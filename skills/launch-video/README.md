# Launch Video — Pexo

Turn your product or pitch into a publish-ready launch video. Describe it (or paste your
landing-page URL) and Pexo writes the script, generates the shots, and assembles a finished launch
video with music — ready for Product Hunt, your site, or launch-day socials.

## Install

```bash
npx skills add https://github.com/pexoai/pexo-skills --skill launch-video
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

> Make a 45-second launch video for our SaaS that writes meeting notes automatically.

Pexo writes the script, picks the right model per shot, generates everything, and returns a
finished video with music and subtitles. See `SKILL.md` for the full workflow; run
`scripts/pexo-doctor.sh` if setup fails.

## What this is

A thin wrapper that delegates to the hosted Pexo video agent — the same backend as the
`pexo-agent` skill, scoped to the launch-video scenario. All creative work (scriptwriting,
model selection, prompts, music, subtitles) happens server-side.
