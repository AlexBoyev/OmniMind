$ErrorActionPreference = "Stop"

Write-Host "Starting Minikube..." -ForegroundColor Cyan
minikube start --cpus=4 --memory=8192 --driver=docker --kubernetes-version=stable

Write-Host "Enabling addons..." -ForegroundColor Cyan
minikube addons enable ingress
minikube addons enable metrics-server

Write-Host "Installing Sealed Secrets controller..." -ForegroundColor Cyan
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
helm repo update
helm upgrade --install sealed-secrets-controller sealed-secrets/sealed-secrets `
  --namespace kube-system `
  --set-string fullnameOverride=sealed-secrets-controller

Write-Host "Waiting for sealed-secrets-controller to be ready..." -ForegroundColor Cyan
kubectl wait --for=condition=Available deployment/sealed-secrets-controller `
  -n kube-system --timeout=120s

Write-Host "✅ Minikube ready. Run 'kubectl get nodes' to verify." -ForegroundColor Green
