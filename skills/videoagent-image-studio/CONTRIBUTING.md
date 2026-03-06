# Contributing Guide

This document explains how to participate in the development and iteration of the `videoagent-image-studio` Skill.

## Project Structure

```
videoagent-image-studio/
├── SKILL.md          # Skill core definition file (read by OpenClaw)
├── tools/
│   └── generate.js   # Image generation core script (Node.js ESM)
├── package.json      # Dependencies (@fal-ai/client)
├── .env.example      # Environment variables example
├── CONTRIBUTING.md   # This file
└── CHANGELOG.md      # Version history
```

## Development Environment Setup

```bash
# 1. Clone the repository
git clone https://github.com/pexoai/videoagent-image-studio.git
cd videoagent-image-studio

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and add your API Keys:
# FAL_KEY=your_fal_key
# LEGNEXT_KEY=your_legnext_key
```

## Local Testing

```bash
# Test Flux Dev (fast, only needs FAL_KEY)
FAL_KEY=your_key node tools/generate.js \
  --model flux-dev \
  --prompt "a cute cat, photorealistic" \
  --aspect-ratio 1:1

# Test Midjourney (requires LEGNEXT_KEY)
LEGNEXT_KEY=your_key node tools/generate.js \
  --model midjourney \
  --prompt "a majestic snow leopard, cinematic" \
  --aspect-ratio 16:9
```

## Supported Models

| Model Key | Provider | Description |
|---|---|---|
| `midjourney` | Legnext.ai | Strongest artistic style, requires LEGNEXT_KEY |
| `flux-pro` | fal.ai | Highest quality photorealistic |
| `flux-dev` | fal.ai | General-purpose high quality |
| `flux-schnell` | fal.ai | Fastest, good for drafts |
| `sdxl` | fal.ai | SDXL Lightning 4-step |
| `nano-banana` | fal.ai | Gemini-powered |
| `ideogram` | fal.ai | Best text layout |
| `recraft` | fal.ai | Vector/icon style |

## Development Guidelines

- **Branch naming**: `feature/xxx`, `fix/xxx`, `chore/xxx`
- **Commit format**: Use [Conventional Commits](https://www.conventionalcommits.org/)
  - `feat: add xxx model support`
  - `fix: fix Midjourney polling timeout issue`
  - `docs: update SKILL.md usage instructions`
- **PR workflow**: Create PR from `feature` branch to `main`, requires at least 1 review

## Publishing New Version to ClawHub

```bash
# Install clawhub CLI (if not installed)
npm i -g clawhub

# Login (using Token)
clawhub login --token <your_clawhub_token>

# Publish new version
clawhub publish . \
  --slug videoagent-image-studio \
  --name "Image Gen" \
  --version 2.x.x \
  --changelog "Release notes..." \
  --tags "latest,image,midjourney,flux,sdxl,fal,generation,ai"
```

## FAQ

**Q: Where do I get FAL_KEY?**
A: Create an API Key at [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys).

**Q: Where do I get LEGNEXT_KEY?**
A: Get an API Key at [legnext.ai/dashboard](https://legnext.ai/dashboard).

**Q: How do I add a new model?**
A: Add the new model ID to the `FAL_MODELS` object in `tools/generate.js`, then add input construction logic in the corresponding `generateFal()` function, and finally update the model selection guide in `SKILL.md`.
