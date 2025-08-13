#!/usr/bin/env bash
set -euo pipefail

# =========================
# deploy.sh [staging|production]
# =========================
ENVIRONMENT="${1:-staging}"

WORKDIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="$WORKDIR/sandbox/docker-compose.yml"
LOGFILE="$WORKDIR/deploy.log"

# Nguồn .env nếu có (để lấy APP_HEALTH_URL, HEALTH_TIMEOUT, ...)
if [ -f "$WORKDIR/.env" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$WORKDIR/.env"
  set +a
fi

# URL health-check (mặc định 3000)
APP_HEALTH_URL="${APP_HEALTH_URL:-http://localhost:3000/health}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-90}" # giây

# Ghi log ra file + console
exec > >(tee -a "$LOGFILE") 2>&1

echo "🚀 Deploying to $ENVIRONMENT..."

# Kiểm tra docker/compose
command -v docker >/dev/null || { echo "❌ Docker chưa cài."; exit 1; }
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif docker-compose version >/dev/null 2>&1; then
  DC="docker-compose"
else
  echo "❌ Không tìm thấy docker compose."; exit 1
fi

# Kiểm tra compose file
[ -f "$COMPOSE_FILE" ] || { echo "❌ Không thấy $COMPOSE_FILE"; exit 1; }

pushd "$WORKDIR" >/dev/null

# Lưu commit hiện tại để rollback
PREV_COMMIT="$(git rev-parse HEAD || echo "")"

# Chuyển branch theo môi trường
# Thực tế hay dùng: staging -> branch 'staging', production -> 'main'
TARGET_BRANCH="$ENVIRONMENT"
[ "$ENVIRONMENT" = "production" ] && TARGET_BRANCH="main"

echo "📦 Checkout branch: $TARGET_BRANCH"
git fetch origin "$TARGET_BRANCH" || true
git checkout "$TARGET_BRANCH"
git pull origin "$TARGET_BRANCH" || true

# Rebuild + up
echo "🔧 Rebuilding containers..."
$DC -f "$COMPOSE_FILE" up -d --build

# Health check
echo "⏱ Chờ health-check: $APP_HEALTH_URL (timeout ${HEALTH_TIMEOUT}s)"
deadline=$((SECONDS + HEALTH_TIMEOUT))
until curl -fsS "$APP_HEALTH_URL" >/dev/null; do
  if (( SECONDS > deadline )); then
    echo "❌ Health-check FAIL. Thực hiện rollback về $PREV_COMMIT"
    if [ -n "$PREV_COMMIT" ]; then
      git reset --hard "$PREV_COMMIT"
      $DC -f "$COMPOSE_FILE" up -d --build
    else
      echo "⚠️ Không xác định được PREV_COMMIT, bỏ qua rollback code."
    fi
    exit 1
  fi
  sleep 3
done

echo "✅ Deployment to $ENVIRONMENT completed."
popd >/dev/null



# #!/bin/bash
# set -e

# echo "🛠️ Pulling latest code..."
# git pull origin staging
# echo " path docker-compose.yml : "
# pwd
# ls -la

# echo "📦 Rebuilding Docker containers..."
# docker compose -f sandbox/docker-compose.yml down
# docker compose -f sandbox/docker-compose.yml up -d --build


# echo "✅ Deployment completed at $(date)"

