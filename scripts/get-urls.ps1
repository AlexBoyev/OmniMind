$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              OmniMind — Access Guide                    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "┌─────────────────────────────────────────────────────────┐" -ForegroundColor DarkGray
Write-Host "│  DOCKER COMPOSE (local dev)                             │" -ForegroundColor DarkGray
Write-Host "├─────────────────────────────────────────────────────────┤" -ForegroundColor DarkGray
Write-Host "│  Frontend:    " -NoNewline -ForegroundColor DarkGray; Write-Host "http://localhost:3000" -ForegroundColor Green
Write-Host "│  Backend API: " -NoNewline -ForegroundColor DarkGray; Write-Host "http://localhost:8001/docs" -ForegroundColor Green
Write-Host "│  pgAdmin:     " -NoNewline -ForegroundColor DarkGray; Write-Host "http://localhost:5050" -ForegroundColor Green
Write-Host "│  Mailpit:     " -NoNewline -ForegroundColor DarkGray; Write-Host "http://localhost:8025" -ForegroundColor Green
Write-Host "└─────────────────────────────────────────────────────────┘" -ForegroundColor DarkGray
Write-Host ""

$minikubeRunning = $false
try {
    $status = & minikube status 2>&1
    $minikubeRunning = $LASTEXITCODE -eq 0
} catch {}

if (-not $minikubeRunning) {
    Write-Host "⚠️  Minikube is not running." -ForegroundColor Yellow
    Write-Host "   Start: minikube start --cpus=4 --memory=8192 --driver=docker" -ForegroundColor Yellow
} else {
    $minikubeIP = & minikube ip 2>&1
    Write-Host "┌─────────────────────────────────────────────────────────┐" -ForegroundColor DarkGray
    Write-Host "│  KUBERNETES / MINIKUBE                                  │" -ForegroundColor DarkGray
    Write-Host "├─────────────────────────────────────────────────────────┤" -ForegroundColor DarkGray
    Write-Host "│  Frontend:    http://omnimind.local" -ForegroundColor Green
    Write-Host "│  hosts file:  $minikubeIP omnimind.local" -ForegroundColor Yellow
    Write-Host "│"

    # Check port-forwards
    $services = @(
        @{name="Jenkins";    port=32000},
        @{name="ArgoCD";     port=32001},
        @{name="Grafana";    port=32002},
        @{name="Prometheus"; port=32003}
    )

    foreach ($svc in $services) {
        try {
            $resp = Invoke-WebRequest -Uri "http://localhost:$($svc.port)" -TimeoutSec 2 -ErrorAction Stop
            Write-Host "│  $($svc.name): " -NoNewline; Write-Host "✅ http://localhost:$($svc.port)" -ForegroundColor Green
        } catch {
            Write-Host "│  $($svc.name): " -NoNewline; Write-Host "❌ offline — run: .\scripts\setup-port-forwards.ps1" -ForegroundColor Red
        }
    }

    Write-Host "└─────────────────────────────────────────────────────────┘" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "┌─────────────────────────────────────────────────────────┐" -ForegroundColor DarkGray
    Write-Host "│  CREDENTIALS                                            │" -ForegroundColor DarkGray
    Write-Host "├─────────────────────────────────────────────────────────┤" -ForegroundColor DarkGray
    Write-Host "│  App Admin:  admin@omnimind.local / AdminPass123!       │"
    Write-Host "│  App User:   user@omnimind.local  / UserPass123!        │"

    try {
        $enc = & kubectl get secret jenkins -n jenkins -o jsonpath="{.data.jenkins-admin-password}" 2>&1
        $jPass = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($enc))
        Write-Host "│  Jenkins:    admin / $jPass"
    } catch { Write-Host "│  Jenkins:    admin / (run get-urls.sh for password)" }

    try {
        $enc = & kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" 2>&1
        $aPass = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($enc))
        Write-Host "│  ArgoCD:     admin / $aPass"
    } catch { Write-Host "│  ArgoCD:     admin / (check secret)" }

    Write-Host "│  Grafana:    admin / changeme_grafana                   │"
    Write-Host "│  pgAdmin:    admin@omnimind.local / pgadmin_password    │"
    Write-Host "└─────────────────────────────────────────────────────────┘" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "  Admin pages: /admin/overview  /admin/users  /admin/audit-log  /admin/env" -ForegroundColor Cyan
Write-Host "  AI Chat:     /jarvis" -ForegroundColor Cyan
Write-Host ""
