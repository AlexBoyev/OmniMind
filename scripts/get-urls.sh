#!/bin/bash
# Run anytime to see all access URLs and passwords
# Usage: bash scripts/get-urls.sh

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              OmniMind — Access Guide                    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "┌─────────────────────────────────────────────────────────┐"
echo "│  DOCKER COMPOSE (local dev)                             │"
echo "├─────────────────────────────────────────────────────────┤"
echo "│  Frontend:    http://localhost:3000                     │"
echo "│  Backend API: http://localhost:8001/docs                │"
echo "│  pgAdmin:     http://localhost:5050                     │"
echo "│  Mailpit:     http://localhost:8025                     │"
echo "└─────────────────────────────────────────────────────────┘"
echo ""

# Check if minikube is running
if ! minikube status &>/dev/null 2>&1; then
  echo "⚠️  Minikube is not running."
  echo "   Start it: minikube start --cpus=4 --memory=8192 --driver=docker"
  echo ""
else
  MINIKUBE_IP=$(minikube ip 2>/dev/null)
  echo "┌─────────────────────────────────────────────────────────┐"
  echo "│  KUBERNETES / MINIKUBE                                  │"
  echo "├─────────────────────────────────────────────────────────┤"
  printf "│  Frontend:    http://omnimind.local                     │\n"
  printf "│  hosts file:  %-40s│\n" "$MINIKUBE_IP omnimind.local"
  echo "│                                                         │"

  # Check if port-forwards are active
  JENKINS_UP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 http://localhost:32000 2>/dev/null)
  ARGOCD_UP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 http://localhost:32001 2>/dev/null)
  GRAFANA_UP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 http://localhost:32002 2>/dev/null)
  PROMETHEUS_UP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 http://localhost:32003 2>/dev/null)

  jenkins_status="❌ offline (run: bash scripts/setup-port-forwards.sh)"
  argocd_status="❌ offline (run: bash scripts/setup-port-forwards.sh)"
  grafana_status="❌ offline"
  prometheus_status="❌ offline"

  [ "$JENKINS_UP" != "000" ] && jenkins_status="✅ http://localhost:32000"
  [ "$ARGOCD_UP" != "000" ] && argocd_status="✅ http://localhost:32001"
  [ "$GRAFANA_UP" != "000" ] && grafana_status="✅ http://localhost:32002"
  [ "$PROMETHEUS_UP" != "000" ] && prometheus_status="✅ http://localhost:32003"

  printf "│  Jenkins:     %-41s│\n" "$jenkins_status"
  printf "│  ArgoCD:      %-41s│\n" "$argocd_status"
  printf "│  Grafana:     %-41s│\n" "$grafana_status"
  printf "│  Prometheus:  %-41s│\n" "$prometheus_status"
  echo "└─────────────────────────────────────────────────────────┘"
  echo ""
  echo "┌─────────────────────────────────────────────────────────┐"
  echo "│  CREDENTIALS                                            │"
  echo "├─────────────────────────────────────────────────────────┤"
  echo "│  App Admin:  admin@omnimind.local / AdminPass123!       │"
  echo "│  App User:   user@omnimind.local  / UserPass123!        │"

  JENKINS_PASS=$(kubectl get secret jenkins -n jenkins \
    -o jsonpath="{.data.jenkins-admin-password}" 2>/dev/null | base64 -d 2>/dev/null || echo "N/A")
  ARGOCD_PASS=$(kubectl -n argocd get secret argocd-initial-admin-secret \
    -o jsonpath="{.data.password}" 2>/dev/null | base64 -d 2>/dev/null || echo "N/A")
  GRAFANA_PASS=$(grep "^GRAFANA_ADMIN_PASSWORD=" .env 2>/dev/null | cut -d= -f2 || echo "changeme_grafana")

  printf "│  Jenkins:    admin / %-34s│\n" "$JENKINS_PASS"
  printf "│  ArgoCD:     admin / %-34s│\n" "$ARGOCD_PASS"
  printf "│  Grafana:    admin / %-34s│\n" "$GRAFANA_PASS"
  echo "│  pgAdmin:    admin@omnimind.local / pgadmin_password    │"
  echo "└─────────────────────────────────────────────────────────┘"
fi

echo ""
echo "┌─────────────────────────────────────────────────────────┐"
echo "│  ADMIN PAGES (login as admin first)                     │"
echo "├─────────────────────────────────────────────────────────┤"
echo "│  Super Dashboard:  /admin/overview                      │"
echo "│  User Management:  /admin/users                         │"
echo "│  Audit Log:        /admin/audit-log                     │"
echo "│  Env Variables:    /admin/env                           │"
echo "│  Project Overview: /overview                            │"
echo "│  Jarvis (AI):      /jarvis                              │"
echo "└─────────────────────────────────────────────────────────┘"
echo ""
echo "  💡 To start infrastructure tunnels: bash scripts/setup-port-forwards.sh"
_mk_ip=$(minikube ip 2>/dev/null | grep -Eo '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' || true)
[ -n "$_mk_ip" ] && echo "  💡 To update hosts file: $_mk_ip omnimind.local"
echo ""
