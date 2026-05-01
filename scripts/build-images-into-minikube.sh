#!/bin/bash
set -e

echo "Pointing Docker to Minikube's registry..."
eval $(minikube docker-env)

echo "Building backend image..."
docker build -t ghcr.io/alexboyev/omnimind-backend:local \
  ./backend --target=production

echo "Building frontend image..."
docker build \
  --build-arg VITE_API_URL=http://omnimind.local \
  --build-arg VITE_APP_NAME=OmniMind \
  -t ghcr.io/alexboyev/omnimind-frontend:local \
  ./frontend --target=production

echo "✅ Images built and available in Minikube's registry"
echo "Run: eval \$(minikube docker-env) && docker images | grep omnimind"
