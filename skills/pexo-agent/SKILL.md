---
name: pexo-agent
description: >
  Use this skill when the user wants to produce a short video (5–60 seconds).
  Supports any video type: product ads, TikTok/Instagram/YouTube content,
  brand videos, explainers, social clips.
  USE FOR: video production, AI video, make a video,
  product video, brand video, promotional clip, explainer video, short video.
homepage: https://pexo.ai
repository: https://github.com/pexoai/pexo-skills
requires:
  env:
    - PEXO_API_KEY
    - PEXO_BASE_URL
  runtime:
    - curl
    - jq
    - file
metadata:
  author: pexoai
  version: "0.2.0"
---

# Pexo Agent

Pexo is an AI video creation agent. You interact with Pexo through conversation — describe what you want, share reference materials if you have them, and Pexo handles the creative production. During the process, Pexo may ask clarifying questions, propose creative directions, and present previews for your feedback. Output: short videos (5–60 s), aspect ratios 16:9 / 9:16 / 1:1.

## Prerequisites

Config file `~/.pexo/config`:

```
PEXO_BASE_URL="https://pexo.ai"
PEXO_API_KEY="sk-<your-api-key>"
```

First time using this skill or encountering a config error → run `pexo-doctor.sh` and follow its output. See `references/SETUP-CHECKLIST.md` for details.

---

## HARD RULES — PROTOCOL (do not remove)

These rules ensure correct behavior. Removing them will break the workflow.

### 1. Faithful Relay

You are a communication channel between the user and Pexo. You are NOT a creative participant.

- **User → Pexo**: relay the user's words to Pexo verbatim. Do NOT add information the user did not explicitly state. In particular, NEVER fill in duration or aspect ratio on your own — these are the most commonly fabricated details and they directly determine what Pexo produces.
- **Pexo → User**: relay Pexo's responses to the user **completely**. Pexo often uses **bold text** to mark key questions, confirmation requests, or decision points. When you see emphasized content in Pexo's response, it is almost certainly something the user needs to see and act on. Your message to the user MUST carry all such critical consultation and confirmation items — do not drop, summarize away, or answer them yourself. If Pexo sends multiple pieces of information in one response (e.g. previews AND questions), relay ALL of them.
- **User feedback → Pexo**: when the user gives revision feedback, pass it through exactly. Do NOT "improve" or supplement it with your own observations.
- **Images/videos from user**: upload them via `pexo-upload.sh` and reference by asset ID. Do NOT describe the visual content in text — your visual understanding is unreliable and will mislead Pexo.

### 2. Decision Routing

All creative decisions belong to the user. Use `nextAction` + `event` type to route:

| nextAction | recentMessages event | Your action | Involve user? |
|---|---|---|---|
| RESPOND | `preview_video` (assetIds) | Fetch ALL preview URLs via `pexo-asset-get.sh`. Present each to the user with Pexo's descriptions. Ask user to choose. | **YES — NEVER auto-select** |
| RESPOND | `message` (Pexo asks a question) | Relay the question to the user. Wait for their answer. | **YES — NEVER answer for user** |
| RESPOND | `message` (informational) | Relay or briefly summarize to user | Optional |
| RESPOND | `document` | Mention the document to user; share key details if relevant | Optional |
| DELIVER | `final_video` (assetId) | Fetch `downloadUrl` via `pexo-asset-get.sh`. Send URL to user. Ask if they are satisfied. | **YES** |
| WAIT | — | Notify user that production is underway. Poll again. | No, but MUST inform |
| FAILED | — | Read `nextActionHint`. Explain the issue to user in plain language. | **YES** |
| RECONNECT | — | Send a message via `pexo-chat.sh` (e.g. "continue") to re-establish. Inform user. | No, but MUST inform |

**CRITICAL: process ALL events in recentMessages, not just the first one.** A single RESPOND may contain multiple events simultaneously. You MUST handle every event. Skipping any event means the user loses information they need to make decisions.

**Default rule**: if you are unsure whether something needs user input → ask the user. Never decide on their behalf.

### 3. Asset Delivery

- ALWAYS use `pexo-asset-get.sh` to get `downloadUrl` (a public URL).
- ALWAYS send the **complete, unmodified** `downloadUrl` to the user — including all query parameters (`?OSSAccessKeyId=...&Expires=...&Signature=...`). These parameters are part of the signed URL; truncating or reformatting them makes the link unusable.
- NEVER download files to local filesystem.
- NEVER send local file paths to the user.
- NEVER wrap the URL in markdown link syntax `[text](url)` — some platforms break long URLs in markdown. Send the raw URL as plain text.
- If a URL has expired, re-fetch via `pexo-asset-get.sh`.
- For platform-specific delivery details → read `references/PLATFORM-DELIVERY.md`.

**Example — correct delivery:**

```
pexo-asset-get.sh <project_id> <asset_id>
# Returns JSON with downloadUrl field, e.g.:
# "downloadUrl": "https://pexo-assets.oss-cn-hangzhou.aliyuncs.com/v/abcd1234/video.mp4?OSSAccessKeyId=LTAI5t&Expires=1741234567&Signature=aBcDeFgH%3D"

# Send the FULL URL to the user:
Your video is ready! Download here:
https://pexo-assets.oss-cn-hangzhou.aliyuncs.com/v/abcd1234/video.mp4?OSSAccessKeyId=LTAI5t&Expires=1741234567&Signature=aBcDeFgH%3D
```

**Common mistakes to avoid:**
- ✗ Truncated URL: `https://pexo-assets.oss-cn-hangzhou.aliyuncs.com/v/abcd1234/video.mp4` (missing signed params → 403 Forbidden)
- ✗ Markdown wrapped: `[Download](https://pexo-assets...&Signature=aBcD...)` (long URLs often break in markdown)
- ✗ Local path: `/tmp/pexo-video-abcd1234.mp4` (user cannot access server filesystem)

### 4. Polling Discipline

- When `nextAction` is `WAIT`: **only** call `pexo-project-get.sh` (read-only check). Do NOT call `pexo-chat.sh`. Do NOT send any message to Pexo. Sending messages while Pexo is working triggers duplicate production — the user's video will be generated multiple times, wasting resources and creating confusion.
- Poll interval: **60 seconds**. Do NOT poll more frequently. Wait the full 60 seconds between each `pexo-project-get.sh` call.
- Between polls, keep the user informed (see Progress Updates below).
- When `nextAction` changes from `WAIT` to something else (e.g. `RESPOND`), STOP polling and handle the new state immediately per the Decision Routing table.

### 5. Project Lifecycle

- New topic or new video → create a new project via `pexo-project-create.sh`.
- Continuing the same video (revision, feedback) → reuse the existing project.
- NEVER create empty or exploratory projects.

---

## Communication Guide — CUSTOMIZABLE

These patterns can be adjusted to match your style. They are recommendations, not hard protocol.

### Information Collection

The more context Pexo gets, the better the first draft and the fewer round-trips. At any point in the conversation — not just the first message — if you notice the user hasn't mentioned key dimensions, guide them to fill in the gaps naturally (not as an interrogation).

Useful context dimensions (gather when natural):
- What the video is about — the subject, theme, or story
- Target platform (TikTok, YouTube, Instagram…) — implies aspect ratio and pacing
- Duration preference (15s / 30s / 60s)
- Core message or feeling the user wants to convey
- Reference materials — images, videos, audio, or style examples
- Existing assets — logo, product photos, brand guidelines, personal footage

If the user gives enough to start, start. Do not over-question. Pexo itself will ask for anything else it needs — relay those questions per the Decision Routing rules.

### Progress Updates

When `nextAction` is `WAIT`, keep the user informed:

**Time estimate**: production time depends on video length and complexity. Use this baseline to set user expectations:
- A ~15s video typically takes **15–20 minutes**
- Longer videos take proportionally longer. A 60s video — whether generated in one pass or split into segments — may take significantly more time
- Estimate based on the actual request and inform the user accordingly

- **First notification** (after sending to Pexo): tell the user your estimated wait time based on the video length. e.g. "Production started — for a 15-second video this typically takes about 15–20 minutes. I'll keep you updated."
- **Each poll** (~every 60s): brief status — "Still generating, about X minutes in."
- **Approaching your estimate**: "About the normal timeline. Still in progress."
- **Exceeding your estimate by 50%+**: "Taking a bit longer than usual. I can wait a bit more, or we can try sending Pexo a new message."

### Delivery Presentation

**Previews** (concept selection): present all options with labels (A, B, C…). Include Pexo's description of each concept. Ask the user to pick.

**Final video**: send the `downloadUrl` with a brief summary of what was produced (duration, concept used). Ask if the user is satisfied or wants revisions.

---

## Pexo Capability Constraints

These reflect Pexo's actual capabilities and limitations. They ensure good video quality.

### Asset Upload

Pexo does **not** crawl web pages or URLs. If the user provides a link to an image or video, download the file first, then upload via `pexo-upload.sh`.

Upload and reference workflow:

```bash
# Step 1: Upload the file → get asset_id
asset_id=$(pexo-upload.sh <project_id> photo.jpg)

# Step 2: Reference the asset in your message to Pexo
pexo-chat.sh <project_id> "Here is the product photo <original-image>${asset_id}</original-image>, please use it as reference for the video"
```

Reference tag formats:

```
<original-image>asset-id</original-image>
<original-video>asset-id</original-video>
<original-audio>asset-id</original-audio>
```

| Asset type | Examples | Impact on quality |
|---|---|---|
| Subject images | Product photos, personal photos, scene shots | Accurate visual representation |
| Brand / identity assets | Logo, color palette, brand guidelines | Visual consistency |
| Style references | Videos or images showing desired look and feel | Guides tone and cinematography |
| Audio | Background music, voiceover, sound effects | Sets mood and rhythm |

### Cost Awareness

Fewer, richer messages beat many thin ones. Each message to Pexo costs tokens and may trigger processing. When you have enough context from the user, consolidate the information into one message to Pexo rather than sending it piecemeal.

---

## Pipeline Lifecycle

`pexo-chat.sh` returns immediately. Video production takes **15–20 minutes** for a short video (~15s), longer for more complex or longer videos. Use `pexo-project-get.sh` to check status.

| `nextAction` | Meaning | What to do |
|---|---|---|
| `WAIT` | Pexo is producing | Poll in 60s. Inform user. NEVER send messages. |
| `RESPOND` | Pexo needs input | Read `recentMessages`. Route per Decision Routing table. |
| `DELIVER` | Video complete | Fetch `downloadUrl`, deliver to user. |
| `FAILED` | Production failed | Explain to user. Retry with adjusted request if appropriate. |
| `RECONNECT` | Connection lost | Re-initiate via `pexo-chat.sh` ("continue"). Inform user. |

The response includes `nextActionHint` — a plain-language sentence explaining the recommended next step.

### recentMessages

Included when `nextAction` is RESPOND, DELIVER, FAILED, or RECONNECT. Non-actionable events (planning, progress, thinking) are already filtered out.

| `role` | `event` | Key fields |
|---|---|---|
| USER | — | `text` |
| ASSISTANT | `message` | `text` |
| ASSISTANT | `preview_video` | `assetIds[]` |
| ASSISTANT | `final_video` | `assetId` |
| ASSISTANT | `document` | `documentType`, `documentName` |

---

## Script Reference

All interaction with Pexo goes through these shell scripts. On API error (exit 1), `PEXO_LAST_HTTP_CODE` is set. For error handling details → read `references/TROUBLESHOOTING.md`.

| Script | Usage | Returns |
|---|---|---|
| `pexo-project-create.sh` | `[project_name]` | `project_id` string |
| `pexo-project-list.sh` | `[page_size]` | Projects JSON |
| `pexo-project-get.sh` | `<project_id> [--full-history]` | JSON with `nextAction`, `nextActionHint`, `recentMessages` |
| `pexo-upload.sh` | `<project_id> <file_path>` | `asset_id` string |
| `pexo-chat.sh` | `<project_id> <message> [--choice <id>]` | Async acknowledgement JSON with `projectId`, `status`, `pollAfterSeconds` |
| `pexo-asset-get.sh` | `<project_id> <asset_id>` | Asset JSON with `downloadUrl` |
| `pexo-doctor.sh` | (no args) | Diagnostic report (config, connectivity, dependencies) |

---

## References

Load these when the situation calls for it — they are not needed on every run.

- **First time using this skill or config error** → read `references/SETUP-CHECKLIST.md`
- **Encountering an error code or unexpected failure** → read `references/TROUBLESHOOTING.md`
