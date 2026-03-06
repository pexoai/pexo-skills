# pexo-skills

A collection of open-source **Agent Skills** for [OpenClaw](https://openclaw.ai), focused on **content creation** — images, audio, and video — with zero API key management.

> We handle all the service integrations so you can focus on creating.

Compatible with [Claude Code](https://code.claude.com/docs/en/skills), [OpenClaw](https://openclaw.ai), and other agents supporting the [Agent Skills](https://agentskills.io) standard.

## Available Skills

| Skill | Description | Category |
|---|---|---|
| 🎨 [image-studio](skills/image-studio/) | Generate images with 8 AI models (Midjourney, Flux, Ideogram, and more). Zero API keys needed. | Image |
| 🎙️ [audiomind](skills/audiomind/) | TTS, music, sound effects, and voice cloning — all in one skill. | Audio |
| 🎥 [seedance-prompter](skills/seedance-prompter/) | Expert prompt engineering for Seedance 2.0 video generation. | Video |

## Quick Install

### Via ClaWHub (Recommended)
```bash
clawhub install pexoai/image-studio
clawhub install pexoai/audiomind
clawhub install pexoai/seedance-prompter
```

### Via npx skills
```bash
npx skills add pexoai/pexo-skills
```

### Via Claude Code Plugin Marketplace
```bash
/plugin marketplace add pexoai/pexo-skills
```

## Skill Format

Each skill follows the [Agent Skills Specification](https://agentskills.io/specification):

```
skill-name/
├── SKILL.md              # Required: Instructions and metadata
├── README.md             # Recommended: Human-readable docs
├── references/           # Optional: Knowledge base files
├── scripts/              # Optional: Executable scripts
└── assets/               # Optional: Static resources
```

## About

These skills are built and maintained by [@pexoai](https://github.com/pexoai), a content creation skills team focused on making AI-powered creative tools accessible to everyone.

- **ClawHub**: [clawhub.ai/pexoai](https://clawhub.ai/pexoai)
- **Issues / Feedback**: [GitHub Issues](https://github.com/pexoai/pexo-skills/issues)

## License

MIT
