#!/bin/bash
set -e

echo "Creating monitoring namespace..."
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

echo "Adding Prometheus community Helm repo..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

echo "Installing kube-prometheus-stack (Prometheus + Grafana + Alertmanager)..."
helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --set "grafana.adminPassword=${GRAFANA_ADMIN_PASSWORD:-changeme_grafana}" \
  --set grafana.service.type=NodePort \
  --set grafana.service.nodePort=32002 \
  --set prometheus.service.type=NodePort \
  --set prometheus.service.nodePort=32003 \
  --wait --timeout=600s

echo "Installing Loki stack (logs)..."
helm upgrade --install loki grafana/loki-stack \
  --namespace monitoring \
  --set grafana.enabled=false \
  --set promtail.enabled=true \
  --wait --timeout=300s

echo "✅ Monitoring installed"
echo ""
echo "Access Grafana:"
echo "  URL: http://$(minikube ip):32002"
echo "  User: admin"
echo "  Pass: ${GRAFANA_ADMIN_PASSWORD:-changeme_grafana}"
echo ""
echo "Access Prometheus:"
echo "  URL: http://$(minikube ip):32003"
