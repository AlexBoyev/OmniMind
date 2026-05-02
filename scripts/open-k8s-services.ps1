#Requires -Version 5.1
# Opens minikube service tunnels for all 4 Kubernetes services.
# Each tunnel runs in a separate PowerShell window.
# Usage: .\scripts\open-k8s-services.ps1

$ErrorActionPreference = "Stop"

function Write-Line { Write-Host ("-" * 60) -ForegroundColor DarkGray }

Write-Host ""
Write-Host "  OmniMind -- Kubernetes Service Tunnels" -ForegroundColor Cyan
Write-Line

# --- Check Minikube is running ---
Write-Host "  Checking Minikube status..." -ForegroundColor Gray
try {
    $null = & minikube status 2>&1
    if ($LASTEXITCODE -ne 0) { throw "not running" }
} catch {
    Write-Host ""
    Write-Host "  [!] Minikube is not running." -ForegroundColor Red
    Write-Host "      Start it first:" -ForegroundColor Yellow
    Write-Host "      minikube start --cpus=4 --memory=8192 --driver=docker" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "  Minikube is running. Opening service tunnels..." -ForegroundColor Green
Write-Host ""

# --- Define services ---
$services = @(
    [pscustomobject]@{ Name = "Jenkins";    Namespace = "jenkins";    SvcName = "jenkins" },
    [pscustomobject]@{ Name = "ArgoCD";     Namespace = "argocd";     SvcName = "argocd-server" },
    [pscustomobject]@{ Name = "Grafana";    Namespace = "monitoring";  SvcName = "kube-prometheus-stack-grafana" },
    [pscustomobject]@{ Name = "Prometheus"; Namespace = "monitoring";  SvcName = "kube-prometheus-stack-prometheus" }
)

# --- Open each service in a new window ---
foreach ($svc in $services) {
    $cmd = "minikube service $($svc.SvcName) -n $($svc.Namespace) --url; Read-Host 'Press Enter to close'"
    Write-Host "  Opening $($svc.Name) tunnel..." -ForegroundColor Cyan
    Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", $cmd
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Line
Write-Host "  4 tunnel windows opened." -ForegroundColor Green
Write-Host "  Each window will print the working URL (e.g. http://127.0.0.1:XXXXX)" -ForegroundColor White
Write-Host "  Keep the windows open -- closing them stops the tunnel." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Credentials:" -ForegroundColor Cyan
Write-Host "    Jenkins:    admin / (shown by: make jenkins-password)"
Write-Host "    ArgoCD:     admin / (shown by: make argocd-password)"
Write-Host "    Grafana:    admin / changeme_grafana"
Write-Host ""
Write-Line
exit 0
