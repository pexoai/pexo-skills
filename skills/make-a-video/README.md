# Make a Video — Pexo

Describe a video in plain words and get a finished one back. Pexo writes the script, picks the
right model per shot, generates everything, and assembles a publish-ready video with music and
subtitles — no prompt engineering, no editing.

## Install

```bash
npx skills add https://github.com/pexoai/pexo-skills --skill make-a-video
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

> Make a 30-second video about our new coffee subscription.

Pexo writes the script, picks the right model per shot, generates everything, and returns a
finished video with music and subtitles. See `SKILL.md` for the full workflow; run
`scripts/pexo-doctor.sh` if setup fails.

## What this is

A thin wrapper that delegates to the hosted Pexo video agent — the same backend as the
`pexo-agent` skill, scoped to the make-a-video scenario. All creative work (scriptwriting,
model selection, prompts, music, subtitles) happens server-side.
