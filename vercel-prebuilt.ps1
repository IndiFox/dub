# Prebuilt deploy: build locally, then upload to Vercel (no build on Vercel).
# Run from repo root: .\vercel-prebuilt.ps1
# Requires: vercel CLI, enough RAM (~8GB free). First step can take 30+ min.

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# Token from apps/web/.env (optional; for private/team deploy)
$envLine = Get-Content "apps\web\.env" -ErrorAction SilentlyContinue | Where-Object { $_ -match '^AUTH_BEARER_TOKEN=' }
$token = if ($envLine) { ($envLine -replace 'AUTH_BEARER_TOKEN=', '').Trim() } else { $null }

# Windows: NODE_OPTIONS=... in buildCommand is Unix-only; set env here and use buildCommand without it for local build
$env:NODE_OPTIONS = "--max-old-space-size=5120"
$vercelJsonPath = "apps\web\vercel.json"
$vercelJson = Get-Content $vercelJsonPath -Raw
$buildCommandWithNodeOpts = "cd ../.. && NODE_OPTIONS=--max-old-space-size=5120 pnpm build --filter=web"
$buildCommandNoNodeOpts = "cd ../.. && pnpm build --filter=web"
try {
  (Get-Content $vercelJsonPath -Raw) -replace [regex]::Escape($buildCommandWithNodeOpts), $buildCommandNoNodeOpts | Set-Content $vercelJsonPath -NoNewline
  Write-Host "Step 1/2: vercel build (local; may take 30+ min, needs RAM)..." -ForegroundColor Cyan
  vercel build
  $buildExit = $LASTEXITCODE
} finally {
  (Get-Content $vercelJsonPath -Raw) -replace [regex]::Escape($buildCommandNoNodeOpts), $buildCommandWithNodeOpts | Set-Content $vercelJsonPath -NoNewline
}
if ($buildExit -ne 0) { exit $buildExit }

Write-Host "Step 2/2: vercel deploy --prebuilt --prod ..." -ForegroundColor Cyan
if ($token) {
  vercel deploy --prebuilt --prod --yes --token $token
} else {
  vercel deploy --prebuilt --prod --yes
}
exit $LASTEXITCODE
