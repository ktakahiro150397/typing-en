#!/bin/bash
set -e

echo "Pulling latest images..."
docker pull ghcr.io/ktakahiro150397/typing-en-backend:latest
docker pull ghcr.io/ktakahiro150397/typing-en-frontend:latest

echo "Restarting services..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

echo "Cleaning up old images..."
docker image prune -f

echo "Deploy complete."
