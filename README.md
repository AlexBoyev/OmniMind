# OmniMind

Production-grade full-stack application with React, FastAPI, PostgreSQL, Redis, deployed on Kubernetes with GitOps.

## Overview

OmniMind is a multi-user web platform featuring JWT authentication, role-based access control (admin/user), and an AI assistant ("Jarvis") powered by Claude. It is deployed locally on Minikube using ArgoCD for GitOps-driven continuous delivery and Jenkins for CI.

## Prerequisites

| Tool | Minimum Version | Notes |
|------|----------------|-------|
| Docker Desktop | 4.x | With Docker Compose v2 |
| Python | 3.12 | For local backend dev |
| Node.js | 20.x | For local frontend dev |
| Minikube | 1.32+ | Local Kubernetes cluster |
| kubectl | 1.29+ | Kubernetes CLI |
| helm | 3.14+ | Package manager for K8s |
| make | any | Linux/macOS/Git Bash |

## Quick Start

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit .env — set these three secrets (all others have safe defaults):
#    SECRET_KEY    → openssl rand -hex 64
#    POSTGRES_PASSWORD → openssl rand -base64 32
#    REDIS_PASSWORD    → openssl rand -base64 32
#    Or just run: bash scripts/setup-local.sh

# 3. Build and start the full stack (Linux/macOS/Git Bash)
docker compose up --build -d
# (Windows PowerShell)
.\make.ps1 build

# 4. Wait ~30s for migrations to complete, then open:
#    Frontend:  http://localhost:3000
#    Backend:   http://localhost:8000/docs
#    pgAdmin:   http://localhost:5050
#    Mailpit:   http://localhost:8025

# 5. Login as admin
#    http://localhost:3000  →  admin@omnimind.local / AdminPass123!
```

Default credentials after seeding:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@omnimind.local | AdminPass123! |
| User | user@omnimind.local | UserPass123! |

## Project Structure

```
OmniMind/
├── frontend/          # React 18 + TypeScript + Vite + Tailwind
├── backend/           # FastAPI + SQLAlchemy 2.0 async + Alembic
├── nginx/             # Reverse-proxy config
├── k8s/               # Kubernetes manifests (base + overlays)
├── jenkins/           # Jenkins pipeline definitions
├── argocd/            # ArgoCD Application/Project manifests
├── monitoring/        # Prometheus, Grafana, Loki configs
├── scripts/           # Utility shell scripts
├── docs/              # Project documentation
├── docker-compose.yml # Full local dev stack
├── Makefile           # Dev workflow shortcuts (Linux/macOS/Git Bash)
└── make.ps1           # Dev workflow shortcuts (Windows PowerShell)
```

## Available Commands

```bash
make help             # List all targets
make build            # Build images and start stack
make up               # Start stack (no rebuild)
make down             # Stop stack
make logs             # Follow all logs
make migrate          # Run DB migrations
make seed             # Seed default users
make test             # Run all tests
make lint             # Lint backend + frontend
make clean            # Remove containers, volumes, images
make minikube-up      # Start Minikube cluster
make minikube-deploy  # Deploy staging to Minikube
```

## Development

See [docs/PHASES.md](docs/PHASES.md) for the 8-phase development workflow.

### Phase Summary

| Phase | Name | Status |
|-------|------|--------|
| 1 | Project Skeleton + Environment | Complete |
| 2 | Backend MVP (FastAPI + Auth + DB + Seed) | Complete |
| 3 | Frontend MVP (React + Auth + RBAC) | Complete |
| 4 | Docker Compose Full Stack | Complete |
| 5 | Minikube + Kustomize K8s Manifests | Pending |
| 6 | Jenkins + ArgoCD (GitOps Loop) | Pending |
| 7 | Monitoring + Audit Log | Pending |
| 8 | Jarvis (Claude AI) + Telegram + WhatsApp Bots | Pending |

## Tech Stack

- **Frontend:** React 18, TypeScript 5, Vite 5, Tailwind CSS 3, shadcn/ui, Zustand, React Router 6
- **Backend:** FastAPI, SQLAlchemy 2.0 async, Alembic, Pydantic v2, python-jose, structlog
- **Data:** PostgreSQL 16, Redis 7
- **Container:** Docker, Docker Compose v2
- **Orchestration:** Minikube, Kustomize
- **CI:** Jenkins (Helm-installed in Minikube)
- **CD:** ArgoCD (GitOps, Helm-installed in Minikube)
- **Registry:** GitHub Container Registry (ghcr.io)
