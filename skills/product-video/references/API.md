# Native Agent API client

Read this before running the bundled scripts. Resolve `SKILL_ROOT` to this skill's directory;
run scripts with `bash "$SKILL_ROOT/scripts/<name>"`. Each installed skill is standalone.

## Compatibility and configuration

This branch targets the native Agent API deployed on test2. Do not release it to production
clients until production exposes the same protocol. It intentionally does not retry with the
legacy request format. The default origin remains `https://pexo.ai`; testing must explicitly
set `PEXO_BASE_URL=https://test2.pexo.ai` with a key belonging to that environment.
Only these two origins are allowed for authenticated API requests.

Before sending data, obtain the user's consent to send their brief and selected files to Pexo.
Relay their words verbatim; only add tags for files they selected. Do not search for extra files.
Keep keys in `~/.pexo/config` or `PEXO_API_KEY`, never in command arguments or logs.

## Workflow

1. Create a project with `pexo-project-create.sh "<brief>"`; reuse it for revisions.
2. Upload selected files with `pexo-upload.sh <project_id> <path>`.
   Add `<original-image>asset_id</original-image>` (or video/audio) to the user's exact text.
   The client sends both that text and typed asset references. Public webpage URLs can be
   relayed in the text; do not download arbitrary URLs or unrelated local files.
3. Submit with `pexo-chat.sh <project_id> "<exact text>"`.
   Success is a JSON receipt containing `executionId` and `requestId`, not a completed result.
   The request ID is also printed to stderr before transport. If acknowledgment is lost,
   retry only the same message, assets and billing mode with `--request-id <original_id>`.
   A fresh ID starts new work. Never automatically submit a continuation or regenerate.
4. Tell the user the request was accepted and share `${PEXO_BASE_URL}/project/<project_id>`.
5. Wait at least 60 seconds, then run `pexo-project-get.sh <project_id>`.
   Follow `nextAction` and handle every public event in `recentMessages`.

| Action | What to do |
|---|---|
| WAIT | Poll again; do not send another chat message. Update the user periodically. |
| RESPOND | Relay assistant messages and attachments. Wait if the assistant asks a question. |
| CONFIRM | Show the exact estimate and ask for approval as described below. |
| DELIVER | Deliver the `final_video` asset and accompanying assistant messages. |
| FAILED | Explain the returned execution error. Do not automatically retry generation. |

If work takes more than 30 minutes, report the delay and ask whether to continue monitoring.
Stopping polling does not stop work already accepted by the server.

## Public messages and files

- `message`: text from the identified role. Do not repeat the user's own text as an assistant answer.
- `attachment`: fetch each `assetIds` entry with `pexo-asset-get.sh`; deliver images, audio or video.
- `choices`: fetch each asset in order, label the options and ask the user to choose. This is not
  limited to video. Send their reply with `pexo-chat.sh <project_id> "<reply>" --choice <asset_id>`.
- `final_video`: fetch its `assetId` and deliver the video.
- `interaction`: direct the user to the project page to answer the native interaction.

Intermediate tool files are not presented as delivered attachments. Explicit `show_files`
results are attachments or choices; `publish_file` identifies a final video independently.
Fetch an asset only once when multiple events refer to the same ID. Send full download URLs,
including query parameters. Honor `withWatermark` in the download receipt; do not claim a
clean download when access is denied. Use `--with-watermark` only when requested.

Default reads cover the latest user turn, including automatic server continuations.
`--full-history` reads every native page. Retained old-project records are returned separately
as `historicalMessages`, with their original `role`, `eventType` and `content`; these are saved
history, not pending tool calls or approvals. Do not execute them.

## Credit approval

Credit confirmation applies to video generation batches. Images, audio and model usage keep
their existing direct billing behavior; `always` does not add confirmation for those operations.
Default `billingPolicy` for video is `always`. `--billing-confirmation-mode threshold` is available only
when the user explicitly opts in. Reading status never approves a purchase.

For `CONFIRM`, read `confirmation.executionId`, `quoteId`, `estimatedCredits`,
`availableCredits`, `sufficient` and `items`. Show the estimate before requesting consent.

- After explicit approval, run:
  `pexo-billing-confirm.sh <project_id> <execution_id> <quote_id> --user-approved`.
- If declined, run the same command with `--decline` instead.
- If the user revises a pending request, decline its quote first, then submit the revised text.
- If funds are insufficient, do not approve. Let the user add credits, then fetch the current quote.
- If the quote changed, show the new quote and obtain fresh approval.

The script reads the quote again and checks identity, pending status and affordability before
posting `{quoteId, approve}`. The server owns task submission and continuation after approval;
do not send an extra chat message. After a timeout while deciding, read current status first.
An already-decided quote is not automatically approved again.

## Commands

| Script | Arguments |
|---|---|
| pexo-project-create.sh | `[project_name]` |
| pexo-project-list.sh | `[page_size]` or `--page <n> --page-size <n>` |
| pexo-chat.sh | `<project_id> <message> [--choice <asset_id>] [--request-id <id>] [--billing-confirmation-mode always|threshold] [--timeout <seconds>]` |
| pexo-project-get.sh | `<project_id> [--full-history]` |
| pexo-billing-confirm.sh | `<project_id> <execution_id> <quote_id> (--user-approved|--decline)` |
| pexo-upload.sh | `<project_id> <file_path>` |
| pexo-asset-get.sh | `<project_id> <asset_id> [--with-watermark]` |
| pexo-doctor.sh | No arguments |
