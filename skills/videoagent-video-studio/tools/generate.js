#!/usr/bin/env node
/**
 * videoagent-video-studio — generate.js
 * CLI for text-to-video and image-to-video via a hosted proxy.
 * Usage:
 *   node generate.js --mode text-to-video --prompt "<text>" [options]
 *   node generate.js --mode image-to-video --prompt "<motion>" --image-url "<url>" [options]
 */

import { parseArgs } from "util";

const PROXY_BASE = process.env.VIDEO_STUDIO_PROXY_URL || "https://video-gen-proxy.vercel.app";
const TOKEN = process.env.VIDEO_STUDIO_TOKEN || "";

const { values: args } = parseArgs({
  options: {
    mode: { type: "string", default: "text-to-video" },
    prompt: { type: "string", default: "" },
    "image-url": { type: "string", default: "" },
    duration: { type: "string", default: "5" },
    "aspect-ratio": { type: "string", default: "16:9" },
    model: { type: "string", default: "" },
    "list-models": { type: "boolean", default: false },
    status: { type: "boolean", default: false },
    "job-id": { type: "string", default: "" },
  },
  strict: false,
});

function output(data) {
  console.log(JSON.stringify(data, null, 2));
}

function error(msg, details = null) {
  console.error(JSON.stringify({ success: false, error: msg, details }, null, 2));
  process.exit(1);
}

async function getToken() {
  if (TOKEN) return TOKEN;
  try {
    const res = await fetch(`${PROXY_BASE}/api/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.token) return null;
    return data.token;
  } catch {
    return null;
  }
}

async function listModels() {
  try {
    const res = await fetch(`${PROXY_BASE}/api/generate`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      error(data.error || "Failed to fetch models", data);
    }
    const info = {
      service: data.service,
      version: data.version,
      status: data.status,
      modes: data.modes,
      models: data.models || [],
    };
    output(info);
  } catch (err) {
    error("Could not reach proxy. Is VIDEO_STUDIO_PROXY_URL set?", err.message);
  }
}

async function checkStatus(jobId) {
  if (!jobId) error("--job-id is required when using --status.");
  const token = await getToken();
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  try {
    const url = new URL("/api/status", PROXY_BASE);
    url.searchParams.set("jobId", jobId);
    const res = await fetch(url.toString(), { headers });
    const data = await res.json().catch(() => ({}));
    output({
      success: res.ok && data.success !== false,
      jobId,
      status: data.status,
      videoUrl: data.videoUrl,
      error: data.error,
      message: data.message,
    });
    if (!res.ok && res.status >= 400) process.exit(1);
  } catch (err) {
    error("Status check failed", err.message);
  }
}

async function main() {
  if (args["list-models"]) {
    await listModels();
    return;
  }
  if (args.status) {
    await checkStatus(args["job-id"]);
    return;
  }

  const mode = args.mode === "image-to-video" ? "image-to-video" : "text-to-video";
  if (!args.prompt) error("--prompt is required.");
  if (mode === "image-to-video" && !args["image-url"]) error("--image-url is required for image-to-video.");

  const token = await getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const body = {
    mode,
    prompt: args.prompt,
    duration: parseInt(args.duration, 10) || 5,
    aspectRatio: args["aspect-ratio"] || "16:9",
    model: args.model || "auto",
  };
  if (mode === "image-to-video") body.imageUrl = args["image-url"];

  try {
    const res = await fetch(`${PROXY_BASE}/api/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      error(data.message || "Video generation failed", data);
    }

    if (data.videoUrl) {
      output({
        success: true,
        mode: data.mode || mode,
        videoUrl: data.videoUrl,
        duration: data.duration ?? body.duration,
        aspectRatio: data.aspectRatio ?? body.aspectRatio,
        jobId: data.jobId || undefined,
        status: data.status || undefined,
      });
    } else if (data.jobId) {
      output({
        success: true,
        mode: data.mode || mode,
        jobId: data.jobId,
        status: data.status || "pending",
        message: "Generation started. Poll the proxy for result or check callback.",
      });
    } else {
      error("Unexpected response from proxy", data);
    }
  } catch (err) {
    error("Request failed. Is VIDEO_STUDIO_PROXY_URL set and the proxy running?", err.message);
  }
}

main();
