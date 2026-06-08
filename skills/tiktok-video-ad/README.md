# TikTok Video Ad — Pexo

Make native TikTok video ads — vertical 9:16, sound-on, hook-first. Pexo writes the script in
TikTok's voice, sequences fast-paced shots, and delivers a ready-to-post ad with music — no
editing.

## Install

```bash
npx skills add https://github.com/pexoai/pexo-skills --skill tiktok-video-ad
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

> Make a TikTok ad for our skincare serum.

Pexo writes the script, picks the right model per shot, generates everything, and returns a
finished video with music and subtitles. See `SKILL.md` for the full workflow; run
`scripts/pexo-doctor.sh` if setup fails.

## What this is

A thin wrapper that delegates to the hosted Pexo video agent — the same backend as the
`pexo-agent` skill, scoped to the tiktok-video-ad scenario. All creative work (scriptwriting,
model selection, prompts, music, subtitles) happens server-side.
