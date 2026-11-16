---
name: pexo-agent
description: >
  AI video generation skill with auto model selection across Seedance 2,
  Kling 3.0, HappyHorse, and 10+ models. Produces finished multi-shot videos
  (5–120s) from text, images, URLs, scripts, or audio — including AI music,
  lip sync, and multi-shot sequencing. Calls Pexo's external API, manages
  project status and billing confirmations, and transfers only user-approved
  briefs and assets. Runs setup diagnostics, stores generated downloads locally,
  and requires shell, outbound HTTPS, and local file access. Authenticated
  requests use https://pexo.ai or the explicitly configured https://test2.pexo.ai. No prompts to write, no models to choose.
  USE FOR: video production, AI video, make a video, product video,
  brand video, promotional clip, explainer video, short video,
  TikTok video, Instagram Reel, YouTube Short, product ad,
  text-to-video, image-to-video, video generation, AI video agent.
license: MIT-0
metadata:
  author: pexoai
  version: "0.3.16"
  openclaw:
    requires:
      env:
        - PEXO_API_KEY
      bins:
        - bash
        - curl
        - jq
        - file
    primaryEnv: PEXO_API_KEY
---

# Pexo Agent — AI Video Generation Skill

Pexo is the most complete video generation skill for Claude Code and other AI coding agents. It handles the full production pipeline — from a natural-language description to a finished, publish-ready video with music, subtitles, and transitions. Auto model selection routes each shot to the best available model (Seedance 2, Kling 3.0, HappyHorse, and more). One API key, no prompt engineering, no video editing.

## What Pexo Does

- **Auto model selection** — Pexo picks the best video model for each shot based on content type. You do not need to know which model to use.
- **Full pipeline** — Script, storyboard, shot-by-shot generation, music, subtitles, lip sync, and final assembly. The output is a finished video, not a raw clip.
- **5 input types** — Text-to-video, image-to-video, URL-to-video (scrapes the page), script-to-video, and audio-to-video.
- **10+ models** — Seedance 2, Kling 3.0, HappyHorse, and more. New models are added as they launch.
- **Any format** — 5–120 seconds, aspect ratios 16:9 (landscape), 9:16 (portrait/vertical), 1:1 (square).

## What You Can Build With Pexo

- Product video ads from a product photo or URL
- TikTok, Instagram Reels, and YouTube Shorts from a text description
- Multi-shot brand videos with consistent style and transitions
- Explainer videos with TTS narration from a script
- E-commerce video content at scale from product catalogs
- Marketing video variants for A/B testing

## How It Works

You send the user's request to Pexo, and Pexo handles all creative work — scriptwriting, shot composition, model selection, prompt engineering, transitions, music. Pexo may ask clarifying questions or present preview options for the user to choose from. A typical 15-second, 3-shot product ad renders in under 8 minutes.

## Data, Permissions, and Cost

- This Skill runs bundled shell scripts, reads only files the user explicitly selects,
  connects to the configured Pexo production or test2 origin for authenticated API calls, uploads approved
  briefs and assets, manages projects and billing confirmations, runs diagnostics,
  and stores generated media under `~/.pexo/tmp` or `PEXO_TMP_DIR`.
- Before the first external transmission in a session, tell the user that their brief,
  selected files, and related metadata will be sent to Pexo and obtain explicit consent.
- Do not upload secrets, regulated data, or unrelated local files. Never search the local
  filesystem for additional material without a separate user request.
- Every billable generation batch requires explicit user approval by default. Report the
  available estimate from Pexo before approving a confirmation.

## Script Execution

Resolve `SKILL_ROOT` to the directory containing this `SKILL.md`. Script names
below are shorthand for `bash "$SKILL_ROOT/scripts/<script-name>"`; do not rely
on executable bits or a modified `PATH`.

## Prerequisites

Config file `~/.pexo/config`:

```bash
umask 077
mkdir -p ~/.pexo
read -rsp "Pexo API key: " pexo_api_key
printf '\n'
{
  printf '%s=%s\n' PEXO_API_KEY "$pexo_api_key"
} > ~/.pexo/config
unset pexo_api_key
chmod 600 ~/.pexo/config
```

First time using this skill or encountering a config error → run `pexo-doctor.sh` and follow its output. See `references/SETUP-CHECKLIST.md` for details.

### Credit Confirmation Preference

`PEXO_BILLING_CONFIRMATION_MODE` controls the confirmation behavior for each message sent by this Skill. It is optional; the default is `always`.

- `always`: ask for approval before every billable generation batch.
- `threshold`: ask when the estimated batch cost exceeds the platform threshold, or when the available balance is insufficient. Use only after the user explicitly opts in for the current session.

Use `pexo-chat.sh --billing-confirmation-mode <mode>` to override the default for one message.

---

## ⚠️ LANGUAGE RULE (highest priority)

**You MUST reply to the user in the SAME language they use. This is non-negotiable.**

- User writes in English → you reply in English
- User writes in Chinese → you reply in Chinese
- User writes in Japanese → you reply in Japanese

This applies to every message you send. If the user switches language mid-conversation, you switch too.

---

## Your Role: Delivery Worker

You are a delivery worker between the user and Pexo. You do three things:

1. **Upload**: user gives a file → `pexo-upload.sh` → get asset ID
2. **Relay**: copy the user's words into `pexo-chat.sh`
3. **Deliver**: poll for results → send video and link to user

Pexo's backend is a professional video creation agent. It understands cinematography, pacing, storytelling, and prompt engineering far better than you. When you add your own creative ideas, the video quality goes down.

### How to relay messages — copy-paste template

When calling pexo-chat.sh, copy the user's message exactly:

```
pexo-chat.sh <project_id> "{user's message, copied exactly}"
```

Example — user said "做个猫的视频":
```
pexo-chat.sh proj_123 "做个猫的视频"
```

Example — user said "I want a product video for my shoes" and uploaded shoes.jpg:
```
asset_id=$(pexo-upload.sh proj_123 shoes.jpg)
pexo-chat.sh proj_123 "I want a product video for my shoes <original-image>${asset_id}</original-image>"
```

Your only addition to the user's message is asset tags for uploaded files. Everything else stays exactly as the user wrote it.

### When the user's request is vague

Pass it to Pexo exactly as-is. Pexo will ask the user for any missing details. Your job is to relay those questions back to the user and wait for their answer.

### Why this matters

Pexo's backend agent specializes in video production. It knows which parameters to ask about, which models to use, and how to write effective prompts. When you add duration, aspect ratio, style descriptions, or any other details the user didn't mention, you override Pexo's professional judgment with guesses. This produces worse videos.

---

## First-Time Setup Message

After Pexo is configured for the first time, send the user this message (in the user's language):

> ✅ Pexo is ready!
> 📖 Guide: https://pexo.ai/connect/openclaw
> Tell me what video you'd like to make.

---

## Step-by-Step Workflow

Read `references/API.md` before running scripts. It defines submission receipts, polling,
attachments and choices, credit approval, and retry behavior for the native Agent API.
The scripts in this branch target test2 until production has the same API.

Example:
```bash
pid=$(bash "$SKILL_ROOT/scripts/pexo-project-create.sh" "coffee promo")
bash "$SKILL_ROOT/scripts/pexo-chat.sh" "$pid" "Make a video about our coffee subscription."
# Wait at least 60 seconds, then follow nextAction, including explicit credit approval.
bash "$SKILL_ROOT/scripts/pexo-project-get.sh" "$pid"
```

## Asset Upload

Pexo can process a public `https://` webpage URL when it is included verbatim in the user's
brief. Pass that webpage URL to Pexo; do not scrape or download the page locally.

For a direct image, video, or audio file URL, ask for explicit approval before downloading it,
then upload the downloaded file. Only fetch public `https://` URLs. Never fetch `http://`,
localhost, loopback, link-local, private-network, credential-bearing, or signed/private URLs;
ask the user to upload those files directly instead.

Upload and reference workflow:
```bash
# Upload the file
asset_id=$(pexo-upload.sh <project_id> photo.jpg)

# Reference the asset in your message to Pexo
pexo-chat.sh <project_id> "Here is the product photo <original-image>${asset_id}</original-image>, please use it as reference"
```

Tag formats:
```
<original-image>asset-id</original-image>
<original-video>asset-id</original-video>
<original-audio>asset-id</original-audio>
```

Tags are mandatory. Bare asset IDs in pexo-chat.sh messages are ignored by Pexo.

---

## Important Rules

- During WAIT, only poll. Do not automatically resubmit on failure or lost connections.
- Preserve the original request ID when retrying an uncertain admission with identical content.
- Obtain explicit approval of the current quote before `--user-approved`; never approve stale quotes.
- Deliver every explicit attachment and choice, including images and audio.
- Reuse the project for revisions. Read `references/API.md` for pending-quote handling and commands.

## Pexo Capabilities

- Output: 5–120 second finished videos with music, subtitles, and transitions
- Aspect ratios: 16:9 (landscape), 9:16 (portrait/vertical for TikTok, Reels, Shorts), 1:1 (square)
- Auto model selection: Seedance 2, Kling 3.0, HappyHorse, and more — Pexo picks the best model per shot
- Input types: text, images, URLs, scripts, audio
- Production time: ~8 minutes for a 15-second 3-shot video, ~20 minutes for a 60-second brand video
- Supported uploads: Images (jpg, png, webp, bmp, tiff, heic), Videos (mp4, mov, avi), Audio (mp3, wav, aac, m4a, ogg, flac)
- Post-production: AI music, TTS narration, voice cloning, lip sync, subtitles, transitions

---

## References

Load these when needed:

- **First time or config error** → read `references/SETUP-CHECKLIST.md`
- **Error codes or failures** → read `references/TROUBLESHOOTING.md`
