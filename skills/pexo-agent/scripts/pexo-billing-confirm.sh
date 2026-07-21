#!/usr/bin/env bash
[ -n "${BASH_VERSION:-}" ] || exec bash "$0" "$@"

usage() {
  cat <<'EOF'
Usage:
  pexo-billing-confirm.sh <project_id> <confirmation_id> --user-approved [--timeout <seconds>]
  pexo-billing-confirm.sh -h | --help

Description:
  Continue the current credit-gated tool batch after explicit user approval.
  The confirmation ID must match the project's latest billing confirmation.
  --user-approved records that the displayed estimate was approved by the user.

Options:
  --user-approved  Required assertion of prior explicit user approval
  --timeout <sec>   Wait time for SSE acknowledgement (default: 20)
EOF
}

source "$(dirname "$0")/_common.sh"

case "${1:-}" in
  -h|--help)
    usage
    exit 0
    ;;
esac

if [[ $# -lt 2 ]]; then
  usage >&2
  exit 2
fi

pid="$1"
confirmation_id="$2"
shift 2
timeout="${PEXO_CHAT_ACK_TIMEOUT:-20}"
user_approved=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --user-approved)
      user_approved=true
      shift
      ;;
    --timeout)
      [[ $# -ge 2 ]] || { echo 'Error: --timeout requires a value' >&2; exit 2; }
      timeout="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Error: unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ "$user_approved" != "true" ]]; then
  echo 'Error: --user-approved is required after the user approves the displayed credit estimate.' >&2
  exit 2
fi

project=$(pexo_get "/api/biz/projects/${pid}")
execution_status=$(jq -r '.executionStatus // ""' <<<"$project")
if [[ "$execution_status" != "CONFIRM_REQUIRED" ]]; then
  echo "Error: project is not waiting for billing confirmation (executionStatus=${execution_status:-unknown})." >&2
  exit 1
fi

pending=$(pexo_get_pending_billing_confirmation "$pid") || {
  echo 'Error: current billing confirmation event is not available yet. Retry shortly.' >&2
  exit 1
}

current_id=$(jq -r '.confirmation_id // ""' <<<"$pending")
if [[ "$current_id" != "$confirmation_id" ]]; then
  echo 'Error: confirmation_id does not match the current pending confirmation.' >&2
  exit 1
fi

sufficient=$(jq -r '.sufficient // false' <<<"$pending")
if [[ "$sufficient" != "true" ]]; then
  echo 'Error: available credits are insufficient; this confirmation cannot continue.' >&2
  exit 1
fi

confirmation_mode=$(jq -r '.confirmation_mode // ""' <<<"$pending")
if [[ -z "$confirmation_mode" ]]; then
  echo 'Error: current confirmation is missing its confirmation mode.' >&2
  exit 1
fi
confirmation_mode=$(pexo_resolve_billing_confirmation_mode "$confirmation_mode") || exit $?

ts=$(date +%s000)
body=$(jq -nc \
  --arg pid "$pid" \
  --arg ts "$ts" \
  --arg confirmation_id "$confirmation_id" \
  --arg mode "$confirmation_mode" '
    {
      action: "billing_confirm",
      project_id: $pid,
      timestamp: $ts,
      user_visible: true,
      billing_confirmation_response: {
        decision: "approve",
        confirmation_id: $confirmation_id
      },
      billing_confirmation_policy: {mode: $mode}
    }
  ')

printf 'Submitting user-approved billing confirmation for project %s and confirmation %s.\n' \
  "$pid" "$confirmation_id" >&2
pexo_post_sse_ack "/api/chat" "$body" "$timeout"

jq -nc --arg pid "$pid" --arg confirmation_id "$confirmation_id" '{
  projectId: $pid,
  confirmationId: $confirmation_id,
  status: "submitted",
  submissionMode: "async",
  pollAfterSeconds: 60,
  nextActionHint: "Use pexo-project-get.sh to poll for progress."
}'
