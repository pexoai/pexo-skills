# pexo-skills — Installation Guide for AI Agents

Read this entire file, then follow the steps. Ask the user for the API key when needed.
Target: ~3 minutes to a working Pexo integration.

Agent-facing companion to [`INSTALL.md`](./INSTALL.md) (human-facing). Read
[`CLAUDE.md`](./CLAUDE.md) first for the runtime contract (delivery-worker role, hard rules).

If you fetched this file by URL without cloning, the companion files live at:

- `https://raw.githubusercontent.com/pexoai/pexo-skills/main/CLAUDE.md` — runtime contract
- `https://raw.githubusercontent.com/pexoai/pexo-skills/main/skills/pexo-agent/SKILL.md` — the agent skill (workflow, hard rules)

## Step 1: Detect the host and pick the install path

| Agent host  | Default skills path        |
|-------------|----------------------------|
| Claude Code | `~/.claude/skills/`        |
| OpenClaw    | `~/.openclaw/skills/`      |
| Codex       | `~/.codex/skills/`         |
| Cursor      | `~/.cursor/skills/`        |
| Other       | Ask the user where the host loads skills from. |

Fastest install (any host with the `skills` CLI):

```bash
npx skills add https://github.com/pexoai/pexo-skills --skill pexo-agent
```

OpenClaw users — fastest path is ClawHub:

```bash
clawhub install pexoai-agent
```

## Step 2: Configure credentials

Create `~/.pexo/config` (ask the user for the key; they get one at https://pexo.ai):

```
PEXO_BASE_URL="https://pexo.ai"
PEXO_API_KEY="sk-..."
```

## Step 3: Verify

```bash
bash <skills-path>/pexo-agent/scripts/pexo-doctor.sh
```

Expect a "ready" report. If it reports a config error, follow its output. Then tell the user
(in their language):

> ✅ Pexo is ready! Tell me what video you'd like to make.

## Step 4: Use

Follow [`skills/pexo-agent/SKILL.md`](./skills/pexo-agent/SKILL.md). You are a **delivery
worker**: relay the user's request verbatim to Pexo, poll for status, and deliver the finished
video URL. Pexo's backend handles all creative work — do not add your own direction.
