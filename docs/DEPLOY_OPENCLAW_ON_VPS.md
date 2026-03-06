# Deploy OpenClaw Gateway on Cloud VPS (Step by Step)

You have purchased a Volcengine ECS instance. Follow the steps below in order. **Replace the example public IP with your actual IP** (e.g. `163.7.8.104`).

---

## Want the least effort? Use the one-click script (recommended)

1. **On your computer**, open `docs/deploy-openclaw.sh` and fill in `GOOGLE_API_KEY` and `TELEGRAM_BOT_TOKEN` on lines 12–13 (get them from Google AI Studio and @BotFather), then save.
2. Upload to the server (run on your computer, replace `YOUR_PUBLIC_IP` with your real IP):
   ```bash
   scp docs/deploy-openclaw.sh root@YOUR_PUBLIC_IP:~/
   ```
3. **SSH into the server**: `ssh root@YOUR_PUBLIC_IP`
4. **On the server, run**:
   ```bash
   chmod +x ~/deploy-openclaw.sh && ~/deploy-openclaw.sh
   ```
5. **Back on your computer**, copy your local config over (replace IP with your public IP):
   ```bash
   scp ~/.openclaw/openclaw.json root@YOUR_PUBLIC_IP:~/.openclaw/
   ```
6. Send a message to the bot in Telegram; if it replies, deployment succeeded.

Below is the step-by-step manual guide for reference.

---

## Step 0: Allow SSH in Volcengine console

1. Open [Volcengine Console](https://console.volcengine.com/) → Cloud Server ECS → Your instance.
2. Click the instance name or "Security Group" → Enter security group → **Inbound rules**.
3. Add a rule: **Port 22**, protocol TCP, source `0.0.0.0/0` (or your fixed IP for better security), save.

This allows you to SSH from your machine.

---

## Step 1: SSH into the server

On **your computer**, open a terminal and run (replace `YOUR_SERVER_PUBLIC_IP` with your real IP):

```bash
ssh root@YOUR_SERVER_PUBLIC_IP
```

The first time you may be asked to trust the host; type `yes`. If a root password is set, you will be prompted for it.

When login succeeds, you will see a prompt like `root@i-xxxxx:~#`, meaning you are on the server.

---

## Step 2: Install Node.js 22

On the server, run **line by line** (or paste the whole block):

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
```

The last line should show `v22.x.x`. If there are no errors, continue.

---

## Step 3: Install OpenClaw

On the server, run (choose one):

**Option A (recommended, official one-liner):**

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

**Option B (via npm):**

```bash
sudo npm install -g openclaw@latest
```

After installation, run:

```bash
openclaw --version
```

If a version number is printed, installation succeeded.

---

## Step 4: Create config directory and .env

On the server, run:

```bash
mkdir -p ~/.openclaw
nano ~/.openclaw/.env
```

In the editor, write (**replace the placeholder values with your real ones**):

```env
GOOGLE_API_KEY=your_Gemini_API_key
TELEGRAM_BOT_TOKEN=your_Telegram_bot_token
```

- Gemini key: Create or copy from [Google AI Studio](https://aistudio.google.com/).
- Telegram token: In Telegram, open @BotFather, use `/newbot` to create a bot; it will give you a token.

Save and exit: `Ctrl+O` then Enter, then `Ctrl+X`.

Then restrict file permissions:

```bash
chmod 600 ~/.openclaw/.env
```

---

## Step 5: Copy your local openclaw.json to the server (recommended)

If you already configured Telegram, skills, etc. on your local machine, reusing that config is easiest.

On **your computer**, run (replace `YOUR_SERVER_PUBLIC_IP` with your real IP):

```bash
scp ~/.openclaw/openclaw.json root@YOUR_SERVER_PUBLIC_IP:~/.openclaw/
```

You will be prompted for the server password. After the transfer, `~/.openclaw/openclaw.json` on the server matches your local config (including Telegram, skills, etc.).

**If you have no local config**: On the server, run `openclaw onboard` and follow the prompts to select run mode, model, Telegram, etc.; this will generate a basic config.

---

## Step 6: Install gateway as a background service (auto-start on boot)

On the **server**, run:

```bash
openclaw gateway install
```

Follow any prompts. This installs a systemd service so the gateway will auto-start after reboots.

Then start and check status:

```bash
openclaw gateway start
openclaw gateway status
```

If `gateway install` is not available or fails, you can use manual systemd setup (see "Fallback: manual systemd" at the end).

---

## Step 7: Verify success

1. In Telegram, send a message to your bot (e.g. `/start` or any text) and see if it replies.
2. On the server, check logs if needed:

   ```bash
   openclaw logs --limit 50
   # Or if using systemd:
   sudo journalctl -u openclaw-gateway -n 50 -f
   ```

If you get a reply and logs show no obvious errors, deployment succeeded. You can then stop the OpenClaw gateway on your local machine and use only the cloud instance.

---

## FAQ

**Q: Cannot connect via SSH?**  
- Check that the Volcengine security group allows **port 22**.  
- Confirm you are using the **public IP**, not the private IP.

**Q: Telegram bot does not reply?**  
- Confirm `TELEGRAM_BOT_TOKEN` in `~/.openclaw/.env` is correct and has no extra spaces.  
- If using pairing mode, on the server run `openclaw pairing list telegram`, then `openclaw pairing approve telegram <CODE>` to approve your account.

**Q: Want to use skills (audiomind, image-studio)?**  
- If using Vercel proxy, you can add to `~/.openclaw/.env` (optional):  
  `AUDIOMIND_PROXY_URL=https://audiomind-proxy.vercel.app`  
  `IMAGE_GEN_PROXY_URL=https://image-studio-proxy.vercel.app`  
- Skill config is in `openclaw.json`; it is included when you scp from your local machine.

---

## Fallback: Manual systemd (when gateway install is unavailable)

On the server, run:

```bash
sudo nano /etc/systemd/system/openclaw-gateway.service
```

Write (if you are not root but a regular user, replace `root` and `/root` with that user and their home directory):

```ini
[Unit]
Description=OpenClaw Gateway
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root
Environment=NODE_ENV=production
EnvironmentFile=/root/.openclaw/.env
ExecStart=/usr/bin/npx openclaw gateway
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Save, then run:

```bash
sudo systemctl daemon-reload
sudo systemctl enable openclaw-gateway
sudo systemctl start openclaw-gateway
sudo systemctl status openclaw-gateway
```

---

**Summary order**: Allow port 22 → SSH login → Install Node 22 → Install OpenClaw → Configure `.env` → Copy or generate `openclaw.json` → `openclaw gateway install` and start → Test by sending a message in Telegram.
