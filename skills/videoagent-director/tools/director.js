#!/usr/bin/env node
/**
 * director.js — VideoAgent Director shot executor.
 *
 * Generates one storyboard shot: image frame → video clip → audio.
 * Runs as a Node.js ESM script (Node 18+).
 *
 * Usage:
 *   node director.js [options]
 *
 * Quick examples:
 *   # Full shot (image → video → music)
 *   node director.js \
 *     --image-prompt "close-up of a coffee cup, steam rising, warm light" \
 *     --video-prompt "camera slowly pushes in, steam drifts upward" \
 *     --audio-type music \
 *     --audio-prompt "gentle acoustic guitar, calm morning mood" \
 *     --duration 5 --aspect-ratio 16:9
 *
 *   # Animate an existing image
 *   node director.js \
 *     --image-url "https://example.com/frame.jpg" \
 *     --video-prompt "gentle wind in the hair, soft bokeh background" \
 *     --duration 5
 *
 *   # Text-to-video only (no image generation)
 *   node director.js \
 *     --skip-image \
 *     --video-prompt "aerial drone shot over a misty forest at dawn, cinematic" \
 *     --duration 6
 */

import { parseArgs } from "node:util";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

// ── Proxy endpoints ──────────────────────────────────────────────────────────
const IMAGE_PROXY = process.env.IMAGE_PROXY_URL  || "https://image-gen-proxy.vercel.app";
const VIDEO_PROXY = process.env.VIDEO_PROXY_URL  || "https://pexo-video-deploy.vercel.app";
const AUDIO_PROXY = process.env.AUDIO_PROXY_URL  || "https://audiomind-proxy.vercel.app";

// ── Token cache (per session) ─────────────────────────────────────────────────
const TOKEN_CACHE_FILE = path.join(os.tmpdir(), "director-tokens.json");

function loadTokenCache() {
  try {
    const raw = fs.readFileSync(TOKEN_CACHE_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveTokenCache(cache) {
  try { fs.writeFileSync(TOKEN_CACHE_FILE, JSON.stringify(cache), "utf8"); } catch {}
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────
async function post(url, body, headers = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, data: { error: text } }; }
}

async function get(url, headers = {}) {
  const res = await fetch(url, { headers });
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, data: { error: text } }; }
}

function fail(msg) {
  console.error(JSON.stringify({ success: false, error: msg }));
  process.exit(1);
}

// ── Image token ───────────────────────────────────────────────────────────────
async function getImageToken() {
  const envToken = process.env.IMAGE_STUDIO_TOKEN;
  if (envToken) return envToken;

  const cache = loadTokenCache();
  if (cache.imageToken) return cache.imageToken;

  const r = await post(`${IMAGE_PROXY}/api/token`, {});
  if (r.status !== 200 || !r.data.token) fail(`Image token error: ${JSON.stringify(r.data)}`);

  cache.imageToken = r.data.token;
  saveTokenCache(cache);
  return r.data.token;
}

// ── Video token ───────────────────────────────────────────────────────────────
async function getVideoToken() {
  const envToken = process.env.VIDEO_STUDIO_TOKEN;
  if (envToken) return envToken;

  const cache = loadTokenCache();
  if (cache.videoToken) return cache.videoToken;

  const r = await post(`${VIDEO_PROXY}/api/token`, {});
  if (r.status !== 200 || !r.data.token) fail(`Video token error: ${JSON.stringify(r.data)}`);

  cache.videoToken = r.data.token;
  saveTokenCache(cache);
  return r.data.token;
}

// ── Image generation ──────────────────────────────────────────────────────────
async function generateImage({ prompt, model = "flux-schnell", aspectRatio = "16:9" }) {
  const token = await getImageToken();
  const r = await post(
    `${IMAGE_PROXY}/api/generate`,
    { model, prompt, aspect_ratio: aspectRatio },
    { "X-ImageGen-Token": token }
  );
  if (r.status !== 200 || !r.data.image_url) {
    fail(`Image generation failed (${r.status}): ${JSON.stringify(r.data)}`);
  }
  return r.data.image_url;
}

// ── Video generation ──────────────────────────────────────────────────────────
async function generateVideo({ prompt, imageUrl, model, duration, aspectRatio }) {
  const token = await getVideoToken();
  const mode = imageUrl ? "image-to-video" : "text-to-video";
  const body = {
    mode,
    prompt,
    duration: Number(duration) || 5,
    aspect_ratio: aspectRatio || "16:9",
    ...(model && { model }),
    ...(imageUrl && { image_url: imageUrl }),
  };

  const r = await post(`${VIDEO_PROXY}/api/generate`, body, {
    Authorization: `Bearer ${token}`,
  });

  if (r.status !== 200 || !r.data.videoUrl) {
    fail(`Video generation failed (${r.status}): ${JSON.stringify(r.data)}`);
  }
  return r.data.videoUrl;
}

// ── Audio generation ──────────────────────────────────────────────────────────
async function generateAudio({ type, prompt, voiceId }) {
  const audioKey = process.env.AUDIOMIND_KEY || "";
  const headers = audioKey ? { "X-Audiomind-Key": audioKey } : {};

  const body = { action: type };
  if (type === "tts") {
    body.text = prompt;
    if (voiceId) body.voice_id = voiceId;
  } else {
    body.prompt = prompt;
  }

  const r = await post(`${AUDIO_PROXY}/api/audio`, body, headers);

  if (r.status !== 200) {
    // Audio failure is non-fatal — warn and continue
    return { error: `Audio failed (${r.status}): ${JSON.stringify(r.data)}` };
  }

  return {
    audio_url: r.data.audio_url || null,
    audio_base64: r.data.audio_base64 || null,
    format: r.data.format || "mp3",
  };
}

// ── Prompt helpers ────────────────────────────────────────────────────────────
function appendStyle(prompt, style) {
  if (!style || !prompt) return prompt || "";
  return `${prompt}, ${style}`;
}

// ── Parse CLI args ────────────────────────────────────────────────────────────
const { values: args } = parseArgs({
  options: {
    "shot-id":      { type: "string", default: "1" },
    "image-prompt": { type: "string" },
    "image-url":    { type: "string" },
    "skip-image":   { type: "boolean", default: false },
    "video-prompt": { type: "string" },
    "video-model":  { type: "string" },
    "image-model":  { type: "string", default: "flux-schnell" },
    "audio-type":   { type: "string" },
    "audio-prompt": { type: "string" },
    "audio-voice":  { type: "string" },
    "skip-audio":   { type: "boolean", default: false },
    "duration":     { type: "string", default: "5" },
    "aspect-ratio": { type: "string", default: "16:9" },
    "style":        { type: "string" },
  },
  strict: false,
});

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const shotId     = args["shot-id"];
  const style      = args["style"] || "";
  const aspectRatio = args["aspect-ratio"] || "16:9";
  const duration   = args["duration"] || "5";

  if (!args["video-prompt"]) fail("--video-prompt is required");

  const result = {
    shot_id: shotId,
    success: false,
    image_url: null,
    video_url: null,
    audio_url: null,
    image_prompt: null,
    video_prompt: null,
    audio_prompt: null,
  };

  // ── 1. Image ────────────────────────────────────────────────────────────────
  let imageUrl = args["image-url"] || null;

  if (!args["skip-image"] && !imageUrl) {
    if (!args["image-prompt"]) {
      // Auto-derive a basic image prompt from the video prompt
      args["image-prompt"] = args["video-prompt"];
    }
    const imagePrompt = appendStyle(args["image-prompt"], style);
    result.image_prompt = imagePrompt;

    process.stderr.write(`[Shot ${shotId}] Generating reference image...\n`);
    imageUrl = await generateImage({
      prompt: imagePrompt,
      model: args["image-model"] || "flux-schnell",
      aspectRatio,
    });
    result.image_url = imageUrl;
    process.stderr.write(`[Shot ${shotId}] Image ready: ${imageUrl}\n`);
  } else if (imageUrl) {
    result.image_url = imageUrl;
  }

  // ── 2. Video ────────────────────────────────────────────────────────────────
  const videoPrompt = appendStyle(args["video-prompt"], style);
  result.video_prompt = videoPrompt;

  process.stderr.write(`[Shot ${shotId}] Generating video clip...\n`);
  const videoUrl = await generateVideo({
    prompt: videoPrompt,
    imageUrl,
    model: args["video-model"] || undefined,
    duration,
    aspectRatio,
  });
  result.video_url = videoUrl;
  process.stderr.write(`[Shot ${shotId}] Video ready: ${videoUrl}\n`);

  // ── 3. Audio ────────────────────────────────────────────────────────────────
  if (!args["skip-audio"] && args["audio-type"] && args["audio-prompt"]) {
    const audioPrompt = args["audio-prompt"];
    result.audio_prompt = audioPrompt;

    process.stderr.write(`[Shot ${shotId}] Generating audio (${args["audio-type"]})...\n`);
    const audio = await generateAudio({
      type: args["audio-type"],
      prompt: audioPrompt,
      voiceId: args["audio-voice"],
    });

    if (audio.error) {
      process.stderr.write(`[Shot ${shotId}] Audio warning: ${audio.error}\n`);
    } else {
      result.audio_url  = audio.audio_url;
      result.audio_base64 = audio.audio_base64;
      result.audio_format = audio.format;
      process.stderr.write(`[Shot ${shotId}] Audio ready.\n`);
    }
  }

  result.success = true;
  console.log(JSON.stringify(result, null, 2));
}

main().catch(err => fail(err.message));
