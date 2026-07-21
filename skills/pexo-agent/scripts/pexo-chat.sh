#!/usr/bin/env bash
[ -n "${BASH_VERSION:-}" ] || exec bash "$0" "$@"

usage() {
  cat <<'EOF'
Usage:
  pexo-chat.sh <project_id> <message> [--choice <preview_asset_id>] [--billing-confirmation-mode <mode>] [--timeout <seconds>]
  pexo-chat.sh -h | --help

Description:
  Submit a message to an existing Pexo project.
  This script does not keep the SSE stream open. It only waits until /api/chat
  acknowledges the request by opening the stream, then it disconnects.
  If the message references uploaded assets, wrap each asset ID with one of:
    <original-image>asset_id</original-image>
    <original-video>asset_id</original-video>
    <original-audio>asset_id</original-audio>
  Bare asset IDs inside the message are ignored by Pexo and rejected locally.

Options:
  --choice <id>     Send the selected preview asset ID as choices.preview_id
  --billing-confirmation-mode <mode>
                    Override this message's confirmation mode: always or threshold
  --timeout <sec>   Wait time for SSE acknowledgement (default: 20)

Returns:
  JSON acknowledgement:
    {
      "projectId": "...",
      "status": "submitted",
      "submissionMode": "async",
      "submittedAt": "...",
      "pollAfterSeconds": 60,
      "nextActionHint": "Use pexo-project-get.sh to poll for progress."
    }

Common errors:
  Local validation error: asset IDs in <message> are not wrapped in valid tags
  400  Invalid request body
  401  Invalid API key or auth failure
  404  Project not found
  412  Project agent version incompatible
  429  Project video limit reached
  500  Backend/internal failure
EOF
}

source "$(dirname "$0")/_common.sh"

strip_valid_asset_tags() {
  local text="$1"
  printf '%s' "$text" \
    | sed -E 's#<original-image>((a_[1-9A-HJ-NP-Za-km-z]{7,24})|([0-9A-Z]{26}))</original-image># #g' \
    | sed -E 's#<original-video>((a_[1-9A-HJ-NP-Za-km-z]{7,24})|([0-9A-Z]{26}))</original-video># #g' \
    | sed -E 's#<original-audio>((a_[1-9A-HJ-NP-Za-km-z]{7,24})|([0-9A-Z]{26}))</original-audio># #g'
}

find_unwrapped_asset_ids() {
  local text="$1"
  printf '%s' "$text" \
    | tr -cs 'A-Za-z0-9_' '\n' \
    | awk '/^([0-9A-Z]{26}|a_[1-9A-HJ-NP-Za-km-z]{7,24})$/ && !seen[$0]++'
}

validate_message_asset_references() {
  local text="$1"
  local stripped invalid_refs joined

  stripped=$(strip_valid_asset_tags "$text")
  invalid_refs=$(find_unwrapped_asset_ids "$stripped")

  if [[ -z "$invalid_refs" ]]; then
    return 0
  fi

  joined=$(printf '%s\n' "$invalid_refs" | awk 'BEGIN { first = 1 } { printf("%s%s", first ? "" : ", ", $0); first = 0 }')
  echo 'Error: asset IDs in <message> must be wrapped with <original-image>...</original-image>, <original-video>...</original-video>, or <original-audio>...</original-audio>.' >&2
  printf 'Invalid asset reference(s): %s\n' "$joined" >&2
  echo 'Example: pexo-chat.sh <project_id> "Use <original-image>a_xxx</original-image> as the reference image."' >&2
  return 1
}

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
msg="$2"
shift 2

choice=""
confirmation_mode_override=""
timeout="${PEXO_CHAT_ACK_TIMEOUT:-20}"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --choice)
      [[ $# -ge 2 ]] || { echo 'Error: --choice requires a value' >&2; exit 2; }
      choice="$2"
      shift 2
      ;;
    --timeout)
      [[ $# -ge 2 ]] || { echo 'Error: --timeout requires a value' >&2; exit 2; }
      timeout="$2"
      shift 2
      ;;
    --billing-confirmation-mode)
      [[ $# -ge 2 ]] || { echo 'Error: --billing-confirmation-mode requires a value' >&2; exit 2; }
      confirmation_mode_override="$2"
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

validate_message_asset_references "$msg" || exit 2
confirmation_mode=$(pexo_resolve_billing_confirmation_mode "$confirmation_mode_override") || exit $?

ts=$(date +%s000)
project=$(pexo_get "/api/biz/projects/${pid}")
execution_status=$(jq -r '.executionStatus // ""' <<<"$project")
replacement_confirmation='null'

if [[ "$execution_status" == "CONFIRM_REQUIRED" ]]; then
  pending=$(pexo_get_pending_billing_confirmation "$pid") || {
    echo 'Error: project is waiting for billing confirmation, but the current confirmation event is not available yet. Retry shortly.' >&2
    exit 1
  }
  replacement_confirmation=$(jq -c '{
    decision: "cancel",
    confirmation_id: .confirmation_id,
    tool_call_ids: (.tool_call_ids // []),
    items: [(.items // [])[] | {tool_name, tool_call_id}]
  }' <<<"$pending")
fi

body=$(jq -nc \
  --arg pid "$pid" \
  --arg msg "$msg" \
  --arg ts "$ts" \
  --arg ch "$choice" \
  --arg mode "$confirmation_mode" \
  --argjson replacement "$replacement_confirmation" '
    {
      project_id: $pid,
      timestamp: $ts,
      user_visible: true,
      native_inputs: {text: $msg},
      billing_confirmation_policy: {mode: $mode}
    }
    + (if $ch != "" then {choices: {preview_id: $ch}} else {} end)
    + (if $replacement != null then {
        action: "message",
        billing_confirmation_response: $replacement
      } else {} end)
  ')

pexo_post_sse_ack "/api/chat" "$body" "$timeout"

jq -nc \
  --arg pid "$pid" \
  --arg submitted_at "$ts" \
  '{
    projectId: $pid,
    status: "submitted",
    submissionMode: "async",
    submittedAt: $submitted_at,
    pollAfterSeconds: 60,
    nextActionHint: "Use pexo-project-get.sh to poll for progress."
  }'
