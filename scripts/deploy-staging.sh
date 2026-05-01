#!/bin/bash
set -e

echo "Ensuring omnimind-staging namespace exists..."
kubectl create namespace omnimind-staging --dry-run=client -o yaml | kubectl apply -f -

echo "Applying staging manifests..."
kubectl apply -k k8s/overlays/staging

echo "Applying service aliases (postgres, redis) to preserve connection URLs..."
kubectl apply -f k8s/overlays/staging/service-aliases.yaml

echo "Waiting for postgres to be ready..."
kubectl rollout status statefulset/staging-postgres -n omnimind-staging --timeout=120s

echo "Waiting for redis to be ready..."
kubectl rollout status deployment/staging-redis -n omnimind-staging --timeout=60s

echo "Waiting for migration job to complete..."
kubectl wait --for=condition=complete job/staging-migration-job \
  -n omnimind-staging --timeout=120s

echo "Waiting for backend pods to be ready..."
kubectl rollout status deployment/staging-backend -n omnimind-staging --timeout=120s

echo "Waiting for frontend pods to be ready..."
kubectl rollout status deployment/staging-frontend -n omnimind-staging --timeout=60s

echo ""
echo "✅ Staging deployed successfully"
echo ""
echo "Add to /etc/hosts (or C:\\Windows\\System32\\drivers\\etc\\hosts on Windows):"
echo "$(minikube ip) omnimind.local"
echo ""
echo "Then visit: http://omnimind.local"
