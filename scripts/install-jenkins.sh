#!/bin/bash
set -e

echo "Creating jenkins namespace..."
kubectl create namespace jenkins --dry-run=client -o yaml | kubectl apply -f -

echo "Adding Jenkins Helm repo..."
helm repo add jenkins https://charts.jenkins.io
helm repo update

echo "Installing Jenkins (this may take 5-10 minutes)..."
helm upgrade --install jenkins jenkins/jenkins \
  --namespace jenkins \
  --set controller.admin.username="${JENKINS_ADMIN_USER:-admin}" \
  --set controller.admin.password="${JENKINS_ADMIN_PASSWORD:-changeme_jenkins}" \
  --set controller.serviceType=NodePort \
  --set controller.nodePort=32000 \
  --set persistence.size=10Gi \
  --set controller.installPlugins[0]=kubernetes \
  --set controller.installPlugins[1]=workflow-aggregator \
  --set controller.installPlugins[2]=git \
  --set controller.installPlugins[3]=github \
  --set controller.installPlugins[4]=github-branch-source \
  --set controller.installPlugins[5]=docker-workflow \
  --set controller.installPlugins[6]=configuration-as-code \
  --set controller.installPlugins[7]=credentials-binding \
  --set controller.installPlugins[8]=pipeline-stage-view \
  --set controller.installPlugins[9]=blueocean \
  --wait --timeout=600s

echo "Waiting for Jenkins StatefulSet to be ready..."
kubectl rollout status statefulset/jenkins -n jenkins --timeout=300s

echo "✅ Jenkins installed"
echo ""
echo "Access Jenkins:"
echo "  URL: http://$(minikube ip):32000"
echo "  User: ${JENKINS_ADMIN_USER:-admin}"
echo "  Pass: ${JENKINS_ADMIN_PASSWORD:-changeme_jenkins}"
