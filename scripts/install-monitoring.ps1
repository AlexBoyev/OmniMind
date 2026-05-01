$ErrorActionPreference = "Stop"

$grafanaPw = if ($env:GRAFANA_ADMIN_PASSWORD) { $env:GRAFANA_ADMIN_PASSWORD } else { "changeme_grafana" }

Write-Host "Creating monitoring namespace..." -ForegroundColor Cyan
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

Write-Host "Adding Helm repos..." -ForegroundColor Cyan
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

Write-Host "Installing kube-prometheus-stack..." -ForegroundColor Cyan
helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack `
    --namespace monitoring `
    --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false `
    "--set grafana.adminPassword=$grafanaPw" `
    --set grafana.service.type=NodePort `
    --set grafana.service.nodePort=32002 `
    --set prometheus.service.type=NodePort `
    --set prometheus.service.nodePort=32003 `
    --wait --timeout=600s

Write-Host "Installing Loki stack..." -ForegroundColor Cyan
helm upgrade --install loki grafana/loki-stack `
    --namespace monitoring `
    --set grafana.enabled=false `
    --set promtail.enabled=true `
    --wait --timeout=300s

$minikubeIP = & minikube ip
Write-Host "✅ Monitoring installed" -ForegroundColor Green
Write-Host "Grafana:    http://${minikubeIP}:32002  (admin / $grafanaPw)" -ForegroundColor Green
Write-Host "Prometheus: http://${minikubeIP}:32003" -ForegroundColor Green
