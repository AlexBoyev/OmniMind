$ErrorActionPreference = "Stop"

Write-Host "Pointing Docker to Minikube's registry..." -ForegroundColor Cyan
$env_vars = & minikube docker-env --shell powershell
$env_vars | Invoke-Expression

Write-Host "Building backend image..." -ForegroundColor Cyan
docker build -t ghcr.io/alexboyev/omnimind-backend:local ./backend --target=production

Write-Host "Building frontend image..." -ForegroundColor Cyan
docker build `
    --build-arg VITE_API_URL=http://omnimind.local `
    --build-arg VITE_APP_NAME=OmniMind `
    -t ghcr.io/alexboyev/omnimind-frontend:local `
    ./frontend --target=production

Write-Host "✅ Images built and available in Minikube's registry" -ForegroundColor Green
Write-Host "Run: minikube docker-env | Invoke-Expression; docker images | Select-String omnimind" -ForegroundColor Green
