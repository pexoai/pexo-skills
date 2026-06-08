# Explainer Video — Pexo

Create explainer videos with narration. Pexo writes the script, generates visuals shot by shot,
adds TTS voiceover and captions, and assembles a clear, finished explainer — no prompt
engineering, no editing.

## Install

```bash
npx skills add https://github.com/pexoai/pexo-skills --skill explainer-video
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

> Explain how our budgeting app works in a 60-second video.

Pexo writes the script, picks the right model per shot, generates everything, and returns a
finished video with music and subtitles. See `SKILL.md` for the full workflow; run
`scripts/pexo-doctor.sh` if setup fails.

## What this is

A thin wrapper that delegates to the hosted Pexo video agent — the same backend as the
`pexo-agent` skill, scoped to the explainer-video scenario. All creative work (scriptwriting,
model selection, prompts, music, subtitles) happens server-side.
