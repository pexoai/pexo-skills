# ============================================================
# video-studio API test script (PowerShell, no node required)
# Usage:
#   Test against the backend API directly:
#     $env:FAL_KEY = "your-api-key"; .\test-api.ps1
#   Test via local or deployed proxy:
#     $env:FAL_KEY = "your-api-key"; $env:VIDEO_STUDIO_PROXY_URL = "http://localhost:3000"; .\test-api.ps1
# ============================================================

param(
  [string]$FalKey     = $env:FAL_KEY,
  [string]$ProxyUrl   = $env:VIDEO_STUDIO_PROXY_URL,
  [string]$TestMode   = "all"   # all | fal | proxy
)

$ErrorActionPreference = "Continue"

# helpers
function Write-Header($msg) { Write-Host "`n===[ $msg ]===" -ForegroundColor Cyan }
function Write-Ok($msg)     { Write-Host "[OK] $msg"   -ForegroundColor Green }
function Write-Fail($msg)   { Write-Host "[FAIL] $msg" -ForegroundColor Red }
function Write-Info($msg)   { Write-Host "     $msg"   -ForegroundColor Gray }

function Invoke-Json {
  param([string]$Uri, [string]$Method = "GET", $Body = $null, $Headers = @{})
  try {
    $params = @{ Uri = $Uri; Method = $Method; Headers = $Headers; ErrorAction = "Stop" }
    if ($Body) {
      $params.ContentType = "application/json"
      $params.Body        = ($Body | ConvertTo-Json -Depth 10)
    }
    $resp = Invoke-RestMethod @params
    return @{ ok = $true; data = $resp }
  } catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $detail     = $_.ErrorDetails.Message
    return @{ ok = $false; status = $statusCode; error = $_.Exception.Message; detail = $detail }
  }
}

# ============================================================
# 1. Direct backend API tests (no proxy)
# ============================================================
function Test-FalDirect {
  Write-Header "Direct API Tests"
  if (-not $FalKey) { Write-Fail "API key not set, skipping"; return }

  $falHeaders = @{ Authorization = "Key $FalKey" }

  # 1-A. minimax text-to-video
  Write-Info "1-A: minimax text-to-video (submit)"
  $r = Invoke-Json `
    -Uri "https://queue.fal.run/fal-ai/minimax/video-01" `
    -Method POST `
    -Headers $falHeaders `
    -Body @{ prompt = "A cat walking in the rain, cinematic, 4K" }
  if ($r.ok) {
    Write-Ok "minimax T2V submitted, request_id=$($r.data.request_id)"
    $Script:minimaxReqId = $r.data.request_id
  } else {
    Write-Fail "minimax T2V failed status=$($r.status): $($r.detail)"
  }

  # 1-B. kling text-to-video
  Write-Info "1-B: kling text-to-video (submit)"
  $r = Invoke-Json `
    -Uri "https://queue.fal.run/fal-ai/kling-video/v3/standard/text-to-video" `
    -Method POST `
    -Headers $falHeaders `
    -Body @{ prompt = "Ocean waves at sunset, slow motion"; aspect_ratio = "16:9" }
  if ($r.ok) {
    Write-Ok "kling T2V submitted, request_id=$($r.data.request_id)"
  } else {
    Write-Fail "kling T2V failed status=$($r.status): $($r.detail)"
  }

  # 1-C. seedance 1.5 pro text-to-video
  Write-Info "1-C: seedance 1.5 pro text-to-video (submit)"
  $r = Invoke-Json `
    -Uri "https://queue.fal.run/fal-ai/bytedance/seedance/v1.5/pro/text-to-video" `
    -Method POST `
    -Headers $falHeaders `
    -Body @{ prompt = "A dog running in a park, sunny day"; duration = "5"; resolution = "720p"; generate_audio = $true }
  if ($r.ok) {
    Write-Ok "seedance 1.5 T2V submitted, request_id=$($r.data.request_id)"
  } else {
    Write-Fail "seedance 1.5 T2V failed status=$($r.status): $($r.detail)"
  }

  # 1-D. veo 3.1 reference-to-video (multiple reference images)
  Write-Info "1-D: veo 3.1 reference-to-video (submit)"
  $r = Invoke-Json `
    -Uri "https://queue.fal.run/fal-ai/veo3.1/reference-to-video" `
    -Method POST `
    -Headers $falHeaders `
    -Body @{
      prompt = "A person walking through a sunlit park"
      image_urls = @("https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png")
      aspect_ratio = "16:9"
      duration = "8s"
    }
  if ($r.ok) {
    Write-Ok "veo reference-to-video submitted, request_id=$($r.data.request_id)"
  } else {
    Write-Fail "veo reference-to-video failed status=$($r.status): $($r.detail)"
  }

  # 1-E. hunyuan video-to-video (reference video)
  Write-Info "1-E: hunyuan video-to-video (submit)"
  $r = Invoke-Json `
    -Uri "https://queue.fal.run/fal-ai/hunyuan-video/video-to-video" `
    -Method POST `
    -Headers $falHeaders `
    -Body @{
      prompt = "Same scene but at night with neon lights"
      video_url = "https://storage.googleapis.com/falserverless/hunyuan_video/hunyuan_v2v_input.mp4"
      aspect_ratio = "16:9"
      strength = 0.85
    }
  if ($r.ok) {
    Write-Ok "hunyuan video-to-video submitted, request_id=$($r.data.request_id)"
  } else {
    Write-Fail "hunyuan video-to-video failed status=$($r.status): $($r.detail)"
  }

  # 1-F. grok text-to-video
  Write-Info "1-F: grok text-to-video (submit)"
  $r = Invoke-Json `
    -Uri "https://queue.fal.run/xai/grok-imagine-video/text-to-video" `
    -Method POST `
    -Headers $falHeaders `
    -Body @{ prompt = "A futuristic city at night with flying cars"; duration = 5; aspect_ratio = "16:9"; resolution = "720p" }
  if ($r.ok) {
    Write-Ok "grok T2V submitted, request_id=$($r.data.request_id)"
  } else {
    Write-Fail "grok T2V failed status=$($r.status): $($r.detail)"
  }

  # 1-G. Poll minimax job status (from 1-A)
  if ($Script:minimaxReqId) {
    Write-Info "1-G: check minimax job status (request_id=$($Script:minimaxReqId))"
    $r = Invoke-Json `
      -Uri "https://queue.fal.run/fal-ai/minimax/video-01/requests/$($Script:minimaxReqId)/status" `
      -Headers $falHeaders
    if ($r.ok) {
      Write-Ok "Queue status: $($r.data.status)"
    } else {
      Write-Fail "Status check failed: $($r.detail)"
    }
  }
}

# ============================================================
# 2. Proxy tests (full free-tier flow + generation)
# ============================================================
function Test-Proxy {
  Write-Header "Proxy Tests"
  if (-not $ProxyUrl) { Write-Fail "VIDEO_STUDIO_PROXY_URL not set, skipping"; return }

  # 2-A. GET /api/generate (health check)
  Write-Info "2-A: GET $ProxyUrl/api/generate"
  $r = Invoke-Json -Uri "$ProxyUrl/api/generate"
  if ($r.ok) {
    Write-Ok "Proxy online: service=$($r.data.service) version=$($r.data.version)"
    Write-Info "    models: $(($r.data.models | ForEach-Object { $_.id }) -join ', ')"
    Write-Info "    free_limit_per_token=$($r.data.free_limit_per_token)"
  } else {
    Write-Fail "Proxy unreachable: $($r.error)"; return
  }

  # 2-B. POST /api/token (get free-tier token)
  Write-Info "2-B: POST $ProxyUrl/api/token"
  $r = Invoke-Json -Uri "$ProxyUrl/api/token" -Method POST
  if ($r.ok) {
    $proxyToken = $r.data.token
    Write-Ok "Token issued: $proxyToken (free_limit=$($r.data.free_limit))"
  } else {
    Write-Fail "Token failed status=$($r.status): $($r.detail)"; return
  }

  $genHeaders = @{ Authorization = "Bearer $proxyToken" }

  # 2-C. Missing prompt should return 400
  Write-Info "2-C: Missing prompt (expect 400)"
  $r = Invoke-Json -Uri "$ProxyUrl/api/generate" -Method POST -Headers $genHeaders `
    -Body @{ mode = "text-to-video" }
  if (-not $r.ok -and $r.status -eq 400) {
    Write-Ok "Correct 400: $($r.detail)"
  } else {
    Write-Fail "Expected 400, got status=$($r.status)"
  }

  # 2-D. Invalid model should return 400
  Write-Info "2-D: Unknown model (expect 400)"
  $r = Invoke-Json -Uri "$ProxyUrl/api/generate" -Method POST -Headers $genHeaders `
    -Body @{ mode = "text-to-video"; prompt = "test"; model = "nonexistent" }
  if (-not $r.ok -and $r.status -eq 400) {
    Write-Ok "Correct 400: $($r.detail)"
  } else {
    Write-Fail "Expected 400, got status=$($r.status) $($r.detail)"
  }

  # 2-E. Real generation — minimax T2V (~30–60s)
  Write-Info "2-E: minimax text-to-video (real call, ~30-60s)"
  $r = Invoke-Json -Uri "$ProxyUrl/api/generate" -Method POST -Headers $genHeaders `
    -Body @{ mode = "text-to-video"; prompt = "A cat walking in the rain, cinematic"; model = "minimax"; duration = 5 }
  if ($r.ok -and $r.data.videoUrl) {
    Write-Ok "minimax T2V succeeded!"
    Write-Info "    videoUrl: $($r.data.videoUrl)"
  } elseif ($r.ok -and $r.data.jobId) {
    Write-Ok "minimax async, jobId=$($r.data.jobId) status=$($r.data.status)"
  } else {
    Write-Fail "minimax failed status=$($r.status): $($r.detail)"
  }

  # 2-F. Real generation — seedance 1.5 T2V
  Write-Info "2-F: seedance 1.5 text-to-video (real call)"
  $r = Invoke-Json -Uri "$ProxyUrl/api/generate" -Method POST -Headers $genHeaders `
    -Body @{ mode = "text-to-video"; prompt = "A dog playing fetch on a sunny beach"; model = "seedance"; duration = 5 }
  if ($r.ok -and $r.data.videoUrl) {
    Write-Ok "seedance 1.5 succeeded!"
    Write-Info "    videoUrl: $($r.data.videoUrl)"
  } elseif ($r.ok -and $r.data.jobId) {
    Write-Ok "seedance 1.5 async, jobId=$($r.data.jobId)"
  } else {
    Write-Fail "seedance 1.5 failed status=$($r.status): $($r.detail)"
  }

  # 2-G. Rate limit test — try to exceed daily token issuance limit
  Write-Info "2-G: Token issuance rate limit test (up to 10 attempts)"
  $hit429 = $false
  for ($i = 0; $i -lt 10; $i++) {
    $r = Invoke-Json -Uri "$ProxyUrl/api/token" -Method POST
    if (-not $r.ok -and $r.status -eq 429) { $hit429 = $true; break }
  }
  if ($hit429) {
    Write-Ok "Correct 429 — daily token limit reached"
  } else {
    Write-Info "429 not triggered (limit higher than 10, or in-memory store not yet reset)"
  }
}

# ============================================================
# 3. Run
# ============================================================
Write-Host "`n🎬 video-studio API Tests" -ForegroundColor Yellow
Write-Host "  API Key:   $(if ($FalKey) { 'set (' + $FalKey.Substring(0, [Math]::Min(8, $FalKey.Length)) + '...)' } else { 'not set' })"
Write-Host "  ProxyUrl:  $(if ($ProxyUrl) { $ProxyUrl } else { 'not set' })"
Write-Host "  TestMode:  $TestMode"

if ($TestMode -eq "all" -or $TestMode -eq "fal")   { Test-FalDirect }
if ($TestMode -eq "all" -or $TestMode -eq "proxy")  { Test-Proxy }

Write-Host "`n✅ Tests complete" -ForegroundColor Yellow
