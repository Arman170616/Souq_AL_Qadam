#!/usr/bin/env bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── Colors ────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}[run]${NC} $1"; }
warn() { echo -e "${YELLOW}[run]${NC} $1"; }
err()  { echo -e "${RED}[run]${NC} $1"; }

# ── 1. Start Docker Desktop if not running ────────────────────────────────────
if ! docker info >/dev/null 2>&1; then
  warn "Docker daemon not running — launching Docker Desktop..."
  open -a Docker
  echo -n "Waiting for Docker"
  until docker info >/dev/null 2>&1; do
    echo -n "."
    sleep 2
  done
  echo ""
  log "Docker is ready."
fi

# ── 2. Free conflicting ports (stop any containers that hold 6379 / 5433 / 8000) ──
PORTS=(6379 5433 8000)
for port in "${PORTS[@]}"; do
  # find container IDs whose port bindings include this host port
  containers=$(docker ps --format '{{.ID}} {{.Ports}}' | grep "0.0.0.0:${port}->" | awk '{print $1}')
  for cid in $containers; do
    name=$(docker inspect --format '{{.Name}}' "$cid" | tr -d '/')
    warn "Port $port is used by container '$name' — stopping it..."
    docker stop "$cid" >/dev/null
  done
done

# ── 3. Start backend services via Docker Compose ─────────────────────────────
log "Starting backend services (db, redis, backend, celery, celery-beat)..."
cd "$PROJECT_DIR"
docker compose up -d 2>&1 | grep -v "^time=" || true

# Wait for the backend container to actually accept requests
log "Waiting for Django to be ready..."
timeout=90
elapsed=0
until curl -sf http://localhost:8000/api/v1/ >/dev/null 2>&1 || \
      curl -sf http://localhost:8000/api/docs/ >/dev/null 2>&1; do
  sleep 2
  elapsed=$((elapsed + 2))
  if [ "$elapsed" -ge "$timeout" ]; then
    err "Backend did not become healthy within ${timeout}s."
    err "Check logs with: docker compose logs backend"
    exit 1
  fi
done
log "Backend is ready."

# ── 4. Print service table ────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  Backend services are running${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${GREEN}API${NC}             http://localhost:8000/api/v1/"
echo -e "  ${GREEN}API Docs${NC}        http://localhost:8000/api/docs/"
echo -e "  ${GREEN}Django Admin${NC}    http://localhost:8000/django-admin/"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Now start the frontend in a new terminal:"
echo -e "  ${YELLOW}cd frontend && npm run dev${NC}"
echo ""
echo "To stop backend services:  docker compose down"
