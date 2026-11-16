#!/usr/bin/env bash
[ -n "${BASH_VERSION:-}" ] || exec bash "$0" "$@"
source "$(dirname "$0")/_common.sh"
usage() { echo 'Usage: pexo-project-get.sh <project_id> [--full-history]'; }
case "${1:-}" in -h|--help) usage; exit 0 ;; esac
[[ $# -ge 1 && $# -le 2 ]] || { usage >&2; exit 2; }
pid="$1"; full=false
if [[ $# == 2 ]]; then
  [[ "$2" == --full-history ]] || { usage >&2; exit 2; }
  full=true
fi
project=$(pexo_get "/api/biz/projects/$(pexo_query_value "$pid")")
path="/api/chat?projectId=$(pexo_query_value "$pid")"
state=$(pexo_get "$path")
# Reject an old server explicitly instead of interpreting missing fields as success.
jq -e '.items | type == "array"' >/dev/null <<<"$state"
items=$(jq -c '.items' <<<"$state")
historical=$(jq -c '.historicalMessages // []' <<<"$state")
previous_page() {
  jq -r 'if .nextBefore != null then "&before=\(.nextBefore)"
         elif .nextHistoryCursor != null then "&historyCursor=\(.nextHistoryCursor | @uri)"
         else empty end'
}
cursor=$(previous_page <<<"$state")
# A native continuation may span executions. Keep the whole latest user turn.
while [[ -n "$cursor" ]]; do
  if [[ "$full" == false ]] && jq -e 'any(.[]; .kind == "message" and .payload.role == "user" and .payload.message.purpose != "media_confirmation")' >/dev/null <<<"$items"; then break; fi
  page=$(pexo_get "$path$cursor")
  jq -e '.items | type == "array"' >/dev/null <<<"$page"
  items=$(jq -nc --argjson older "$page" --argjson newer "$items" '$older.items + $newer')
  historical=$(jq -nc --argjson older "$page" --argjson newer "$historical" '($older.historicalMessages // []) + $newer')
  cursor=$(previous_page <<<"$page")
done
if [[ "$full" == false ]]; then
  items=$(jq -c '([to_entries[] | select(.value.kind == "message" and .value.payload.role == "user" and .value.payload.message.purpose != "media_confirmation") | .key] | last) as $start | .[($start // 0):]' <<<"$items")
fi
messages=$(jq -f "$(dirname "$0")/messages.jq" <<<"$items")
status=$(jq -r '.execution.status // "idle"' <<<"$state")
execution_id=$(jq -r '.execution.executionId // empty' <<<"$state")
confirmation=null
# Only a current deferred media batch needs the quote endpoint, not ordinary chat.
if [[ "$full" == false && "$status" == completed ]] && jq -e --arg id "$execution_id" 'any(.[]; .executionId == $id and .kind == "tool" and (.payload.call.name | startswith("mcp__media-orchestrator__")) and .payload.result.structuredContent.status == "awaiting_confirmation")' >/dev/null <<<"$items"; then
  confirmation=$(pexo_get "$(pexo_confirmation_path "$pid" "$execution_id")")
fi
case "$status" in
  queued|running|cancelling) action=WAIT; hint='Work is running. Poll again; do not submit another message.' ;;
  failed|recovery_required) action=FAILED; hint='Execution stopped. Read error; do not automatically resubmit generation.' ;;
  cancelled) action=RESPOND; hint='Conversation stopped. Already submitted media may still finish.' ;;
  idle|paused) action=RESPOND; hint='Read recentMessages and relay the user response. For a native interaction, answer in the project page.' ;;
  completed)
    action=RESPOND; hint='Relay all messages and attachments; ask the user to choose when choices are present.'
    if jq -e 'any(.[]; .event == "final_video")' >/dev/null <<<"$messages"; then
      action=DELIVER; hint='Fetch and deliver the final_video asset.'
    fi
    case "$(jq -r '.status // empty' <<<"$confirmation")" in
      pending) action=CONFIRM; hint='Ask the user to approve this exact quote. Never approve automatically.' ;;
      collecting|approved) action=WAIT; hint='The server is preparing or continuing this media batch. Poll again.' ;;
    esac ;;
  *) printf 'Unknown Agent execution status: %s\n' "$status" >&2; exit 1 ;;
esac
jq -n --argjson project "$project" --argjson state "$state" --argjson messages "$messages" --argjson confirmation "$confirmation" --argjson historical "$historical" --arg action "$action" --arg hint "$hint" '
  ($project | del(.status, .executionStatus, .serviceStatus, .executionProgress, .stepProgress)) +
  (if $historical == [] then {} else {historicalMessages: $historical} end) +
  {execution: $state.execution, nextAction: $action, nextActionHint: $hint, recentMessages: $messages} +
  (if $confirmation == null then {} else {confirmation: $confirmation} end) +
  (if $state.execution.error == null then {} else {error: $state.execution.error} end)
'
