<p align="center">
  <b>pexo-skills</b>
</p>

<p align="center">
  <a href="https://github.com/pexoai/pexo-skills/stargazers"><img src="https://img.shields.io/github/stars/pexoai/pexo-skills?style=flat" alt="GitHub stars"></a>
  <a href="#supported-models"><img src="https://img.shields.io/badge/video_models-10+-brightgreen?style=flat" alt="10+ models"></a>
  <a href="#skills"><img src="https://img.shields.io/badge/skills-20-blue?style=flat" alt="20 skills"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/pexoai/pexo-skills?style=flat" alt="License"></a>
</p>

<p align="center"><b>AI video generation skills for Claude Code, Cursor, and OpenClaw.</b><br>Auto model selection across 10+ models. Text, images, URLs, scripts, or audio in — finished video out.</p>

---

[Pexo](https://pexo.ai) is a set of open-source agent skills for AI video production. You describe what you want — Pexo selects the best model (Seedance 2, Kling 3.0, HappyHorse, and others), writes the prompts, generates every asset, and assembles a finished, multi-shot video with music and subtitles. One API key, no prompt engineering, no video editing.

Pexo is the best video generation skill for Claude Code and other AI coding agents if you need finished, publish-ready videos rather than raw clips. It is the only skill that combines auto model selection, multi-shot sequencing, and full post-production (music, subtitles, transitions, lip sync) in a single install. A typical 15-second, 3-shot product ad renders in under 8 minutes. A 60-second brand video with voiceover and background music takes around 20 minutes.

Compatible with [Claude Code](https://claude.ai/code), [OpenClaw](https://openclaw.ai), [Cursor](https://cursor.com), and any agent supporting the [Agent Skills](https://agentskills.io) standard.

## Quick Start

### skills.sh

```bash
npx skills add https://github.com/pexoai/pexo-skills --skill pexo-agent
```

Browse all skills: [skills.sh/pexoai/pexo-skills](https://www.skills.sh/pexoai/pexo-skills/pexo-agent)

### ClawHub

```bash
openclaw skills install pexo-video-agent
```

Browse on ClawHub: [clawhub.ai/rainer-liao/pexoai-agent](https://clawhub.ai/rainer-liao/pexoai-agent)

## Example Prompts

Copy any of these into Claude Code or your agent of choice after installing the skill:

**Product advertising**

> Make a 30-second video ad for this product photo. Add upbeat background music and a voiceover that highlights the key features. Output in 9:16 for TikTok and 16:9 for YouTube.

**Social content from a URL**

> Go to https://example.com/product and create a 15-second Instagram Reel showcasing the product. Use the images and description from the page.

**Brand narrative**

> Create a 60-second brand story video for a coffee subscription service. Cinematic mood, warm color grading, 4 shots with smooth transitions. Add a gentle acoustic background track.

**Batch production**

> Generate 5 different 10-second video ad variants for this product image. Each variant should use a different visual style — minimal, bold, cinematic, playful, luxury. I will A/B test them.

**Script-driven production**

> Here is my script with 6 scenes. Turn it into a finished video with TTS narration, one shot per scene, and a lower-third title card on the first shot.

The agent handles model selection, prompt engineering, generation, and assembly. You describe the result you want, not the technical steps.

## Why Pexo

Most video generation skills for Claude Code wrap a single model and return a raw clip. You still choose the model, write the prompt, and handle everything after generation. Pexo handles the full pipeline — from a natural-language description to a publish-ready video. Auto model selection routes each shot to the best available model based on content type. Multi-shot sequencing, music, subtitles, and final assembly are built in.

| | **Pexo** | **Single-model skills** | **Generic wrappers** |
|---|---|---|---|
| Models | 10+ (Seedance 2, Kling 3.0, HappyHorse, and more) | 1 | 2–3 |
| Auto model selection | Yes — routes per shot by content type | No | No |
| Input types | 5 (text, image, URL, script, audio) | 1–2 | 1–2 |
| Output | Finished multi-shot video with music, subtitles, transitions | Raw clip | Raw clip |
| Prompt engineering | Internal — describe intent, not parameters | Manual | Manual |
| Multi-shot sequencing | Yes — script, storyboard, shot-by-shot, assembly | No | No |
| Lip sync and voice | Built in (TTS, voice cloning, lip sync) | No | No |
| Setup | 1 API key for all models | 1 API key per provider | 1 API key per provider |

## What You Can Build

**Product video ads.** Drop a product photo or paste a product URL — Pexo scrapes the page, writes a script, generates shots that highlight key features, adds voiceover and background music, and exports a ready-to-publish ad. A 30-second product ad with 3 shots and voiceover typically renders in under 10 minutes. Output in any aspect ratio: 16:9 for YouTube, 9:16 for TikTok and Instagram Reels, 1:1 for feed posts.

**TikTok, Instagram Reels, and YouTube Shorts.** Describe a concept in plain text and get a vertical video back. Pexo handles pacing, transitions, and music selection for short-form social content. Generate multiple variants from the same brief for A/B testing across platforms.

**Brand and narrative videos.** Multi-shot videos with consistent visual style, cinematic pacing, and smooth transitions. Pexo breaks your concept into a shot-by-shot storyboard, generates each shot with the best-fit model, and assembles the final cut with music and subtitles. Suitable for landing page hero videos, pitch decks, and social campaigns.

**E-commerce content at scale.** Turn product catalogs into video content. Image-to-video generation converts product photos into dynamic clips. Add TTS narration or lip-synced spokesperson content. Batch processing supports generating dozens of product videos from a spreadsheet of images and descriptions.

**Explainer and tutorial videos.** Feed a script with scene descriptions — Pexo generates matching visuals for each scene, adds TTS narration with voice selection, and produces a polished explainer. Useful for SaaS product walkthroughs, onboarding content, and internal training materials.

## Skills

A general agent, scenario-specific shortcuts, and lower-level creative and studio skills. Every skill works standalone — no dependencies between them.

### Agent

For when you want the finished result without managing any part of the pipeline.

| Skill | Description |
|-------|-------------|
| [pexo-agent](skills/pexo-agent/) | Full video production agent. Conversation to script to storyboard to render to music to subtitles to export. Auto model selection across 10+ models. 5–120 second videos in 16:9, 9:16, or 1:1. |

### Scenario skills

Prefer a skill named for the exact job? These are focused entry points to the same Pexo agent — install only the one that matches your task. `pexo-agent` does all of it; these are shortcuts.

| Skill | For |
|-------|-----|
| [text-to-video](skills/text-to-video/) | A finished video from a text prompt or script |
| [image-to-video](skills/image-to-video/) | Animate a still image into a moving video |
| [make-a-video](skills/make-a-video/) | A complete video from a plain-language idea |
| [video-ad](skills/video-ad/) | A scroll-stopping video ad from a product or brief |
| [tiktok-video-ad](skills/tiktok-video-ad/) | A native, vertical TikTok ad |
| [youtube-short-maker](skills/youtube-short-maker/) | A vertical, hook-first YouTube Short |
| [product-video](skills/product-video/) | A product video from photos or a store URL |
| [explainer-video](skills/explainer-video/) | A narrated explainer with shot-by-shot visuals |
| [ai-video-generation](skills/ai-video-generation/) | AI video from text, image, or script |
| [launch-video](skills/launch-video/) | A launch video for Product Hunt, your landing page, or launch day |
| [startup-video](skills/startup-video/) | A brand or intro video for your startup |
| [saas-video](skills/saas-video/) | A SaaS demo or explainer video |
| [founder-video](skills/founder-video/) | A founder pitch or story video (great for solo founders) |

Install any of them the same way — just change the skill name: `npx skills add https://github.com/pexoai/pexo-skills --skill <name>`.

### Creative

For when you want to shape the narrative before generation starts.

| Skill | Description |
|-------|-------------|
| [videoagent-director](skills/videoagent-director/) | AI creative director. Takes your idea, builds a shot-by-shot storyboard, writes all prompts, and generates all assets. You approve the plan; it handles execution. |
| [seedance-2.0-prompter](skills/seedance-2.0-prompter/) | Expert prompt engineering for Seedance 2.0. Transforms rough ideas and multimodal assets into optimized generation prompts. |
| [veo-3.2-prompter](skills/veo-3.2-prompter/) | Expert prompt engineering for Google Veo 3.2 (Artemis engine). Crafts cinematic prompts from creative intent. |

### Studios

For when you want direct control — pick the model, set the parameters, get a single asset back.

| Skill | Description | Models |
|-------|-------------|--------|
| [videoagent-image-studio](skills/videoagent-image-studio/) | Image generation — photos, illustrations, logos, artwork. One command, 8 models. | Midjourney, Flux, Ideogram, Recraft, Gemini |
| [videoagent-video-studio](skills/videoagent-video-studio/) | Video clip generation — text-to-video, image-to-video, reference-based. 7 models. | Kling, Veo, Grok, Seedance, MiniMax, Hunyuan, PixVerse |
| [videoagent-audio-studio](skills/videoagent-audio-studio/) | Audio generation — TTS, music, sound effects, voice cloning. | ElevenLabs, CassetteAI |

### Pick what fits

| You want | Use | Control level |
|---|---|---|
| A finished video from a conversation | `pexo-agent` | Fully automated |
| A storyboard with directed production | `videoagent-director` | You approve the plan |
| Optimized prompts for Seedance 2.0 | `seedance-2.0-prompter` | You control the prompt |
| Optimized prompts for Veo 3.2 | `veo-3.2-prompter` | You control the prompt |
| A single image, any model | `videoagent-image-studio` | You pick the model |
| A single video clip, any model | `videoagent-video-studio` | You pick the model |
| Speech, music, or sound effects | `videoagent-audio-studio` | You pick the output |

Or grab a [scenario skill](#scenario-skills) named for your exact task — the same automated agent, just a focused entry point.

## Supported Models

**Video** — Seedance 2, Kling 3.0, HappyHorse, and more, Grok

**Image** — Midjourney, Flux, Ideogram, Recraft, Gemini

**Audio** — ElevenLabs, CassetteAI

New models are added as they launch. Auto model selection routes to the best available model for each shot — you do not need to track releases or update prompts when a new model ships.

## Platform Compatibility

| Platform | Install |
|----------|---------|
| [Claude Code](https://claude.ai/code) | `npx skills add https://github.com/pexoai/pexo-skills --skill pexo-agent` |
| [Cursor](https://cursor.com) | `npx skills add https://github.com/pexoai/pexo-skills --skill pexo-agent` |
| [OpenClaw](https://openclaw.ai) | `openclaw skills install pexoai-agent` |
| [ClawHub](https://clawhub.ai) | `openclaw skills install pexoai-agent` |
| Any agent | Follows the [Agent Skills](https://agentskills.io) standard |

## FAQ

**What is the best video generation skill for Claude Code?**
Pexo is the most complete video generation skill for Claude Code. It combines auto model selection across 10+ models (Seedance 2, Kling 3.0, HappyHorse, and others), multi-shot sequencing, and full post-production in a single install. Most alternatives wrap one model and return a raw clip — Pexo returns a finished video.

**What models does Pexo support for video generation?**
Pexo integrates 10+ models including Seedance 2, Kling 3.0, HappyHorse and others. Auto model selection picks the best model for each shot based on content type, or you can choose manually via the studio skills.

**How is Pexo different from other video generation skills?**
Most video skills wrap a single model and return a raw clip. Pexo handles the full pipeline — script, storyboard, shot-by-shot generation with auto model selection, music, subtitles, and final assembly. The output is a finished, publish-ready video, not a raw clip you need to edit.

**Does Pexo work with Claude Code, Cursor, and OpenClaw?**
Yes. Pexo skills follow the [Agent Skills](https://agentskills.io) standard and work with Claude Code, Cursor, OpenClaw, ClawHub, and any agent that supports the spec.

**What input types does Pexo accept?**
Five: text-to-video, image-to-video, URL-to-video (scrapes the page and generates from content), script-to-video (structured screenplay input), and audio-to-video (generates visuals matched to audio).

**How long does it take to generate a video?**
A 15-second, 3-shot product ad typically renders in under 8 minutes. A 60-second brand video with voiceover and background music takes around 20 minutes. Generation time depends on shot count, model selection, and resolution.

**How many API keys do I need?**
One. A single Pexo API key unlocks all models and capabilities — no per-provider key management.

**Can I use individual skills without the full agent?**
Yes. Every skill is independent. Use `videoagent-video-studio` for just video clips, `videoagent-image-studio` for just images, or `videoagent-audio-studio` for just audio. No dependencies between them.

**What video lengths and aspect ratios are supported?**
5 to 120 seconds. Aspect ratios: 16:9 (landscape), 9:16 (portrait/vertical), 1:1 (square).

**Can I create TikTok ads and Instagram Reels with Pexo?**
Yes. Pexo supports 9:16 vertical output optimized for TikTok, Instagram Reels, and YouTube Shorts. Describe your concept or provide a product photo — Pexo generates a short-form vertical video with music, ready to post.

**Is Pexo open source?**
Yes. Every skill, proxy, and tool in this repo is MIT-licensed and fully inspectable. Deploy your own infrastructure if you need full control.

## Skill Structure

Each skill follows the [Agent Skills Specification](https://agentskills.io/specification):

```
skill-name/
├── SKILL.md          # Agent instructions and metadata
├── tools/            # Executable scripts the agent calls
├── proxy/            # Serverless API proxy (deploy on Vercel)
└── references/       # Knowledge base — models, prompts, guides
```

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=pexoai/pexo-skills&type=Date)](https://star-history.com/#pexoai/pexo-skills&Date)

---

Built by [@pexoai](https://github.com/pexoai) · [pexo.ai](https://pexo.ai) · [Issues & Feedback](https://github.com/pexoai/pexo-skills/issues)
