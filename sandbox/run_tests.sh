#!/bin/bash

# Dừng ngay lập tức nếu bất kỳ lệnh nào thất bại
set -e

echo "🔍 Detecting project type..."

# --- Node.js ---
if [ -f "package.json" ]; then
  echo "📦 Node.js project detected."
  echo "Installing dependencies..."
  npm install
  echo "Running tests..."
  # Lệnh 'npm test' bây giờ sẽ khiến toàn bộ script dừng lại nếu nó thất bại
  npm test

# --- .NET ---
elif [ $(find . -maxdepth 1 -name "*.csproj") ]; then
  echo "📦 .NET project detected."
  # ... (các phần khác giữ nguyên)

# --- Python ---
elif [ -f "requirements.txt" ]; then
  echo "📦 Python project detected."
  # ... (các phần khác giữ nguyên)

else
  echo "⚠️ No testable project detected."
  exit 0
fi

echo "✅ All tests passed!"