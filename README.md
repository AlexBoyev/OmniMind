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
# 1. Copy and configure environment variables
cp .env.example .env
# Edit .env — at minimum, set SECRET_KEY to the value from phase 1 setup

# 2. Build and start the full stack (Linux/macOS/Git Bash)
make build

# 2. (Windows PowerShell)
.\make.ps1 build

# 3. Open the application
#    Frontend:  http://localhost:3000
#    Backend:   http://localhost:8000/docs
#    pgAdmin:   http://localhost:5050

# 4. Run database migrations and seed default users
make migrate
make seed
```

Default credentials after seeding:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@omnimind.local | Admin1234! |
| User | user@omnimind.local | User1234! |

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
| 2 | Backend MVP (FastAPI + Auth + DB + Seed) | Pending |
| 3 | Frontend MVP (React + Auth + RBAC) | Pending |
| 4 | Docker Compose Full Stack | Pending |
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
