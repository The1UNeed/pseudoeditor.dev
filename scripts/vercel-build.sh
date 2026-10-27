#!/usr/bin/env bash
set -euo pipefail

if [[ -e "convex/workspaceSyncSecret.ts" ]]; then
  echo "Refusing to deploy with convex/workspaceSyncSecret.ts present; workspace sync secrets must not be written to source." >&2
  exit 1
fi

if [[ -z "${CONVEX_DEPLOY_KEY:-}" ]]; then
  echo "CONVEX_DEPLOY_KEY is unset; skipping Convex deploy and building the web app only."
  pnpm --filter @pseudoeditor/web build
  exit 0
fi

# A preview build must never push functions to the production deployment.
if [[ "${VERCEL_ENV:-}" != "production" && "${CONVEX_DEPLOY_KEY}" == prod:* ]]; then
  echo "Refusing to deploy Convex from a ${VERCEL_ENV:-non-production} build with a production key; building the web app only."
  pnpm --filter @pseudoeditor/web build
  exit 0
fi

pnpm exec convex deploy \
  --cmd "pnpm --filter @pseudoeditor/web build" \
  --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL
