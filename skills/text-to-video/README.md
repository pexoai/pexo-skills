# Text to Video — Pexo

Turn a text prompt or script into a finished, multi-shot video. Pexo auto-selects the best
model across 10+ engines (Seedance, Kling, Veo, Sora, and more), writes the prompts, generates
every shot, and assembles a publish-ready video with music, subtitles, and transitions — no
prompt engineering, no model picking, no editing.

## Install

```bash
npx skills add https://github.com/pexoai/pexo-skills --skill text-to-video
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
`pexo-agent` skill, scoped to the text-to-video scenario. All creative work (scriptwriting,
model selection, prompts, music, subtitles) happens server-side.
