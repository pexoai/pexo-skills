#!/usr/bin/env node

import { pathToFileURL } from "node:url";

export const DEFAULT_MODEL = "bytedance/seedream-v5.0-lite";
export const DEFAULT_BASE_URL = "https://api.atlascloud.ai";
export const DEFAULT_SIZE = "2048*2048";
export const DEFAULT_OUTPUT_FORMAT = "jpeg";

const COMPLETED_STATUSES = new Set(["completed", "succeeded"]);
const FAILED_STATUSES = new Set(["failed", "canceled", "cancelled"]);

function readValue(argv, index, option) {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${option} requires a value`);
  }
  return value;
}

function readPositiveInteger(value, option) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${option} must be a positive integer`);
  }
  return parsed;
}

export function parseArgs(argv) {
  const options = {
    prompt: "",
    size: DEFAULT_SIZE,
    outputFormat: DEFAULT_OUTPUT_FORMAT,
    pollIntervalMs: 3000,
    maxAttempts: 60,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    switch (option) {
      case "--prompt":
        options.prompt = readValue(argv, index, option);
        index += 1;
        break;
      case "--size":
        options.size = readValue(argv, index, option);
        index += 1;
        break;
      case "--output-format":
        options.outputFormat = readValue(argv, index, option);
        index += 1;
        break;
      case "--poll-interval-ms":
        options.pollIntervalMs = readPositiveInteger(
          readValue(argv, index, option),
          option,
        );
        index += 1;
        break;
      case "--max-attempts":
        options.maxAttempts = readPositiveInteger(
          readValue(argv, index, option),
          option,
        );
        index += 1;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      default:
        throw new Error(`Unknown option: ${option}`);
    }
  }

  if (!options.help && !options.prompt.trim()) {
    throw new Error("--prompt is required");
  }
  if (!new Set(["jpeg", "png"]).has(options.outputFormat)) {
    throw new Error("--output-format must be jpeg or png");
  }

  return options;
}

function unwrapPayload(payload) {
  return payload?.data ?? payload;
}

async function requestJson(url, init, fetchImpl) {
  const response = await fetchImpl(url, init);
  const body = await response.text();
  let payload;

  try {
    payload = body ? JSON.parse(body) : {};
  } catch {
    throw new Error(`Atlas Cloud returned invalid JSON (HTTP ${response.status})`);
  }

  const apiCode = payload?.code;
  if (!response.ok || (apiCode !== undefined && apiCode !== 200)) {
    const message =
      payload?.message ?? payload?.error?.message ?? `HTTP ${response.status}`;
    throw new Error(`Atlas Cloud request failed: ${message}`);
  }

  return payload;
}

export async function generateImage(options, dependencies = {}) {
  const {
    apiKey,
    baseUrl = DEFAULT_BASE_URL,
    prompt,
    size = DEFAULT_SIZE,
    outputFormat = DEFAULT_OUTPUT_FORMAT,
    pollIntervalMs = 3000,
    maxAttempts = 60,
  } = options;
  const fetchImpl = dependencies.fetchImpl ?? globalThis.fetch;
  const sleepImpl =
    dependencies.sleepImpl ??
    ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));

  if (!apiKey) {
    throw new Error("ATLASCLOUD_API_KEY is required");
  }
  if (typeof fetchImpl !== "function") {
    throw new Error("A Fetch API implementation is required");
  }

  const origin = baseUrl.replace(/\/+$/, "");
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  const submission = await requestJson(
    `${origin}/api/v1/model/generateVideo`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        prompt,
        size,
        output_format: outputFormat,
      }),
    },
    fetchImpl,
  );
  const task = unwrapPayload(submission);
  const predictionId = task?.id ?? task?.request_id;

  if (!predictionId) {
    throw new Error("Atlas Cloud response did not include a prediction ID");
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const prediction = await requestJson(
      `${origin}/api/v1/model/result/${encodeURIComponent(predictionId)}`,
      { method: "GET", headers },
      fetchImpl,
    );
    const result = unwrapPayload(prediction);
    const status = String(result?.status ?? "unknown").toLowerCase();

    if (COMPLETED_STATUSES.has(status)) {
      const outputs = Array.isArray(result?.outputs) ? result.outputs : [];
      if (outputs.length === 0) {
        throw new Error("Atlas Cloud generation completed without an output URL");
      }
      return {
        id: predictionId,
        status,
        model: result?.model ?? DEFAULT_MODEL,
        outputs,
      };
    }
    if (FAILED_STATUSES.has(status)) {
      throw new Error(
        `Atlas Cloud generation failed: ${result?.error ?? result?.message ?? status}`,
      );
    }
    if (attempt < maxAttempts) {
      await sleepImpl(pollIntervalMs);
    }
  }

  throw new Error(
    `Atlas Cloud generation did not finish after ${maxAttempts} status requests`,
  );
}

function printHelp() {
  process.stdout.write(`Usage: node generate-image.mjs --prompt <text> [options]\n\n`);
  process.stdout.write(`Options:\n`);
  process.stdout.write(`  --size <width*height>       Default: ${DEFAULT_SIZE}\n`);
  process.stdout.write(`  --output-format <jpeg|png>  Default: ${DEFAULT_OUTPUT_FORMAT}\n`);
  process.stdout.write(`  --poll-interval-ms <ms>     Default: 3000\n`);
  process.stdout.write(`  --max-attempts <count>      Default: 60\n`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const result = await generateImage({
    ...options,
    apiKey: process.env.ATLASCLOUD_API_KEY,
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
