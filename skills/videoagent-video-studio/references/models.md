# Video Generation Models

All models supported by the video-studio proxy. Pass `model` in the request body or use `--model` in the CLI.

For per-model endpoint details and input parameters, see [calling_guide.md](calling_guide.md).

## Generation Modes

| Mode | Description | Supported Models |
|------|-------------|-----------------|
| **text-to-video** | Text prompt only → video | minimax, kling, veo, hunyuan, grok, seedance |
| **image-to-video** | Single image + prompt → animated clip | minimax, kling, veo, pixverse, grok, seedance |
| **reference-based** | Reference images or video → consistent output | minimax, kling, veo, hunyuan, grok, seedance |

Reference-based generation uses a separate endpoint per model. Supported models return `ref: true` and `referenceToVideoEndpoint` in `GET /api/generate`.

## Reference Endpoints

Each model's reference-based mode uses an independent endpoint:

| Model | Reference Endpoint | Input |
|-------|-------------------|-------|
| **minimax** | `…/video-01-subject-reference` | Single subject reference image — character consistency |
| **kling** | `…/kling-video/o3/standard/reference-to-video` | Multi-element images, keyframes, character elements (O3) |
| **veo** | `…/veo3.1/reference-to-video` | Multiple reference images — style/character consistency |
| **hunyuan** | `…/hunyuan-video/video-to-video` | Reference video + prompt — style transfer (`strength` param) |
| **grok** | `…/grok-imagine-video/edit-video` | Reference video + prompt — content/style editing |
| **seedance** | Same endpoint, body-distinguished | Text / image / reference all routed by request body |

## Model List

| Model ID | Name | T2V | I2V | Reference | Notes |
|----------|------|-----|-----|-----------|-------|
| **minimax** | MiniMax Video 01 | ✅ | ✅ | ✅ | Balanced, good default |
| **kling** | Kling 3.0 | ✅ | ✅ | ✅ | v3 for T2V/I2V; O3 for reference |
| **veo** | Google Veo 3.1 | ✅ | ✅ | ✅ | Latest Veo, 4K option |
| **hunyuan** | Hunyuan Video | ✅ | — | ✅ | Open-source T2V |
| **pixverse** | PixVerse v4.5 | — | ✅ | — | Stylized I2V only |
| **grok** | Grok Imagine Video | ✅ | ✅ | ✅ | 1–15 s, 480p/720p |
| **seedance** | Seedance 1.5 Pro | ✅ | ✅ | ✅ | ByteDance, synchronized audio, 4–12 s |

## Choosing a Model

- **Default (auto)**: Proxy picks the first available model for the requested mode (usually minimax).
- **Cinematic / commercial**: `veo`, `kling`, `grok`.
- **Fast preview**: `minimax`.
- **Image-to-video only**: `pixverse`.
- **Open / self-hostable**: `hunyuan`.
- **Synchronized audio**: `seedance` (pair with seedance-2.0-prompter for best prompts).

## Provider Limits

- **Duration**: Varies by model — Veo maps to 4s/6s/8s, Kling uses 5s/10s, Seedance 4–12 s, Grok 1–15 s.
- **Resolution**: Most default to 720p; some support 480p (preview) or 4K.
- **Reference mode**: `veo/reference-to-video` only accepts `duration: "8s"` (API constraint).
