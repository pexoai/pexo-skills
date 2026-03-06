const { fal } = require("@fal-ai/client");

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
const FAL_KEY = process.env.FAL_KEY || "";
const VALID_PRO_KEYS = (process.env.VALID_PRO_KEYS || "").split(",").filter(Boolean);

const DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";
const DEFAULT_TTS_MODEL = "eleven_multilingual_v2";

fal.config({ credentials: FAL_KEY });

function json(res, status, data) {
  res.setHeader("Content-Type", "application/json");
  res.status(status).json(data);
}

function errorResponse(res, status, message) {
  json(res, status, { error: message, status: "failed" });
}

function authenticateRequest(req) {
  if (VALID_PRO_KEYS.length === 0) return true;
  const key = req.headers["x-audiomind-key"];
  return key && VALID_PRO_KEYS.includes(key);
}

function inferAction(body) {
  if (body.action) return body.action.toLowerCase();

  const model = String(body.model || "").toLowerCase();
  if (model.includes("sfx")) return "sfx";
  if (model.includes("music") || model.includes("cassette")) return "music";
  if (model.includes("tts") || model.includes("eleven")) return "tts";

  const combined = `${body.prompt || ""} ${body.text || ""}`.toLowerCase();
  if (/\b(sfx|sound effect|whoosh|explosion|rain|thunder|bird|dog bark|foley)\b/.test(combined)) return "sfx";
  if (/(sfx|sound effect|whoosh|explosion|rain|thunder|bird|dog bark|foley|doorbell|ambient)/.test(combined)) return "sfx";
  if (/\b(music|track|song|melody|beat|lo-fi|soundtrack|bgm)\b/.test(combined)) return "music";
  if (/(music|track|song|melody|beat|lo-?fi|soundtrack|bgm|score)/.test(combined)) return "music";
  return "tts";
}

async function handleTTS(body) {
  const text = body.text || body.prompt;
  if (!text) throw new Error("Missing text for TTS");

  const voiceId = body.voice_id || DEFAULT_VOICE_ID;
  const modelId = body.model || DEFAULT_TTS_MODEL;

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText);
    throw new Error(`ElevenLabs TTS failed (${response.status}): ${err}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return {
    status: "completed",
    audio_base64: base64,
    format: "mp3",
    model: modelId,
    voice_id: voiceId,
  };
}

async function handleSFX(body) {
  const text = body.text || body.prompt;
  if (!text) throw new Error("Missing text for SFX");

  const payload = { text };
  if (body.duration_seconds) {
    payload.duration_seconds = Math.min(Math.max(body.duration_seconds, 0.5), 30);
  }

  const response = await fetch(
    "https://api.elevenlabs.io/v1/sound-generation",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText);
    throw new Error(`ElevenLabs SFX failed (${response.status}): ${err}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return {
    status: "completed",
    audio_base64: base64,
    format: "mp3",
  };
}

async function handleMusic(body) {
  const prompt = body.prompt || body.text;
  if (!prompt) throw new Error("Missing prompt for music generation");

  const duration = body.duration_seconds || 30;

  const result = await fal.subscribe("CassetteAI/music-generator", {
    input: {
      prompt,
      duration: Math.min(Math.max(duration, 5), 180),
    },
  });

  const audioUrl =
    result?.data?.audio_file?.url ||
    result?.data?.audio_url ||
    result?.data?.url ||
    null;

  if (!audioUrl) {
    throw new Error("Music generation returned no audio URL");
  }

  return {
    status: "completed",
    audio_url: audioUrl,
    format: "wav",
    model: "cassetteai-music",
    duration,
  };
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method === "GET") {
    return json(res, 200, {
      service: "audiomind-proxy",
      version: "1.0.0",
      status: "ok",
      actions: ["tts", "sfx", "music"],
    });
  }

  if (req.method !== "POST") {
    return errorResponse(res, 405, "Method not allowed");
  }

  if (!authenticateRequest(req)) {
    return errorResponse(res, 401, "Invalid or missing API key");
  }

  const body = req.body;
  if (!body || (!body.text && !body.prompt)) {
    return errorResponse(res, 400, "Missing text or prompt in request body");
  }

  const action = inferAction(body);

  try {
    let result;

    switch (action) {
      case "tts":
        if (!ELEVENLABS_API_KEY) {
          return errorResponse(res, 503, "ElevenLabs API key not configured on server");
        }
        result = await handleTTS(body);
        break;

      case "sfx":
        if (!ELEVENLABS_API_KEY) {
          return errorResponse(res, 503, "ElevenLabs API key not configured on server");
        }
        result = await handleSFX(body);
        break;

      case "music":
        if (!FAL_KEY) {
          return errorResponse(res, 503, "fal.ai API key not configured on server");
        }
        result = await handleMusic(body);
        break;

      default:
        return errorResponse(res, 400, `Unknown action: ${action}. Supported: tts, sfx, music`);
    }

    return json(res, 200, result);
  } catch (err) {
    console.error(`[AudioMind] ${action} error:`, err.message);
    return errorResponse(res, 500, err.message);
  }
};
