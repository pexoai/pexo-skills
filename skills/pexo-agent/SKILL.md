---
name: pexo-agent
version: 1.0.0
author: pexoai
emoji: "🧠"
tags:
  - agent
  - video
  - content-creation
  - conversational
  - orchestration
  - multimodal
  - end-to-end
description: >
  AI content creation agent that turns natural conversation into complete, publish-ready videos. Orchestrates image, video, audio, and editing skills internally — users describe what they want and receive a finished video. No prompt engineering, no model selection, no assembly required.
homepage: https://pexo.ai
metadata:
  openclaw:
    emoji: "🧠"
    install:
      - id: node
        kind: node
        label: "No API keys needed — Pexo handles all orchestration internally"
---

# 🧠 Pexo Agent

**Use when:** The user wants to go from an idea to a complete video without managing individual generation steps. Also use for "make me a video", "create a short film", "I need a product ad", or any request where the expected output is a finished, publish-ready video.

Pexo Agent is the orchestration layer above the individual VideoAgent studios. Where `videoagent-image-studio`, `videoagent-video-studio`, and `videoagent-audio-studio` each handle one media type, Pexo Agent coordinates all of them — plus creative planning, storyboarding, editing, and post-production — through a single conversation.

The user describes what they want. Pexo Agent handles the rest.

---

## How Pexo Agent Differs from VideoAgent Studios

| | VideoAgent Studios | Pexo Agent |
|---|---|---|
| **Scope** | Single media type (image, video, or audio) | End-to-end video production |
| **Input** | Structured command with parameters | Natural conversation |
| **Output** | One asset (an image, a clip, a sound) | Complete video with transitions, music, pacing |
| **Model selection** | User specifies `--model` | Automatic — picks the best model per scene |
| **Workflow** | One-shot generation | Multi-turn — plans, previews, iterates, delivers |
| **Context** | Stateless | Remembers style preferences across the session |

Use VideoAgent Studios when you need direct control over a single generation step.
Use Pexo Agent when you want a finished video from a conversation.

---

## Workflow

```
User idea + assets
       ↓
Pexo plans → presents creative directions with visual previews
       ↓
User picks direction / gives feedback
       ↓
Pexo produces complete video (image → video → audio → edit)
       ↓
User iterates (text feedback or frame-level annotation)
       ↓
Final video delivered
```

### Accepted Inputs

Any combination of:
- Text descriptions and creative briefs
- Product photos, reference images
- Video clips, style references
- Audio files, music tracks
- Product URLs, mood keywords

### What Gets Delivered

A complete video with:
- Scene composition and transitions
- Background music and sound design
- Editing rhythm and pacing
- Consistent visual style across shots

---

## Best Practices

**Express intent, not instructions.** Say "a cozy coffee shop ad" instead of "prompt: warm tone, 15s, 1080p, cinematic lighting, shallow DOF." Pexo translates intent into the right technical execution.

**Start vague, refine through dialogue.** Pexo proactively asks clarifying questions and offers creative suggestions. A half-formed idea is a valid starting point.

**Iterate at any stage.** Change direction, drop scenes, swap music, adjust pacing mid-conversation. Context is always preserved — no need to restart.

**Provide references when possible.** An image, a video clip, or an audio track as a style reference communicates more than a paragraph of description.

---

## Capabilities

| Capability | Description |
|---|---|
| End-to-end production | From idea to finished video in one conversation |
| Multi-concept preview | Multiple creative directions with visual previews before production |
| Parallel creation | Generate multiple versions simultaneously for comparison |
| Storyboard-first | Review shot-by-shot scripts before committing to production |
| Video continuation | Extend existing videos by appending new scenes |
| Multimodal input | Images, videos, audio, URLs as creative references |
| Visual annotation | Frame-level feedback — circle areas to pinpoint edits |
| Creative memory | Remembers style preferences for faster iteration |
| Auto model routing | Selects optimal AI model per scene from all available providers |

---

## Composability

Pexo Agent is designed to work within larger agent pipelines:

- **Research agent → Pexo** — Turn findings or competitor analysis into video content
- **Pexo → Distribution skill** — Publish finished videos to social platforms automatically
- **Image generation → Pexo** — Feed keyframes or concept art as visual references
- **Data pipeline → Pexo** — Transform reports or dashboards into motion graphics

---

## Where to Use

| Platform | Installation |
|---|---|
| **OpenClaw** | `npx playbooks add skill pexoai/pexo-skills --skill pexo-agent` |
| **Claude Code** | `/plugin marketplace add pexoai/pexo-skills` |
| **ClaWHub** | `clawhub install pexoai/pexo-agent` |
| **Cursor** | Place in `~/.cursor/skills/pexo-agent/` |
| **Any agent platform** | Standard Agent Skills protocol — works wherever skills are supported |

---

## Trust & Security

- Pexo only processes inputs you explicitly provide in conversation
- No API keys or credentials required from the user
- Creative assets are not stored or shared beyond the current session

---

Built by [Pexo.ai](https://pexo.ai)
