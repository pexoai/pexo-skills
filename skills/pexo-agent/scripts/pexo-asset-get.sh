#!/usr/bin/env bash
[ -n "${BASH_VERSION:-}" ] || exec bash "$0" "$@"

usage() {
  cat <<'EOF'
Usage:
  pexo-asset-get.sh <project_id> <asset_id> [--with-watermark]
  pexo-asset-get.sh -h | --help

Description:
  Fetch asset details and download the asset into ~/.pexo/tmp/ (or
  $PEXO_TMP_DIR when set). Downloads are watermark-free by default. Pass
  --with-watermark when the user explicitly requests a watermarked copy.

Returns:
  Asset JSON from /api/biz/projects/:project_id/assets/:asset_id
  plus:
    - url: signed download URL selected by the watermark option
    - localPath: downloaded local cache path, or null when the asset is not ready
    - withWatermark: whether the selected URL contains a watermark

Common errors:
  401  Invalid API key or auth failure
  403  User is not entitled to download, or object storage denied download
  404  Asset not found, or asset does not belong to the project/user
  412  Asset derivative is still processing
  500  Backend/internal failure
EOF
}

source "$(dirname "$0")/_common.sh"

with_watermark=false
positionals=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    --with-watermark)
      with_watermark=true
      ;;
    --)
      shift
      positionals+=("$@")
      break
      ;;
    -* )
      printf 'unknown option: %s\n' "$1" >&2
      usage >&2
      exit 2
      ;;
    *)
      positionals+=("$1")
      ;;
  esac
  shift
done

if [[ ${#positionals[@]} -ne 2 ]]; then
  usage >&2
  exit 2
fi

pid="${positionals[0]}"
aid="${positionals[1]}"

asset=$(pexo_get "/api/biz/projects/${pid}/assets/${aid}")

# Uploading assets have no stable download URL yet. Avoid turning the existing
# metadata-only behavior into a download error while still using the explicit
# download endpoint for all ready assets, including final videos.
if [[ "$(echo "$asset" | jq -r '.assetStatus // empty')" == "UPLOADING" ]]; then
  echo "$asset" | jq '. + {url:null, localPath:null, withWatermark:null}'
  exit 0
fi

remove_watermark=true
if [[ "$with_watermark" == true ]]; then
  remove_watermark=false
fi

download=$(pexo_get "/api/biz/projects/${pid}/assets/${aid}/download-url?remove_watermark=${remove_watermark}")
download_url=$(echo "$download" | jq -r '.url // empty')
with_watermark_result=$(echo "$download" | jq -c 'if has("withWatermark") then .withWatermark else null end')

if [[ -z "$download_url" ]]; then
  echo "$asset" | jq --argjson withWatermark "$with_watermark_result" '. + {url:null, localPath:null, withWatermark:$withWatermark}'
  exit 0
fi

tmp_dir=$(pexo_tmp_dir)
file_name=$(echo "$asset" | jq -r '.fileName // .assetName // empty')
[[ -n "$file_name" && "$file_name" != "null" ]] || file_name="${aid}.bin"

safe_name=$(printf '%s' "$file_name" | sed 's#[/[:space:]]#_#g')
variant="clean"
if [[ "$with_watermark" == true ]]; then
  variant="watermarked"
fi
local_path="${tmp_dir}/${aid}-${variant}-${safe_name}"
part_path="${local_path}.part.$$"
err_file=$(mktemp)
http_code=""
curl_status=0

http_code=$(curl -sS -L \
  --connect-timeout "$_PEXO_CONNECT_TIMEOUT" \
  --max-time "$_PEXO_REQUEST_TIMEOUT" \
  -o "$part_path" \
  -w '%{http_code}' \
  "$download_url" 2>"$err_file") || curl_status=$?

if [[ $curl_status -ne 0 && "${http_code:-0}" == "000" ]]; then
  err_text=$(cat "$err_file")
  rm -f "$part_path" "$err_file"
  _pexo_emit_error 0 "" "${err_text:-Failed to download asset from signed URL}"
fi

if [[ ! "${http_code:-}" =~ ^2 ]]; then
  err_text=$(cat "$err_file")
  rm -f "$part_path"
  rm -f "$err_file"
  _pexo_emit_error "${http_code:-0}" "" "${err_text:-Failed to download asset from signed URL}"
fi

mv -f "$part_path" "$local_path"
rm -f "$err_file"

echo "$asset" | jq \
  --arg url "$download_url" \
  --arg localPath "$local_path" \
  --argjson withWatermark "$with_watermark_result" \
  '. + {url:$url, localPath:$localPath, withWatermark:$withWatermark}'
