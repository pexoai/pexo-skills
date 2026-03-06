#!/usr/bin/env node
/**
 * AudioMind skill CLI — call AudioMind Proxy for TTS, music, SFX.
 * Usage:
 *   node cli.js --prompt "one minute lo-fi with piano and rain"
 *   node cli.js --action music --prompt "relaxing background"
 *   node cli.js --action tts --text "Hello world"
 *   node cli.js --action sfx --text "rain and thunder" --duration-seconds 10
 *   node cli.js --action music --prompt "..." --duration 60
 */

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const PROXY_URL = process.env.AUDIOMIND_PROXY_URL || "https://audiomind-proxy.vercel.app/api/audio";
const PRO_KEY = process.env.AUDIOMIND_API_KEY || "";

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {
    action: "",
    text: "",
    prompt: "",
    duration_seconds: null,
    model: "",
    fast: false,
    poll_interval: 5,
    max_wait_seconds: 180,
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--action" && args[i + 1]) { out.action = args[++i].toLowerCase(); continue; }
    if (args[i] === "--prompt" && args[i + 1]) { out.prompt = args[++i]; continue; }
    if (args[i] === "--text" && args[i + 1]) { out.text = args[++i]; continue; }
    if ((args[i] === "--duration-seconds" || args[i] === "--duration") && args[i + 1]) { out.duration_seconds = parseInt(args[++i], 10) || null; continue; }
    if (args[i] === "--model" && args[i + 1]) { out.model = args[++i]; continue; }
    if (args[i] === "--fast") { out.fast = true; continue; }
    if (args[i] === "--poll-interval" && args[i + 1]) { out.poll_interval = Math.max(1, parseInt(args[++i], 10) || 5); continue; }
    if (args[i] === "--max-wait-seconds" && args[i + 1]) { out.max_wait_seconds = Math.max(10, parseInt(args[++i], 10) || 180); continue; }
    if (!out.prompt && !out.text && !args[i].startsWith("-")) out.prompt = args[i];
  }
  if (out.prompt && !out.text) out.text = out.prompt;
  return out;
}

function inferAction(params) {
  if (params.action) return params.action;

  const model = String(params.model || "").toLowerCase();
  if (model.includes("sfx")) return "sfx";
  if (model.includes("music")) return "music";
  if (model.includes("tts")) return "tts";

  const combined = `${params.prompt || ""} ${params.text || ""}`.toLowerCase();
  if (/\b(sfx|sound effect|whoosh|explosion|rain|thunder|bird|dog bark|foley)\b/.test(combined)) return "sfx";
  if (/(sfx|sound effect|whoosh|explosion|rain|thunder|bird|dog bark|foley|doorbell|ambient)/.test(combined)) return "sfx";
  if (/\b(music|track|song|melody|beat|lo-fi|soundtrack|bgm)\b/.test(combined)) return "music";
  if (/(music|track|song|melody|beat|lo-?fi|soundtrack|bgm|score)/.test(combined)) return "music";
  return "tts";
}

function isPendingStatus(status) {
  const s = String(status || "").toLowerCase();
  return s === "in_progress" || s === "processing" || s === "pending" || s === "queued";
}

function extractAudioUrl(data) {
  return data?.audio_url || data?.url || data?.result?.audio_url || data?.output?.audio_url || null;
}

async function sleep(ms) {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveOutputDir() {
  const configured = process.env.AUDIOMIND_OUTPUT_DIR;
  if (configured) return configured;
  const openclawWorkspace = path.join(os.homedir(), ".openclaw", "workspace");
  return path.join(openclawWorkspace, "tmp", "audiomind");
}

function persistBase64Audio(result) {
  if (!result || typeof result !== "object") return result;
  const b64 = result.audio_base64;
  if (!b64 || typeof b64 !== "string") return result;

  const format = (result.format || "mp3").toLowerCase();
  const ext = format === "wav" ? "wav" : "mp3";
  const dir = resolveOutputDir();
  fs.mkdirSync(dir, { recursive: true });
  const filename = `audiomind-${Date.now()}.${ext}`;
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, Buffer.from(b64, "base64"));

  const next = { ...result };
  delete next.audio_base64;
  next.audio_file_path = filepath;
  next.has_inline_audio_payload = true;
  next.delivery_hint = "Use audio_file_path for media delivery. Never paste base64 into chat.";
  return next;
}

async function pollUntilComplete(statusUrl, headers, intervalSeconds, maxWaitSeconds) {
  const startedAt = Date.now();
  let attempt = 0;
  while (Date.now() - startedAt < maxWaitSeconds * 1000) {
    attempt += 1;
    await sleep(intervalSeconds * 1000);
    const res = await fetch(statusUrl, { method: "GET", headers });
    const data = await res.json().catch(() => ({}));
    const status = data?.status;
    const audioUrl = extractAudioUrl(data);
    if (audioUrl || String(status).toLowerCase() === "completed" || String(status).toLowerCase() === "succeeded") {
      return persistBase64Audio({ ...data, audio_url: audioUrl || data?.audio_url || null, _polled: true, _attempts: attempt });
    }
    if (String(status).toLowerCase() === "failed" || String(status).toLowerCase() === "error") {
      return persistBase64Audio({ ...data, _polled: true, _attempts: attempt });
    }
    // Keep progress noise low: only occasional stderr heartbeat.
    if (attempt % 3 === 0) {
      process.stderr.write(`[AudioMind] still generating (attempt ${attempt}, status=${status || "pending"})\n`);
    }
  }
  return persistBase64Audio({ status: "in_progress", status_url: statusUrl, _polled: true, _timeout: true });
}

async function main() {
  const params = parseArgs();
  const payload = {
    action: inferAction(params),
    text: params.text || params.prompt,
    prompt: params.prompt || params.text,
    duration_seconds: params.duration_seconds,
    model: params.model || undefined,
    fast: params.fast || undefined,
  };
  if (!payload.text && !payload.prompt) {
    console.error(JSON.stringify({ error: "Missing --prompt or --text" }));
    process.exit(1);
  }

  const headers = { "Content-Type": "application/json" };
  if (PRO_KEY) headers["X-Audiomind-Key"] = PRO_KEY;

  try {
    const res = await fetch(PROXY_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const data = persistBase64Audio(await res.json().catch(() => ({})));
    if (!res.ok) {
      console.error(JSON.stringify({ error: data.message || data.error || res.statusText, status: res.status, ...data }));
      process.exit(1);
    }

    // Proactively poll long-running tasks until completion to reduce user wait anxiety.
    if (data?.status_url && isPendingStatus(data?.status)) {
      const polled = await pollUntilComplete(data.status_url, headers, params.poll_interval, params.max_wait_seconds);
      if (polled?.audio_url || polled?.status === "completed" || polled?.status === "succeeded") {
        console.log(JSON.stringify(polled));
        return;
      }
      // If timeout/pending, return latest status to caller for follow-up.
      console.log(JSON.stringify({ ...data, ...polled }));
      return;
    }

    console.log(JSON.stringify(data));
  } catch (err) {
    console.error(JSON.stringify({ error: err.message, code: err.code }));
    process.exit(1);
  }
}

main();
