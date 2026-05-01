$ErrorActionPreference = "Stop"

if (-not $env:GITHUB_USERNAME -or -not $env:GITHUB_TOKEN) {
    Write-Error "GITHUB_USERNAME and GITHUB_TOKEN must be set as environment variables."
    exit 1
}

Write-Host "Getting ArgoCD admin password..." -ForegroundColor Cyan
$encoded = kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}"
$bytes = [System.Convert]::FromBase64String($encoded)
$ARGOCD_PASSWORD = [System.Text.Encoding]::UTF8.GetString($bytes)

$minikubeIP = & minikube ip
$ARGOCD_SERVER = "${minikubeIP}:32001"

Write-Host "Checking for ArgoCD CLI..." -ForegroundColor Cyan
if (-not (Get-Command argocd -ErrorAction SilentlyContinue)) {
    Write-Host "argocd CLI not found. Download from: https://github.com/argoproj/argo-cd/releases/latest" -ForegroundColor Yellow
    Write-Host "Or use: winget install argoproj.argocd" -ForegroundColor Yellow
    Write-Host "Continuing with kubectl apply only..." -ForegroundColor Yellow
}

Write-Host "Creating AppProject..." -ForegroundColor Cyan
kubectl apply -f argocd/projects/omnimind-project.yaml

Write-Host "Creating Applications..." -ForegroundColor Cyan
kubectl apply -f argocd/applications/app-staging.yaml
kubectl apply -f argocd/applications/app-production.yaml

if (Get-Command argocd -ErrorAction SilentlyContinue) {
    Write-Host "Logging into ArgoCD..." -ForegroundColor Cyan
    argocd login $ARGOCD_SERVER --username admin --password $ARGOCD_PASSWORD --insecure

    Write-Host "Adding GitHub repo to ArgoCD..." -ForegroundColor Cyan
    argocd repo add "https://github.com/$($env:GITHUB_USERNAME)/OmniMind.git" `
        --username $env:GITHUB_USERNAME `
        --password $env:GITHUB_TOKEN `
        --insecure-skip-server-verification

    Write-Host "Syncing staging application..." -ForegroundColor Cyan
    argocd app sync omnimind-staging --insecure
}

Write-Host "✅ ArgoCD configured" -ForegroundColor Green
Write-Host "Open UI: http://$ARGOCD_SERVER" -ForegroundColor Green
