#!/bin/bash
set -e

echo "🛠️ Pulling latest code..."
git pull origin staging

echo "📦 Rebuilding Docker containers..."
docker compose down
docker compose up -d --build

echo "✅ Deployment completed at $(date)"
