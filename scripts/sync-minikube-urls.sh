#!/bin/bash
# Updates .env with current Minikube service URLs.
# Run this every time Minikube restarts (IPs and port-forwards may change).

set -e

if [ ! -f .env ]; then
  echo "Error: .env not found. Run from project root."
  exit 1
fi

echo "Syncing Minikube URLs to .env..."

JENKINS_URL="http://localhost:32000"
ARGOCD_URL="http://localhost:32001"
GRAFANA_URL="http://localhost:32002"
PROMETHEUS_URL="http://localhost:32003"

update_or_add() {
  local key="$1" val="$2"
  if grep -q "^${key}=" .env; then
    sed -i "s|^${key}=.*|${key}=${val}|" .env
  else
    echo "${key}=${val}" >> .env
  fi
}

update_or_add "VITE_JENKINS_URL"    "$JENKINS_URL"
update_or_add "VITE_ARGOCD_URL"     "$ARGOCD_URL"
update_or_add "VITE_GRAFANA_URL"    "$GRAFANA_URL"
update_or_add "VITE_PROMETHEUS_URL" "$PROMETHEUS_URL"
update_or_add "VITE_PGADMIN_URL"    "http://localhost:5050"
update_or_add "VITE_MAILPIT_URL"    "http://localhost:8025"

echo "✅ Updated .env with service URLs:"
echo "  Jenkins:    $JENKINS_URL"
echo "  ArgoCD:     $ARGOCD_URL"
echo "  Grafana:    $GRAFANA_URL"
echo "  Prometheus: $PROMETHEUS_URL"
echo ""
echo "Rebuild frontend to apply: docker compose up --build -d frontend"
