#!/usr/bin/env bash
# =============================================================================
# OmniMind — Local development setup (idempotent)
# Usage: bash scripts/setup-local.sh
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$ROOT_DIR/.env"
ENV_EXAMPLE="$ROOT_DIR/.env.example"

log()  { echo "[setup] $*"; }
ok()   { echo "[setup] ✓ $*"; }
err()  { echo "[setup] ✗ $*" >&2; exit 1; }

# ── 1. Docker running check ──────────────────────────────────────────────────
log "Checking Docker..."
docker info > /dev/null 2>&1 || err "Docker is not running. Start Docker Desktop first."
ok "Docker is running"

# ── 2. Ensure .env exists ────────────────────────────────────────────────────
if [[ ! -f "$ENV_FILE" ]]; then
  log ".env not found — copying from .env.example"
  cp "$ENV_EXAMPLE" "$ENV_FILE"
  ok ".env created from template"
else
  ok ".env already exists"
fi

# ── 3. Replace placeholder SECRET_KEY ───────────────────────────────────────
PLACEHOLDER="REPLACE_WITH_OUTPUT_OF_openssl_rand_-hex_64"
if grep -q "$PLACEHOLDER" "$ENV_FILE"; then
  log "Generating real SECRET_KEY..."
  NEW_KEY=$(openssl rand -hex 64)
  # portable sed: works on Linux and macOS
  sed -i.bak "s|SECRET_KEY=.*|SECRET_KEY=$NEW_KEY|" "$ENV_FILE" && rm -f "${ENV_FILE}.bak"
  ok "SECRET_KEY generated"
fi

# ── 4. Build and start the stack ─────────────────────────────────────────────
log "Building and starting all services..."
cd "$ROOT_DIR"
docker compose up --build -d
ok "Stack started"

# ── 5. Wait for backend healthcheck ─────────────────────────────────────────
log "Waiting for backend to become healthy (up to 120s)..."
TIMEOUT=120
ELAPSED=0
until curl -sf http://localhost:8000/api/v1/health > /dev/null 2>&1; do
  if [[ $ELAPSED -ge $TIMEOUT ]]; then
    err "Backend did not become healthy within ${TIMEOUT}s. Run: docker compose logs backend"
  fi
  sleep 3
  ELAPSED=$((ELAPSED + 3))
done
ok "Backend is healthy (${ELAPSED}s)"

# ── 6. Print success ──────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║           OmniMind is up and running!                    ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  Frontend  →  http://localhost:3000                      ║"
echo "║  Backend   →  http://localhost:8000/docs                 ║"
echo "║  Nginx     →  http://localhost                           ║"
echo "║  pgAdmin   →  http://localhost:5050                      ║"
echo "║  Mailpit   →  http://localhost:8025                      ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  Admin:  admin@omnimind.local / AdminPass123!            ║"
echo "║  User:   user@omnimind.local  / UserPass123!             ║"
echo "╚══════════════════════════════════════════════════════════╝"
