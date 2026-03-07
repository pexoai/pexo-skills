/**
 * GET /api/status?jobId= — Optional async job status (for proxies that return jobId).
 * This proxy waits for completion and returns videoUrl directly, so jobId is never returned.
 * For custom proxies that do return jobId, implement status lookup here and return { status, videoUrl? }.
 */

function json(res, status, data) {
  res.setHeader("Content-Type", "application/json");
  res.status(status).json(data);
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });

  const jobId = (req.query?.jobId || req.query?.job_id || "").trim();
  if (!jobId) {
    return json(res, 400, {
      success: false,
      error: "Missing jobId",
      hint: "Use GET /api/status?jobId=your-job-id",
    });
  }

  // This proxy does not use async jobs; it waits for FAL/Grok/Seedance and returns videoUrl.
  // If you deploy a custom proxy that returns jobId, implement your status store lookup here.
  return json(res, 501, {
    success: false,
    error: "Async job status not implemented",
    message: "This proxy waits for completion and returns videoUrl directly. No jobId is issued.",
    jobId,
  });
};
