name: E2E Preview __WORKER__

# Runs E2E tests against the Preview that Workers Builds creates for this PR.
# Waits for the "Workers Builds: __WORKER__" check run, then tests the Preview URL.

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  checks: read
  pull-requests: read

concurrency:
  group: e2e-__WORKER__-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  e2e:
    name: "E2E (Preview: __WORKER__)"
    # Never expose credentials or run untrusted code from forks
    if: github.event.pull_request.head.repo.full_name == github.repository
    runs-on: ubuntu-latest
    timeout-minutes: 30
    env:
      GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      HEAD_SHA: ${{ github.event.pull_request.head.sha }}
      BRANCH: ${{ github.event.pull_request.head.ref }}
      # e.g. https://{branch}-__WORKER__.<subdomain>.workers.dev  (verify on the first real PR)
      PREVIEW_URL_TEMPLATE: ${{ vars.PREVIEW_URL_TEMPLATE___WORKER_VAR__ }}
    steps:
      - uses: actions/checkout@v4

      - name: Wait for Workers Builds
        run: |
          set -euo pipefail
          CHECK="Workers Builds: __WORKER__"
          for i in $(seq 1 80); do
            state="$(gh api "repos/${{ github.repository }}/commits/$HEAD_SHA/check-runs" \
              --jq ".check_runs[] | select(.name==\"$CHECK\") | \"\(.status):\(.conclusion // \"\")\"" | head -n1)"
            echo "[$i] $CHECK -> ${state:-not started}"
            case "$state" in
              completed:success) exit 0 ;;
              completed:*) echo "Workers Builds did not succeed: $state"; exit 1 ;;
            esac
            sleep 15
          done
          echo "Timed out waiting for $CHECK"; exit 1

      - name: Resolve Preview URL
        id: url
        run: |
          set -euo pipefail
          if [ -z "${PREVIEW_URL_TEMPLATE:-}" ]; then
            echo "Set repository variable PREVIEW_URL_TEMPLATE___WORKER_VAR__ (see references/workers-builds-setup.md)"; exit 1
          fi
          url="${PREVIEW_URL_TEMPLATE//\{branch\}/$BRANCH}"
          echo "url=$url" >> "$GITHUB_OUTPUT"
          echo "Preview URL: $url"

      - name: Wait until the Preview answers
        env:
          CF_ACCESS_CLIENT_ID: ${{ secrets.CF_ACCESS_CLIENT_ID }}
          CF_ACCESS_CLIENT_SECRET: ${{ secrets.CF_ACCESS_CLIENT_SECRET }}
        run: |
          # Internal Workers are behind Cloudflare Access: pass a service token if configured
          # (see references/access-and-secrets.md). Public Workers need no token.
          hdr=()
          if [ -n "${CF_ACCESS_CLIENT_ID:-}" ]; then
            hdr=(-H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET")
          fi
          for i in $(seq 1 20); do
            code="$(curl -s -o /dev/null -w '%{http_code}' "${hdr[@]}" "${{ steps.url.outputs.url }}__HEALTH_PATH__" || true)"
            echo "[$i] HTTP $code"
            [ "$code" = "200" ] && exit 0
            sleep 6
          done
          exit 1

__SETUP_STEPS__
      - name: Run E2E tests
        run: __PM_RUN__ test:e2e
        env:
          BASE_URL: ${{ steps.url.outputs.url }}
          # Optional, for Workers protected by Cloudflare Access
          CF_ACCESS_CLIENT_ID: ${{ secrets.CF_ACCESS_CLIENT_ID }}
          CF_ACCESS_CLIENT_SECRET: ${{ secrets.CF_ACCESS_CLIENT_SECRET }}
