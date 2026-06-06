# Install Pexo Skills

## Quick install (Claude Code, Cursor, OpenClaw, Codex, …)

```bash
npx skills add https://github.com/pexoai/pexo-skills --skill pexo-agent
```

## Via ClawHub (OpenClaw)

```bash
clawhub install pexoai-agent
```

## Via Claude Code plugin marketplace

```
/plugin marketplace add pexoai/pexo-skills
/plugin install pexo@pexo
```

## Configure

Create `~/.pexo/config`:

```
PEXO_BASE_URL="https://pexo.ai"
PEXO_API_KEY="sk-<your-key>"
```

Get an API key at <https://pexo.ai>. Then ask your agent, for example:

> Make a 15-second product ad from this photo.

**Troubleshooting:** run `pexo-doctor.sh` inside the `pexo-agent` skill — it checks config,
dependencies, connectivity, and API-key validity.
