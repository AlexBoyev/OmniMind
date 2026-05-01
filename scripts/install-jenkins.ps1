$ErrorActionPreference = "Stop"

$adminUser     = if ($env:JENKINS_ADMIN_USER)     { $env:JENKINS_ADMIN_USER }     else { "admin" }
$adminPassword = if ($env:JENKINS_ADMIN_PASSWORD) { $env:JENKINS_ADMIN_PASSWORD } else { "changeme_jenkins" }

Write-Host "Creating jenkins namespace..." -ForegroundColor Cyan
kubectl create namespace jenkins --dry-run=client -o yaml | kubectl apply -f -

Write-Host "Adding Jenkins Helm repo..." -ForegroundColor Cyan
helm repo add jenkins https://charts.jenkins.io
helm repo update

Write-Host "Installing Jenkins (this may take 5-10 minutes)..." -ForegroundColor Cyan
helm upgrade --install jenkins jenkins/jenkins `
    --namespace jenkins `
    --set "controller.adminUser=$adminUser" `
    --set "controller.adminPassword=$adminPassword" `
    --set controller.serviceType=NodePort `
    --set controller.nodePort=32000 `
    --set persistence.size=10Gi `
    "--set controller.installPlugins[0]=kubernetes" `
    "--set controller.installPlugins[1]=workflow-aggregator" `
    "--set controller.installPlugins[2]=git" `
    "--set controller.installPlugins[3]=github" `
    "--set controller.installPlugins[4]=github-branch-source" `
    "--set controller.installPlugins[5]=docker-workflow" `
    "--set controller.installPlugins[6]=configuration-as-code" `
    "--set controller.installPlugins[7]=credentials-binding" `
    "--set controller.installPlugins[8]=pipeline-stage-view" `
    "--set controller.installPlugins[9]=blueocean" `
    --wait --timeout=600s

Write-Host "Waiting for Jenkins to be ready..." -ForegroundColor Cyan
kubectl wait --for=condition=Available deployment/jenkins -n jenkins --timeout=300s

$minikubeIP = & minikube ip
Write-Host "✅ Jenkins installed" -ForegroundColor Green
Write-Host ""
Write-Host "Access Jenkins:" -ForegroundColor Green
Write-Host "  URL: http://${minikubeIP}:32000" -ForegroundColor Green
Write-Host "  User: $adminUser" -ForegroundColor Green
Write-Host "  Pass: $adminPassword" -ForegroundColor Green
