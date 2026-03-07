/**
 * Video model registry: id -> { provider, endpoints, env key }.
 * Used by api/generate.js to route and build requests.
 */

const FAL = "fal";

// Maps a duration (seconds) to Veo's accepted discrete values.
function dur4s6s8s(sec) {
  const n = parseInt(sec, 10) || 5;
  if (n <= 4) return "4s";
  if (n <= 6) return "6s";
  return "8s";
}

// Categories: t2v = text-to-video, i2v = image-to-video, ref = reference-based
const MODELS = {
  minimax: {
    provider: FAL,
    name: "MiniMax Video 01",
    categories: ["t2v", "i2v", "ref"],
    t2v: "fal-ai/minimax/video-01",
    i2v: "fal-ai/minimax/video-01-live/image-to-video",
    // Subject reference: one reference image for character consistency
    referenceToVideo: "fal-ai/minimax/video-01-subject-reference",
    env: "FAL_KEY",
    falInput: (body, mode) => ({
      prompt: body.prompt.trim(),
      ...(mode === "image-to-video" && body.imageUrl && { image_url: body.imageUrl }),
      output_format: "url",
    }),
    refInput: (body) => ({
      prompt: body.prompt.trim(),
      subject_reference_image_url: body.imageUrl || body.referenceUrl,
    }),
  },

  // Kling uses v3 for T2V/I2V and a separate O3 endpoint for reference-based generation.
  kling: {
    provider: FAL,
    name: "Kling 3.0",
    categories: ["t2v", "i2v", "ref"],
    t2v: "fal-ai/kling-video/v3/standard/text-to-video",
    i2v: "fal-ai/kling-video/v3/standard/image-to-video",
    referenceToVideo: "fal-ai/kling-video/o3/standard/reference-to-video",
    env: "FAL_KEY",
    falInput: (body, mode) => ({
      prompt: body.prompt.trim(),
      aspect_ratio: body.aspectRatio || "16:9",
      ...(mode === "image-to-video" && { image_url: body.imageUrl.trim() }),
      output_format: "url",
    }),
    // Reference input: start/end keyframes, multi-image, or character elements
    refInput: (body) => ({
      prompt: body.prompt.trim(),
      aspect_ratio: body.aspectRatio || "16:9",
      duration: String(Math.min(15, Math.max(3, parseInt(body.duration, 10) || 5))),
      ...(body.imageUrl && { start_image_url: body.imageUrl }),
      ...(body.endImageUrl && { end_image_url: body.endImageUrl }),
      ...(body.imageUrls && { image_urls: body.imageUrls }),
      ...(body.elements && { elements: body.elements }),
    }),
  },

  veo: {
    provider: FAL,
    name: "Google Veo 3.1",
    categories: ["t2v", "i2v", "ref"],
    t2v: "fal-ai/veo3.1",
    i2v: "fal-ai/veo3.1/image-to-video",
    referenceToVideo: "fal-ai/veo3.1/reference-to-video",
    env: "FAL_KEY",
    falInput: (body, mode) => ({
      prompt: body.prompt.trim(),
      aspect_ratio: body.aspectRatio || "16:9",
      duration: dur4s6s8s(body.duration),
      ...(mode === "image-to-video" && body.imageUrl && { image_url: body.imageUrl }),
      output_format: "url",
    }),
    // veo3.1/reference-to-video only accepts duration "8s" (API constraint).
    refInput: (body) => ({
      prompt: body.prompt.trim(),
      aspect_ratio: body.aspectRatio || "16:9",
      duration: "8s",
      resolution: "720p",
      image_urls: body.imageUrls || (body.imageUrl ? [body.imageUrl] : []),
    }),
  },

  hunyuan: {
    provider: FAL,
    name: "Hunyuan Video",
    categories: ["t2v", "ref"],
    t2v: "fal-ai/hunyuan-video",
    // Reference: video-to-video style transfer via prompt (strength controls deviation)
    referenceToVideo: "fal-ai/hunyuan-video/video-to-video",
    env: "FAL_KEY",
    falInput: (body) => ({
      prompt: body.prompt.trim(),
      aspect_ratio: body.aspectRatio || "16:9",
      output_format: "url",
    }),
    refInput: (body) => ({
      prompt: body.prompt.trim(),
      video_url: body.videoUrl || body.referenceUrl,
      aspect_ratio: body.aspectRatio || "16:9",
      strength: body.strength ?? 0.85,
    }),
  },

  pixverse: {
    provider: FAL,
    name: "PixVerse v4.5",
    categories: ["i2v"],
    i2v: "fal-ai/pixverse/v4.5/image-to-video",
    env: "FAL_KEY",
    falInput: (body) => ({
      prompt: body.prompt.trim(),
      image_url: body.imageUrl.trim(),
      aspect_ratio: body.aspectRatio || "16:9",
      output_format: "url",
    }),
  },

  grok: {
    provider: FAL,
    name: "Grok Imagine Video",
    categories: ["t2v", "i2v", "ref"],
    t2v: "xai/grok-imagine-video/text-to-video",
    i2v: "xai/grok-imagine-video/image-to-video",
    // Reference: edit-video — apply prompt changes to a reference video (colorize, restyle, etc.)
    referenceToVideo: "xai/grok-imagine-video/edit-video",
    env: "FAL_KEY",
    falInput: (body, mode) => ({
      prompt: body.prompt.trim(),
      duration: Math.min(15, Math.max(1, parseInt(body.duration, 10) || 6)),
      aspect_ratio: body.aspectRatio || "16:9",
      resolution: "720p",
      ...(mode === "image-to-video" && body.imageUrl && { image_url: body.imageUrl }),
    }),
    refInput: (body) => ({
      prompt: body.prompt.trim(),
      video_url: body.videoUrl || body.referenceUrl,
    }),
  },

  // Seedance 1.5 Pro (ByteDance) — synchronized audio generation
  seedance: {
    provider: FAL,
    name: "Seedance 1.5 Pro",
    categories: ["t2v", "i2v", "ref"],
    t2v: "fal-ai/bytedance/seedance/v1.5/pro/text-to-video",
    i2v: "fal-ai/bytedance/seedance/v1.5/pro/image-to-video",
    env: "FAL_KEY",
    falInput: (body, mode) => ({
      prompt: body.prompt.trim(),
      aspect_ratio: body.aspectRatio || "16:9",
      resolution: "720p",
      duration: String(Math.min(12, Math.max(4, parseInt(body.duration, 10) || 5))),
      generate_audio: true,
      ...(mode === "image-to-video" && body.imageUrl && { image_url: body.imageUrl }),
    }),
  },
};

function getModel(id) {
  const key = (id || "").toLowerCase().replace(/\s+/g, "-");
  return MODELS[key] || null;
}

function listModels() {
  return Object.entries(MODELS).map(([id, m]) => ({
    id,
    name: m.name,
    provider: m.provider,
    categories: m.categories || (m.t2v && m.i2v ? ["t2v", "i2v"] : m.t2v ? ["t2v"] : ["i2v"]),
    t2v: !!m.t2v,
    i2v: !!m.i2v,
    ref: !!m.referenceToVideo,
    ...(m.referenceToVideo && { referenceToVideoEndpoint: m.referenceToVideo }),
  }));
}

function resolveModel(modelId, mode) {
  const m = getModel(modelId);
  if (!m) return null;
  if (mode === "text-to-video" && !m.t2v) return null;
  if (mode === "image-to-video" && !m.i2v) return null;
  return m;
}

module.exports = { MODELS, getModel, listModels, resolveModel, FAL };
