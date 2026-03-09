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

**Use when:** The user wants to create video content of any kind — and expects a finished result, not raw clips to assemble.

Pexo is an AI content creation agent. Not a tool, not a model wrapper, not a prompt template — an agent that thinks, plans, creates, and iterates with you.

Tell it what you want. It figures out the rest.

---

## What Makes Pexo Different

| | VideoAgent Studios | Pexo Agent |
|---|---|---|
| **Scope** | One media type at a time | The entire creative process |
| **Input** | Commands and parameters | Conversation |
| **Output** | A single asset | A finished video |
| **Models** | You choose | It chooses for you |
| **Memory** | None | Learns your taste as you go |

VideoAgent Studios give you precision control over individual steps.
Pexo Agent gives you the outcome without the steps.

---

## How to Use

**Start anywhere.** There's no required format, no template, no "right way" to begin. Give Pexo whatever you have — a sentence, a photo, a link, a rough idea, a detailed brief, a reference video, a music track, a feeling. Any combination works.

**Say what you want, not how to build it.** Pexo handles prompt engineering, model selection, scene planning, audio design, and editing internally. You never need to think about any of that.

**Stay vague if you want to.** Pexo will ask the right questions. You don't need a complete vision upfront — a half-formed idea is a perfectly valid starting point. Pexo helps you discover what you want through conversation.

**Change your mind freely.** At any point — before, during, or after production — you can shift direction, adjust details, or start fresh. Pexo keeps full context. Nothing is lost.

**Point at what you don't like.** Beyond text feedback, you can annotate directly on video frames — circle an area, mark a moment, highlight what feels off. Faster and more precise than describing it in words.

---

## Capabilities

| | |
|---|---|
| **End-to-end** | From conversation to finished video. No intermediate steps to manage. |
| **Multimodal** | Accepts text, images, video, audio, URLs — anything you have becomes input. |
| **Multi-concept** | Explores multiple creative directions before committing. You compare, you choose. |
| **Iterative** | Refine endlessly — pacing, music, scenes, style, structure. Context is never lost. |
| **Visual feedback** | Annotate directly on video frames to pinpoint changes. |
| **Model-agnostic** | Routes to the best AI model per task. Seedance, Kling, Veo, and more — automatically. |
| **Creative memory** | Remembers your preferences within a session. The more you create, the faster it gets. |

---

## Composability

Pexo works as a standalone creation partner or as a node in larger agent pipelines:

- Any agent can invoke Pexo to add video creation to its capabilities
- Outputs from other skills (research, data, design) can feed directly into Pexo as creative input
- Pexo's output can chain into distribution, publishing, or analytics skills downstream

---

## Where to Use

| Platform | Installation |
|---|---|
| **OpenClaw** | `npx playbooks add skill pexoai/pexo-skills --skill pexo-agent` |
| **Claude Code** | `/plugin marketplace add pexoai/pexo-skills` |
| **ClaWHub** | `clawhub install pexoai/pexo-agent` |
| **Cursor** | Place in `~/.cursor/skills/pexo-agent/` |
| **Any agent platform** | Standard Agent Skills protocol — works wherever skills are supported |

No API keys. No configuration. No dependencies.

---

## Trust & Security

- Only processes what you explicitly provide in conversation
- No API keys or credentials required from the user
- Creative assets are not stored or shared beyond the current session

---

Built by [Pexo.ai](https://pexo.ai)
