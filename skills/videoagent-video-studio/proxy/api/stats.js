/**
 * GET /api/stats        — JSON usage statistics (default)
 * GET /api/stats?ui=1   — HTML dashboard (browser-friendly)
 *
 * Requires Authorization: Bearer <STATS_KEY> when STATS_KEY env is set.
 */

const STATS_KEY = process.env.STATS_KEY || "";
const { getStats, getDailyStats } = require("../usage-store.js");

function json(res, status, data) {
  res.setHeader("Content-Type", "application/json");
  res.status(status).json(data);
}

// ── HTML dashboard ────────────────────────────────────────────────────────────
function renderDashboard(stats, daily) {
  const { total_generations, total_errors, total_tokens_issued,
          rate_limit_hits, by_model, by_mode, using_kv } = stats;

  const now = new Date().toLocaleString("en-US", { timeZone: "UTC", hour12: false });
  const maxVal = Math.max(1, ...Object.values(by_model));

  const modelRows = Object.entries(by_model)
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => {
      const pct = Math.round((count / maxVal) * 100);
      return `
      <tr>
        <td class="label">${id}</td>
        <td class="bar-cell">
          <div class="bar-wrap">
            <div class="bar" style="width:${pct}%"></div>
          </div>
        </td>
        <td class="num">${count}</td>
      </tr>`;
    }).join("");

  const modeRows = Object.entries(by_mode).map(([mode, count]) => `
      <tr>
        <td class="label">${mode}</td>
        <td class="num">${count}</td>
      </tr>`).join("");

  const maxDay = Math.max(1, ...daily.map(d => d.total));
  const dayRows = daily.map(d => {
    const pct = Math.round((d.total / maxDay) * 100);
    return `
      <tr>
        <td class="label">${d.date}</td>
        <td class="bar-cell">
          <div class="bar-wrap">
            <div class="bar bar-day" style="width:${Math.max(pct, d.total > 0 ? 2 : 0)}%"></div>
          </div>
        </td>
        <td class="num">${d.total}</td>
      </tr>`;
  }).join("");

  const storageLabel = using_kv
    ? `<span class="badge green">Redis</span>`
    : `<span class="badge yellow">In-memory</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Video Studio — Usage Stats</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    background: #0d1117; color: #e6edf3; min-height: 100vh; padding: 32px 24px;
  }
  h1 { font-size: 1.3rem; font-weight: 600; letter-spacing: -.3px; }
  h2 { font-size: .85rem; font-weight: 600; text-transform: uppercase;
       letter-spacing: .08em; color: #7d8590; margin-bottom: 12px; }
  .header { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; }
  .header .meta { font-size: .8rem; color: #7d8590; margin-left: auto; }
  .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
           gap: 12px; margin-bottom: 32px; }
  .card { background: #161b22; border: 1px solid #30363d; border-radius: 8px;
          padding: 16px 18px; }
  .card .val { font-size: 2rem; font-weight: 700; line-height: 1; margin-bottom: 4px; }
  .card .lbl { font-size: .75rem; color: #7d8590; }
  .card.red .val   { color: #f85149; }
  .card.orange .val{ color: #e3b341; }
  .section { background: #161b22; border: 1px solid #30363d; border-radius: 8px;
             padding: 20px 22px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 6px 4px; font-size: .85rem; vertical-align: middle; }
  td.label { width: 140px; color: #c9d1d9; font-family: monospace; }
  td.num   { width: 60px; text-align: right; font-variant-numeric: tabular-nums; color: #58a6ff; font-weight: 600; }
  td.bar-cell { padding: 6px 8px; }
  .bar-wrap { background: #21262d; border-radius: 4px; height: 10px; overflow: hidden; }
  .bar      { height: 100%; background: #58a6ff; border-radius: 4px;
              transition: width .3s ease; }
  .bar-day  { background: #3fb950; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 12px;
           font-size: .7rem; font-weight: 600; }
  .badge.green  { background: #1a4731; color: #3fb950; }
  .badge.yellow { background: #3d2e00; color: #e3b341; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  @media (max-width: 600px) { .two-col { grid-template-columns: 1fr; } }
  .footer { font-size: .75rem; color: #484f58; margin-top: 24px; text-align: center; }
</style>
</head>
<body>

<div class="header">
  <h1>🎬 Video Studio — Usage</h1>
  <span class="meta">Storage: ${storageLabel} &nbsp;·&nbsp; ${now} UTC</span>
</div>

<div class="cards">
  <div class="card">
    <div class="val">${total_generations}</div>
    <div class="lbl">Total generations</div>
  </div>
  <div class="card red">
    <div class="val">${total_errors}</div>
    <div class="lbl">Errors</div>
  </div>
  <div class="card">
    <div class="val">${total_tokens_issued}</div>
    <div class="lbl">Tokens issued</div>
  </div>
  <div class="card orange">
    <div class="val">${(rate_limit_hits.token || 0) + (rate_limit_hits.ip || 0)}</div>
    <div class="lbl">Rate limit hits</div>
  </div>
</div>

<div class="section">
  <h2>Last 14 days</h2>
  <table>
    <tbody>${dayRows}</tbody>
  </table>
</div>

<div class="two-col">
  <div class="section">
    <h2>By model</h2>
    <table><tbody>${modelRows}</tbody></table>
  </div>
  <div class="section">
    <h2>By mode</h2>
    <table><tbody>${modeRows}</tbody></table>
    <br>
    <h2 style="margin-top:16px">Rate limits</h2>
    <table>
      <tr><td class="label">token quota</td><td class="num">${rate_limit_hits.token || 0}</td></tr>
      <tr><td class="label">IP daily cap</td><td class="num">${rate_limit_hits.ip || 0}</td></tr>
    </table>
  </div>
</div>

<div class="footer">Refresh to update &nbsp;·&nbsp; JSON: <code>/api/stats</code>
${STATS_KEY ? " &nbsp;·&nbsp; Protected by STATS_KEY" : ""}</div>
</body>
</html>`;
}

// ── Handler ───────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });

  if (STATS_KEY) {
    const bearer = req.headers.authorization || "";
    const token  = bearer.startsWith("Bearer ") ? bearer.slice(7).trim() : "";
    if (token !== STATS_KEY)
      return json(res, 401, { error: "Unauthorized. Set Authorization: Bearer <STATS_KEY>." });
  }

  try {
    const wantsHtml = (req.query && req.query.ui) ||
                      (req.headers.accept || "").includes("text/html");

    const [stats, daily] = await Promise.all([
      getStats(),
      getDailyStats(14),
    ]);

    if (wantsHtml) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(200).end(renderDashboard(stats, daily));
      return;
    }

    return json(res, 200, { ...stats, daily, timestamp: new Date().toISOString() });
  } catch (e) {
    return json(res, 500, { error: "Failed to fetch stats", detail: e.message });
  }
};
