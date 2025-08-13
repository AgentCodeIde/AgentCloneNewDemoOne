#!/bin/bash
set -e

echo "🔍 Detecting project type..."

if ls *.csproj >/dev/null 2>&1; then
    echo "📦 Detected .NET C# project"
    echo "⏳ dotnet restore start at $(date)"
    dotnet restore
    echo "⏳ dotnet build start at $(date)"
    dotnet build --no-restore
    echo "⏳ dotnet test start at $(date)"
    dotnet test --no-build --logger "console;verbosity=detailed"

elif [ -f "package.json" ]; then
    echo "📦 Detected Node.js project"
    echo "⏳ npm install start at $(date)"
    npm install
    echo "⏳ npm test start at $(date)"
    npm test -- --passWithNoTests

elif ls *.py >/dev/null 2>&1 && [ -f "requirements.txt" ]; then
    echo "📦 Detected Python project"
    echo "⏳ pip install start at $(date)"
    pip install -r requirements.txt
    echo "⏳ pytest start at $(date)"
    pytest

else
    echo "❌ No supported project type detected"
    exit 1
fi
