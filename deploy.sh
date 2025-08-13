#!/bin/bash
set -e

echo "🛠️ Pulling latest code..."
git pull origin staging
echo " path docker-compose.yml : "
pwd
ls -la

echo "📦 Rebuilding Docker containers..."
docker compose -f sandbox/docker-compose.yml down
docker compose -f sandbox/docker-compose.yml up -d --build


echo "✅ Deployment completed at $(date)"
