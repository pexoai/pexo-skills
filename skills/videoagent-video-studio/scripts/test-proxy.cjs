/**
 * Local proxy unit test harness — no Vercel / HTTP server required.
 * Directly invokes handler(req, res) with mock req/res objects.
 * Run: node scripts/test-proxy.cjs
 */

process.env.FAL_KEY = process.env.FAL_KEY || "";
process.env.FREE_LIMIT_PER_IP = "3";
process.env.MAX_TOKENS_PER_IP_PER_DAY = "2";
delete process.env.VALID_TOKENS;
delete process.env.KV_REST_API_URL; // force in-memory fallback

const path = require("path");
const proxyDir = path.join(__dirname, "../proxy");

// ── Mock req / res ────────────────────────────────────────────────────────────
function mockReq(method, body = {}, headers = {}, ip = "1.2.3.4") {
  return { method, body, headers: { ...headers },
           socket: { remoteAddress: ip }, query: body };
}
function mockRes() {
  const res = { _status: 200, _body: null, _headers: {} };
  res.status = (s) => { res._status = s; return res; };
  res.json   = (d) => { res._body  = d; return res; };
  res.end    = ()  => res;
  res.setHeader = (k, v) => { res._headers[k] = v; };
  return res;
}

// ── Runner ────────────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
async function test(label, fn) {
  try   { await fn(); console.log(`  ✓  ${label}`); passed++; }
  catch (e) { console.error(`  ✗  ${label}\n       ${e.message}`); failed++; }
}
function expect(val, label) {
  return {
    toBe:       (exp) => { if (val !== exp) throw new Error(`${label}: expected ${JSON.stringify(exp)}, got ${JSON.stringify(val)}`); },
    toContain:  (sub) => { if (!String(val).includes(sub)) throw new Error(`${label}: expected to contain "${sub}", got "${val}"`); },
    toBeTruthy: ()    => { if (!val) throw new Error(`${label}: expected truthy, got ${JSON.stringify(val)}`); },
    toBeNull:   ()    => { if (val !== null) throw new Error(`${label}: expected null, got ${JSON.stringify(val)}`); },
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────
async function runTests() {
  console.log("\n═══ proxy unit tests ═══\n");

  // ── usage-store (async) ───────────────────────────────────────────────────
  console.log("── usage-store ──");
  const store = require(path.join(proxyDir, "usage-store.js"));

  await test("setIssuedToken + getIssuedToken round-trip", async () => {
    await store.setIssuedToken("tok_test_1", "1.2.3.4");
    const data = await store.getIssuedToken("tok_test_1");
    expect(data.ip, "ip").toBe("1.2.3.4");
  });

  await test("getIssuedToken returns null for unknown token", async () => {
    const data = await store.getIssuedToken("tok_nonexistent");
    expect(data, "data").toBeNull();
  });

  await test("incrementTokenUsage increments counter", async () => {
    await store.setIssuedToken("tok_usage_1", "1.2.3.4");
    await store.incrementTokenUsage("tok_usage_1");
    await store.incrementTokenUsage("tok_usage_1");
    const n = await store.getTokenUsage("tok_usage_1");
    expect(n, "usage").toBe(2);
  });

  await test("getIssuanceCount + incrementIssuanceCount", async () => {
    const ip = "10.0.0.test_async";
    expect(await store.getIssuanceCount(ip), "initial count").toBe(0);
    await store.incrementIssuanceCount(ip);
    await store.incrementIssuanceCount(ip);
    expect(await store.getIssuanceCount(ip), "after 2 increments").toBe(2);
  });

  await test("getStats returns expected shape", async () => {
    const stats = await store.getStats();
    if (typeof stats.total_generations !== "number") throw new Error("missing total_generations");
    if (typeof stats.by_model !== "object") throw new Error("missing by_model");
    if (typeof stats.by_mode  !== "object") throw new Error("missing by_mode");
  });

  // ── models.js ─────────────────────────────────────────────────────────────
  console.log("\n── models.js ──");
  const { getModel, listModels, resolveModel } = require(path.join(proxyDir, "models.js"));

  await test("listModels returns array with id/name/categories", async () => {
    const list = listModels();
    if (!Array.isArray(list) || list.length === 0) throw new Error("empty list");
    const m = list[0];
    if (!m.id || !m.name || !Array.isArray(m.categories)) throw new Error("missing fields: " + JSON.stringify(m));
  });

  await test("getModel('minimax') returns correct config", async () => {
    const m = getModel("minimax");
    expect(m.t2v, "t2v").toBe("fal-ai/minimax/video-01");
    expect(m.referenceToVideo, "ref endpoint").toBe("fal-ai/minimax/video-01-subject-reference");
  });

  await test("getModel('kling') has correct O3 reference endpoint", async () => {
    const m = getModel("kling");
    expect(m.referenceToVideo, "kling O3").toBe("fal-ai/kling-video/o3/standard/reference-to-video");
  });

  await test("getModel('veo') refInput always returns duration 8s", async () => {
    const m = getModel("veo");
    const input = m.refInput({ prompt: "test", imageUrl: "http://x.com/img.jpg", duration: 4 });
    expect(input.duration, "veo ref duration").toBe("8s");
  });

  await test("getModel('seedance') uses fal-ai/bytedance endpoint", async () => {
    const m = getModel("seedance");
    expect(m.t2v, "seedance t2v").toContain("fal-ai/bytedance/seedance");
    expect(m.provider, "provider").toBe("fal");
  });

  await test("resolveModel returns null for unsupported mode", async () => {
    const m = resolveModel("pixverse", "text-to-video");
    expect(m, "pixverse t2v should be null").toBeNull();
  });

  await test("all models have categories array", async () => {
    for (const m of listModels()) {
      if (!Array.isArray(m.categories) || m.categories.length === 0)
        throw new Error(`${m.id} missing categories`);
    }
  });

  // ── POST /api/token ───────────────────────────────────────────────────────
  console.log("\n── POST /api/token ──");
  const tokenHandler = require(path.join(proxyDir, "api/token.js"));

  await test("GET /api/token → 405", async () => {
    const res = mockRes();
    await tokenHandler(mockReq("GET"), res);
    expect(res._status, "status").toBe(405);
  });

  await test("POST /api/token → issues token", async () => {
    const res = mockRes();
    await tokenHandler(mockReq("POST", {}, {}, "192.168.1.1"), res);
    expect(res._status, "status").toBe(200);
    if (!res._body.token?.startsWith("vs_")) throw new Error("bad token: " + res._body.token);
  });

  await test("POST /api/token → second token same IP works", async () => {
    const res = mockRes();
    await tokenHandler(mockReq("POST", {}, {}, "192.168.1.2"), res);
    const res2 = mockRes();
    await tokenHandler(mockReq("POST", {}, {}, "192.168.1.2"), res2);
    expect(res2._status, "second token").toBe(200);
  });

  await test("POST /api/token → 429 after MAX_TOKENS_PER_IP_PER_DAY (2)", async () => {
    const ip = "192.168.1.50";
    for (let i = 0; i < 2; i++) {
      const res = mockRes();
      await tokenHandler(mockReq("POST", {}, {}, ip), res);
      if (res._status !== 200) throw new Error(`expected 200 on call ${i+1}, got ${res._status}`);
    }
    const res3 = mockRes();
    await tokenHandler(mockReq("POST", {}, {}, ip), res3);
    expect(res3._status, "3rd token should 429").toBe(429);
  });

  // ── POST /api/generate ────────────────────────────────────────────────────
  console.log("\n── POST /api/generate ──");
  const generateHandler = require(path.join(proxyDir, "api/generate.js"));

  await test("GET /api/generate → health check 200", async () => {
    const res = mockRes();
    await generateHandler(mockReq("GET"), res);
    expect(res._status, "status").toBe(200);
    expect(res._body.service, "service").toBe("videoagent-video-studio-proxy");
    if (!Array.isArray(res._body.models)) throw new Error("models not array");
    expect(res._body.free_limit_per_token, "free_limit").toBe(3);
  });

  await test("POST /api/generate without token → 401", async () => {
    const res = mockRes();
    await generateHandler(mockReq("POST", { mode: "text-to-video", prompt: "test" }), res);
    expect(res._status, "status").toBe(401);
  });

  await test("POST /api/generate with unknown token → 401", async () => {
    const res = mockRes();
    await generateHandler(mockReq("POST", { mode: "text-to-video", prompt: "test" }, {
      authorization: "Bearer vs_fake_never_issued",
    }), res);
    expect(res._status, "status").toBe(401);
  });

  // issue real token for next tests
  const tr = mockRes();
  await tokenHandler(mockReq("POST", {}, {}, "test.harness.ip"), tr);
  const testToken = tr._body.token;

  await test("POST /api/generate missing prompt → 400", async () => {
    const res = mockRes();
    await generateHandler(mockReq("POST", { mode: "text-to-video" }, {
      authorization: `Bearer ${testToken}`,
    }), res);
    expect(res._status, "status").toBe(400);
    expect(res._body.error, "error").toContain("prompt");
  });

  await test("POST /api/generate image-to-video missing imageUrl → 400", async () => {
    const res = mockRes();
    await generateHandler(mockReq("POST", { mode: "image-to-video", prompt: "test" }, {
      authorization: `Bearer ${testToken}`,
    }), res);
    expect(res._status, "status").toBe(400);
    expect(res._body.error, "error").toContain("imageUrl");
  });

  await test("POST /api/generate invalid model → 400", async () => {
    const res = mockRes();
    await generateHandler(mockReq("POST",
      { mode: "text-to-video", prompt: "test", model: "nonexistent_xyz" },
      { authorization: `Bearer ${testToken}` }
    ), res);
    expect(res._status, "status").toBe(400);
  });

  await test("POST /api/generate pixverse with text-to-video → 400 (i2v only)", async () => {
    const res = mockRes();
    await generateHandler(mockReq("POST",
      { mode: "text-to-video", prompt: "test", model: "pixverse" },
      { authorization: `Bearer ${testToken}` }
    ), res);
    expect(res._status, "status").toBe(400);
  });

  await test("POST /api/generate with no FAL_KEY → 503", async () => {
    const saved = process.env.FAL_KEY;
    process.env.FAL_KEY = "";
    delete require.cache[require.resolve(path.join(proxyDir, "api/generate.js"))];
    const fresh = require(path.join(proxyDir, "api/generate.js"));
    const tr2 = mockRes();
    await tokenHandler(mockReq("POST", {}, {}, "no.fal.key.ip"), tr2);
    const res = mockRes();
    await fresh(mockReq("POST",
      { mode: "text-to-video", prompt: "test", model: "minimax" },
      { authorization: `Bearer ${tr2._body.token}` }
    ), res);
    process.env.FAL_KEY = saved;
    expect(res._status, "status").toBe(503);
  });

  await test("POST /api/generate rate-limit: 429 after FREE_LIMIT_PER_IP (3) calls", async () => {
    const tr3 = mockRes();
    await tokenHandler(mockReq("POST", {}, {}, "ratelimit.test.ip"), tr3);
    const tok = tr3._body.token;
    // burn usage to limit
    for (let i = 0; i < 3; i++) await store.incrementTokenUsage(tok);
    delete require.cache[require.resolve(path.join(proxyDir, "api/generate.js"))];
    const fresh = require(path.join(proxyDir, "api/generate.js"));
    process.env.FAL_KEY = "test_key";
    const res = mockRes();
    await fresh(mockReq("POST",
      { mode: "text-to-video", prompt: "test", model: "minimax" },
      { authorization: `Bearer ${tok}` }
    ), res);
    process.env.FAL_KEY = "";
    expect(res._status, "status").toBe(429);
    expect(res._body.error, "error").toContain("Free limit");
  });

  // ── GET /api/status ───────────────────────────────────────────────────────
  console.log("\n── GET /api/status ──");
  const statusHandler = require(path.join(proxyDir, "api/status.js"));

  await test("GET /api/status without jobId → 400", async () => {
    const res = mockRes();
    await statusHandler(mockReq("GET", {}), res);
    expect(res._status, "status").toBe(400);
  });

  await test("GET /api/status with jobId → 501", async () => {
    const req = mockReq("GET", {});
    req.query = { jobId: "test-job-123" };
    const res = mockRes();
    await statusHandler(req, res);
    expect(res._status, "status").toBe(501);
    expect(res._body.jobId, "jobId echoed").toBe("test-job-123");
  });

  // ── GET /api/stats ────────────────────────────────────────────────────────
  console.log("\n── GET /api/stats ──");
  const statsHandler = require(path.join(proxyDir, "api/stats.js"));

  await test("GET /api/stats open access (no STATS_KEY) → 200", async () => {
    delete process.env.STATS_KEY;
    delete require.cache[require.resolve(path.join(proxyDir, "api/stats.js"))];
    const fresh = require(path.join(proxyDir, "api/stats.js"));
    const res = mockRes();
    await fresh(mockReq("GET"), res);
    expect(res._status, "status").toBe(200);
    if (typeof res._body.total_generations !== "number") throw new Error("missing total_generations");
    if (!res._body.timestamp) throw new Error("missing timestamp");
  });

  await test("GET /api/stats with STATS_KEY set → 401 without token", async () => {
    process.env.STATS_KEY = "secret123";
    delete require.cache[require.resolve(path.join(proxyDir, "api/stats.js"))];
    const fresh = require(path.join(proxyDir, "api/stats.js"));
    const res = mockRes();
    await fresh(mockReq("GET"), res);
    expect(res._status, "status").toBe(401);
    delete process.env.STATS_KEY;
  });

  await test("GET /api/stats with correct STATS_KEY → 200", async () => {
    process.env.STATS_KEY = "secret123";
    delete require.cache[require.resolve(path.join(proxyDir, "api/stats.js"))];
    const fresh = require(path.join(proxyDir, "api/stats.js"));
    const res = mockRes();
    await fresh(mockReq("GET", {}, { authorization: "Bearer secret123" }), res);
    expect(res._status, "status").toBe(200);
    delete process.env.STATS_KEY;
  });

  await test("POST /api/stats → 405", async () => {
    const res = mockRes();
    await statsHandler(mockReq("POST"), res);
    expect(res._status, "status").toBe(405);
  });

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n═══ Results: ${passed} passed, ${failed} failed ═══\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => { console.error("Unhandled:", e); process.exit(1); });
