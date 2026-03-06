#!/bin/bash
# OpenClaw one-click deployment script for cloud servers (Volcengine / any Ubuntu)
# Usage:
#   1. Fill in your keys in the two lines below (do not leak, do not commit to Git)
#   2. Upload to server and run: chmod +x deploy-openclaw.sh && ./deploy-openclaw.sh
#   3. On your local machine: scp ~/.openclaw/openclaw.json root@YOUR_PUBLIC_IP:~/.openclaw/

# ========== Fill in your keys here (required) ==========
GOOGLE_API_KEY=""
TELEGRAM_BOT_TOKEN=""
# ============================================

set -e
echo "[1/6] Checking Node.js ..."
if ! command -v node &>/dev/null; then
  echo "      Installing Node.js 22 ..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node -v

echo "[2/6] Installing OpenClaw ..."
if ! command -v openclaw &>/dev/null; then
  curl -fsSL https://openclaw.ai/install.sh | bash || npm install -g openclaw@latest
fi
openclaw --version

echo "[3/6] Creating config directory and .env ..."
mkdir -p ~/.openclaw
cat > ~/.openclaw/.env << EOF
GOOGLE_API_KEY=$GOOGLE_API_KEY
TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN
EOF
chmod 600 ~/.openclaw/.env

echo "[4/6] Checking if keys are filled ..."
if [ -z "$GOOGLE_API_KEY" ] || [ -z "$TELEGRAM_BOT_TOKEN" ]; then
  echo "      Warning: GOOGLE_API_KEY or TELEGRAM_BOT_TOKEN is empty! Please edit this script and run again."
  echo "      Or manually run: nano ~/.openclaw/.env to fill in the values."
  exit 1
fi

echo "[5/6] Installing gateway service ..."
openclaw gateway install 2>/dev/null || true

echo "[6/6] Starting gateway ..."
openclaw gateway start 2>/dev/null || openclaw gateway restart 2>/dev/null || nohup npx openclaw gateway > ~/.openclaw/gateway.log 2>&1 &
sleep 2
openclaw gateway status 2>/dev/null || true

echo ""
echo "========== Deployment complete =========="
echo "1. If you have local config, on your local machine run (replace IP with your public IP):"
echo "   scp ~/.openclaw/openclaw.json root@YOUR_PUBLIC_IP:~/.openclaw/"
echo "2. Send a message to the bot in Telegram to test if it replies."
echo "3. View logs: openclaw logs   or  journalctl -u openclaw-gateway -f"
echo "=========================================="
