# Troubleshooting

## Script Exit Behavior

- Exit `0`: success
- Exit `1`: request/transport/backend failure
- Exit `2`: local usage error (missing args, invalid flags, invalid local input)

On request failure, scripts print compact JSON to `stderr`, for example:

```json
{"ok":false,"httpCode":429,"message":"Daily creation limit reached. Contact support email for more access."}
```

Fields you may see:

- `httpCode`: the real HTTP status code returned to the script
- `error`: auth/proxy error code such as `INVALID_API_KEY` or `INTERNAL_ERROR`
- `message`: the most useful user-facing message extracted from the response
- `details`: extra backend detail when available

## Auth And Proxy Errors

These can happen on every script that makes API calls:

| HTTP | `error` | Meaning | What to do |
|---|---|---|---|
| 401 | `INVALID_API_KEY` | API key is invalid or revoked | Update `PEXO_API_KEY` in `~/.pexo/config`. Get a new key at pexo.ai. |
| 401 | `MISSING_TOKEN` | The request was sent without an API key | Run `pexo-doctor.sh` to verify config. Make sure `~/.pexo/config` is sourced correctly. |
| 401 | `INTERNAL_ERROR` | The service failed to process the request before authentication completed | This is a temporary service issue, not a problem with the API key. Wait a moment and retry; if it persists, contact support. |
| 409 | `SESSION_REPLACED` | This API key's session was invalidated by a new login elsewhere | Unusual for API-key usage. Retry the command. If it keeps happening, regenerate the API key at pexo.ai. |

If the message says `Invalid API key`, it is an auth problem.
If the body says `error=INTERNAL_ERROR`, do not tell the user to rotate the key first; the service may simply be temporarily down.

## Script-Specific Errors

### `pexo-project-create.sh`

Real statuses:

- `400`: project name is too long. Ask the user to use a shorter name and retry.
- `401`: auth failure — see Auth and Proxy Errors above.
- `429`: creation limit reached — could be any of:
  - User already has an active project running (must wait for it to finish)
  - Insufficient credits to start a new project
  Read the error `message` to distinguish these cases. The script does not query the balance automatically.
- `500`: an unexpected server error occurred. Retry in a moment; if the problem persists, contact support at pexo.ai.

Notes:

- If no project name is provided, the script defaults to `"Untitled"`.

### `pexo-project-list.sh`

Real statuses:

- `401`: auth failure — see Auth and Proxy Errors above.
- `500`: an unexpected server error occurred. Retry in a moment; if the problem persists, contact support at pexo.ai.

Notes:

- Invalid `page` / `page_size` values are handled locally by the script before request time.
- Backend page size is effectively capped at `100`.

### `pexo-project-get.sh`

Real statuses from the first project fetch:

- `401`: auth failure — see Auth and Proxy Errors above.
- `404`: the project does not exist or has been deleted. Verify the project_id; if correct, start a new project.
- `500`: an unexpected server error occurred. Retry in a moment; if the problem persists, contact support at pexo.ai.

Subsequent status fetches can also fail with:

- `401`: auth failure — see Auth and Proxy Errors above.
- `404`: project not found. Same action as above.
- `500`: an unexpected server error occurred. Retry in a moment; if the problem persists, contact support at pexo.ai.

`nextAction=CONFIRM` is a successful status response. The output includes a `confirmation` object for the current pending batch. Use its `confirmation_id` only after obtaining explicit user approval.

`nextAction=FAILED` can include `failureReason=INSUFFICIENT_CREDITS`. In that case, `recentMessages` retains the terminal error with `errorCode=credits.insufficient_credits_err`. This polling result is the authoritative way to detect an insufficient-credit failure that occurs after `pexo-chat.sh` has acknowledged an asynchronous submission.

### `pexo-upload.sh`

This script has three phases, and the failure source matters.

#### Phase 1: upload credential

Real statuses:

- `400`: the file name or file size is invalid. Check that the file exists and is not empty; rename it if it contains special characters.
- `401`: auth failure — see Auth and Proxy Errors above.
- `500`: an unexpected server error occurred. Retry in a moment; if the problem persists, contact support at pexo.ai.

Notes:

- The script rejects unsupported extensions locally. Supported formats:
  - Images: `jpg`, `jpeg`, `png`, `webp`, `bmp`, `tiff`, `heic`, `heif`
  - Videos: `mp4`, `mov`, `avi`
  - Audio: `mp3`, `wav`, `aac`, `m4a`, `ogg`, `flac`

#### Phase 2: file transfer

Possible failures:

- `4xx/5xx`: the file storage service rejected the upload. Check network connectivity and retry. If the problem persists, contact support at pexo.ai.

The script surfaces this directly as:

```text
Error: upload failed with HTTP <code>
```

#### Phase 3: finalize

Real statuses:

- `400`: the file was rejected — possible reasons: file exceeds the size limit, file format is not supported, or the file content does not match its extension. Convert or compress the file and re-upload from scratch using `pexo-upload.sh`.
- `401`: auth failure — see Auth and Proxy Errors above.
- `404`: the file record was not found. The upload session may have been cleaned up. Re-upload from scratch using `pexo-upload.sh`.
- `412`: the upload session has already expired or been completed. Re-upload from scratch using `pexo-upload.sh`.
- `500`: an unexpected server error occurred. Retry in a moment; if the problem persists, contact support at pexo.ai.

### `pexo-chat.sh`

Real statuses:

- `400`: the message could not be sent due to invalid content. Check the message text; if the issue persists, start a new project.
- `401`: auth failure — see Auth and Proxy Errors above.
- `404`: the project does not exist or has been deleted. Start a new project.
- `412`: two possible causes:
  - **Project no longer supported**: this project was created with an older version of Pexo's production system and cannot be continued. Start a new project.
  - **Account billing issue**: the account's credits are frozen or suspended. Read the response `message`, then direct the user to top up or contact support at pexo.ai.
- `429`: limit reached — could be insufficient credits or the project's video output limit. Read the response `message` to distinguish the cause.
- `500`: an unexpected server error occurred. Retry in a moment; if the problem persists, contact support at pexo.ai.

Notes:

- `pexo-chat.sh` is asynchronous. Success means the request was accepted, not that the video is done.
- The script stops reading the SSE stream after `: stream opened`. A business error emitted later in that stream is not returned by `pexo-chat.sh`.
- Synchronous HTTP failures are printed as compact JSON to `stderr`. Use the HTTP status and response `message` to classify them.
- A successful `pexo-chat.sh` call should be followed by `pexo-project-get.sh` polling, typically every `60` seconds.
- If the asynchronous run later fails for insufficient credits, `pexo-project-get.sh` returns `nextAction=FAILED`, `failureReason=INSUFFICIENT_CREDITS`, and the matching error in `recentMessages`.
- When a project is waiting for credit approval, sending a new message through `pexo-chat.sh` cancels that pending confirmation and submits the replacement message.

### `pexo-billing-confirm.sh`

This command approves a pending billable batch. It must only be called after explicit user approval
and requires the `--user-approved` flag. Without that flag it exits before making a network request.

Local validation failures:

- The project is not in `CONFIRM_REQUIRED`: fetch the project again and follow its current `nextAction`.
- The supplied `confirmation_id` does not match the latest confirmation: use the current `confirmation.confirmation_id` returned by `pexo-project-get.sh`.
- The confirmation event is temporarily unavailable in history: poll again shortly; the event may still be persisting.
- `sufficient` is `false`: the available balance cannot cover the batch. Direct the user to purchase credits and do not submit approval.
- The confirmation mode is missing or invalid: fetch the current confirmation again; do not construct an approval request manually.

### `pexo-asset-get.sh`

Real statuses:

- `401`: auth failure — see Auth and Proxy Errors above.
- `403`: the account is not subscribed or watermark-whitelisted, or object storage denied access.
- `404`: the file does not exist, or it belongs to a different project. Verify the asset_id and project_id.
- `412`: the requested asset derivative is still processing. Retry after a short delay.
- `500`: an unexpected server error occurred. Retry in a moment; if the problem persists, contact support at pexo.ai.

Secondary download failures after metadata fetch:

- `403`: the download link has expired. Re-run `pexo-asset-get.sh` to get a fresh link.
- `000`: network request failed before receiving a response. Check network connectivity and retry.
- local filesystem write failure: the temp directory (`~/.pexo/tmp/`) is not writable or the disk is full. Free up space or set `PEXO_TMP_DIR` to a writable path.

Notes:

- The script downloads without a watermark by default. Pass `--with-watermark` only when the user explicitly requests it.
- The script downloads the file into `~/.pexo/tmp/` (or `$PEXO_TMP_DIR`) and returns `url`, `localPath`, and `withWatermark`.
- If the asset is still uploading or has no ready download URL, the script returns `localPath: null`.

### `pexo-doctor.sh`

- `200`: config and API key look healthy
- `401` + `INVALID_API_KEY`: API key is invalid or revoked. Update `PEXO_API_KEY` in `~/.pexo/config`.
- `401` + `INTERNAL_ERROR`: the service failed temporarily — not a key problem. Wait and retry.
- `409`: session conflict, unusual for API-key usage. Retry the command.
- `000`: no response received — network is unreachable or DNS failed. Check connectivity.

## Common Scenarios

### Synchronous `429` or `412` from project creation or chat submission

These scripts print the HTTP failure as compact JSON to `stderr`. They do not query or append the current credit balance. Read both `httpCode` and `message` before choosing an action because these statuses also represent non-credit limits and compatibility failures.

If the response identifies insufficient or suspended credits:

1. Explain the credit restriction to the user.
2. Direct them to `https://pexo.ai/home?billing=credits` and have them complete the purchase flow.
3. Do not retry until the user confirms that credits have been added or the suspension has been resolved.

For a concurrent-project limit, video output limit, or incompatible project, follow the response `message` instead of using the credit remediation.

### `pexo-chat.sh` returns success immediately

This is expected.

The script only confirms that the request was accepted by the server, then exits.
It does not stream progress or final results to the terminal.
It also does not return business errors emitted after the SSE acknowledgement.

Next step:

1. Wait `60` seconds.
2. Run `pexo-project-get.sh <project_id>`.
3. Follow `nextAction`.

### `nextAction=FAILED` with `failureReason=INSUFFICIENT_CREDITS`

Meaning:

- Production started but stopped when a billable operation found that the account did not have enough credits.
- The matching error details are retained in `recentMessages` with `event: "error"`.

Action:

1. Tell the user prominently that production stopped because the account has insufficient credits.
2. Direct them to top up credits at `https://pexo.ai/home?billing=credits`.
3. Do not retry until the user confirms that credits have been added.
4. Use `recentMessages[].errorMessage` for additional detail when needed; use `failureReason`, not free-form hint text, to select this remediation.

### `nextAction=CONFIRM`

The project is waiting for a decision on a billable generation batch.

1. Read `confirmation.estimated_credits`, `confirmation.available_credits`, and `confirmation.sufficient`.
2. If `sufficient` is `true`, explain the estimate and ask the user for explicit approval.
3. After approval, run `pexo-billing-confirm.sh <project_id> <confirmation_id> --user-approved`, then resume polling.
4. If `sufficient` is `false`, direct the user to purchase credits. Do not submit approval.
5. If the user changes the request, send the revised message with `pexo-chat.sh`; this cancels the pending confirmation.

### `WAIT` lasts a long time

This is normal for video generation.

Practical guideline:

1. Keep polling every `60` seconds.
2. Do not send another `pexo-chat.sh` message while `nextAction=WAIT`.
3. If the project later becomes `RECONNECT`, send a short continuation message and resume polling.

### `RECONNECT` keeps appearing

Meaning:

- The connection to the video generation service was interrupted.

Action:

1. Send a short message with `pexo-chat.sh`, for example `continue`.
2. Resume polling with `pexo-project-get.sh`.
3. If this repeats multiple times, start a new project instead of looping forever.

### Download URL expired or returns `403`

Signed URLs are temporary.

Action:

1. Re-run `pexo-asset-get.sh <project_id> <asset_id>`.
2. The script will fetch a fresh download URL for the default clean variant and re-download the file into `~/.pexo/tmp/`.
3. Deliver the fresh `downloadUrl` and report the `withWatermark` value.

### Upload fails locally with “unsupported file type”

This is a local pre-check, not a backend outage.

Action:

1. Convert the file into one of the supported formats listed above.
2. Retry `pexo-upload.sh`.

### A script says `401`, but the API key may still be fine

Inspect the error payload:

- `error=INVALID_API_KEY`: fix the key
- `error=INTERNAL_ERROR`: treat it as a temporary service issue, not a key problem
