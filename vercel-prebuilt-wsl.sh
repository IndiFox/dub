#!/usr/bin/env bash
# Prebuilt deploy from WSL (use this if local build crashes on Windows with exit 3221225477/3221226505).
# From repo root in WSL: bash vercel-prebuilt-wsl.sh
# Requires: vercel CLI, pnpm, node. Copy AUTH_BEARER_TOKEN from apps/web/.env and export TOKEN=... before running, or pass as first arg.

set -e
cd "$(dirname "$0")"
TOKEN="${1:-$TOKEN}"

echo "Step 0: vercel pull --yes ..."
vercel pull --yes ${TOKEN:+--token "$TOKEN"}

export NODE_OPTIONS="--max-old-space-size=5120"
echo "Step 1/2: vercel build (may take 30+ min)..."
vercel build

echo "Step 2/2: vercel deploy --prebuilt --prod --yes ..."
vercel deploy --prebuilt --prod --yes ${TOKEN:+--token "$TOKEN"}

echo "Done."
