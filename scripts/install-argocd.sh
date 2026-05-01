#!/bin/bash
set -e

echo "Creating argocd namespace..."
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

echo "Installing ArgoCD..."
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "Waiting for ArgoCD server to be ready (this may take 2-3 minutes)..."
kubectl wait --for=condition=Available deployment/argocd-server \
  -n argocd --timeout=300s

echo "Patching argocd-server service to NodePort 32001..."
kubectl patch svc argocd-server -n argocd \
  --type='json' \
  -p='[{"op":"replace","path":"/spec/type","value":"NodePort"},{"op":"add","path":"/spec/ports/0/nodePort","value":32001}]'

echo "Getting initial admin password..."
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d)

echo "✅ ArgoCD installed"
echo ""
echo "Access ArgoCD:"
echo "  URL: http://$(minikube ip):32001"
echo "  User: admin"
echo "  Pass: $ARGOCD_PASSWORD"
echo ""
echo "Save this password — change it after first login!"
