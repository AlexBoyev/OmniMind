$ErrorActionPreference = "Stop"

Write-Host "Ensuring omnimind-staging namespace exists..." -ForegroundColor Cyan
kubectl create namespace omnimind-staging --dry-run=client -o yaml | kubectl apply -f -

Write-Host "Applying staging manifests..." -ForegroundColor Cyan
kubectl apply -k k8s/overlays/staging

Write-Host "Waiting for postgres to be ready..." -ForegroundColor Cyan
kubectl rollout status statefulset/staging-postgres -n omnimind-staging --timeout=120s

Write-Host "Waiting for redis to be ready..." -ForegroundColor Cyan
kubectl rollout status deployment/staging-redis -n omnimind-staging --timeout=60s

Write-Host "Waiting for migration job to complete..." -ForegroundColor Cyan
kubectl wait --for=condition=complete job/staging-migration-job `
  -n omnimind-staging --timeout=120s

Write-Host "Waiting for backend pods to be ready..." -ForegroundColor Cyan
kubectl rollout status deployment/staging-backend -n omnimind-staging --timeout=120s

Write-Host "Waiting for frontend pods to be ready..." -ForegroundColor Cyan
kubectl rollout status deployment/staging-frontend -n omnimind-staging --timeout=60s

Write-Host ""
Write-Host "✅ Staging deployed successfully" -ForegroundColor Green
Write-Host ""
$minikubeIP = & minikube ip
Write-Host "Add to C:\Windows\System32\drivers\etc\hosts (as Administrator):" -ForegroundColor Yellow
Write-Host "$minikubeIP omnimind.local" -ForegroundColor Yellow
Write-Host ""
Write-Host "Then visit: http://omnimind.local" -ForegroundColor Green
