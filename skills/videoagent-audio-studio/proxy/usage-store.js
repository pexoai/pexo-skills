/**
 * usage-store.js — Persistent stats tracking for audiomind-proxy.
 * Backed by Upstash Redis; falls back to in-memory for local dev.
 *
 * Redis key schema (prefix "am"):
 *   am:stats:total          → { generations, errors, rateLimits }
 *   am:stats:action:{name}  → { generations, errors }
 *   am:stats:day:{YYYYMMDD} → { generations }
 */

const PREFIX = "am";
const DAY_TTL_S = 90 * 24 * 3600; // 90-day retention

let redis = null;

async function getRedis() {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  try {
    const { Redis } = require("@upstash/redis");
    redis = new Redis({ url, token });
    return redis;
  } catch {
    return null;
  }
}

// In-memory fallback
const mem = {};
function memIncr(key, field, by = 1) {
  if (!mem[key]) mem[key] = {};
  mem[key][field] = (mem[key][field] || 0) + by;
}
function memGet(key) {
  return mem[key] || null;
}

function datestamp() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

async function hincr(r, key, field, by = 1) {
  try {
    return await r.hincrby(key, field, by);
  } catch {
    return null;
  }
}

/**
 * Track a successful generation.
 * @param {string} action - "tts" | "sfx" | "music"
 */
async function trackGeneration(action) {
  const r = await getRedis();
  const day = datestamp();
  const dayKey = `${PREFIX}:stats:day:${day}`;

  if (r) {
    await Promise.allSettled([
      hincr(r, `${PREFIX}:stats:total`, "generations"),
      hincr(r, `${PREFIX}:stats:action:${action}`, "generations"),
      hincr(r, dayKey, "generations").then(() =>
        r.expire(dayKey, DAY_TTL_S).catch(() => {})
      ),
    ]);
  } else {
    memIncr(`${PREFIX}:stats:total`, "generations");
    memIncr(`${PREFIX}:stats:action:${action}`, "generations");
    memIncr(dayKey, "generations");
  }
}

/**
 * Track an error during generation.
 * @param {string} action - "tts" | "sfx" | "music"
 */
async function trackError(action) {
  const r = await getRedis();
  if (r) {
    await Promise.allSettled([
      hincr(r, `${PREFIX}:stats:total`, "errors"),
      hincr(r, `${PREFIX}:stats:action:${action}`, "errors"),
    ]);
  } else {
    memIncr(`${PREFIX}:stats:total`, "errors");
    memIncr(`${PREFIX}:stats:action:${action}`, "errors");
  }
}

/**
 * Track a rate-limit / auth rejection.
 */
async function trackRateLimit() {
  const r = await getRedis();
  if (r) {
    await hincr(r, `${PREFIX}:stats:total`, "rateLimits").catch(() => {});
  } else {
    memIncr(`${PREFIX}:stats:total`, "rateLimits");
  }
}

/**
 * Retrieve aggregated statistics.
 * @param {number} [days=30] - How many daily buckets to include.
 */
async function getStats(days = 30) {
  const r = await getRedis();
  const actions = ["tts", "sfx", "music"];

  if (r) {
    const [total, ...actionStats] = await Promise.all([
      r.hgetall(`${PREFIX}:stats:total`),
      ...actions.map((a) => r.hgetall(`${PREFIX}:stats:action:${a}`)),
    ]);

    // Daily buckets
    const daily = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const stamp = d.toISOString().slice(0, 10).replace(/-/g, "");
      const bucket = await r.hgetall(`${PREFIX}:stats:day:${stamp}`).catch(() => null);
      daily.push({
        date: `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}`,
        generations: Number(bucket?.generations || 0),
      });
    }

    const byAction = {};
    actions.forEach((a, i) => {
      byAction[a] = {
        generations: Number(actionStats[i]?.generations || 0),
        errors: Number(actionStats[i]?.errors || 0),
      };
    });

    return {
      total: {
        generations: Number(total?.generations || 0),
        errors: Number(total?.errors || 0),
        rateLimits: Number(total?.rateLimits || 0),
      },
      byAction,
      daily,
    };
  }

  // In-memory fallback
  const totalMem = memGet(`${PREFIX}:stats:total`) || {};
  const byAction = {};
  actions.forEach((a) => {
    const s = memGet(`${PREFIX}:stats:action:${a}`) || {};
    byAction[a] = { generations: s.generations || 0, errors: s.errors || 0 };
  });
  return {
    total: {
      generations: totalMem.generations || 0,
      errors: totalMem.errors || 0,
      rateLimits: totalMem.rateLimits || 0,
    },
    byAction,
    daily: [],
  };
}

module.exports = { trackGeneration, trackError, trackRateLimit, getStats };
