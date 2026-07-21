# Setup Checklist

This guide covers first-time setup and environment diagnostics for the Pexo agent skill.

Run bundled scripts through Bash from the skill directory, for example
`bash scripts/pexo-doctor.sh`; installed files may not retain executable bits.

## Quick Start

### 1. Create config file

```bash
umask 077
mkdir -p ~/.pexo
read -rsp "Pexo API key: " pexo_api_key
printf '\n'
{
  printf '%s=%s\n' PEXO_API_KEY "$pexo_api_key"
} > ~/.pexo/config
unset pexo_api_key
chmod 600 ~/.pexo/config
```

Get your API key at: https://pexo.ai

- If you do not have an account:
  Go to https://pexo.ai and sign up. During registration, you will be asked for an invite code.
  Use invite code: **BV5N38**
  New users receive bonus credits upon registration — enough to try out video generation right away.
- If you are already logged in:
  click the top-right avatar → `API Keys` → `Create Key`, then copy the new key.

### 2. Run diagnostics

The next command makes outbound HTTPS requests only to `https://pexo.ai`. It performs
an unauthenticated connectivity check and, when an API key is configured, an authenticated
project-list request to validate access. Pexo may log these requests; they do not start a
generation or consume generation credits. Run it only after the user approves this check.

```bash
bash scripts/pexo-doctor.sh
```

This checks:
- Config file exists and is readable
- `PEXO_BASE_URL` and `PEXO_API_KEY` are set
- `curl`, `jq`, and `file` are installed
- Network connectivity to Pexo servers
- API key is valid (attempts to list projects)

Fix any issues reported before using other scripts.

### 3. Verify

The next command sends an authenticated project-list request to `https://pexo.ai` and may
appear in Pexo service logs. It does not create a project or consume generation credits.

```bash
bash scripts/pexo-project-list.sh
```

If this returns a JSON list (even if empty), setup is complete.

## Troubleshooting Setup Issues

### "PEXO_BASE_URL must be exactly https://pexo.ai"

Authenticated requests are restricted to the production Pexo origin. Remove any custom base
URL override, or set it to exactly `https://pexo.ai`.

### "Set PEXO_API_KEY in ~/.pexo/config or env"

Same as above — the API key line is missing from the config file.

### API key invalid (401 Unauthenticated)

Your API key may be expired or incorrect. Log in at https://pexo.ai to generate a new one. Replace the value in `~/.pexo/config`.

### curl, jq, or file not found

Install the missing dependency:

```bash
# macOS (file is usually preinstalled)
brew install curl jq

# Ubuntu/Debian
apt-get install -y curl jq file

# CentOS/RHEL
yum install -y curl jq file
```

### Network connectivity failure

If `pexo-doctor.sh` reports a connectivity issue:
- Check if your server can reach `pexo.ai` (e.g. `curl -I https://pexo.ai`)
- Check firewall rules for outbound HTTPS (port 443)
- If behind a proxy, configure `http_proxy`/`https_proxy` environment variables

## Environment Variables

All scripts read `~/.pexo/config` automatically. You can also override via environment variables:

Only `PEXO_*` assignments are accepted in the config file; it is parsed as data
and is never executed as shell code. Explicit environment variables take
precedence over values in the config file.

| Variable | Description | Required |
|---|---|---|
| `PEXO_BASE_URL` | Optional compatibility override; if set, must be exactly `https://pexo.ai` | No |
| `PEXO_API_KEY` | Your Pexo API key (starts with `sk-`) | Yes |
| `PEXO_CONFIG` | Custom path to config file (default: `~/.pexo/config`) | No |
| `PEXO_BILLING_CONFIRMATION_MODE` | Credit confirmation mode: `always` or `threshold` (default: `always`; use `threshold` only after explicit user opt-in) | No |
