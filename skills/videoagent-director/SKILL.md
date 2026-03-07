---
name: videoagent-director
version: 1.0.0
author: pexoai
emoji: "🎬"
tags:
  - director
  - storyboard
  - video-production
  - image-to-video
  - multi-modal
  - orchestration
description: >
  AI creative director that turns a user's idea into a complete storyboard and generates the assets — images, video clips, and audio — shot by shot. Use when the user wants to produce a short film, brand video, social clip, or any multi-shot production.
metadata:
  openclaw:
    emoji: "🎬"
    install:
      - id: node
        kind: node
        label: "No API keys needed — orchestrates existing hosted proxies"
---

# 🎬 VideoAgent Director

**Use when:** The user wants to produce a multi-shot video — a brand video, short film, social reel, product ad, or any creative concept requiring more than one clip. Also use when the user asks to "write a storyboard", "plan a video shoot", or "create a scene-by-scene breakdown."

This skill turns a vague creative idea into a structured storyboard, then generates each shot's assets (reference image → video clip → audio) using the other VideoAgent skills behind the scenes.

---

## Your Role as Director

You are the **creative director**. For each request:

1. **Analyze intent** — Understand the concept, tone, audience, and medium (social reel, cinematic, ad, etc.)
2. **Plan the storyboard** — Break the concept into 4–8 shots with clear visual and audio direction
3. **Optimize prompts** — Write precise prompts for image generation, video motion, and audio
4. **Execute shot by shot** — Call `director.js` for each shot; it generates image → video → audio
5. **Present the production** — Deliver a formatted storyboard with all asset URLs

---

## Storyboard Planning

### Shot Count by Format

| Format | Shots | Total Duration |
|--------|-------|----------------|
| Social clip / reel | 3–5 | 15–30 s |
| Brand / product video | 5–8 | 30–60 s |
| Short film teaser | 6–10 | 45–90 s |
| Single scene | 1–3 | 5–20 s |

### Shot Types

| Type | When to Use |
|------|-------------|
| **Establishing shot** | Open a scene, show context and environment |
| **Close-up** | Emotion, product detail, texture |
| **Medium shot** | Action, character interaction |
| **Tracking shot** | Follow a subject or reveal a space |
| **POV shot** | Immersive perspective |
| **Cutaway** | B-roll, supporting context |

### Audio Per Shot

| Audio Type | When to Use | `--audio-type` |
|------------|-------------|----------------|
| Background music | Sustained mood across shots | `music` |
| Sound effects | Specific event in a shot (pour, footstep, door) | `sfx` |
| Narration / voiceover | Story-driven or product-driven content | `tts` |

**Rule:** Assign music to the opening and closing shots. Assign SFX to action shots. Use TTS only when the user explicitly wants voiceover.

---

## Prompt Writing Rules

### Image prompts (reference frames)
- Lead with **composition**: `Close-up of`, `Wide shot of`, `Overhead view of`
- Include **lighting**: `soft morning light`, `golden hour`, `neon-lit`, `studio lighting`
- Add **style**: `cinematic`, `editorial photography`, `product shot`, `35mm film`
- Keep under 60 words

### Video prompts (motion description)
- Describe **camera movement** first: `camera slowly pushes in`, `static shot`, `smooth tracking left`
- Describe **subject motion**: `steam rises gently`, `person walks toward camera`
- Add **atmosphere**: `soft bokeh background`, `motion blur on edges`
- Avoid describing visual appearance — that is already in the image

### Style lock
Pick one visual style for the whole production and add it to every prompt. Example:
> `cinematic, warm amber tones, shallow depth of field, 4K`

---

## Execution: director.js

Run once per shot. The tool generates the image frame, video clip, and audio in sequence.

### Full shot (image → video → audio):
```bash
node {baseDir}/tools/director.js \
  --shot-id <n> \
  --image-prompt "<composition + lighting + style>" \
  --video-prompt "<camera movement + subject motion>" \
  --audio-type <music|sfx|tts> \
  --audio-prompt "<describe the sound or text for TTS>" \
  --duration <seconds> \
  --aspect-ratio <ratio> \
  --style "<global style suffix>"
```

### Video only (no image generation, T2V mode):
```bash
node {baseDir}/tools/director.js \
  --shot-id <n> \
  --skip-image \
  --video-prompt "<full scene description + motion>" \
  --duration <seconds> \
  --aspect-ratio <ratio>
```

### Animate an existing image (user-provided):
```bash
node {baseDir}/tools/director.js \
  --shot-id <n> \
  --image-url "<url from user>" \
  --video-prompt "<motion description>" \
  --audio-type sfx \
  --audio-prompt "<sound description>" \
  --duration <seconds>
```

### Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `--shot-id` | `1` | Shot number for labeling |
| `--image-prompt` | — | Prompt for reference frame image |
| `--image-url` | — | Use an existing image instead of generating |
| `--skip-image` | false | Skip image generation (use T2V for video) |
| `--video-prompt` | *(required)* | Video motion / scene description |
| `--video-model` | `kling` | `kling`, `minimax`, `veo`, `seedance`, `grok`, `hunyuan` |
| `--image-model` | `flux-schnell` | `flux-schnell`, `flux-pro`, `ideogram`, `recraft` |
| `--audio-type` | — | `music`, `sfx`, or `tts` |
| `--audio-prompt` | — | Sound description or TTS text |
| `--duration` | `5` | Video length in seconds |
| `--aspect-ratio` | `16:9` | `16:9`, `9:16`, `1:1` |
| `--style` | — | Global style suffix appended to all prompts |
| `--skip-audio` | false | Skip audio generation |

### Output
```json
{
  "shot_id": 1,
  "success": true,
  "image_url": "https://...",
  "video_url": "https://...",
  "audio_url": "https://...",
  "image_prompt": "...",
  "video_prompt": "...",
  "audio_prompt": "..."
}
```

---

## Workflow

### Step 1 — Understand the brief
Ask (or infer from context):
- What is the concept / story?
- What is the format: **16:9** (landscape), **9:16** (vertical reel), or **1:1** (square)?
- What is the tone: cinematic, energetic, calm, corporate, playful?
- Any existing images or brand assets to animate?

### Step 2 — Present the storyboard plan
Before executing, show the user a table:

| Shot | Type | Scene | Duration | Audio |
|------|------|-------|----------|-------|
| 1 | Establishing | ... | 5 s | music |
| 2 | Close-up | ... | 4 s | sfx |
| ... | | | | |

Confirm with the user or proceed directly if the request is clear.

### Step 3 — Execute each shot
Call `director.js` once per shot. Wait for each to complete before starting the next (assets from shot N may inform shot N+1 choices).

### Step 4 — Present the production
After all shots are complete:

```
## 🎬 Production Complete

**Concept:** [title / concept]
**Style:** [global style]
**Format:** [aspect ratio] · [total duration]

---

### Shot 1 — [Scene Name]
🖼 Frame: [image_url]
🎬 Clip: [video_url]
🔊 Audio: [audio_url or "none"]

### Shot 2 — [Scene Name]
...
```

---

## Example: Brand Video Brief

**User:** "Make a 30-second brand video for a minimalist coffee brand. Vertical format for Instagram."

**Director's plan:**
- Format: 9:16 · 5 shots × 5–6 s
- Style: `editorial product photography, warm amber, shallow depth of field`
- Audio: music for opening/closing, SFX for action shots

| Shot | Scene | Audio |
|------|-------|-------|
| 1 | Coffee beans close-up, steam | music |
| 2 | Hands wrapping around a warm cup | sfx (gentle clink) |
| 3 | Pour shot — espresso into cup | sfx (liquid pour) |
| 4 | Person by window, morning light | music |
| 5 | Brand logo reveal on cup | music |

Then execute each shot with `director.js`.

---

## Knowledge Base

- [references/storyboard_guide.md](references/storyboard_guide.md) — Shot types, pacing, and prompt patterns
