#!/bin/bash
set -e

if [ -z "$GITHUB_USERNAME" ] || [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GITHUB_USERNAME and GITHUB_TOKEN must be set"
  echo "  export GITHUB_USERNAME=alexboyev"
  echo "  export GITHUB_TOKEN=<your-PAT>"
  exit 1
fi

echo "Getting ArgoCD admin password..."
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d)

ARGOCD_SERVER="$(minikube ip):32001"

echo "Installing ArgoCD CLI (if needed)..."
if ! command -v argocd &> /dev/null; then
  echo "ArgoCD CLI not found. Downloading..."
  ARGOCD_VERSION=$(curl -L -s https://raw.githubusercontent.com/argoproj/argo-cd/stable/VERSION)
  curl -sSL -o /usr/local/bin/argocd \
    "https://github.com/argoproj/argo-cd/releases/download/v${ARGOCD_VERSION}/argocd-linux-amd64"
  chmod +x /usr/local/bin/argocd
fi

echo "Logging into ArgoCD..."
argocd login "$ARGOCD_SERVER" \
  --username admin \
  --password "$ARGOCD_PASSWORD" \
  --insecure

echo "Adding GitHub repo to ArgoCD..."
argocd repo add "https://github.com/${GITHUB_USERNAME}/OmniMind.git" \
  --username "$GITHUB_USERNAME" \
  --password "$GITHUB_TOKEN" \
  --insecure-skip-server-verification

echo "Creating AppProject..."
kubectl apply -f argocd/projects/omnimind-project.yaml

echo "Creating Applications..."
kubectl apply -f argocd/applications/app-staging.yaml
kubectl apply -f argocd/applications/app-production.yaml

echo "Syncing staging application..."
argocd app sync omnimind-staging --insecure || true

echo "✅ ArgoCD configured"
echo ""
echo "View apps:  argocd app list"
echo "Open UI:    http://$ARGOCD_SERVER"
