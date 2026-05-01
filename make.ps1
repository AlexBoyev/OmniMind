# =============================================================================
# OmniMind — make.ps1 (PowerShell equivalent of Makefile)
# Usage: .\make.ps1 <target>
# Example: .\make.ps1 build
# =============================================================================

param(
    [Parameter(Position = 0)]
    [string]$Target = "help"
)

$Compose = "docker compose"

function Invoke-Up {
    Write-Host "Starting all services in detached mode..." -ForegroundColor Cyan
    docker compose up -d
}

function Invoke-Build {
    Write-Host "Building images and starting all services..." -ForegroundColor Cyan
    docker compose up --build -d
}

function Invoke-Down {
    Write-Host "Stopping and removing containers..." -ForegroundColor Cyan
    docker compose down
}

function Invoke-Logs {
    Write-Host "Following logs (Ctrl-C to exit)..." -ForegroundColor Cyan
    docker compose logs -f
}

function Invoke-Clean {
    Write-Host "Removing containers, volumes, and local images..." -ForegroundColor Yellow
    docker compose down -v --rmi local
}

function Invoke-Migrate {
    Write-Host "Running Alembic migrations..." -ForegroundColor Cyan
    docker compose exec backend alembic upgrade head
}

function Invoke-Seed {
    Write-Host "Seeding the database..." -ForegroundColor Cyan
    docker compose exec backend python -m app.db.seed
}

function Invoke-MakeMigration {
    param([string]$Msg = "auto")
    Write-Host "Generating Alembic migration: $Msg" -ForegroundColor Cyan
    docker compose exec backend alembic revision --autogenerate -m $Msg
}

function Invoke-Test {
    Write-Host "Running full test suite in isolated Docker stack..." -ForegroundColor Cyan
    docker compose -f docker-compose.test.yml -p omnimind-test up --build --abort-on-container-exit --exit-code-from backend
}

function Invoke-TestBackend {
    Write-Host "Running backend pytest suite inside running container..." -ForegroundColor Cyan
    docker compose exec backend pytest
}

function Invoke-TestFrontend {
    Write-Host "Running frontend test suite inside running container..." -ForegroundColor Cyan
    docker compose exec frontend npm test -- --run
}

function Invoke-Lint {
    Write-Host "Linting backend and frontend..." -ForegroundColor Cyan
    Push-Location backend
    ruff check .
    Pop-Location
    Push-Location frontend
    npm run lint
    Pop-Location
}

function Invoke-Format {
    Write-Host "Formatting backend and frontend..." -ForegroundColor Cyan
    Push-Location backend
    ruff format .
    Pop-Location
    Push-Location frontend
    npm run format
    Pop-Location
}

function Invoke-MinikubeSetup {
    Write-Host "Starting Minikube, enabling addons, installing Sealed Secrets..." -ForegroundColor Cyan
    & scripts\install-minikube-deps.ps1
}

function Invoke-MinikubeSeal {
    Write-Host "Sealing secrets from .env..." -ForegroundColor Cyan
    & scripts\seal-secrets.ps1
}

function Invoke-MinikubeBuild {
    Write-Host "Building images into Minikube's Docker registry..." -ForegroundColor Cyan
    & scripts\build-images-into-minikube.ps1
}

function Invoke-MinikubeDeployStaging {
    Write-Host "Deploying staging overlay to Minikube..." -ForegroundColor Cyan
    & scripts\deploy-staging.ps1
}

function Invoke-MinikubeDown {
    Write-Host "Deleting Minikube cluster..." -ForegroundColor Yellow
    minikube delete
}

function Invoke-MinikubeIP {
    Write-Host "Minikube IP:" -ForegroundColor Cyan
    minikube ip
}

function Invoke-MinikubeTunnel {
    Write-Host "Starting Minikube tunnel (requires admin)..." -ForegroundColor Cyan
    minikube tunnel
}

function Invoke-MinikubeUp {
    Write-Host "Starting Minikube (4 CPUs, 8 GB RAM)..." -ForegroundColor Cyan
    minikube start --cpus=4 --memory=8192 --driver=docker
}

function Invoke-MinikubeStop {
    Write-Host "Stopping Minikube..." -ForegroundColor Cyan
    minikube stop
}

function Invoke-MinikubeDelete {
    Write-Host "Deleting Minikube cluster..." -ForegroundColor Yellow
    minikube delete
}

function Invoke-MinikubeDeploy {
    Write-Host "Applying staging Kustomize overlay..." -ForegroundColor Cyan
    kubectl apply -k k8s/overlays/staging
}

function Invoke-MinikubeStatus {
    Write-Host "Checking Minikube and cluster status..." -ForegroundColor Cyan
    minikube status
    kubectl get nodes
}

function Invoke-Help {
    Write-Host ""
    Write-Host "  OmniMind — available .\make.ps1 targets" -ForegroundColor Green
    Write-Host ""
    $targets = @(
        @{ Name = "up";               Desc = "Start all services in detached mode" },
        @{ Name = "build";            Desc = "Build images and start all services in detached mode" },
        @{ Name = "down";             Desc = "Stop and remove containers (keeps volumes)" },
        @{ Name = "logs";             Desc = "Follow logs for all services (Ctrl-C to exit)" },
        @{ Name = "clean";            Desc = "Stop containers, remove volumes and local images" },
        @{ Name = "migrate";          Desc = "Run Alembic migrations inside the backend container" },
        @{ Name = "seed";             Desc = "Seed the database with admin + user accounts" },
        @{ Name = "makemigration";    Desc = "Generate a new Alembic migration (pass -Msg 'your message')" },
        @{ Name = "test-backend";     Desc = "Run backend pytest suite inside the container" },
        @{ Name = "test-frontend";    Desc = "Run frontend test suite inside the container" },
        @{ Name = "test";             Desc = "Run all tests" },
        @{ Name = "lint";             Desc = "Lint backend (ruff) and frontend (eslint)" },
        @{ Name = "format";           Desc = "Auto-format backend (ruff) and frontend (prettier)" },
        @{ Name = "minikube-setup";          Desc = "Start Minikube, enable addons, install Sealed Secrets" },
        @{ Name = "minikube-seal";           Desc = "Seal .env secrets into k8s/base/secrets.sealed.yaml" },
        @{ Name = "minikube-build";          Desc = "Build images into Minikube's Docker registry" },
        @{ Name = "minikube-deploy-staging"; Desc = "Deploy staging overlay to Minikube" },
        @{ Name = "minikube-down";           Desc = "Completely delete the Minikube cluster" },
        @{ Name = "minikube-ip";             Desc = "Print Minikube IP (add to hosts as omnimind.local)" },
        @{ Name = "minikube-tunnel";         Desc = "Start Minikube tunnel for LoadBalancer services" },
        @{ Name = "minikube-up";             Desc = "Start Minikube with 4 CPUs and 8 GB RAM" },
        @{ Name = "minikube-stop";           Desc = "Stop Minikube without deleting the cluster" },
        @{ Name = "minikube-status";         Desc = "Show Minikube and kubectl cluster status" },
        @{ Name = "help";             Desc = "Show this help message" }
    )
    foreach ($t in $targets) {
        Write-Host ("  {0,-22} {1}" -f $t.Name, $t.Desc) -ForegroundColor Cyan
    }
    Write-Host ""
}

switch ($Target) {
    "up"               { Invoke-Up }
    "build"            { Invoke-Build }
    "down"             { Invoke-Down }
    "logs"             { Invoke-Logs }
    "clean"            { Invoke-Clean }
    "migrate"          { Invoke-Migrate }
    "seed"             { Invoke-Seed }
    "makemigration"    { Invoke-MakeMigration }
    "test-backend"     { Invoke-TestBackend }
    "test-frontend"    { Invoke-TestFrontend }
    "test"             { Invoke-Test }
    "lint"             { Invoke-Lint }
    "format"           { Invoke-Format }
    "minikube-setup"          { Invoke-MinikubeSetup }
    "minikube-seal"           { Invoke-MinikubeSeal }
    "minikube-build"          { Invoke-MinikubeBuild }
    "minikube-deploy-staging" { Invoke-MinikubeDeployStaging }
    "minikube-down"           { Invoke-MinikubeDown }
    "minikube-ip"             { Invoke-MinikubeIP }
    "minikube-tunnel"         { Invoke-MinikubeTunnel }
    "minikube-up"             { Invoke-MinikubeUp }
    "minikube-stop"           { Invoke-MinikubeStop }
    "minikube-delete"         { Invoke-MinikubeDelete }
    "minikube-deploy"         { Invoke-MinikubeDeploy }
    "minikube-status"         { Invoke-MinikubeStatus }
    "help"             { Invoke-Help }
    default {
        Write-Host "Unknown target: '$Target'. Run .\make.ps1 help to see available targets." -ForegroundColor Red
        exit 1
    }
}
