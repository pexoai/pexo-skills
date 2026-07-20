#!/usr/bin/env bash
[ -n "${BASH_VERSION:-}" ] || exec bash "$0" "$@"

usage() {
  cat <<'EOF'
Usage:
  pexo-billing-confirm.sh <project_id> <confirmation_id> [--timeout <seconds>]
  pexo-billing-confirm.sh -h | --help

Description:
  Continue the current credit-gated tool batch after explicit user approval.
  The confirmation ID must match the project's latest billing confirmation.

Options:
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

while [[ $# -gt 0 ]]; do
  case "$1" in
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
      user_visible: false,
      billing_confirmation_response: {
        decision: "approve",
        confirmation_id: $confirmation_id
      },
      billing_confirmation_policy: {mode: $mode}
    }
  ')

pexo_post_sse_ack "/api/chat" "$body" "$timeout"

jq -nc --arg pid "$pid" --arg confirmation_id "$confirmation_id" '{
  projectId: $pid,
  confirmationId: $confirmation_id,
  status: "submitted",
  submissionMode: "async",
  pollAfterSeconds: 60,
  nextActionHint: "Use pexo-project-get.sh to poll for progress."
}'
