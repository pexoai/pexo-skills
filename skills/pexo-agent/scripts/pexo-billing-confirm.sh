#!/usr/bin/env bash
[ -n "${BASH_VERSION:-}" ] || exec bash "$0" "$@"
source "$(dirname "$0")/_common.sh"
usage() { echo 'Usage: pexo-billing-confirm.sh <project_id> <execution_id> <quote_id> (--user-approved|--decline)'; }
case "${1:-}" in -h|--help) usage; exit 0 ;; esac
[[ $# == 4 ]] || { usage >&2; exit 2; }
case "$4" in
  --user-approved) approve=true ;;
  --decline) approve=false ;;
  *) usage >&2; exit 2 ;;
esac
# The explicit execution and quote IDs bind consent to the quote the user saw.
path=$(pexo_confirmation_path "$1" "$2")
current=$(pexo_get "$path")
jq -e --arg id "$3" --arg execution "$2" --argjson approve "$approve" '
  .executionId == $execution and .quoteId == $id and .status == "pending" and
  ($approve == false or .sufficient == true)
' >/dev/null <<<"$current" || { echo 'Quote is stale, already decided, or unaffordable. Read the current quote before deciding.' >&2; exit 1; }
body=$(jq -nc --arg quote "$3" --argjson approve "$approve" '{quoteId: $quote, approve: $approve}')
pexo_post "$path" "$body"
