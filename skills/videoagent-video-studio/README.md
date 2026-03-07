# 🎬 VideoAgent Video Studio

Generate short AI videos from text or images — **7 models**, zero API key setup.

> Tired of juggling accounts for Kling, Veo, and Grok? This skill gives you one-command access to 7 state-of-the-art video models — with zero setup.

## Features

- **Text-to-video**: Describe a scene; get a short video clip (4–15 s)
- **Image-to-video**: Upload an image and describe the motion; get an animated clip
- **Reference-to-video**: Use reference images or video to control character, style, or scene consistency
- **7 models**: MiniMax, Kling 3.0, Google Veo 3.1, Grok, Hunyuan, Seedance 1.5, PixVerse
- **Free tier**: Built-in rate limiting on the hosted proxy — no API keys needed
- **Deploy your own**: Full serverless proxy included under `proxy/`

## Quick Start

The agent enhances your prompt and calls `tools/generate.js` automatically. You can also run it directly:

```bash
# Text-to-video
node tools/generate.js --prompt "A cat walking in the rain, cinematic 4K" --model kling

# Image-to-video
node tools/generate.js --mode image-to-video --prompt "Slowly pan right" --image-url "https://..." --model minimax

# List available models
node tools/generate.js --list-models
```

## Models

| Model | T2V | I2V | Reference | Notes |
|-------|-----|-----|-----------|-------|
| `minimax` | ✅ | ✅ | ✅ | Subject reference image, character consistency |
| `kling` | ✅ | ✅ | ✅ | Multi-element / character / keyframe (O3) |
| `veo` | ✅ | ✅ | ✅ | Google Veo 3.1, multiple reference images |
| `grok` | ✅ | ✅ | ✅ | Video editing via reference video |
| `hunyuan` | ✅ | — | ✅ | Video-to-video style transfer |
| `seedance` | ✅ | ✅ | ✅ | ByteDance 1.5 Pro, synchronized audio |
| `pixverse` | — | ✅ | — | Stylized image-to-video, PixVerse v4.5 |

> **Reference mode**: Supply reference images, video, or elements to control character, style, or scene consistency. Each model uses a dedicated endpoint.

## Parameters

| Option | Description |
|--------|-------------|
| `--mode` | `text-to-video` (default) or `image-to-video` |
| `--prompt` | Scene or motion description (required) |
| `--image-url` | Public image URL (required for image-to-video) |
| `--duration` | Length in seconds (default: 5) |
| `--aspect-ratio` | `16:9`, `9:16`, `1:1`, etc. (default: `16:9`) |
| `--model` | Model ID from table above, or `auto` |
| `--list-models` | List all available models from proxy |
| `--status --job-id <id>` | Check async job status (if proxy returns jobId) |

## Setup

### Option 1 — Hosted proxy (zero setup)

The default proxy is pre-configured. Just run the tool — it auto-fetches a free-tier token.

Free-tier limits (per token, per day):
- Default: 100 generations / token
- Max tokens per IP per day: 3

### Option 2 — Deploy your own proxy

The `proxy/` directory is a ready-to-deploy serverless app. Set your API key in the deployment dashboard, then point the tool to your URL:

```bash
cd proxy && npm install && vercel deploy --prod
```

```bash
export VIDEO_STUDIO_PROXY_URL=https://your-proxy.vercel.app
```

### Option 3 — Local dev

```bash
# Terminal 1: start local proxy
cd skills/videoagent-video-studio/proxy
npm install
API_KEY=your_key node ../scripts/local-server.cjs 3777

# Terminal 2: use the CLI
export VIDEO_STUDIO_PROXY_URL=http://localhost:3777
node tools/generate.js --prompt "A cat walking in the rain" --model kling
```

### Option 4 — Pre-configured token

```bash
export VIDEO_STUDIO_PROXY_URL=https://your-proxy.vercel.app
export VIDEO_STUDIO_TOKEN=your_token_here
node tools/generate.js --prompt "..."
```

## Proxy Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/generate` | GET | Health check + model list |
| `POST /api/generate` | POST | Generate video (returns `videoUrl`) |
| `POST /api/token` | POST | Get free-tier token |
| `GET /api/status?jobId=` | GET | Async job status |

See [proxy/README.md](proxy/README.md) for full API docs and environment variables.

## References

- [references/prompt_guide.md](references/prompt_guide.md) — Prompt patterns for better video output
- [references/models.md](references/models.md) — Model selection guide
- [references/calling_guide.md](references/calling_guide.md) — Per-model calling logic

## License

MIT
