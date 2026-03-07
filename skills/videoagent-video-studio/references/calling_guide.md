# Calling Guide — Per-Model Details

How each model is invoked by the proxy. Useful for debugging, building compatible integrations, or understanding endpoint routing.

All requests go through `POST /api/generate`. The proxy routes by `model` and `mode`, maps inputs, calls the backend, and returns `{ videoUrl }` directly.

---

## Common Request Body

```json
{
  "mode": "text-to-video",
  "prompt": "A cat walking in the rain, cinematic",
  "model": "kling",
  "duration": 5,
  "aspectRatio": "16:9",
  "imageUrl": "https://..."
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `mode` | No | `text-to-video` (default) or `image-to-video` |
| `prompt` | **Yes** | Scene or motion description |
| `imageUrl` | For I2V | Public image URL |
| `duration` | No | Seconds (default 5); some models map to discrete steps |
| `aspectRatio` | No | Default `16:9`; common: `16:9`, `9:16`, `1:1` |
| `model` | No | Model ID; `auto` = proxy picks first available |

---

## MiniMax (`minimax`)

| | |
|---|---|
| **T2V endpoint** | `fal-ai/minimax/video-01` |
| **I2V endpoint** | `fal-ai/minimax/video-01-live/image-to-video` |
| **Reference endpoint** | `fal-ai/minimax/video-01-subject-reference` |
| **T2V / I2V input** | `prompt` + `output_format: "url"`; I2V adds `image_url`. Duration and aspect_ratio are not passed. |
| **Reference input** | `{ prompt, subject_reference_image_url: "https://..." }` — one subject reference image for character consistency |

---

## Kling (`kling`)

Kling 3.0 uses different endpoints per capability: v3 for T2V/I2V, O3 for reference.

| | |
|---|---|
| **T2V endpoint** | `fal-ai/kling-video/v3/standard/text-to-video` |
| **I2V endpoint** | `fal-ai/kling-video/v3/standard/image-to-video` |
| **Reference endpoint** | `fal-ai/kling-video/o3/standard/reference-to-video` |
| **T2V / I2V input** | `prompt`, `aspect_ratio`, `output_format: "url"`; I2V adds `image_url`. Duration not passed (Kling uses its own steps). |
| **Reference input** | `prompt`, `start_image_url?`, `end_image_url?`, `image_urls?`, `elements?`, `duration` (3–15), `aspect_ratio` |

---

## Google Veo (`veo`)

| | |
|---|---|
| **T2V endpoint** | `fal-ai/veo3.1` |
| **I2V endpoint** | `fal-ai/veo3.1/image-to-video` |
| **Reference endpoint** | `fal-ai/veo3.1/reference-to-video` |
| **T2V / I2V input** | `prompt`, `aspect_ratio`, `output_format`; I2V adds `image_url`. Duration maps: 1–4 s → `"4s"`, 5–6 s → `"6s"`, 7+ s → `"8s"`. |
| **Reference input** | `{ prompt, image_urls: ["url1", ...], aspect_ratio, duration: "8s", resolution: "720p" }` |
| **⚠ Constraint** | `veo3.1/reference-to-video` only accepts `duration: "8s"`. The proxy fixes this — user `duration` is ignored for reference mode. |

---

## Hunyuan (`hunyuan`)

| | |
|---|---|
| **T2V endpoint** | `fal-ai/hunyuan-video` |
| **I2V** | Not supported |
| **Reference endpoint** | `fal-ai/hunyuan-video/video-to-video` |
| **T2V input** | `prompt`, `aspect_ratio`, `output_format: "url"`. Duration not passed. |
| **Reference input** | `{ prompt, video_url: "https://...", aspect_ratio, strength: 0.85 }` — `strength` controls how far the output drifts from the reference (lower = closer to original) |

---

## PixVerse (`pixverse`)

| | |
|---|---|
| **T2V** | Not supported |
| **I2V endpoint** | `fal-ai/pixverse/v4.5/image-to-video` |
| **I2V input** | `prompt`, `image_url`, `aspect_ratio`, `output_format: "url"` |

---

## Grok (`grok`)

| | |
|---|---|
| **T2V endpoint** | `xai/grok-imagine-video/text-to-video` |
| **I2V endpoint** | `xai/grok-imagine-video/image-to-video` |
| **Reference endpoint** | `xai/grok-imagine-video/edit-video` |
| **T2V / I2V input** | `prompt`, `duration` (1–15 s, default 6), `aspect_ratio`, `resolution: "720p"`; I2V adds `image_url` |
| **Reference input** | `{ prompt: "Colorize the video", video_url: "https://..." }` |

---

## Seedance (`seedance`) — Seedance 1.5 Pro

| | |
|---|---|
| **T2V endpoint** | `fal-ai/bytedance/seedance/v1.5/pro/text-to-video` |
| **I2V endpoint** | `fal-ai/bytedance/seedance/v1.5/pro/image-to-video` |
| **Reference** | Body-distinguished (same endpoint; reference is controlled via `image_url` and prompt) |

**Input parameters:**

| Field | Default | Description |
|-------|---------|-------------|
| `prompt` | required | Scene, action, dialogue, sound effects |
| `aspect_ratio` | `"16:9"` | `21:9` / `16:9` / `4:3` / `1:1` / `3:4` / `9:16` |
| `resolution` | `"720p"` | `"480p"` (fast preview) or `"720p"` |
| `duration` | `"5"` | `"4"`–`"12"` seconds (string); proxy clamps automatically |
| `generate_audio` | `true` | Generate synchronized audio (dialogue, SFX, ambience) |
| `image_url` | — | First-frame image for I2V mode |

**Response:**
```json
{ "video": { "url": "https://...", "content_type": "video/mp4" }, "seed": 42 }
```

---

## Model Selection Guide

| Scenario | Mode | Recommended | Key Notes |
|----------|------|-------------|-----------|
| General / default | T2V or I2V | `auto` or `minimax` | Pass prompt, optionally image_url |
| Cinematic / commercial | T2V | `veo` / `kling` / `grok` | Veo: duration maps to 4s/6s/8s; Grok: pass duration + resolution |
| Image-to-video only | I2V | `pixverse` | Requires image_url |
| Text-to-video only | T2V | `hunyuan` | No duration param |
| Synchronized audio | T2V / I2V | `seedance` | Pair with seedance-2.0-prompter for best results |
| Reference / consistency | Reference | `kling`, `veo`, `minimax` | Each has a dedicated reference endpoint |
