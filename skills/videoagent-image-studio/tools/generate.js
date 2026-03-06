#!/usr/bin/env node
/**
 * videoagent-image-studio — generate.js
 * Unified image generation CLI that calls the image-gen-proxy.
 * Users never need their own API keys — the proxy holds them server-side.
 *
 * Usage:
 *   node generate.js --model <id> --prompt "<text>" [options]
 *   node generate.js --model midjourney --action upscale --index 2 --job-id <id>
 */

import { parseArgs } from "util";

// ── Proxy configuration ────────────────────────────────────────────────────
const PROXY_BASE = process.env.IMAGE_STUDIO_PROXY_URL || "https://image-gen-proxy.vercel.app";
const TOKEN = process.env.IMAGE_STUDIO_TOKEN || "";

// ── Parse CLI arguments ────────────────────────────────────────────────────
const { values: args } = parseArgs({
  options: {
    model:              { type: "string", default: "flux-dev" },
    prompt:             { type: "string", default: "" },
    "aspect-ratio":     { type: "string", default: "1:1" },
    "num-images":       { type: "string", default: "1" },
    "negative-prompt":  { type: "string", default: "" },
    action:             { type: "string", default: "" },
    index:              { type: "string", default: "1" },
    "job-id":           { type: "string", default: "" },
    "upscale-type":     { type: "string", default: "0" },
    "variation-type":   { type: "string", default: "0" },
    mode:               { type: "string", default: "turbo" },
    seed:               { type: "string", default: "" },
  },
  strict: false,
});

// ── Output helpers ─────────────────────────────────────────────────────────
function output(data) {
  console.log(JSON.stringify(data, null, 2));
}

function error(msg, details) {
  console.error(JSON.stringify({ success: false, error: msg, details }, null, 2));
  process.exit(1);
}

// ── Token management ───────────────────────────────────────────────────────
async function getToken() {
  if (TOKEN) return TOKEN;

  process.stderr.write("[ImageStudio] No token found, requesting free token...\n");
  const res = await fetch(`${PROXY_BASE}/api/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) {
    error("Failed to obtain free token", data);
  }
  process.stderr.write(`[ImageStudio] Got free token (${data.free_limit || 100} uses)\n`);
  return data.token;
}

// ── Midjourney generation ──────────────────────────────────────────────────
async function generateMidjourney(token) {
  const action = args["action"] || "imagine";
  const payload = { action };

  if (action === "imagine") {
    if (!args["prompt"]) error("--prompt is required for Midjourney generation.");
    payload.prompt = args["prompt"];
    payload.mode = args["mode"] || "turbo";
    const ar = args["aspect-ratio"];
    if (ar && ar !== "1:1") payload.aspectRatio = ar;
  } else if (action === "upscale" || action === "variation") {
    if (!args["job-id"]) error("--job-id is required for Midjourney actions.");
    payload.jobId = args["job-id"];
    payload.index = parseInt(args["index"], 10) || 1;
    if (action === "upscale") payload.type = parseInt(args["upscale-type"], 10) || 0;
    if (action === "variation") payload.type = parseInt(args["variation-type"], 10) || 0;
    if (args["prompt"]) payload.prompt = args["prompt"];
  } else if (action === "reroll" || action === "describe") {
    if (!args["job-id"]) error("--job-id is required for Midjourney actions.");
    payload.jobId = args["job-id"];
  } else if (action === "poll") {
    if (!args["job-id"]) error("--job-id is required for polling.");
    payload.jobId = args["job-id"];
  }

  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  process.stderr.write(`[ImageStudio] Midjourney ${action}...\n`);

  const res = await fetch(`${PROXY_BASE}/api/midjourney`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  return res.json().catch(() => ({}));
}

// ── fal.ai model generation ────────────────────────────────────────────────
async function generateFal(token) {
  if (!args["prompt"]) error("--prompt is required.");

  const payload = {
    model: args["model"],
    prompt: args["prompt"],
    aspect_ratio: args["aspect-ratio"] || "1:1",
    num_images: parseInt(args["num-images"], 10) || 1,
  };

  if (args["negative-prompt"]) payload.negative_prompt = args["negative-prompt"];
  if (args["seed"]) payload.seed = parseInt(args["seed"], 10);

  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  process.stderr.write(`[ImageStudio] Generating with ${payload.model}...\n`);

  const res = await fetch(`${PROXY_BASE}/api/generate`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  return res.json().catch(() => ({}));
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const model = args["model"];

  let token;
  try {
    token = await getToken();
  } catch (err) {
    process.stderr.write(`[ImageStudio] Warning: token request failed (${err.message}), proceeding without token\n`);
    token = "";
  }

  try {
    let result;
    if (model === "midjourney") {
      result = await generateMidjourney(token);
    } else {
      result = await generateFal(token);
    }

    if (result.success === false || result.error) {
      error(result.error || "Generation failed", result);
    }

    output(result);
  } catch (err) {
    error(err.message, err.code);
  }
}

main();
