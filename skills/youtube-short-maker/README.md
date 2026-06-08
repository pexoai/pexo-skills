# YouTube Short Maker — Pexo

Make YouTube Shorts that hold attention — vertical, fast-paced, hook-first. Pexo scripts,
generates, and assembles a finished Short with music and captions — no prompt engineering, no
editing.

## Install

```bash
npx skills add https://github.com/pexoai/pexo-skills --skill youtube-short-maker
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

> Make a YouTube Short on 3 quick tips for better sleep.

Pexo writes the script, picks the right model per shot, generates everything, and returns a
finished video with music and subtitles. See `SKILL.md` for the full workflow; run
`scripts/pexo-doctor.sh` if setup fails.

## What this is

A thin wrapper that delegates to the hosted Pexo video agent — the same backend as the
`pexo-agent` skill, scoped to the youtube-short-maker scenario. All creative work (scriptwriting,
model selection, prompts, music, subtitles) happens server-side.
