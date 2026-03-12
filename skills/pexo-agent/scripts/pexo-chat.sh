#!/usr/bin/env bash
[ -n "${BASH_VERSION:-}" ] || exec bash "$0" "$@"

usage() {
  cat <<'EOF'
Usage:
  pexo-chat.sh <project_id> <message> [--choice <preview_asset_id>] [--timeout <seconds>]
  pexo-chat.sh -h | --help

Description:
  Submit a message to an existing Pexo project.
  This script does not keep the SSE stream open. It only waits until /api/chat
  acknowledges the request by opening the stream, then it disconnects.

Options:
  --choice <id>     Send the selected preview asset ID as choices.preview_id
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
  400  Invalid request body
  401  Invalid API key or auth failure
  404  Project not found
  412  Project agent version incompatible
  429  Project video limit reached
  500  Backend/internal failure
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
msg="$2"
shift 2

choice=""
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

ts=$(date +%s000)

if [[ -n "$choice" ]]; then
  body=$(jq -nc --arg pid "$pid" --arg msg "$msg" --arg ts "$ts" --arg ch "$choice" \
    '{project_id:$pid, timestamp:$ts, user_visible:true, native_inputs:{text:$msg}, choices:{preview_id:$ch}}')
else
  body=$(jq -nc --arg pid "$pid" --arg msg "$msg" --arg ts "$ts" \
    '{project_id:$pid, timestamp:$ts, user_visible:true, native_inputs:{text:$msg}}')
fi

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
