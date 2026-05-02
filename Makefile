# =============================================================================
# OmniMind — Makefile
# Usage: make <target>
# Run `make help` to list all available targets.
# =============================================================================

.DEFAULT_GOAL := help
COMPOSE := docker compose

# ─── Access Guide ─────────────────────────────────────────────────────────────

.PHONY: urls
urls: ## Print all service URLs and credentials
	bash scripts/get-urls.sh

.PHONY: tunnels
tunnels: ## Start kubectl port-forwards for all Minikube services
	bash scripts/setup-port-forwards.sh

.PHONY: sync-urls
sync-urls: ## Update .env with current Minikube service URLs
	bash scripts/sync-minikube-urls.sh

# ─── Stack Lifecycle ──────────────────────────────────────────────────────────

.PHONY: up
up: ## Start all services in detached mode
	$(COMPOSE) up -d

.PHONY: build
build: ## Build images and start all services in detached mode
	$(COMPOSE) up --build -d

.PHONY: down
down: ## Stop and remove containers (keeps volumes)
	$(COMPOSE) down

.PHONY: logs
logs: ## Follow logs for all services (Ctrl-C to exit)
	$(COMPOSE) logs -f

.PHONY: clean
clean: ## Stop containers, remove volumes and locally-built images
	$(COMPOSE) down -v --rmi local

# ─── Database ─────────────────────────────────────────────────────────────────

.PHONY: migrate
migrate: ## Run Alembic migrations inside the backend container
	$(COMPOSE) exec backend alembic upgrade head

.PHONY: seed
seed: ## Seed the database with admin + user accounts
	$(COMPOSE) exec backend python -m app.db.seed

.PHONY: makemigration
makemigration: ## Generate a new Alembic migration (set MSG=your message)
	$(COMPOSE) exec backend alembic revision --autogenerate -m "$(MSG)"

# ─── Testing ──────────────────────────────────────────────────────────────────

.PHONY: test
test: ## Run full test suite in isolated Docker stack (CI-safe)
	$(COMPOSE) -f docker-compose.test.yml -p omnimind-test up --build --abort-on-container-exit --exit-code-from backend

.PHONY: test-backend
test-backend: ## Run backend pytest suite inside the running backend container
	$(COMPOSE) exec backend pytest

.PHONY: test-frontend
test-frontend: ## Run frontend test suite inside the running frontend container
	$(COMPOSE) exec frontend npm test -- --run

# ─── Code Quality ─────────────────────────────────────────────────────────────

.PHONY: lint
lint: ## Lint backend (ruff) and frontend (eslint)
	(cd backend && ruff check .) && (cd frontend && npm run lint)

.PHONY: format
format: ## Auto-format backend (ruff format) and frontend (prettier)
	(cd backend && ruff format .) && (cd frontend && npm run format)

# ─── Kubernetes / Minikube ────────────────────────────────────────────────────

.PHONY: minikube-setup
minikube-setup: ## Start Minikube, enable addons, install Sealed Secrets controller
	bash scripts/install-minikube-deps.sh

.PHONY: minikube-seal
minikube-seal: ## Seal .env secrets into k8s/base/secrets.sealed.yaml
	bash scripts/seal-secrets.sh

.PHONY: minikube-build
minikube-build: ## Build backend + frontend images into Minikube's Docker registry
	bash scripts/build-images-into-minikube.sh

.PHONY: minikube-deploy-staging
minikube-deploy-staging: ## Deploy staging overlay to Minikube
	bash scripts/deploy-staging.sh

.PHONY: minikube-down
minikube-down: ## Completely delete the Minikube cluster
	minikube delete

.PHONY: minikube-ip
minikube-ip: ## Print Minikube IP (add to /etc/hosts as omnimind.local)
	minikube ip

.PHONY: minikube-tunnel
minikube-tunnel: ## Start Minikube tunnel for LoadBalancer services
	minikube tunnel

.PHONY: minikube-up
minikube-up: ## Start Minikube with 4 CPUs and 8 GB RAM
	minikube start --cpus=4 --memory=8192 --driver=docker

.PHONY: minikube-stop
minikube-stop: ## Stop Minikube without deleting the cluster
	minikube stop

.PHONY: minikube-delete
minikube-delete: ## Completely delete the Minikube cluster (alias: minikube-down)
	minikube delete

.PHONY: minikube-deploy
minikube-deploy: ## Apply staging Kustomize overlay to Minikube (alias: minikube-deploy-staging)
	kubectl apply -k k8s/overlays/staging

.PHONY: minikube-status
minikube-status: ## Show Minikube and kubectl cluster status
	minikube status && kubectl get nodes

# ─── Monitoring ───────────────────────────────────────────────────────────────

.PHONY: monitoring-install
monitoring-install: ## Install Prometheus + Grafana + Loki in the monitoring namespace
	bash scripts/install-monitoring.sh

.PHONY: grafana-url
grafana-url: ## Print Grafana URL
	@echo "http://$(shell minikube ip):32002"

.PHONY: grafana-password
grafana-password: ## Print Grafana admin password
	@echo "$${GRAFANA_ADMIN_PASSWORD:-changeme_grafana}"

.PHONY: prometheus-url
prometheus-url: ## Print Prometheus URL
	@echo "http://$(shell minikube ip):32003"

# ─── Jenkins ──────────────────────────────────────────────────────────────────

.PHONY: jenkins-install
jenkins-install: ## Install Jenkins via Helm into the jenkins namespace
	bash scripts/install-jenkins.sh

.PHONY: jenkins-url
jenkins-url: ## Print Jenkins URL
	@echo "http://$(shell minikube ip):32000"

.PHONY: jenkins-password
jenkins-password: ## Print Jenkins admin password
	@kubectl get secret jenkins -n jenkins -o jsonpath="{.data.jenkins-admin-password}" | base64 -d && echo

# ─── ArgoCD ───────────────────────────────────────────────────────────────────

.PHONY: argocd-install
argocd-install: ## Install ArgoCD into the argocd namespace
	bash scripts/install-argocd.sh

.PHONY: argocd-url
argocd-url: ## Print ArgoCD URL
	@echo "http://$(shell minikube ip):32001"

.PHONY: argocd-password
argocd-password: ## Print ArgoCD initial admin password
	@kubectl get secret argocd-initial-admin-secret -n argocd -o jsonpath="{.data.password}" | base64 -d && echo

.PHONY: argocd-configure
argocd-configure: ## Configure ArgoCD (requires GITHUB_USERNAME and GITHUB_TOKEN env vars)
	bash scripts/configure-argocd.sh

# ─── Help ─────────────────────────────────────────────────────────────────────

.PHONY: help
help: ## Show this help message
	@echo ""
	@echo "  OmniMind — available make targets"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'
	@echo ""
