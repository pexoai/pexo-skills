# Quick test for tools/generate.js. Set VIDEO_STUDIO_PROXY_URL to your proxy (e.g. http://localhost:3000).
$ErrorActionPreference = "Continue"
$SkillDir = Split-Path $PSScriptRoot -Parent
Set-Location $SkillDir

Write-Host "=== Test 1: missing --prompt (expect error) ==="
node tools/generate.js --mode text-to-video 2>&1

Write-Host ""
Write-Host "=== Test 2: text-to-video (fails if proxy unreachable) ==="
node tools/generate.js --mode text-to-video --prompt "A cat walking in the rain" --duration 5 2>&1

Write-Host ""
Write-Host "=== Test 3: image-to-video missing --image-url (expect error) ==="
node tools/generate.js --mode image-to-video --prompt "Gentle motion" 2>&1

Write-Host ""
Write-Host "=== Test 4: list-models (GET proxy; may fail if proxy unreachable) ==="
node tools/generate.js --list-models 2>&1
