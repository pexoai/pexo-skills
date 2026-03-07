# Video Studio Proxy

Vercel serverless proxy for videoagent-video-studio. All video generation routes through this proxy, so users never need API keys.

## Deploy

```bash
npm install -g vercel
cd proxy
vercel deploy --prod
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FAL_KEY` | **Yes** | Video generation API key |
| `VALID_TOKENS` | No | Comma-separated long-lived tokens. If set, free-tier rate limiting does not apply. |
| `FREE_LIMIT_PER_IP` | No | Max free generations per token (default: 100). 0 = unlimited. |
| `MAX_TOKENS_PER_IP_PER_DAY` | No | Max tokens an IP can issue per day (default: 3). |
| `STATS_KEY` | No | Bearer token required to access `GET /api/stats`. Leave empty for open access. |
| `UPSTASH_REDIS_REST_URL` | For production | Upstash Redis REST URL (auto-injected by Vercel integration). |
| `UPSTASH_REDIS_REST_TOKEN` | For production | Upstash Redis REST token (auto-injected by Vercel integration). |

## Production: Persistent Storage with Upstash Redis

Without Redis, usage data lives in memory and resets on cold starts — fine for testing, not for production.

**Set up in 2 minutes via Vercel:**

1. Vercel dashboard → your proxy project → **Integrations** tab → search **Upstash Redis** → **Add**
2. Create a Redis database and link it to your project
3. Vercel automatically injects `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
4. Redeploy — done

**Or use any Upstash Redis instance directly:**
```bash
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
```

With Redis enabled:
- Rate limits work correctly across all serverless instances
- Usage data survives cold starts and redeployments
- `/api/stats` returns accurate lifetime totals

## API Endpoints

### `GET /api/generate`
Health check. Returns service info, model list, and free-tier config.

### `POST /api/token`
Issue a free-tier token for anonymous users.
```json
// Response
{ "token": "vs_...", "free_limit": 100, "free_limit_reset": "daily", "max_tokens_per_day": 3 }
```
Returns **429** when the IP has exceeded its daily token limit.

### `POST /api/generate`
Generate a video.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "mode": "text-to-video",
  "prompt": "A cat walking in the rain, cinematic",
  "model": "kling",
  "duration": 5,
  "aspectRatio": "16:9",
  "imageUrl": "https://..."
}
```

**Response:**
```json
{ "success": true, "videoUrl": "https://...", "mode": "text-to-video", "model": "kling", "duration": 5 }
```

Returns **401** if token is missing or invalid, **429** if generation limit reached, **503** if API key not configured.

### `GET /api/stats`
Real-time usage statistics. Requires `Authorization: Bearer <STATS_KEY>` if `STATS_KEY` env is set.

**JSON response** (default):
```json
{
  "using_kv": true,
  "total_generations": 142,
  "total_errors": 3,
  "total_tokens_issued": 48,
  "rate_limit_hits": { "token": 7, "ip": 2 },
  "by_model": { "kling": 55, "minimax": 32, "veo": 28, "seedance": 18, "grok": 9 },
  "by_mode":  { "text-to-video": 98, "image-to-video": 44 },
  "daily": [
    { "date": "2026-02-22", "total": 8 },
    { "date": "2026-02-23", "total": 14 }
  ],
  "timestamp": "2026-03-07T10:00:00.000Z"
}
```

**HTML dashboard** — open in browser or append `?ui=1`:
```
https://your-proxy.vercel.app/api/stats?ui=1
```
Shows total generations, errors, tokens issued, rate-limit hits, per-model bar chart, and a 14-day daily trend — no extra tooling needed.

### `GET /api/status?jobId=`
Async job status placeholder. Returns 501 — this proxy waits for completion and returns `videoUrl` directly.

## Local Dev

```bash
cd proxy && npm install
FAL_KEY=your_key node ../scripts/local-server.cjs 3777

# In another terminal:
export VIDEO_STUDIO_PROXY_URL=http://localhost:3777
node tools/generate.js --prompt "A cat walking in the rain" --model kling
```
