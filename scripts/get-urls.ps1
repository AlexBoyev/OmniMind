#Requires -Version 5.1
$ErrorActionPreference = "Continue"

function Write-Separator { Write-Host ("-" * 60) -ForegroundColor DarkGray }
function Write-Section([string]$Title) {
    Write-Separator
    Write-Host "  $Title" -ForegroundColor Cyan
    Write-Separator
}

Write-Host ""
Write-Host "  OmniMind -- Access Guide" -ForegroundColor Cyan
Write-Host ""

Write-Section "DOCKER COMPOSE (local dev)"
Write-Host "  Frontend:    " -NoNewline; Write-Host "http://localhost:3000" -ForegroundColor Green
Write-Host "  Backend API: " -NoNewline; Write-Host "http://localhost:8001/docs" -ForegroundColor Green
Write-Host "  pgAdmin:     " -NoNewline; Write-Host "http://localhost:5050" -ForegroundColor Green
Write-Host "  Mailpit:     " -NoNewline; Write-Host "http://localhost:8025" -ForegroundColor Green
Write-Host ""

$minikubeRunning = $false
try {
    $null = & minikube status 2>&1
    if ($LASTEXITCODE -eq 0) { $minikubeRunning = $true }
} catch {}

if (-not $minikubeRunning) {
    Write-Host "  [!] Minikube is not running." -ForegroundColor Yellow
    Write-Host "      Start: minikube start --cpus=4 --memory=8192 --driver=docker" -ForegroundColor Yellow
    Write-Host ""
} else {
    $minikubeIP = (& minikube ip 2>&1) | Where-Object { $_ -match '^\d+\.\d+\.\d+\.\d+$' } | Select-Object -First 1

    Write-Section "KUBERNETES / MINIKUBE"
    Write-Host "  Frontend:    " -NoNewline; Write-Host "http://omnimind.local" -ForegroundColor Green
    if ($minikubeIP) {
        Write-Host "  hosts entry: $minikubeIP omnimind.local" -ForegroundColor Yellow
        Write-Host "  (Add to C:\Windows\System32\drivers\etc\hosts as Administrator)"
    }
    Write-Host ""

    Write-Section "KUBERNETES SERVICE STATUS"
    $services = @(
        [pscustomobject]@{Name="Jenkins";    Port=32000},
        [pscustomobject]@{Name="ArgoCD";     Port=32001},
        [pscustomobject]@{Name="Grafana";    Port=32002},
        [pscustomobject]@{Name="Prometheus"; Port=32003}
    )

    foreach ($svc in $services) {
        try {
            $null = Invoke-WebRequest -Uri "http://localhost:$($svc.Port)" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
            Write-Host ("  {0,-12} [UP]  http://localhost:{1}" -f $svc.Name, $svc.Port) -ForegroundColor Green
        } catch {
            Write-Host ("  {0,-12} [DOWN] run: scripts\setup-port-forwards.ps1" -f $svc.Name) -ForegroundColor Red
        }
    }
    Write-Host ""

    Write-Section "CREDENTIALS"
    Write-Host "  App Admin:   admin@omnimind.local / AdminPass123!"
    Write-Host "  App User:    user@omnimind.local  / UserPass123!"

    try {
        $enc = (& kubectl get secret jenkins -n jenkins -o "jsonpath={.data.jenkins-admin-password}" 2>&1)
        if ($enc -and $enc -notmatch 'Error') {
            $jPass = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($enc.Trim()))
            Write-Host "  Jenkins:     admin / $jPass"
        }
    } catch {}

    try {
        $enc = (& kubectl -n argocd get secret argocd-initial-admin-secret -o "jsonpath={.data.password}" 2>&1)
        if ($enc -and $enc -notmatch 'Error') {
            $aPass = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($enc.Trim()))
            Write-Host "  ArgoCD:      admin / $aPass"
        }
    } catch {}

    Write-Host "  Grafana:     admin / changeme_grafana"
    Write-Host "  pgAdmin:     admin@omnimind.local / pgadmin_password"
    Write-Host ""
}

Write-Section "ADMIN PAGES (login as admin first)"
Write-Host "  /dashboard       -- main page"
Write-Host "  /admin/overview  -- infrastructure status"
Write-Host "  /admin/users     -- user management"
Write-Host "  /admin/audit-log -- audit events"
Write-Host "  /admin/env       -- environment variables"
Write-Host "  /jarvis          -- AI chat"
Write-Host ""
Write-Separator
exit 0
