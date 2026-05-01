$ErrorActionPreference = "Stop"

Write-Host "Creating argocd namespace..." -ForegroundColor Cyan
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

Write-Host "Installing ArgoCD..." -ForegroundColor Cyan
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

Write-Host "Waiting for ArgoCD server to be ready (2-3 minutes)..." -ForegroundColor Cyan
kubectl wait --for=condition=Available deployment/argocd-server `
  -n argocd --timeout=300s

Write-Host "Patching argocd-server service to NodePort 32001..." -ForegroundColor Cyan
kubectl patch svc argocd-server -n argocd `
  --type='json' `
  '-p=[{"op":"replace","path":"/spec/type","value":"NodePort"},{"op":"add","path":"/spec/ports/0/nodePort","value":32001}]'

Write-Host "Getting initial admin password..." -ForegroundColor Cyan
$encoded = kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}"
$bytes = [System.Convert]::FromBase64String($encoded)
$ARGOCD_PASSWORD = [System.Text.Encoding]::UTF8.GetString($bytes)

$minikubeIP = & minikube ip
Write-Host "✅ ArgoCD installed" -ForegroundColor Green
Write-Host ""
Write-Host "Access ArgoCD:" -ForegroundColor Green
Write-Host "  URL: http://${minikubeIP}:32001" -ForegroundColor Green
Write-Host "  User: admin" -ForegroundColor Green
Write-Host "  Pass: $ARGOCD_PASSWORD" -ForegroundColor Green
Write-Host ""
Write-Host "Save this password — change it after first login!" -ForegroundColor Yellow
