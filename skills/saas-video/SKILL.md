---
name: saas-video
description: >
  Make a SaaS demo or explainer video with Pexo. Describe your software (or paste your app URL or a
  screenshot) and Pexo writes the script, generates the visuals, picks the models, adds narration
  and captions, and returns a finished, publish-ready video — for your landing page, onboarding, or
  sales. Use for SaaS and software videos: "saas video", "saas demo video", "software demo", "app
  explainer video". NOT for live screen recording — Pexo generates the visuals.
homepage: https://pexo.ai
repository: https://github.com/pexoai/pexo-skills
version: "0.1.0"
requires:
  env: [PEXO_API_KEY, PEXO_BASE_URL]
  runtime: [curl, jq, file]
metadata:
  author: pexoai
---

# SaaS Video — Pexo

**Pexo:** https://pexo.ai — get an API key, watch your project render, and buy credits there.

Make a finished SaaS demo or explainer video. You relay a description of the software — or its URL
or a screenshot — to the hosted Pexo agent and deliver the result; Pexo writes the script,
generates the visuals, and adds narration and captions.

## Your role: relay, don't create

Create a project, send the user's request **verbatim**, poll, deliver. Pexo's backend handles
all creative work — scriptwriting, model choice, prompts, music. Adding your own direction
(duration, style, models the user didn't ask for) overrides its judgment and produces worse
videos.

## Config

`~/.pexo/config`:
```
PEXO_BASE_URL="https://pexo.ai"
PEXO_API_KEY="sk-<your-api-key>"
```
**No account / first run →** read `references/SETUP-CHECKLIST.md` and walk the user through it — it carries the signup flow with the **invite code that grants new users bonus credits**, plus how to create the config above. **Config error →** run `scripts/pexo-doctor.sh` and follow its output.

## Workflow

Read `references/API.md` before running the bundled scripts. It defines the native Agent
submission, polling, file choices, explicit credit approval and retry rules. This branch
targets test2 until production exposes the same API. Each skill contains its own runnable client.

Reply in the user's language, relay their words verbatim and only upload selected files with
consent. Read every public message and attachment. Never submit chat while waiting or approve
charges without the user's explicit decision. For revisions, reuse the same project.

## Revisions

After delivery, the user's tweaks ("make it shorter", "new music", "different shot") reuse the
**same** project: `pexo-chat.sh <project_id> "<their feedback>"`, then follow the polling workflow in `references/API.md`. Never
create a new project for a revision — it throws away Pexo's server-side context.

## Credits

If a script fails with "Credits balance" / "Insufficient credits": if the error carries a
purchase link, pass it to the user; otherwise tell them to add credits at `https://pexo.ai/home`
→ Credits → Buy Credits. Retry after they confirm.

## Example

User: "Make a 60-second demo video for our SaaS that automates expense reports."

```bash
pid=$(pexo-project-create.sh "SaaS demo video")
pexo-chat.sh "$pid" "Make a 60-second demo video for our SaaS that automates expense reports."
# Tell the user: submitted, ~15–20 min, https://pexo.ai/project/$pid
# Poll pexo-project-get.sh "$pid" until nextAction is DELIVER, then deliver the asset URL.
```

## Scripts

| Script | Usage | Returns |
|---|---|---|
| `pexo-project-create.sh` | `"<brief>"` | `project_id` |
| `pexo-upload.sh` | `<project_id> <file>` | `asset_id` |
| `pexo-chat.sh` | `<project_id> "<message>" [--choice <id>]` | ack (async) |
| `pexo-project-get.sh` | `<project_id>` | JSON: `nextAction`, `recentMessages` |
| `pexo-asset-get.sh` | `<project_id> <asset_id>` | JSON with `url` |
| `pexo-doctor.sh` | — | setup diagnostic |

Error codes and edge cases → `references/TROUBLESHOOTING.md`.
