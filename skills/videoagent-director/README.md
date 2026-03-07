# 🎬 VideoAgent Director

Turn any creative idea into a shot-by-shot production. The Director skill plans a storyboard from your concept and generates each shot's assets — reference image, video clip, and audio — automatically.

> One prompt. A complete storyboard. All assets generated.

---

## What It Does

1. **Analyzes your brief** — extracts format, tone, key shots
2. **Plans the storyboard** — breaks the concept into 4–8 shots with clear visual and audio direction
3. **Executes shot by shot** — for each shot:
   - Generates a **reference frame** (image)
   - Uses it to create a **video clip** (image-to-video for visual consistency)
   - Adds **audio** — music, SFX, or voiceover
4. **Delivers the production** — a formatted storyboard with all asset URLs

---

## Quick Start

Just describe what you want:

> "Make a 30-second brand video for a minimalist coffee brand. Instagram vertical format."

> "Create a short film teaser for a sci-fi story about a lone astronaut discovering a signal from Earth."

> "Produce a product launch reel for a smartwatch. 15 seconds, energetic."

The Director will plan the shots, confirm with you, and then generate everything.

---

## Models Used

| Asset | Service | Models Available |
|-------|---------|-----------------|
| Reference image | [VideoAgent Image Studio](../videoagent-image-studio/) | Flux, Ideogram, Recraft, SDXL |
| Video clip | [VideoAgent Video Studio](../videoagent-video-studio/) | Kling, MiniMax, Veo, Seedance, Grok, Hunyuan |
| Audio | [VideoAgent Audio Studio](../videoagent-audio-studio/) | ElevenLabs TTS/SFX, CassetteAI Music |

All services run through hosted proxies — **no API keys needed**.

---

## Supported Formats

| Format | Aspect Ratio | Best For |
|--------|-------------|----------|
| Landscape | 16:9 | YouTube, presentations, cinema |
| Vertical | 9:16 | Instagram Reels, TikTok, Stories |
| Square | 1:1 | Instagram feed, thumbnails |

---

## Shot Pipeline

For each shot in the storyboard:

```
User intent
    ↓
Storyboard plan (shot list with prompts)
    ↓ [for each shot]
Image generation (reference frame)
    ↓
Video generation (image-to-video)
    ↓
Audio generation (music / SFX / TTS)
    ↓
Shot result: { image_url, video_url, audio_url }
```

---

## Tool Usage

```bash
node tools/director.js \
  --shot-id 1 \
  --image-prompt "close-up of hands holding a warm coffee cup, morning light, editorial" \
  --video-prompt "camera slowly pushes in, steam curls upward" \
  --audio-type music \
  --audio-prompt "gentle acoustic guitar, warm morning mood" \
  --duration 5 \
  --aspect-ratio 9:16 \
  --style "warm amber tones, shallow depth of field, editorial photography"
```

Full parameter reference: [SKILL.md](SKILL.md)

---

## Environment Variables

All optional — the skill works out of the box with hosted proxies.

| Variable | Default | Description |
|----------|---------|-------------|
| `IMAGE_PROXY_URL` | `https://image-gen-proxy.vercel.app` | Image generation proxy |
| `VIDEO_PROXY_URL` | `https://pexo-video-deploy.vercel.app` | Video generation proxy |
| `AUDIO_PROXY_URL` | `https://audiomind-proxy.vercel.app` | Audio proxy |
| `IMAGE_STUDIO_TOKEN` | *(auto-fetched)* | Pre-fetched image token |
| `VIDEO_STUDIO_TOKEN` | *(auto-fetched)* | Pre-fetched video token |
| `AUDIOMIND_KEY` | *(none)* | Pro key for audio proxy |

---

## Knowledge Base

- [references/storyboard_guide.md](references/storyboard_guide.md) — Shot types, pacing, audio strategy, and prompt glossary
