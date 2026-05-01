#!/bin/bash
set -e

echo "Starting Minikube..."
minikube start --cpus=4 --memory=8192 --driver=docker --kubernetes-version=stable

echo "Enabling addons..."
minikube addons enable ingress
minikube addons enable metrics-server

echo "Installing Sealed Secrets controller..."
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
helm repo update
helm upgrade --install sealed-secrets-controller sealed-secrets/sealed-secrets \
  --namespace kube-system \
  --set-string fullnameOverride=sealed-secrets-controller

echo "Waiting for sealed-secrets-controller to be ready..."
kubectl wait --for=condition=Available deployment/sealed-secrets-controller \
  -n kube-system --timeout=120s

echo "✅ Minikube ready. Run 'kubectl get nodes' to verify."
