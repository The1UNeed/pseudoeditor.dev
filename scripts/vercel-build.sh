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

# Copies a Vercel setting into the production Convex deployment. Only an admin deploy key can write
# production Convex variables, and the production build holds one, so Vercel is the single place to
# set them. The value goes in through stdin, so it never appears in the command line or the build log.
sync_convex_env() {
  local name=$1 value=$2
  if [[ -z "$value" ]]; then
    echo "$name is unset in Vercel; leaving it unchanged on Convex."
    return
  fi
  printf '%s' "$value" | pnpm exec convex env set "$name" >/dev/null
  echo "Synced $name to Convex."
}

if [[ "${VERCEL_ENV:-}" == "production" && "${CONVEX_DEPLOY_KEY}" == prod:* ]]; then
  # Account analytics (convex/analytics.ts) use the same public project key as the browser.
  sync_convex_env POSTHOG_PROJECT_KEY "${NEXT_PUBLIC_POSTHOG_KEY:-}"
  # Verifies Clerk's user.created and user.deleted webhook (convex/http.ts).
  sync_convex_env CLERK_WEBHOOK_SECRET "${CLERK_WEBHOOK_SECRET:-}"
fi

pnpm exec convex deploy \
  --cmd "pnpm --filter @pseudoeditor/web build" \
  --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL
