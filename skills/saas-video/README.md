# SaaS Video — Pexo

Turn your SaaS into a publish-ready demo or explainer video. Describe the product or paste your
app URL, and Pexo writes the script, generates the visuals, and adds narration and captions — for
your landing page, onboarding, or sales.

## Install

```bash
npx skills add https://github.com/pexoai/pexo-skills --skill saas-video
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

> Make a 60-second demo video for our SaaS that automates expense reports.

Pexo writes the script, picks the right model per shot, generates everything, and returns a
finished video with music and subtitles. See `SKILL.md` for the full workflow; run
`scripts/pexo-doctor.sh` if setup fails.

## What this is

A thin wrapper that delegates to the hosted Pexo video agent — the same backend as the
`pexo-agent` skill, scoped to the saas-video scenario. All creative work (scriptwriting,
model selection, prompts, music, subtitles) happens server-side.
