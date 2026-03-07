/**
 * /api/stats — Usage statistics for audiomind-proxy.
 *
 * Auth: query param ?key=STATS_KEY or header X-Stats-Key
 * HTML dashboard: ?ui=1 or browser Accept: text/html
 */

const { getStats } = require("../usage-store.js");

const STATS_KEY = process.env.STATS_KEY || "";

function authorized(req) {
  if (!STATS_KEY) return true;
  const k = req.headers["x-stats-key"] || req.query?.key || "";
  return k === STATS_KEY;
}

function wantHtml(req) {
  return req.query?.ui === "1" || (req.headers.accept || "").includes("text/html");
}

function renderDashboard(data, generatedAt) {
  const rows = Object.entries(data.byAction)
    .map(([action, s]) => `
      <tr>
        <td><strong>${action.toUpperCase()}</strong></td>
        <td>${s.generations.toLocaleString()}</td>
        <td>${s.errors.toLocaleString()}</td>
      </tr>`)
    .join("");

  const chartBars = data.daily
    .map((d) => {
      const max = Math.max(...data.daily.map((x) => x.generations), 1);
      const pct = Math.round((d.generations / max) * 100);
      const label = d.date.slice(5);
      return `<div class="bar-wrap" title="${d.date}: ${d.generations}">
        <div class="bar" style="height:${pct}%"></div>
        <div class="bar-label">${label}</div>
      </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AudioMind Proxy — Stats</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#0f172a;color:#e2e8f0;padding:2rem}
  h1{font-size:1.5rem;font-weight:700;margin-bottom:1.5rem;color:#f8fafc}
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-bottom:2rem}
  .card{background:#1e293b;border-radius:12px;padding:1.2rem;text-align:center}
  .card .val{font-size:2rem;font-weight:700;color:#38bdf8}
  .card .lbl{font-size:0.75rem;color:#94a3b8;margin-top:.3rem}
  table{width:100%;border-collapse:collapse;background:#1e293b;border-radius:12px;overflow:hidden;margin-bottom:2rem}
  th{background:#0f172a;padding:.7rem 1rem;text-align:left;font-size:.8rem;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em}
  td{padding:.7rem 1rem;border-top:1px solid #334155;font-size:.9rem}
  .chart{background:#1e293b;border-radius:12px;padding:1.5rem;height:200px;display:flex;align-items:flex-end;gap:2px;overflow-x:auto}
  .bar-wrap{flex:1;min-width:20px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%}
  .bar{width:100%;background:#38bdf8;border-radius:3px 3px 0 0;min-height:2px;transition:height .3s}
  .bar-label{font-size:.55rem;color:#64748b;margin-top:4px;transform:rotate(-45deg);transform-origin:top left}
  .ts{color:#475569;font-size:.75rem;margin-top:1.5rem}
</style>
</head>
<body>
<h1>AudioMind Proxy — Usage Dashboard</h1>
<div class="cards">
  <div class="card"><div class="val">${data.total.generations.toLocaleString()}</div><div class="lbl">Total Generations</div></div>
  <div class="card"><div class="val">${data.total.errors.toLocaleString()}</div><div class="lbl">Errors</div></div>
  <div class="card"><div class="val">${data.total.rateLimits.toLocaleString()}</div><div class="lbl">Auth Rejections</div></div>
</div>
<table>
  <thead><tr><th>Action</th><th>Generations</th><th>Errors</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="chart">${chartBars}</div>
<p class="ts">Generated at ${generatedAt}</p>
</body>
</html>`;
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(204).end();

  if (!authorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const data = await getStats(30);
  const generatedAt = new Date().toISOString();

  if (wantHtml(req)) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(renderDashboard(data, generatedAt));
  }

  res.setHeader("Content-Type", "application/json");
  return res.status(200).json({ ...data, generated_at: generatedAt });
};
