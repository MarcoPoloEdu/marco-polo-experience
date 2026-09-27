#!/usr/bin/env bash
# Per-boot reconciliation for Marco Polo Experience Cloud Agents.
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -d node_modules/next ]] || [[ ! -f .env.local ]]; then
  echo "[cloud-agent-start] running install"
  ./scripts/cloud-agent-install.sh
fi

echo "[cloud-agent-start] ready"
