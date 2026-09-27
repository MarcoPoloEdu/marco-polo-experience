#!/usr/bin/env bash
# Idempotent Cloud Agent install for Marco Polo Experience.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[cloud-agent-install] node=$(node -v) npm=$(npm -v)"

# Refresh deps from the lockfile (idempotent).
npm ci

upsert_env() {
  local key="$1"
  local value="$2"
  local file=".env.local"
  touch "$file"
  chmod 600 "$file" || true
  if [[ -z "$value" ]]; then
    return 0
  fi
  python3 - "$file" "$key" "$value" <<'PY'
import sys
from pathlib import Path
path, key, value = Path(sys.argv[1]), sys.argv[2], sys.argv[3]
lines = path.read_text(encoding="utf-8").splitlines() if path.exists() else []
out = []
found = False
for line in lines:
    if line.startswith(f"{key}="):
        if "\n" in value or any(c in value for c in ' #"\''):
            escaped = value.replace("\\", "\\\\").replace('"', '\\"')
            out.append(f'{key}="{escaped}"')
        else:
            out.append(f"{key}={value}")
        found = True
    else:
        out.append(line)
if not found:
    if "\n" in value or any(c in value for c in ' #"\''):
        escaped = value.replace("\\", "\\\\").replace('"', '\\"')
        out.append(f'{key}="{escaped}"')
    else:
        out.append(f"{key}={value}")
path.write_text("\n".join(out) + "\n", encoding="utf-8")
PY
}

if [[ ! -f .env.local ]]; then
  cp .env.example .env.local
  chmod 600 .env.local || true
  echo "[cloud-agent-install] seeded .env.local from .env.example"
fi

for key in \
  NEXT_PUBLIC_FIREBASE_API_KEY \
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN \
  NEXT_PUBLIC_FIREBASE_PROJECT_ID \
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET \
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID \
  NEXT_PUBLIC_FIREBASE_APP_ID \
  FIREBASE_PROJECT_ID \
  FIREBASE_CLIENT_EMAIL \
  FIREBASE_PRIVATE_KEY \
  EDVISOR_API_KEY \
  EDVISOR_API_URL \
  STRIPE_SECRET_KEY \
  STRIPE_WEBHOOK_SECRET \
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY \
  RESEND_API_KEY \
  BOOKING_FROM_EMAIL \
  MPE_INTERNAL_EMAIL \
  NEXT_PUBLIC_APP_URL
do
  if [[ -n "${!key:-}" ]]; then
    upsert_env "$key" "${!key}"
  fi
done

echo "[cloud-agent-install] done"
