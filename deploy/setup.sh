#!/usr/bin/env bash
# One-time bootstrap script for a fresh Ubuntu 22.04+ VPS.
# Run as root or with sudo:  bash deploy/setup.sh
set -euo pipefail

APP_DIR="/opt/notes-app"
REPO_URL="https://github.com/gollerdev/notes-taking-app-challenge.git"

echo "==> Installing Docker..."
if ! command -v docker &>/dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable --now docker
else
    echo "    Docker already installed, skipping."
fi

echo "==> Installing Docker Compose plugin..."
if ! docker compose version &>/dev/null; then
    apt-get update && apt-get install -y docker-compose-plugin
else
    echo "    Docker Compose already installed, skipping."
fi

echo "==> Cloning repository to ${APP_DIR}..."
if [ ! -d "${APP_DIR}" ]; then
    git clone "${REPO_URL}" "${APP_DIR}"
else
    echo "    ${APP_DIR} already exists, pulling latest..."
    cd "${APP_DIR}" && git pull origin main
fi

cd "${APP_DIR}"

echo "==> Checking for .env.production..."
if [ ! -f .env.production ]; then
    echo "    ERROR: .env.production not found."
    echo "    Copy the example and fill in real values:"
    echo "      cp .env.production.example .env.production"
    echo "      nano .env.production"
    exit 1
fi

echo "==> Starting services..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

echo "==> Waiting for services to be healthy..."
sleep 15

echo "==> Running healthcheck..."
DOMAIN=$(grep '^DOMAIN=' .env.production | cut -d= -f2)
if curl -f "https://${DOMAIN}/api/v1/health/"; then
    echo ""
    echo "==> Setup complete! App is live at https://${DOMAIN}"
else
    echo ""
    echo "==> WARNING: Healthcheck failed. Check logs with:"
    echo "    docker compose -f docker-compose.prod.yml logs"
fi
