/**
 * Usage store — Upstash Redis with in-memory fallback for local dev.
 * Redis is used when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set.
 * Legacy Vercel KV env vars (KV_REST_API_URL / KV_REST_API_TOKEN) are also accepted.
 * Falls back to in-process Maps when Redis is not configured.
 *
 * Key schema (prefix: vs:)
 *   vs:tok:{token}               → { ip, createdAt }   TTL 24 h
 *   vs:usage:{token}             → int                  TTL 25 h
 *   vs:ip:{ip}:{dayKey}          → int                  TTL 25 h
 *
 *   vs:stats:total               → int  (lifetime successful generations)
 *   vs:stats:err                 → int  (lifetime generation errors)
 *   vs:stats:issued              → int  (lifetime tokens issued)
 *   vs:stats:429:token           → int  (rate-limit hits by token quota)
 *   vs:stats:429:ip              → int  (rate-limit hits by IP daily limit)
 *   vs:stats:model:{id}          → int  (per-model lifetime total)
 *   vs:stats:mode:{mode}         → int  (per-mode lifetime total)
 *   vs:stats:err:{id}            → int  (per-model error count)
 *
 *   vs:stats:day:{YYYYMMDD}             → int  (total generations that day)
 *   vs:stats:day:{YYYYMMDD}:{modelId}   → int  (per-model that day)
 */

const DAY_MS     = 86400000;
const TOKEN_TTL_S = 86400; // 24 h
const DAY_TTL_S  = 86400 * 90; // keep daily stats for 90 days

// ── Redis client (lazy-loaded) ────────────────────────────────────────────────
let _kv = null;
function getKV() {
  if (_kv) return _kv;
  const url   = process.env.UPSTASH_REDIS_REST_URL   || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  try {
    const { Redis } = require("@upstash/redis");
    _kv = new Redis({ url, token });
    return _kv;
  } catch {
    return null;
  }
}

// ── In-memory fallback ────────────────────────────────────────────────────────
const mem = {
  tokens: global._vs_tokens ?? (global._vs_tokens = new Map()),
  usage:  global._vs_usage  ?? (global._vs_usage  = new Map()),
  ip:     global._vs_ip     ?? (global._vs_ip     = new Map()),
  stats:  global._vs_stats  ?? (global._vs_stats  = new Map()),
};

function dayKey()        { return Math.floor(Date.now() / DAY_MS); }
function datestamp(d)    { // d = Date obj or offset from today (0 = today, -1 = yesterday)
  const dt = typeof d === "number"
    ? new Date(Date.now() + d * DAY_MS)
    : d;
  return dt.toISOString().slice(0, 10).replace(/-/g, "");
}

// ── Token ops ─────────────────────────────────────────────────────────────────
async function getIssuedToken(token) {
  if (!token || typeof token !== "string") return null;
  const kv = getKV();
  if (kv) return (await kv.get(`vs:tok:${token}`)) || null;

  const data = mem.tokens.get(token);
  if (!data) return null;
  if (Date.now() - data.createdAt > TOKEN_TTL_S * 1000) {
    mem.tokens.delete(token);
    mem.usage.delete(token);
    return null;
  }
  return data;
}

async function setIssuedToken(token, ip) {
  const data = { ip, createdAt: Date.now() };
  const kv = getKV();
  if (kv) {
    await Promise.all([
      kv.set(`vs:tok:${token}`, data, { ex: TOKEN_TTL_S }),
      kv.set(`vs:usage:${token}`, 0,    { ex: TOKEN_TTL_S + 3600 }),
      kv.incr("vs:stats:issued"),
    ]);
    return;
  }
  mem.tokens.set(token, data);
  mem.usage.set(token, 0);
  mem.stats.set("issued", (mem.stats.get("issued") || 0) + 1);
}

async function getTokenUsage(token) {
  const kv = getKV();
  if (kv) return (await kv.get(`vs:usage:${token}`)) || 0;
  return mem.usage.get(token) || 0;
}

async function incrementTokenUsage(token) {
  const kv = getKV();
  if (kv) return await kv.incr(`vs:usage:${token}`);
  const n = (mem.usage.get(token) || 0) + 1;
  mem.usage.set(token, n);
  return n;
}

// ── IP issuance ops ───────────────────────────────────────────────────────────
async function getIssuanceCount(ip) {
  const key = `vs:ip:${ip}:${dayKey()}`;
  const kv = getKV();
  if (kv) return (await kv.get(key)) || 0;
  return mem.ip.get(key) || 0;
}

async function incrementIssuanceCount(ip) {
  const key = `vs:ip:${ip}:${dayKey()}`;
  const kv = getKV();
  if (kv) {
    const n = await kv.incr(key);
    if (n === 1) await kv.expire(key, Math.floor(DAY_MS / 1000) + 3600);
    return n;
  }
  const n = (mem.ip.get(key) || 0) + 1;
  mem.ip.set(key, n);
  return n;
}

// ── Stats tracking ────────────────────────────────────────────────────────────
async function trackGeneration(modelId, mode) {
  const ds  = datestamp(0);
  const kv  = getKV();
  if (!kv) {
    mem.stats.set("total",           (mem.stats.get("total")           || 0) + 1);
    mem.stats.set(`model:${modelId}`, (mem.stats.get(`model:${modelId}`) || 0) + 1);
    mem.stats.set(`mode:${mode}`,     (mem.stats.get(`mode:${mode}`)     || 0) + 1);
    mem.stats.set(`day:${ds}`,        (mem.stats.get(`day:${ds}`)        || 0) + 1);
    mem.stats.set(`day:${ds}:${modelId}`, (mem.stats.get(`day:${ds}:${modelId}`) || 0) + 1);
    return;
  }
  await Promise.all([
    kv.incr("vs:stats:total"),
    kv.incr(`vs:stats:model:${modelId}`),
    kv.incr(`vs:stats:mode:${mode}`),
    kv.incr(`vs:stats:day:${ds}`).then(n => n === 1 && kv.expire(`vs:stats:day:${ds}`, DAY_TTL_S)),
    kv.incr(`vs:stats:day:${ds}:${modelId}`),
  ]);
}

async function trackError(modelId) {
  const kv = getKV();
  if (!kv) {
    mem.stats.set("err", (mem.stats.get("err") || 0) + 1);
    if (modelId) mem.stats.set(`err:${modelId}`, (mem.stats.get(`err:${modelId}`) || 0) + 1);
    return;
  }
  await Promise.all([
    kv.incr("vs:stats:err"),
    modelId && kv.incr(`vs:stats:err:${modelId}`),
  ].filter(Boolean));
}

async function trackRateLimit(type) { // "token" | "ip"
  const kv = getKV();
  if (!kv) { mem.stats.set(`429:${type}`, (mem.stats.get(`429:${type}`) || 0) + 1); return; }
  await kv.incr(`vs:stats:429:${type}`);
}

// ── Stats query ───────────────────────────────────────────────────────────────
const MODEL_IDS = ["minimax", "kling", "veo", "hunyuan", "pixverse", "grok", "seedance"];
const MODES     = ["text-to-video", "image-to-video"];

async function getDailyStats(days = 14) {
  const dates = Array.from({ length: days }, (_, i) => datestamp(-i)).reverse(); // oldest first
  const kv = getKV();

  if (!kv) {
    return dates.map(ds => ({
      date: ds,
      total: mem.stats.get(`day:${ds}`) || 0,
    }));
  }

  const keys = dates.map(ds => `vs:stats:day:${ds}`);
  const vals = await kv.mget(...keys);
  return dates.map((ds, i) => ({
    date: `${ds.slice(0, 4)}-${ds.slice(4, 6)}-${ds.slice(6, 8)}`,
    total: vals[i] || 0,
  }));
}

async function getStats() {
  const kv      = getKV();
  const using_kv = !!kv;

  if (!kv) {
    const byModel = {}, byMode = {};
    MODEL_IDS.forEach(m => { byModel[m] = mem.stats.get(`model:${m}`) || 0; });
    MODES.forEach(m      => { byMode[m]  = mem.stats.get(`mode:${m}`)  || 0; });
    return {
      using_kv,
      total_generations:   mem.stats.get("total")   || 0,
      total_errors:        mem.stats.get("err")     || 0,
      total_tokens_issued: mem.stats.get("issued")  || 0,
      rate_limit_hits: {
        token: mem.stats.get("429:token") || 0,
        ip:    mem.stats.get("429:ip")    || 0,
      },
      by_model: byModel,
      by_mode:  byMode,
    };
  }

  const keys = [
    "vs:stats:total", "vs:stats:err", "vs:stats:issued",
    "vs:stats:429:token", "vs:stats:429:ip",
    ...MODEL_IDS.map(m => `vs:stats:model:${m}`),
    ...MODES.map(m      => `vs:stats:mode:${m}`),
  ];
  const vals = await kv.mget(...keys);
  const [total, err, issued, rl_token, rl_ip] = vals.slice(0, 5).map(v => v || 0);
  const byModel = {}, byMode = {};
  MODEL_IDS.forEach((m, j) => { byModel[m] = vals[5 + j]                    || 0; });
  MODES.forEach((m, j)      => { byMode[m]  = vals[5 + MODEL_IDS.length + j] || 0; });

  return {
    using_kv,
    total_generations:   total,
    total_errors:        err,
    total_tokens_issued: issued,
    rate_limit_hits: { token: rl_token, ip: rl_ip },
    by_model: byModel,
    by_mode:  byMode,
  };
}

module.exports = {
  getIssuedToken, setIssuedToken,
  getTokenUsage, incrementTokenUsage,
  getIssuanceCount, incrementIssuanceCount,
  trackGeneration, trackError, trackRateLimit,
  getStats, getDailyStats,
  TOKEN_TTL_MS: TOKEN_TTL_S * 1000,
};
