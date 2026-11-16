#!/usr/bin/env bash
[ -n "${BASH_VERSION:-}" ] || exec bash "$0" "$@"
source "$(dirname "$0")/_common.sh"

usage() {
  cat <<'HELP'
Usage: pexo-chat.sh <project_id> <message> [--choice <asset_id>]
       [--billing-confirmation-mode always|threshold] [--request-id <id>] [--timeout <seconds>]

Submit one message using the native Agent API. Returns a JSON admission receipt,
not an SSE connection. Poll with pexo-project-get.sh; disconnecting does not stop work.
Use the same --request-id when retrying an uncertain submission with the same content.
Reference uploaded files with <original-image>, <original-video> or <original-audio> tags.
HELP
}
case "${1:-}" in -h|--help) usage; exit 0 ;; esac
[[ $# -ge 2 ]] || { usage >&2; exit 2; }
pid="$1"; message="$2"; shift 2
_PEXO_REQUEST_TIMEOUT="${PEXO_CHAT_ACK_TIMEOUT:-$_PEXO_REQUEST_TIMEOUT}"
choice=""; mode=""; request_id="$(pexo_request_id)"
while [[ $# -gt 0 ]]; do
  [[ $# -ge 2 ]] || { usage >&2; exit 2; }
  case "$1" in
    --choice) choice="$2" ;;
    --billing-confirmation-mode) mode="$2" ;;
    --request-id) request_id="$2" ;;
    --timeout) _PEXO_REQUEST_TIMEOUT="$2" ;;
    *) printf 'Unknown option: %s\n' "$1" >&2; exit 2 ;;
  esac
  shift 2
done
[[ -n "$pid" && -n "$message" && -n "$request_id" && ${#request_id} -le 128 ]] || { usage >&2; exit 2; }
mode=$(pexo_resolve_billing_confirmation_mode "$mode")
body=$(jq -nc --arg project "$pid" --arg text "$message" --arg choice "$choice" --arg id "$request_id" --arg mode "$mode" '
  [$text | match("<original-(image|video|audio)>([^<>]+)</original-\\1>"; "g") | .captures[1].string] +
  (if $choice == "" then [] else [$choice] end) | unique as $assets |
  {projectId: $project, requestId: $id,
   message: {messageId: $id, billingPolicy: $mode,
             content: ([{type: "text", text: $text}] + ($assets | map({type: "asset", assetId: .})))}}
')
# Print the identity before transport so a lost acknowledgement can be retried safely.
printf 'Request ID: %s\n' "$request_id" >&2
receipt=$(pexo_post /api/chat "$body")
jq -e --arg id "$request_id" '
  if (.executionId | type) != "string" then error("Missing Agent admission receipt")
  else . + {requestId: $id, submissionMode: "async", pollAfterSeconds: 60} end
' <<<"$receipt"
