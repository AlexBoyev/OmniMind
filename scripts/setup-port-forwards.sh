#!/bin/bash
# Starts kubectl port-forwards for all Minikube services at stable localhost ports
# Usage: bash scripts/setup-port-forwards.sh
# Run this every time Minikube restarts.

set -e

echo "Starting port-forwards for all OmniMind services..."
echo "(Keep this terminal open or run with: nohup bash scripts/setup-port-forwards.sh &)"
echo ""

# Kill existing port-forwards on these ports
for port in 32000 32001 32002 32003; do
  fuser -k "${port}/tcp" 2>/dev/null || true
done

# Jenkins
kubectl port-forward -n jenkins svc/jenkins 32000:8080 &
echo "✅ Jenkins:    http://localhost:32000"

# ArgoCD
kubectl port-forward -n argocd svc/argocd-server 32001:80 &
echo "✅ ArgoCD:     http://localhost:32001"

# Grafana
kubectl port-forward -n monitoring svc/kube-prometheus-stack-grafana 32002:80 &
echo "✅ Grafana:    http://localhost:32002"

# Prometheus
kubectl port-forward -n monitoring svc/kube-prometheus-stack-prometheus 32003:9090 &
echo "✅ Prometheus: http://localhost:32003"

echo ""
echo "All port-forwards started. Press Ctrl+C to stop."
echo ""
echo "Jenkins password:  $(kubectl get secret jenkins -n jenkins -o jsonpath='{.data.jenkins-admin-password}' 2>/dev/null | base64 -d)"
echo "ArgoCD password:   $(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' 2>/dev/null | base64 -d)"
echo "Grafana password:  changeme_grafana"
echo ""

wait
