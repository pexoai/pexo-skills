# Product Video — Pexo

Turn product photos into a publish-ready product video. Upload your images and Pexo composes the
shots, adds motion and music, and returns a finished clip for your listing, ads, or socials — no
editing, no model picking.

## Install

```bash
npx skills add https://github.com/pexoai/pexo-skills --skill product-video
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

> Make a 20-second product video from these three sneaker photos.

Pexo writes the script, picks the right model per shot, generates everything, and returns a
finished video with music and subtitles. See `SKILL.md` for the full workflow; run
`scripts/pexo-doctor.sh` if setup fails.

## What this is

A thin wrapper that delegates to the hosted Pexo video agent — the same backend as the
`pexo-agent` skill, scoped to the product-video scenario. All creative work (scriptwriting,
model selection, prompts, music, subtitles) happens server-side.
