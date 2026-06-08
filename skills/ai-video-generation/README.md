# AI Video Generation — Pexo

Generate AI video from text, images, or scripts. Pexo auto-routes each shot to the best of 10+
models, handles the prompts and generation, and returns a finished video with music and
subtitles — one skill, no model picking.

## Install

```bash
npx skills add https://github.com/pexoai/pexo-skills --skill ai-video-generation
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

> Generate a 20-second AI video introducing our productivity app.

Pexo writes the script, picks the right model per shot, generates everything, and returns a
finished video with music and subtitles. See `SKILL.md` for the full workflow; run
`scripts/pexo-doctor.sh` if setup fails.

## What this is

A thin wrapper that delegates to the hosted Pexo video agent — the same backend as the
`pexo-agent` skill, scoped to the ai-video-generation scenario. All creative work (scriptwriting,
model selection, prompts, music, subtitles) happens server-side.
