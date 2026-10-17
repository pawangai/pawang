# Secrets, variables and Access

Principle: the skill prints commands; the user types secret values. Never ask for a secret in chat, never write one to a file, never echo one.

## GitHub (CI secrets and variables)

| Name | Kind | Used by |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | secret | preview-cleanup (`wrangler preview delete`). Token needs edit rights for Workers Scripts and the resources of the Preview |
| `CLOUDFLARE_ACCOUNT_ID` | secret | preview-cleanup |
| `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET` | secret (optional) | E2E against Access-protected Previews |
| `PREVIEW_URL_TEMPLATE_<WORKER>` | variable | E2E workflow |
| E2E test credentials | secret | E2E tests, scoped to the PREVIEW environment only |

```bash
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID
gh variable set PREVIEW_URL_TEMPLATE_MY_API --body "https://{branch}-my-api.<subdomain>.workers.dev"
```

Secrets are not available to forked PRs by default. All templates guard Cloudflare-credential jobs with `github.event.pull_request.head.repo.full_name == github.repository`; keep that guard.

## Cloudflare (runtime secrets for Previews)

```bash
npx wrangler preview base-config secret put SECRET_NAME      # new Previews
npx wrangler preview secret put SECRET_NAME --name <branch>  # one Preview
```
Production runtime secrets stay as they are (`wrangler secret put`). Preview secrets must be preview-safe values (preview Supabase keys, test API keys), never production ones.

## Workers Builds secrets

Per trigger in the dashboard (see workers-builds-setup.md). Production trigger and preview trigger hold different values.
