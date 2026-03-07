/**
 * GET /api/stats — real-time usage statistics.
 * Requires Authorization: Bearer <STATS_KEY> when STATS_KEY env is set.
 * Returns generation counts, error counts, rate-limit hits, per-model and per-mode breakdown.
 */

const STATS_KEY = process.env.STATS_KEY || "";

const { getStats } = require("../usage-store.js");

function json(res, status, data) {
  res.setHeader("Content-Type", "application/json");
  res.status(status).json(data);
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });

  // Auth: if STATS_KEY is set, require it
  if (STATS_KEY) {
    const bearer = req.headers.authorization || "";
    const token  = bearer.startsWith("Bearer ") ? bearer.slice(7).trim() : "";
    if (token !== STATS_KEY)
      return json(res, 401, { error: "Unauthorized. Set Authorization: Bearer <STATS_KEY>." });
  }

  try {
    const stats = await getStats();
    return json(res, 200, { ...stats, timestamp: new Date().toISOString() });
  } catch (e) {
    return json(res, 500, { error: "Failed to fetch stats", detail: e.message });
  }
};
