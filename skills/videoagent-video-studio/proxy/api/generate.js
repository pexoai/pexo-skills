/**
 * videoagent-video-studio proxy — POST /api/generate
 * Body: { mode, prompt, imageUrl?, duration?, aspectRatio?, model? }
 * model: minimax | kling | veo | hunyuan | pixverse | grok | seedance
 */

const { fal } = require("@fal-ai/client");
const { getModel, listModels, resolveModel, FAL } = require("../models.js");

const FAL_KEY           = process.env.FAL_KEY || "";
const VALID_TOKENS      = (process.env.VALID_TOKENS || "").split(",").filter(Boolean);
const FREE_LIMIT_PER_IP = Math.max(0, parseInt(process.env.FREE_LIMIT_PER_IP || "100", 10));

const {
  getIssuedToken,
  getTokenUsage,
  incrementTokenUsage,
  trackGeneration,
  trackError,
  trackRateLimit,
} = require("../usage-store.js");

fal.config({ credentials: FAL_KEY });

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

function err(res, status, message, details = null) {
  json(res, status, { success: false, error: message, ...(details && { details }) });
}

function getBearerToken(req) {
  const h = req.headers.authorization;
  return h && h.startsWith("Bearer ") ? h.slice(7).trim() : null;
}

function clampDuration(d, max = 10) {
  const n = parseInt(d, 10);
  if (Number.isNaN(n) || n < 1) return 5;
  return Math.min(n, max);
}

async function runFal(modelId, mode, body) {
  const m = getModel(modelId);
  if (!m || m.provider !== FAL) throw new Error(`Unknown FAL model: ${modelId}`);
  const endpoint = mode === "image-to-video" ? m.i2v : m.t2v;
  if (!endpoint) throw new Error(`Model ${modelId} does not support ${mode}`);

  const normalized = {
    prompt:      body.prompt,
    imageUrl:    body.imageUrl || body.image_url,
    duration:    clampDuration(body.duration),
    aspectRatio: body.aspectRatio || "16:9",
  };
  const input  = m.falInput(normalized, mode);
  const result = await fal.subscribe(endpoint, { input, logs: false });

  const url = result?.data?.video?.url || result?.data?.url;
  if (!url) throw new Error("No video URL in response");

  return { success: true, mode, model: modelId, videoUrl: url,
           duration: normalized.duration, aspectRatio: normalized.aspectRatio };
}

function pickDefaultModel(mode) {
  const list = listModels();
  const m = list.find(m => m.provider === FAL && (mode === "text-to-video" ? m.t2v : m.i2v));
  return m ? m.id : "minimax";
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(204).end();

  // ── GET: health + model list ────────────────────────────────────────────────
  if (req.method === "GET") {
    return json(res, 200, {
      service: "videoagent-video-studio-proxy",
      version: "2.1.0",
      status: "ok",
      modes: ["text-to-video", "image-to-video"],
      models: listModels(),
      free_limit_per_token: FREE_LIMIT_PER_IP,
      free_limit_reset: "daily",
      max_tokens_per_ip_per_day: VALID_TOKENS.length === 0
        ? parseInt(process.env.MAX_TOKENS_PER_IP_PER_DAY || "3", 10) : null,
    });
  }

  if (req.method !== "POST") return err(res, 405, "Method not allowed");

  // ── Auth ────────────────────────────────────────────────────────────────────
  const bearerToken = getBearerToken(req);

  if (VALID_TOKENS.length > 0) {
    if (!bearerToken || !VALID_TOKENS.includes(bearerToken))
      return err(res, 401, "Invalid or missing token.");
  } else {
    if (!bearerToken)
      return err(res, 401, "Missing token. Get one from POST /api/token first.", {
        hint: "POST /api/token → use token as Authorization: Bearer <token>",
      });
    const tokenData = await getIssuedToken(bearerToken);
    if (!tokenData)
      return err(res, 401, "Invalid or expired token. Get a new one from POST /api/token.", {
        token_ttl_hours: 24,
      });
    if (FREE_LIMIT_PER_IP > 0) {
      const used = await getTokenUsage(bearerToken);
      if (used >= FREE_LIMIT_PER_IP) {
        await trackRateLimit("token");
        return json(res, 429, {
          success: false,
          error: "Free limit reached for this token",
          free_limit: FREE_LIMIT_PER_IP,
          used,
          hint: "Get a new token from POST /api/token.",
        });
      }
    }
  }

  // ── Validate input ──────────────────────────────────────────────────────────
  const body        = req.body || {};
  const mode        = (body.mode || "text-to-video").toLowerCase();
  const isI2V       = mode === "image-to-video";

  if (!body.prompt)
    return err(res, 400, "Missing prompt");
  if (isI2V && !body.imageUrl && !body.image_url)
    return err(res, 400, "Missing imageUrl for image-to-video");

  const modelId    = (body.model || "auto").toLowerCase().trim();
  const resolvedId = modelId === "auto" ? pickDefaultModel(mode) : modelId;
  const model      = resolveModel(resolvedId, mode);

  if (!model)
    return err(res, 400,
      `Unsupported model or mode: model=${resolvedId}, mode=${mode}. GET /api/generate for list.`);

  if (model.provider === FAL && !FAL_KEY)
    return err(res, 503, "Service not configured");

  // ── Generate ────────────────────────────────────────────────────────────────
  try {
    let out;
    if (model.provider === FAL) {
      out = await runFal(resolvedId, mode, body);
    } else {
      return err(res, 500, "Unknown provider");
    }

    // Increment usage + track stats only on success
    if (VALID_TOKENS.length === 0 && FREE_LIMIT_PER_IP > 0 && bearerToken) {
      await incrementTokenUsage(bearerToken);
    }
    await trackGeneration(resolvedId, mode).catch(() => {});

    return json(res, 200, out);
  } catch (e) {
    console.error("[vs-proxy]", resolvedId, mode, e.message);
    await trackError(resolvedId).catch(() => {});
    return err(res, 500, e.message || "Video generation failed");
  }
};
