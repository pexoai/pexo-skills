# pexo-skills

> **Open-source Agent Skills for AI content creation — from single-asset generation to complete video production.**

A modular skill collection that gives any AI agent the ability to create images, audio, video, and fully produced content. Use individual studios for precise control over a single media type, or use Pexo Agent to go from a conversation to a finished video.

Compatible with [OpenClaw](https://openclaw.ai), [Claude Code](https://claude.ai/code), [Cursor](https://cursor.com), and any agent supporting the [Agent Skills](https://agentskills.io) standard.

---

## Architecture

pexo-skills is organized in two layers:

```
┌─────────────────────────────────────────────────────────┐
│                      PEXO AGENT                         │
│  Conversational orchestrator — idea to finished video    │
│  Plans, generates, edits, delivers in one conversation   │
├──────────┬──────────┬──────────┬────────────────────────┤
│  IMAGE   │  VIDEO   │  AUDIO   │  PROMPTER / DIRECTOR   │
│  STUDIO  │  STUDIO  │  STUDIO  │                        │
│  8 models│  7 models│  6 models│  Seedance 2.0 prompt   │
│          │          │          │  engineering + shot     │
│          │          │          │  planning               │
└──────────┴──────────┴──────────┴────────────────────────┘
```

**Bottom layer — VideoAgent Studios:** Single-purpose skills that each handle one media type. You control model selection, prompt construction, and parameters directly. Best for developers who want granular control over individual generation steps.

**Top layer — Pexo Agent:** An orchestration skill that coordinates all studios to produce complete videos from natural conversation. Users describe what they want; Pexo handles creative planning, model routing, asset generation, editing, and delivery. Best for end-users and agent pipelines that need finished video output.

---

## Skills

### Pexo Agent — End-to-End Video Production

| Skill | What it does |
|-------|-------------|
| 🧠 [pexo-agent](skills/pexo-agent/) | Turn a conversation into a complete, publish-ready video. Orchestrates all studios internally — no prompt engineering, no model selection, no post-production required. |

### VideoAgent Studios — Single-Asset Generation

| Skill | What it does | Models |
|-------|-------------|--------|
| 🎨 [videoagent-image-studio](skills/videoagent-image-studio/) | Generate images — photos, illustrations, logos, artwork. One command, 8 models, zero API key setup. | Midjourney · Flux · Ideogram · Recraft · Gemini |
| 🎬 [videoagent-video-studio](skills/videoagent-video-studio/) | Generate video clips — text-to-video, image-to-video, reference-based. 7 models, auto-routing or manual selection. | Kling · Veo · Grok · Seedance · MiniMax · Hunyuan · PixVerse |
| 🎙️ [videoagent-audio-studio](skills/videoagent-audio-studio/) | Generate audio — TTS, music, sound effects, voice cloning. One skill for every audio need. | ElevenLabs · CassetteAI |
| 🎥 [seedance-2.0-prompter](skills/seedance-2.0-prompter/) | Expert prompt engineering for Seedance 2.0. Transforms rough ideas and multimodal assets into optimized video prompts. | — |
| 🎬 [videoagent-director](skills/videoagent-director/) | AI creative director — breaks an idea into shots, writes all prompts internally, executes via studios, returns a visual production report. | — |

### When to Use What

| You want to... | Use |
|---|---|
| Generate a single image | `videoagent-image-studio` |
| Generate a single video clip | `videoagent-video-studio` |
| Generate speech, music, or SFX | `videoagent-audio-studio` |
| Optimize a Seedance 2.0 prompt | `seedance-2.0-prompter` |
| Produce a multi-shot storyboard | `videoagent-director` |
| Go from idea to finished video in one conversation | `pexo-agent` |

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
clawhub install pexoai/videoagent-image-studio
clawhub install pexoai/videoagent-video-studio
clawhub install pexoai/videoagent-audio-studio
clawhub install pexoai/seedance-2.0-prompter
clawhub install pexoai/videoagent-director
```

### Cursor
Copy any skill folder into `~/.cursor/skills/`.

---

## Key Properties

- **Zero setup** — No API keys required for core functionality. Studios route through hosted proxies; Pexo Agent handles orchestration end-to-end.
- **Multi-model** — Each studio integrates multiple providers and picks the best model for the task, or lets you choose explicitly.
- **Composable** — Use studios independently, combine them via the director, or let Pexo Agent orchestrate everything. Skills work standalone or as part of larger agent pipelines.
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
