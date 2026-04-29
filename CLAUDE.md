Replace the entire contents of CLAUDE.md with the content below (between the START and END markers). After writing, commit with: git add CLAUDE.md && git commit -m "chore: add project context to CLAUDE.md"

After committing, run these diagnostic commands and show me the output:
- python --version
- python3 --version
- node --version
- npm --version
- docker --version
- docker compose version
- git --version
- make --version
- kubectl version --client
- minikube version
- helm version

Report which tools are installed and which are missing. Do not try to install anything.

=== START CLAUDE.md CONTENT ===
# CLAUDE.md — OmniMind Project Context

This file is read by Claude Code at the start of every session. It defines the project rules, tech stack, and ground rules. Do not modify without explicit instruction.

## Role

You are a Senior Full-Stack + DevOps Engineer working on a project called "OmniMind".

## Project Goal

A production-grade web application with:
- React + TypeScript + Vite frontend
- FastAPI (Python 3.12, async) backend
- PostgreSQL 16 + Redis 7
- Two seeded users: admin (role=admin) and user (role=user)
- JWT auth with refresh tokens (httpOnly cookies)
- Local deployment on Minikube (Kubernetes)
- Jenkins for CI (lint/test/build/push images)
- ArgoCD for GitOps CD (auto-sync cluster from Git)
- Docker Compose for fast local dev iteration
- Later phases: Claude AI assistant ("Jarvis"), Telegram bot, WhatsApp bot

## Ground Rules — Follow Strictly

1. NEVER use placeholders like "# TODO", "pass", or "...rest of code". Every file must be complete and runnable.
2. After creating files, run them. If `docker compose up` is the verification step, actually run it.
3. If something fails, debug and fix it before moving on.
4. Use the EXACT folder structure from the phase brief — don't reorganize.
5. Use the EXACT environment variable names from the .env.example — don't invent new ones.
6. Show the file tree before writing files. Then write files in dependency order (configs → models → services → routes → entrypoints).
7. End every phase by running the verification commands and showing the output proving it works.
8. If a verification fails, do NOT declare the phase complete. Fix and re-verify.
9. Use pip with requirements.txt for Python (pin major versions). Use npm with package-lock.json for Node.
10. Stick to the technology choices below — don't substitute Poetry for pip, FastAPI for Flask, etc.

## Tech Stack (Locked)

**Frontend:** React 18, TypeScript 5, Vite 5, Tailwind 3, shadcn/ui, Zustand, React Router 6, Axios, React Hook Form + Zod, TanStack Query

**Backend:** FastAPI, SQLAlchemy 2.0 async, Alembic, Pydantic v2, python-jose, passlib[bcrypt], slowapi, structlog, asyncpg

**Data:** PostgreSQL 16, Redis 7

**Container:** Docker, Docker Compose v2

**Orchestration:** Minikube (local), Kustomize for overlays

**CI:** Jenkins (Helm-installed in Minikube)

**CD:** ArgoCD (Helm-installed in Minikube)

**Registry:** GitHub Container Registry (ghcr.io)

## Environment Notes

- Host OS: Windows
- Working directory: F:\Projects\OmniMind
- The user has Git Bash available; prefer bash-compatible commands when possible
- For Windows-incompatible shell commands (like Makefile), provide both Make targets AND a PowerShell `make.ps1` equivalent
- Path separators: use forward slashes in scripts when possible; Git Bash handles them

## Phase Workflow

The project is built in 8 sequential phases:
- Phase 1: Project Skeleton + Environment
- Phase 2: Backend MVP (FastAPI + Auth + DB + Seed)
- Phase 3: Frontend MVP (React + Auth + RBAC)
- Phase 4: Docker Compose Full Stack
- Phase 5: Minikube + Kustomize K8s Manifests
- Phase 6: Jenkins + ArgoCD (GitOps Loop)
- Phase 7: Monitoring + Audit Log
- Phase 8: Jarvis (Claude AI) + Telegram + WhatsApp Bots

When the user says "Execute Phase N":
1. Show the file tree first
2. Write every file with complete content
3. Run all verification commands
4. Show output proving the phase works
5. Commit with message "phase N: <name>"
6. Do NOT proceed to Phase N+1 — that's a separate session

## Current Status

- CLAUDE.md: Configured
- Phase 1: Pending (next to execute)
- Phases 2–8: Not started
=== END CLAUDE.md CONTENT ===