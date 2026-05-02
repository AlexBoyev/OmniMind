# OmniMind

Production-grade full-stack AI platform: React 18 + FastAPI + PostgreSQL + Redis, deployed on Kubernetes with GitOps.

## Overview

OmniMind is a multi-user web platform with JWT authentication, role-based access control (admin/user), an AI assistant ("Jarvis") powered by Claude, Telegram and WhatsApp bots, a full monitoring stack, and a GitOps CI/CD pipeline on Minikube.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Backend | FastAPI, Python 3.12, SQLAlchemy (async), Alembic, Pydantic v2 |
| Frontend | React 18, TypeScript, Tailwind CSS, Zustand, TanStack Query, Framer Motion, Radix UI |
| AI / Bots | Anthropic Claude (`claude-opus-4-7`), streaming, tool use · Telegram · WhatsApp (Twilio) |
| Database | PostgreSQL 16, Redis 7 |
| DevOps | Docker Compose, Kubernetes (Minikube), Kustomize, Sealed Secrets, HPA |
| CI/CD | Jenkins (Helm), ArgoCD (GitOps) |
| Monitoring | Prometheus, Grafana, Loki |
| Auth | JWT (access + refresh tokens), bcrypt, rate limiting, audit log |

## Quick Start

```bash
# 1. Clone and configure
git clone https://github.com/AlexBoyev/OmniMind
cd OmniMind
cp .env.example .env
# Edit .env: set SECRET_KEY, POSTGRES_PASSWORD, REDIS_PASSWORD, ANTHROPIC_API_KEY

# 2. Start
docker compose up -d

# 3. Wait ~30s, then open
#    Frontend:  http://localhost:3000
#    API docs:  http://localhost:8001/docs
#    pgAdmin:   http://localhost:5050
#    Mailpit:   http://localhost:8025
```

**Default credentials:**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@omnimind.local | AdminPass123! |
| User | user@omnimind.local | UserPass123! |

## Routes

### User
| Path | Description |
|------|-------------|
| `/login` | Login |
| `/register` | Register |
| `/dashboard` | Main dashboard |
| `/overview` | Project overview |
| `/jarvis` | AI chat (Claude) |
| `/profile` | User profile |

### Admin (admin role required)
| Path | Description |
|------|-------------|
| `/admin/overview` | Infrastructure status cards |
| `/admin/users` | User management |
| `/admin/audit-log` | Security audit events |
| `/admin/env` | Environment variable manager |
| `/admin/settings` | System settings |

## Services

| Service | URL | Notes |
|---------|-----|-------|
| Frontend | http://localhost:3000 | React SPA |
| Backend API | http://localhost:8001/docs | FastAPI Swagger |
| pgAdmin | http://localhost:5050 | PostgreSQL UI |
| Mailpit | http://localhost:8025 | Dev email inbox |
| Jenkins | http://localhost:32000 | CI (requires Minikube + port-forward) |
| ArgoCD | http://localhost:32001 | CD (requires Minikube + port-forward) |
| Grafana | http://localhost:32002 | Dashboards (requires Minikube + port-forward) |
| Prometheus | http://localhost:32003 | Metrics (requires Minikube + port-forward) |

For Minikube services: `bash scripts/setup-port-forwards.sh`

## Commands

```bash
make up          # Start all services
make down        # Stop services
make logs        # Tail all logs
make migrate     # Run DB migrations
make seed        # Seed admin + user accounts
make test        # Run full test suite
make lint        # Lint backend + frontend

make urls        # Print all URLs and passwords  (Windows: .\scripts\get-urls.ps1)
make tunnels     # Start kubectl port-forwards for Minikube services
make sync-urls   # Update .env with current Minikube URLs

# Kubernetes
make minikube-up          # Start Minikube (4 CPUs, 8 GB)
make minikube-deploy      # Deploy staging overlay
make minikube-status      # Cluster status
make monitoring-install   # Install Prometheus + Grafana + Loki
make jenkins-install      # Install Jenkins via Helm
make argocd-install       # Install ArgoCD
```

## Project Structure

```
OmniMind/
├── backend/           # FastAPI app (api/, core/, models/, services/, db/)
├── frontend/          # React 18 SPA (pages/, components/, stores/)
├── k8s/               # Kubernetes manifests (base/ + overlays/staging/)
├── scripts/           # Utility scripts (get-urls.sh/.ps1, port-forwards, etc.)
├── docs/              # User guide, route reference
├── docker-compose.yml
└── Makefile
```

## Development Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | Project skeleton + environment | Complete |
| 2 | Backend MVP (FastAPI + auth + DB) | Complete |
| 3 | Frontend MVP (React + auth + RBAC) | Complete |
| 4 | Docker Compose full stack | Complete |
| 5 | Minikube + Kustomize K8s manifests | Complete |
| 6 | Jenkins + ArgoCD GitOps pipeline | Complete |
| 7 | Prometheus + Grafana + Loki + audit log | Complete |
| 8 | Jarvis AI (Claude) + Telegram + WhatsApp bots | Complete |
| 9 | Frontend redesign (dark theme, admin dashboard) | Complete |
| 10 | Fix all packages, Minikube access, complete setup | Complete |
| 11 | Framer-motion fix, scripts, user guides | Complete |

## Documentation

- [User Guide](docs/USER_GUIDE.md) — how to use the app
- [Route Reference](docs/ROUTES.md) — complete frontend and API route table
