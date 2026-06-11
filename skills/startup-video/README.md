# Startup Video — Pexo

Turn your startup's story into a publish-ready video. Describe your company or paste your site,
and Pexo writes the script, generates the shots, and assembles a finished video with music — for
your homepage, deck, or socials.

## Install

```bash
npx skills add https://github.com/pexoai/pexo-skills --skill startup-video
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

> Make a 30-second intro video for our startup — a marketplace for local farmers.

Pexo writes the script, picks the right model per shot, generates everything, and returns a
finished video with music and subtitles. See `SKILL.md` for the full workflow; run
`scripts/pexo-doctor.sh` if setup fails.

## What this is

A thin wrapper that delegates to the hosted Pexo video agent — the same backend as the
`pexo-agent` skill, scoped to the startup-video scenario. All creative work (scriptwriting,
model selection, prompts, music, subtitles) happens server-side.
