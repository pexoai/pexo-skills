# Image to Video — Pexo

Turn a still image into a moving, publish-ready video. Upload a photo and Pexo auto-selects the
best image-to-video model, adds natural motion and camera moves, and assembles a finished clip
with music — no prompt engineering, no model picking.

## Install

```bash
npx skills add https://github.com/pexoai/pexo-skills --skill image-to-video
```

## Configure

Create `~/.pexo/config`:

```
PEXO_BASE_URL="https://pexo.ai"
PEXO_API_KEY="sk-<your-key>"
```

Get an API key at <https://pexo.ai>.

## Use

Ask your agent, for example:

> Animate this product photo into a 10-second clip with a slow zoom.

Pexo writes the script, picks the right model per shot, generates everything, and returns a
finished video with music and subtitles. See `SKILL.md` for the full workflow; run
`scripts/pexo-doctor.sh` if setup fails.

## What this is

A thin wrapper that delegates to the hosted Pexo video agent — the same backend as the
`pexo-agent` skill, scoped to the image-to-video scenario. All creative work (scriptwriting,
model selection, prompts, music, subtitles) happens server-side.
