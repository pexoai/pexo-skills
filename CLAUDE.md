# CLAUDE.md — pexo-skills

Runtime contract for the Pexo skills. Claude Code reads this automatically; other
agents should fetch it before using any skill.

## What this is

Open-source agent skills for AI video production. Two categories:

**Pexo agent (the product wrapper)** — delegates to the hosted Pexo video agent:

```
pexo-agent  →  create project → chat (relay the user's words) → poll → deliver finished video
```

You are a delivery worker. Upload assets, relay the user's request **verbatim**, poll for
status, and return the finished video. Pexo's backend does all creative work — scriptwriting,
model selection, prompt engineering, music, subtitles. Do **not** add your own creative
direction; it lowers quality.

**Creative studios & prompters (core assets)** — self-contained skills:

```
videoagent-video-studio  →  text/image-to-video across 7 models (hosted proxy, no keys)
videoagent-image-studio  →  image generation across 8 models
videoagent-audio-studio  →  TTS, music, SFX, voice cloning
videoagent-director      →  storyboard → generates images, clips, and audio shot by shot
seedance-2.0-prompter    →  expert Seedance 2.0 prompts
veo-3.2-prompter         →  expert Google Veo 3.2 prompts
```

## Hard rules (pexo-agent)

1. Reply to the user in their language.
2. Relay the user's message to Pexo verbatim; only add asset tags for uploaded files.
3. During `WAIT`, only poll (`pexo-project-get`). Never call `pexo-chat` during `WAIT` — it
   triggers duplicate production.
4. Deliver the full asset URL as plain text (all query params); never truncate or
   markdown-wrap it.

## Config

`~/.pexo/config`:

```
PEXO_BASE_URL="https://pexo.ai"
PEXO_API_KEY="sk-<your-api-key>"
```

First-time setup or config errors → run `skills/pexo-agent/scripts/pexo-doctor.sh`.

## Repository structure

```
pexo-skills/
├── README.md                     # public-facing description
├── INSTALL.md                    # human-facing install
├── INSTALL_FOR_AGENTS.md         # agent-driven install runbook
├── CONTRIBUTING.md               # PR workflow + quality bar + slug convention
├── CLAUDE.md                     # this file — runtime contract
├── LICENSE                       # MIT
├── VERSION                       # repo-wide version
├── scripts/
│   └── update-check.sh           # opt-in version check (relayed by pexo-agent)
├── .claude-plugin/marketplace.json   # Claude Code
├── .codex-plugin/plugin.json         # OpenAI Codex
├── .cursor-plugin/plugin.json        # Cursor
├── .github/workflows/                # validate, publish, awesome-list submit
└── skills/
    ├── pexo-agent/                   # the product wrapper (shell → Pexo API)
    ├── videoagent-video-studio/
    ├── videoagent-image-studio/
    ├── videoagent-audio-studio/
    ├── videoagent-director/
    ├── seedance-2.0-prompter/
    └── veo-3.2-prompter/
```

## Updates

`scripts/update-check.sh` compares the local `VERSION` to the remote and prints
`UPGRADE_AVAILABLE <old> <new>` when a newer release exists. The pexo-agent skill calls it
opportunistically and relays the result to the user with the update command. Failures are
always silent.
