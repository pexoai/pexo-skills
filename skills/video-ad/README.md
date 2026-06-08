# Video Ad — Pexo

Turn a product or brief into a scroll-stopping video ad. Pexo writes the hook, sequences the
shots, auto-selects the models, and delivers a finished ad with music — ready to run, no editing
required.

## Install

```bash
npx skills add https://github.com/pexoai/pexo-skills --skill video-ad
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

> Make a 15-second video ad for our new running shoes.

Pexo writes the script, picks the right model per shot, generates everything, and returns a
finished video with music and subtitles. See `SKILL.md` for the full workflow; run
`scripts/pexo-doctor.sh` if setup fails.

## What this is

A thin wrapper that delegates to the hosted Pexo video agent — the same backend as the
`pexo-agent` skill, scoped to the video-ad scenario. All creative work (scriptwriting,
model selection, prompts, music, subtitles) happens server-side.
