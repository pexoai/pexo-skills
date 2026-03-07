/**
 * Minimal local HTTP server for testing the proxy handlers.
 * No extra deps — uses Node.js built-in http module.
 * Wraps Vercel-style handlers (req.body, res.status().json()) into real HTTP.
 * Usage: node scripts/local-server.cjs [port]
 */

const http = require("http");
const path = require("path");

const PORT = parseInt(process.argv[2] || "3777", 10);
const proxyDir = path.join(__dirname, "../proxy");

// Load handlers (CommonJS)
const generateHandler = require(path.join(proxyDir, "api/generate.js"));
const tokenHandler    = require(path.join(proxyDir, "api/token.js"));
const statusHandler   = require(path.join(proxyDir, "api/status.js"));

// Adapt Node http IncomingMessage → Express-style req
async function adaptReq(nodeReq) {
  return new Promise((resolve, reject) => {
    let body = "";
    nodeReq.on("data", (c) => (body += c));
    nodeReq.on("end", () => {
      const url = new URL(nodeReq.url, `http://localhost:${PORT}`);
      const query = Object.fromEntries(url.searchParams.entries());
      let parsed = {};
      if (body) {
        try { parsed = JSON.parse(body); } catch {}
      }
      resolve({
        method: nodeReq.method,
        headers: nodeReq.headers,
        body: parsed,
        query,
        socket: { remoteAddress: nodeReq.socket?.remoteAddress || "127.0.0.1" },
      });
    });
    nodeReq.on("error", reject);
  });
}

// Adapt Express-style res → Node http ServerResponse
function adaptRes(nodeRes) {
  const res = {
    _status: 200,
    setHeader: (k, v) => nodeRes.setHeader(k, v),
    status: function(s) { res._status = s; return res; },
    json: function(data) {
      const body = JSON.stringify(data);
      nodeRes.writeHead(res._status, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) });
      nodeRes.end(body);
      return res;
    },
    end: function() { nodeRes.writeHead(res._status); nodeRes.end(); return res; },
  };
  return res;
}

const server = http.createServer(async (nodeReq, nodeRes) => {
  const req = await adaptReq(nodeReq);
  const res = adaptRes(nodeRes);

  // CORS
  nodeRes.setHeader("Access-Control-Allow-Origin", "*");
  if (nodeReq.method === "OPTIONS") { nodeRes.writeHead(204); nodeRes.end(); return; }

  const pathname = new URL(nodeReq.url, `http://localhost:${PORT}`).pathname;

  if (pathname === "/api/generate") return generateHandler(req, res);
  if (pathname === "/api/token")    return tokenHandler(req, res);
  if (pathname === "/api/status")   return statusHandler(req, res);

  nodeRes.writeHead(404, { "Content-Type": "application/json" });
  nodeRes.end(JSON.stringify({ error: "Not found", path: pathname }));
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[local-server] listening on http://127.0.0.1:${PORT}`);
  console.log(`[local-server] FAL_KEY: ${process.env.FAL_KEY ? "set (" + process.env.FAL_KEY.slice(0, 8) + "...)" : "NOT SET"}`);
  console.log("[local-server] ready");
});

server.on("error", (e) => {
  console.error("[local-server] error:", e.message);
  process.exit(1);
});
