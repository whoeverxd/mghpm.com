#!/usr/bin/env bash
# Runs inside `firebase emulators:exec` (auth + firestore already up).
# Starts Next.js on :3100 against the emulators, waits for it and runs every e2e suite.
set -euo pipefail

export FIREBASE_PROJECT_ID=demo-mghpm
export NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-mghpm
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
export FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
export PUBLIC_CATALOG_ORGANIZATION_ID=org-a
export GOOGLE_APPLICATION_CREDENTIALS=
export FIREBASE_BOOTSTRAP_ADMIN_UID=none
export LOCAL_STORAGE_DIR="${RUNNER_TEMP:-/tmp}/mghpm-storage"

npx next dev -p 3100 > next-e2e.log 2>&1 &
NEXT_PID=$!
trap 'kill "$NEXT_PID" 2>/dev/null || true' EXIT

for attempt in $(seq 1 120); do
  if curl -fsS -o /dev/null http://localhost:3100/login; then break; fi
  if ! kill -0 "$NEXT_PID" 2>/dev/null; then cat next-e2e.log; exit 1; fi
  sleep 2
done

status=0
npm run test:e2e || status=$?
if [ "$status" -ne 0 ]; then tail -200 next-e2e.log; fi
exit "$status"
