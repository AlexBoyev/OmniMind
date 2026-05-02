# OmniMind User Guide

## Quick Start

```bash
# Start the stack
docker compose up -d

# Wait ~30 seconds, then open:
http://localhost:3000
```

**Login credentials:**
- Admin: `admin@omnimind.local` / `AdminPass123!`
- User: `user@omnimind.local` / `UserPass123!`

---

## App Routes

### Main Routes

| URL | Description |
|-----|-------------|
| http://localhost:3000/login | Login page |
| http://localhost:3000/register | Register a new account |
| http://localhost:3000/dashboard | Main dashboard (after login) |
| http://localhost:3000/overview | Project overview page |
| http://localhost:3000/jarvis | Full-page AI chat with Claude |
| http://localhost:3000/profile | Your profile and settings |

### Admin Routes (admin account required)

| URL | Description |
|-----|-------------|
| http://localhost:3000/admin/overview | Live status of all services |
| http://localhost:3000/admin/users | Create, edit, deactivate users |
| http://localhost:3000/admin/audit-log | Security audit event log |
| http://localhost:3000/admin/env | Edit environment variables (API keys, etc.) |
| http://localhost:3000/admin/settings | System settings |

---

## Service URLs

### Always Available (Docker Compose)

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | — |
| Backend API docs | http://localhost:8001/docs | — |
| pgAdmin | http://localhost:5050 | admin@omnimind.local / pgadmin_password |
| Mailpit (dev email) | http://localhost:8025 | — |

### Kubernetes Services (requires Minikube)

Start port-forwards first:
```bash
bash scripts/setup-port-forwards.sh
# Keep the terminal open (or run in background with nohup)
```

| Service | URL | Credentials |
|---------|-----|-------------|
| Jenkins | http://localhost:32000 | admin / (see below) |
| ArgoCD | http://localhost:32001 | admin / (see below) |
| Grafana | http://localhost:32002 | admin / changeme_grafana |
| Prometheus | http://localhost:32003 | — |

To get Jenkins and ArgoCD passwords:
```bash
bash scripts/get-urls.sh
# Windows:
.\scripts\get-urls.ps1
```

---

## Accessing omnimind.local (Kubernetes ingress)

1. Start Minikube:
   ```bash
   minikube start --cpus=4 --memory=8192 --driver=docker
   ```

2. Get the Minikube IP:
   ```bash
   minikube ip
   # Example: 192.168.49.2
   ```

3. Add to your hosts file (requires Administrator/sudo):
   - **Windows**: Edit `C:\Windows\System32\drivers\etc\hosts`
   - **Linux/macOS**: Edit `/etc/hosts`
   - Add line: `192.168.49.2 omnimind.local` (use your actual IP)

4. Open http://omnimind.local in your browser.

---

## Jarvis AI Chat

Jarvis is an AI assistant powered by Anthropic's Claude.

- Open http://localhost:3000/jarvis after logging in
- Start a conversation — Jarvis can answer questions, help with code, and query app data (if logged in as admin)
- Admin users get extra tools: user count, audit events, failed login stats

To enable Jarvis: set `ANTHROPIC_API_KEY` in your `.env` file, then restart the backend:
```bash
docker compose restart backend
```

---

## Telegram Bot

If configured, the Telegram bot mirrors the Jarvis chat interface.

1. Set `TELEGRAM_BOT_TOKEN` in `.env`
2. Restart backend: `docker compose restart backend`
3. Open http://localhost:3000/admin/env to verify the token is set
4. Get the bot link from `/admin/env` or from the BotFather

---

## Troubleshooting

### Frontend shows blank page or crashes
```bash
docker compose logs frontend --tail=30
docker compose restart frontend
```

### Backend returns 500 errors
```bash
docker compose logs backend --tail=30
# Check DB connection:
docker compose exec backend python -c "from app.db.session import engine; print('OK')"
```

### Database migration failed
```bash
docker compose exec backend alembic current
docker compose exec backend alembic upgrade head
```

### Port already in use
```bash
# Find what's using port 3000:
# Windows:
netstat -ano | findstr :3000
# Linux:
lsof -i :3000
```

### Full reset
```bash
docker compose down -v    # removes volumes (wipes DB)
docker compose up -d
```
