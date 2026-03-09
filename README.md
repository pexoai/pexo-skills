# pexo-skills

> **Open-source Agent Skills for AI content creation — pick the level of control you need.**

A collection of independent skills for AI content creation, organized by the problem they solve. Use one, use all, or combine them however you want. Each skill works on its own — no dependencies between them.

Compatible with [OpenClaw](https://openclaw.ai), [Claude Code](https://claude.ai/code), [Cursor](https://cursor.com), and any agent supporting the [Agent Skills](https://agentskills.io) standard.

---

## Skills

### 🧠 Agent — Your AI Creative Partner

For when you want a finished result and don't want to think about how it gets made. Describe what you're imagining — Pexo thinks with you, picks the best AI models, and delivers a polished, ready-to-share piece.

| Skill | Description |
|-------|-------------|
| [pexo-agent](skills/pexo-agent/) | AI creative partner that turns conversation into complete, publish-ready content. No prompts to write, no models to choose, no editing skills required. Just describe your idea. |

---

### ✍️ Creative — Story & Prompt Craft

For when you want to shape the creative direction before anything gets generated. Plan the narrative, design the storyboard, engineer the prompts.

| Skill | Description |
|-------|-------------|
| [videoagent-director](skills/videoagent-director/) | AI creative director. Takes an idea, breaks it into a shot-by-shot storyboard, writes all prompts internally, and executes production. You approve the plan; it handles the rest. |
| [seedance-2.0-prompter](skills/seedance-2.0-prompter/) | Expert prompt engineering for Seedance 2.0. Transforms rough ideas and multimodal assets into structured, optimized generation prompts. |

---

### 🔧 Studios — Model-Level Generation

For when you want direct control over a specific generation step — choose the model, craft the prompt, set the parameters.

| Skill | Description | Models |
|-------|-------------|--------|
| [videoagent-image-studio](skills/videoagent-image-studio/) | Generate images — photos, illustrations, logos, artwork. One command, 8 models. | Midjourney · Flux · Ideogram · Recraft · Gemini |
| [videoagent-video-studio](skills/videoagent-video-studio/) | Generate video clips — text-to-video, image-to-video, reference-based. 7 models, auto-routing or manual selection. | Kling · Veo · Grok · Seedance · MiniMax · Hunyuan · PixVerse |
| [videoagent-audio-studio](skills/videoagent-audio-studio/) | Generate audio — TTS, music, sound effects, voice cloning. One skill for every audio need. | ElevenLabs · CassetteAI |

---

### Pick What Fits

| You need... | Use |
|---|---|
| A finished piece from a conversation | `pexo-agent` |
| A storyboard and directed production | `videoagent-director` |
| An optimized Seedance 2.0 prompt | `seedance-2.0-prompter` |
| A single image | `videoagent-image-studio` |
| A single video clip | `videoagent-video-studio` |
| Speech, music, or sound effects | `videoagent-audio-studio` |

Every skill solves a different problem. None requires another to work.

---

## Quick Install

### OpenClaw / npx
```bash
npx playbooks add skill pexoai/pexo-skills
```

### Claude Code
```bash
/plugin marketplace add pexoai/pexo-skills
```

### ClaWHub
```bash
clawhub install pexoai/pexo-agent
clawhub install pexoai/videoagent-director
clawhub install pexoai/seedance-2.0-prompter
clawhub install pexoai/videoagent-image-studio
clawhub install pexoai/videoagent-video-studio
clawhub install pexoai/videoagent-audio-studio
```

### Cursor
Copy any skill folder into `~/.cursor/skills/`.

---

## Key Properties

- **Minimal setup** — One API key unlocks every capability. No juggling credentials across providers.
- **Multi-model** — Studios integrate multiple providers and pick the best model for the job, or let you choose explicitly.
- **Independent** — Every skill works standalone. Use one or combine several — no coupling, no orchestration required.
- **Open source** — Every skill, proxy, and tool is inspectable. Deploy your own infrastructure if you need full control.

---

## Skill Structure

Each skill follows the [Agent Skills Specification](https://agentskills.io/specification):

```
skill-name/
├── SKILL.md          # Agent instructions and metadata
├── tools/            # Executable scripts the agent calls
├── proxy/            # Serverless API proxy (deploy on Vercel)
└── references/       # Knowledge base — models, prompts, guides
```

---

## About

Built and maintained by [@pexoai](https://github.com/pexoai).

- **Website**: [pexo.ai](https://pexo.ai)
- **Issues / Feedback**: [GitHub Issues](https://github.com/pexoai/pexo-skills/issues)
- **ClawHub**: [clawhub.ai/pexoai](https://clawhub.ai/pexoai)

## License

MIT
