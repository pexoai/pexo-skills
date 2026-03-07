/**
 * POST /api/token — issue free-tier tokens for anonymous users.
 * Each token is capped at FREE_LIMIT_PER_IP uses.
 * Token issuance is capped at MAX_TOKENS_PER_IP_PER_DAY per IP per day.
 */

const VALID_TOKENS            = (process.env.VALID_TOKENS || "").split(",").filter(Boolean);
const FREE_LIMIT_PER_IP       = Math.max(0, parseInt(process.env.FREE_LIMIT_PER_IP || "100", 10));
const MAX_TOKENS_PER_IP_PER_DAY = Math.max(1, parseInt(process.env.MAX_TOKENS_PER_IP_PER_DAY || "3", 10));

const {
  setIssuedToken,
  getIssuanceCount,
  incrementIssuanceCount,
  trackRateLimit,
} = require("../usage-store.js");

function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  return (typeof xff === "string" ? xff.split(",")[0] : xff?.[0])?.trim()
    || req.headers["x-real-ip"]
    || req.socket?.remoteAddress
    || "unknown";
}

function json(res, status, data) {
  res.setHeader("Content-Type", "application/json");
  res.status(status).json(data);
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  if (VALID_TOKENS.length > 0) {
    return json(res, 200, {
      token: null,
      free_limit: 0,
      message: "Proxy uses VALID_TOKENS; use one of those for Authorization.",
    });
  }

  const ip     = getClientIp(req);
  const issued = await getIssuanceCount(ip);

  if (issued >= MAX_TOKENS_PER_IP_PER_DAY) {
    await trackRateLimit("ip").catch(() => {});
    return json(res, 429, {
      success: false,
      error: "Too many tokens requested today",
      max_tokens_per_ip_per_day: MAX_TOKENS_PER_IP_PER_DAY,
      hint: "Limit resets daily.",
    });
  }

  const token = `vs_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  await setIssuedToken(token, ip);
  await incrementIssuanceCount(ip);

  return json(res, 200, {
    token,
    free_limit: FREE_LIMIT_PER_IP,
    free_limit_reset: "daily",
    max_tokens_per_day: MAX_TOKENS_PER_IP_PER_DAY,
  });
};
