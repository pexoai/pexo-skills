import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_MODEL,
  generateImage,
  parseArgs,
} from "../scripts/generate-image.mjs";

function jsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(payload),
  };
}

test("parseArgs applies schema-backed defaults", () => {
  assert.deepEqual(parseArgs(["--prompt", "A red cube"]), {
    prompt: "A red cube",
    size: "2048*2048",
    outputFormat: "jpeg",
    pollIntervalMs: 3000,
    maxAttempts: 60,
    help: false,
  });
});

test("generateImage submits and polls an Atlas Cloud task", async () => {
  const calls = [];
  const responses = [
    jsonResponse({ code: 200, data: { id: "prediction-123" } }),
    jsonResponse({ code: 200, data: { status: "processing" } }),
    jsonResponse({
      code: 200,
      data: {
        status: "completed",
        model: DEFAULT_MODEL,
        outputs: ["https://example.invalid/image.jpeg"],
      },
    }),
  ];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return responses.shift();
  };

  const result = await generateImage(
    {
      apiKey: "test-key",
      baseUrl: "https://atlas.example/",
      prompt: "A red cube",
      pollIntervalMs: 1,
      maxAttempts: 2,
    },
    { fetchImpl, sleepImpl: async () => {} },
  );

  assert.deepEqual(result, {
    id: "prediction-123",
    status: "completed",
    model: DEFAULT_MODEL,
    outputs: ["https://example.invalid/image.jpeg"],
  });
  assert.equal(
    calls[0].url,
    "https://atlas.example/api/v1/model/generateVideo",
  );
  assert.equal(calls[0].init.headers.Authorization, "Bearer test-key");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    model: DEFAULT_MODEL,
    prompt: "A red cube",
    size: "2048*2048",
    output_format: "jpeg",
  });
  assert.equal(
    calls[1].url,
    "https://atlas.example/api/v1/model/result/prediction-123",
  );
  assert.equal(calls.length, 3);
});

test("generateImage surfaces API failures", async () => {
  await assert.rejects(
    generateImage(
      {
        apiKey: "test-key",
        prompt: "A red cube",
      },
      {
        fetchImpl: async () =>
          jsonResponse({ error: { message: "invalid key" } }, 401),
      },
    ),
    /Atlas Cloud request failed: invalid key/,
  );
});

test("generateImage rejects a completed task without output URLs", async () => {
  const responses = [
    jsonResponse({ code: 200, data: { id: "prediction-123" } }),
    jsonResponse({ code: 200, data: { status: "completed", outputs: [] } }),
  ];

  await assert.rejects(
    generateImage(
      {
        apiKey: "test-key",
        prompt: "A red cube",
      },
      { fetchImpl: async () => responses.shift() },
    ),
    /completed without an output URL/,
  );
});
