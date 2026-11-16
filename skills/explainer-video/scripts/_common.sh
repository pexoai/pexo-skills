#!/usr/bin/env bash
# Shared configuration for Pexo scripts.
# Parses ~/.pexo/config as data; explicit environment variables override it.
# Agent scripts source this file -- no need to handle auth manually.
set -euo pipefail
umask 077

_PEXO_CONFIG="${PEXO_CONFIG:-$HOME/.pexo/config}"
_PEXO_PRODUCTION_BASE_URL="https://pexo.ai"
_PEXO_REQUESTED_BASE_URL="${PEXO_BASE_URL:-}"

_pexo_trim() {
  local value="${1:-}"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "$value"
}

_pexo_set_config_default() {
  local key="$1"
  local value="$2"

  case "$key" in
    PEXO_BASE_URL)
      [[ -n "$_PEXO_REQUESTED_BASE_URL" ]] || _PEXO_REQUESTED_BASE_URL="$value"
      ;;
    PEXO_API_KEY)
      [[ -n "${PEXO_API_KEY+x}" ]] || export PEXO_API_KEY="$value"
      ;;
    PEXO_BILLING_CONFIRMATION_MODE)
      [[ -n "${PEXO_BILLING_CONFIRMATION_MODE+x}" ]] || export PEXO_BILLING_CONFIRMATION_MODE="$value"
      ;;
    PEXO_CONNECT_TIMEOUT)
      [[ -n "${PEXO_CONNECT_TIMEOUT+x}" ]] || export PEXO_CONNECT_TIMEOUT="$value"
      ;;
    PEXO_REQUEST_TIMEOUT)
      [[ -n "${PEXO_REQUEST_TIMEOUT+x}" ]] || export PEXO_REQUEST_TIMEOUT="$value"
      ;;
    PEXO_CHAT_ACK_TIMEOUT)
      [[ -n "${PEXO_CHAT_ACK_TIMEOUT+x}" ]] || export PEXO_CHAT_ACK_TIMEOUT="$value"
      ;;
    PEXO_TMP_DIR)
      [[ -n "${PEXO_TMP_DIR+x}" ]] || export PEXO_TMP_DIR="$value"
      ;;
    *)
      printf 'Unsupported config key in %s: %s\n' "$_PEXO_CONFIG" "$key" >&2
      return 2
      ;;
  esac
}

pexo_load_config() {
  local config_file="$1"
  local line line_number=0 key value first last

  [[ -r "$config_file" ]] || return 0

  while IFS= read -r line || [[ -n "$line" ]]; do
    line_number=$((line_number + 1))
    line=$(_pexo_trim "$line")
    [[ -z "$line" || "$line" == \#* ]] && continue
    [[ "$line" == export[[:space:]]* ]] && line=$(_pexo_trim "${line#export}")

    if [[ ! "$line" =~ ^(PEXO_[A-Z0-9_]+)[[:space:]]*=(.*)$ ]]; then
      printf 'Invalid config syntax in %s at line %d\n' "$config_file" "$line_number" >&2
      return 2
    fi

    key="${BASH_REMATCH[1]}"
    value=$(_pexo_trim "${BASH_REMATCH[2]}")
    if [[ -n "$value" ]]; then
      first="${value:0:1}"
      last="${value: -1}"
      if [[ "$first" == '"' || "$first" == "'" ]]; then
        if [[ "$last" != "$first" || ${#value} -lt 2 ]]; then
          printf 'Unterminated quoted value in %s at line %d\n' "$config_file" "$line_number" >&2
          return 2
        fi
        value="${value:1:${#value}-2}"
      elif [[ "$value" == *'`'* || "$value" == *'$('* || "$value" == *';'* ]]; then
        printf 'Unsafe unquoted value in %s at line %d\n' "$config_file" "$line_number" >&2
        return 2
      fi
    fi

    _pexo_set_config_default "$key" "$value"
  done < "$config_file"
}

pexo_load_config "$_PEXO_CONFIG"

# Keep credentials on Pexo origins; the native client can also target test2.
pexo_select_base_url() {
  local requested="${_PEXO_REQUESTED_BASE_URL:-$_PEXO_PRODUCTION_BASE_URL}"
  requested="${requested%/}"
  case "$requested" in
    https://pexo.ai|https://test2.pexo.ai) ;;
    *) printf 'Unsupported Pexo API origin: %s\n' "$requested" >&2; return 2 ;;
  esac
  export PEXO_BASE_URL="$requested"
  readonly PEXO_BASE_URL
}
pexo_select_base_url

_PEXO_CONNECT_TIMEOUT="${PEXO_CONNECT_TIMEOUT:-10}"
_PEXO_REQUEST_TIMEOUT="${PEXO_REQUEST_TIMEOUT:-60}"

pexo_resolve_billing_confirmation_mode() {
  local override="${1:-}"
  local mode="${override:-${PEXO_BILLING_CONFIRMATION_MODE:-always}}"

  case "$mode" in
    always|threshold)
      printf '%s\n' "$mode"
      ;;
    *)
      printf 'Invalid billing confirmation mode: %s (expected always or threshold)\n' "$mode" >&2
      return 2
      ;;
  esac
}

# New messages and retries carry the same caller-owned admission identity.
pexo_request_id() {
  od -An -N16 -tx1 /dev/urandom | tr -d ' \n'
}

pexo_query_value() {
  jq -nr --arg value "$1" '$value | @uri'
}

pexo_confirmation_path() {
  printf '/api/biz/projects/%s/executions/%s/media-confirmation' "$(pexo_query_value "$1")" "$(pexo_query_value "$2")"
}

pexo_require_config() {
  local missing=()

  if [[ -z "${PEXO_BASE_URL:-}" ]]; then
    missing+=("PEXO_BASE_URL")
  fi

  if [[ -z "${PEXO_API_KEY:-}" ]]; then
    missing+=("PEXO_API_KEY")
  fi

  if [[ ${#missing[@]} -gt 0 ]]; then
    printf 'Missing required config: %s\n' "${missing[*]}" >&2
    printf 'Set them in %s or in the environment.\n' "$_PEXO_CONFIG" >&2
    return 1
  fi
}

_pexo_auth_header() {
  printf 'Authorization: Bearer %s' "$PEXO_API_KEY"
}

pexo_tmp_dir() {
  local tmp_dir="${PEXO_TMP_DIR:-$HOME/.pexo/tmp}"
  mkdir -p "$tmp_dir"
  chmod 700 "$tmp_dir"
  printf '%s\n' "$tmp_dir"
}

_pexo_is_json() {
  local payload="${1:-}"
  [[ -n "$payload" ]] && jq -e . >/dev/null 2>&1 <<<"$payload"
}

_pexo_emit_success() {
  local body="${1:-}"

  if [[ -z "$body" ]]; then
    return 0
  fi

  if _pexo_is_json "$body"; then
    if jq -e 'type == "object" and has("code") and has("data")' >/dev/null 2>&1 <<<"$body"; then
      jq '.data' <<<"$body"
      return 0
    fi

    jq '.' <<<"$body"
    return 0
  fi

  printf '%s\n' "$body"
}

_pexo_emit_error() {
  local http_code="${1:-0}"
  local body="${2:-}"
  local transport_error="${3:-}"

  if [[ "$http_code" == "0" && -n "$transport_error" ]]; then
    jq -nc \
      --argjson httpCode 0 \
      --arg message "Network request failed" \
      --arg details "$transport_error" \
      '{ok:false, httpCode:$httpCode, message:$message, details:$details}' >&2
    return 1
  fi

  if _pexo_is_json "$body"; then
    jq -c --argjson httpCode "${http_code:-0}" '
      def maybe(field; value):
        if value == null or value == "" then {} else { (field): value } end;

      {
        ok: false,
        httpCode: $httpCode,
        message: (
          if (.data | type) == "object" and (.data.message? // "") != "" then .data.message
          elif (.message? // "") != "" then .message
          elif (.error? // "") != "" then .error
          else "request failed"
          end
        )
      }
      + (
        if (.data | type) == "object" and (.data.code? != null) then
          {businessCode: .data.code}
        else
          {}
        end
      )
      + (
        if (.data | type) == "object" and (.data.error? // "") != "" then
          {error: .data.error}
        elif (.error? // "") != "" then
          {error: .error}
        else
          {}
        end
      )
      + (
        if (.data | type) == "object" and (.data.details? // "") != "" then
          {details: .data.details}
        elif (.details? // "") != "" then
          {details: .details}
        else
          {}
        end
      )
    ' <<<"$body" >&2
    return 1
  fi

  jq -nc \
    --argjson httpCode "${http_code:-0}" \
    --arg message "request failed" \
    --arg details "${transport_error:-$body}" \
    '{ok:false, httpCode:$httpCode, message:$message} + (if $details != "" then {details:$details} else {} end)' >&2
  return 1
}

_pexo_request_json() (
  local method="$1" path="$2" body="${3:-}"
  shift 3
  pexo_require_config
  local body_file err_file http_code response
  body_file=$(mktemp)
  err_file=$(mktemp)
  trap 'rm -f "$body_file" "$err_file"' EXIT
  local args=(-sS --connect-timeout "$_PEXO_CONNECT_TIMEOUT" --max-time "$_PEXO_REQUEST_TIMEOUT"
    -X "$method" -H "$(_pexo_auth_header)" -H "Content-Type: application/json"
    -o "$body_file" -w '%{http_code}')
  [[ -z "$body" ]] || args+=(-d "$body")
  if ! http_code=$(curl "${args[@]}" "$@" "${PEXO_BASE_URL}${path}" 2>"$err_file"); then
    _pexo_emit_error 0 "" "$(cat "$err_file")"
    return 1
  fi
  response=$(cat "$body_file")
  if [[ "$http_code" -lt 200 || "$http_code" -ge 300 ]]; then
    _pexo_emit_error "$http_code" "$response" "$(cat "$err_file")"
    return 1
  fi
  _pexo_emit_success "$response"
)

# GET -> extracts .data from BFF wrapper when present
pexo_get() {
  local path="$1"
  shift || true
  _pexo_request_json GET "$path" "" "$@"
}

# POST with optional JSON body -> extracts .data
pexo_post() {
  local path="$1"
  local body="${2:-}"
  shift 2 || true
  _pexo_request_json POST "$path" "$body" "$@"
}

detect_mime() {
  file --brief --mime-type "$1" 2>/dev/null || echo "application/octet-stream"
}

mime_supported_for_asset_type() {
  local mime_type
  local asset_type="$2"

  mime_type=$(echo "$1" | tr '[:upper:]' '[:lower:]')

  case "${asset_type}:${mime_type}" in
    IMAGE:image/jpeg|IMAGE:image/jpg|IMAGE:image/png|IMAGE:image/webp|IMAGE:image/tiff|IMAGE:image/bmp|IMAGE:image/heic|IMAGE:image/heif)
      return 0
      ;;
    VIDEO:video/mp4|VIDEO:video/x-msvideo|VIDEO:video/avi|VIDEO:video/quicktime)
      return 0
      ;;
    AUDIO:audio/mpeg|AUDIO:audio/wav|AUDIO:audio/wave|AUDIO:audio/aac|AUDIO:audio/mp4|AUDIO:audio/x-m4a|AUDIO:audio/ogg|AUDIO:audio/flac)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}
