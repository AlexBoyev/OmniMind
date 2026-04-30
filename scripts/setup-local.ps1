# =============================================================================
# OmniMind — Local development setup (PowerShell, idempotent)
# Usage: .\scripts\setup-local.ps1
# =============================================================================
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir   = Split-Path -Parent $ScriptDir
$EnvFile   = Join-Path $RootDir ".env"
$EnvExample = Join-Path $RootDir ".env.example"

function Log  { param($m) Write-Host "[setup] $m" -ForegroundColor Cyan }
function Ok   { param($m) Write-Host "[setup] OK $m" -ForegroundColor Green }
function Err  { param($m) Write-Host "[setup] ERROR $m" -ForegroundColor Red; exit 1 }

# ── 1. Docker running check ──────────────────────────────────────────────────
Log "Checking Docker..."
$dockerInfo = docker info 2>&1
if ($LASTEXITCODE -ne 0) { Err "Docker is not running. Start Docker Desktop first." }
Ok "Docker is running"

# ── 2. Ensure .env exists ────────────────────────────────────────────────────
if (-not (Test-Path $EnvFile)) {
    Log ".env not found — copying from .env.example"
    Copy-Item $EnvExample $EnvFile
    Ok ".env created from template"
} else {
    Ok ".env already exists"
}

# ── 3. Replace placeholder SECRET_KEY ───────────────────────────────────────
$placeholder = "REPLACE_WITH_OUTPUT_OF_openssl_rand_-hex_64"
$envContent = Get-Content $EnvFile -Raw
if ($envContent -match [regex]::Escape($placeholder)) {
    Log "Generating real SECRET_KEY..."
    $newKey = -join ((1..64) | ForEach-Object { "{0:x2}" -f (Get-Random -Maximum 256) })
    $envContent = $envContent -replace "SECRET_KEY=.*", "SECRET_KEY=$newKey"
    Set-Content -Path $EnvFile -Value $envContent -Encoding utf8
    Ok "SECRET_KEY generated"
}

# ── 4. Build and start the stack ─────────────────────────────────────────────
Log "Building and starting all services..."
Set-Location $RootDir
docker compose up --build -d
if ($LASTEXITCODE -ne 0) { Err "docker compose up failed." }
Ok "Stack started"

# ── 5. Wait for backend healthcheck ─────────────────────────────────────────
Log "Waiting for backend to become healthy (up to 120s)..."
$timeout = 120
$elapsed = 0
$healthy = $false
while ($elapsed -lt $timeout) {
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/health" -UseBasicParsing -TimeoutSec 3
        if ($resp.StatusCode -eq 200) { $healthy = $true; break }
    } catch {}
    Start-Sleep -Seconds 3
    $elapsed += 3
}
if (-not $healthy) { Err "Backend did not become healthy within ${timeout}s. Run: docker compose logs backend" }
Ok "Backend is healthy (${elapsed}s)"

# ── 6. Print success ──────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║           OmniMind is up and running!                    ║" -ForegroundColor Green
Write-Host "╠══════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  Frontend  →  http://localhost:3000                      ║" -ForegroundColor Green
Write-Host "║  Backend   →  http://localhost:8000/docs                 ║" -ForegroundColor Green
Write-Host "║  Nginx     →  http://localhost                           ║" -ForegroundColor Green
Write-Host "║  pgAdmin   →  http://localhost:5050                      ║" -ForegroundColor Green
Write-Host "║  Mailpit   →  http://localhost:8025                      ║" -ForegroundColor Green
Write-Host "╠══════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  Admin:  admin@omnimind.local / AdminPass123!            ║" -ForegroundColor Green
Write-Host "║  User:   user@omnimind.local  / UserPass123!             ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
