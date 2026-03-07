# pexo-skills

> **One-command access to the best AI creative tools — no API keys, no setup, no friction.**

A collection of open-source **Agent Skills** for AI coding assistants, focused on **content creation** — images, audio, and video. We handle all the service integrations so you can focus on creating.

Compatible with [Claude Code](https://claude.ai/code), [OpenClaw](https://openclaw.ai), and any agent supporting the [Agent Skills](https://agentskills.io) standard.

---

## Skills

| Skill | What it does | Models |
|-------|-------------|--------|
| 🎨 [videoagent-image-studio](skills/videoagent-image-studio/) | Generate any image — photo, illustration, logo, artwork. Tired of juggling 8 API keys? One command does it all. | Midjourney · Flux · Ideogram · Recraft · Gemini |
| 🎙️ [videoagent-audio-studio](skills/videoagent-audio-studio/) | TTS, music, sound effects, voice cloning — the complete audio toolkit in a single skill. | ElevenLabs · more |
| 🎬 [videoagent-video-studio](skills/videoagent-video-studio/) | Text-to-video, image-to-video, reference-to-video. 7 models, zero API keys, free tier included. | Kling · Veo · Grok · Seedance · MiniMax · Hunyuan · PixVerse |
| 🎥 [seedance-2.0-prompter](skills/seedance-2.0-prompter/) | Expert prompt engineer for Seedance 2.0 — turns rough ideas into structured, high-quality video prompts. | — |

---

## Why pexo-skills?

- **Zero setup** — no API keys required for core functionality; just install and go
- **Production-ready** — rate limiting, error handling, async polling all built in
- **Multi-model** — each skill picks the best model for the job, or lets you choose
- **Open source** — inspect every line, deploy your own proxy, contribute improvements

---

## Quick Install

### Claude Code Plugin Marketplace
```bash
/plugin marketplace add pexoai/pexo-skills
```

### Via npx
```bash
npx skills add pexoai/pexo-skills
```

### Via ClaWHub
```bash
clawhub install pexoai/videoagent-image-studio
clawhub install pexoai/videoagent-audio-studio
clawhub install pexoai/videoagent-video-studio
clawhub install pexoai/seedance-2.0-prompter
```

---

## Skill Structure

Each skill follows the [Agent Skills Specification](https://agentskills.io/specification):

```
skill-name/
├── SKILL.md          # Agent instructions and metadata
├── README.md         # Human-readable docs
├── tools/            # Executable scripts the agent calls
├── proxy/            # Serverless API proxy (deploy on Vercel)
└── references/       # Knowledge base — models, prompts, guides
```

---

## About

Built and maintained by [@pexoai](https://github.com/pexoai) — a team focused on making AI-powered creative tools accessible to every developer and creator.

- **Issues / Feedback**: [GitHub Issues](https://github.com/pexoai/pexo-skills/issues)
- **ClawHub**: [clawhub.ai/pexoai](https://clawhub.ai/pexoai)

## License

MIT
