#!/usr/bin/env bash
[ -n "${BASH_VERSION:-}" ] || exec bash "$0" "$@"

usage() {
  cat <<'EOF'
Usage:
  pexo-asset-get.sh <project_id> <asset_id>
  pexo-asset-get.sh -h | --help

Description:
  Fetch asset details for a project. The response may include fresh signed URLs
  such as downloadUrl, thumbnailUrl, or spriteSheetUrl.

Returns:
  Asset JSON from /api/biz/projects/:project_id/assets/:asset_id

Common errors:
  401  Invalid API key or auth failure
  404  Asset not found, or asset does not belong to the project/user
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

if [[ $# -ne 2 ]]; then
  usage >&2
  exit 2
fi

pid="$1"
aid="$2"

pexo_get "/api/biz/projects/${pid}/assets/${aid}"
