# Manual checks (things audit.py cannot see)

Ask the user to confirm these or check via dashboard/CLI. Mark anything unconfirmed as UNKNOWN.

## Workers Builds (Cloudflare dashboard: Workers & Pages > Worker > Settings > Build)

| Check | Expected |
|---|---|
| Git repo connected | Yes, production branch = `main` |
| Branch control > "Enable Preview Builds" | On |
| Existing Worker created before Worker Previews | The one-time "Set up Worker Previews" switch was completed (irreversible). New Workers use it by default |
| Preview command | `npx wrangler preview` (custom commands must invoke it). With DB migrations: `<pm> run db:migrate:preview && npx wrangler preview` |
| Deploy command (production) | `npx wrangler deploy`. With DB migrations: `<pm> run db:migrate:prod && npx wrangler deploy` |
| Build command | Runs on EVERY branch (production and preview). It must NOT contain migrations or anything that touches production |
| Build variables/secrets | Set per trigger, so production and preview builds can hold different values (for example different DB URLs for migrations) |
| Build token permissions | Can edit Workers Scripts plus the resources it uses (D1 Edit if D1 migrations run in the build) |
| Root directory (monorepo) | Points at the Worker being built; one Workers Builds connection per Worker |

## Preview naming

`wrangler preview` names a Preview after the git branch unless `--name` is given. The E2E workflow and the cleanup job must use the same name. Check one real PR: read the Preview URL in the Workers Builds PR comment and compare with the name the workflows compute. Branch names with `/` may be transformed; verify rather than assume.

## Cloudflare Access (internal Workers)

Preview URLs on workers.dev are public by default. For each Worker the user marked internal, confirm Access protects its Previews (account-wide, per Worker, or per hostname; see https://developers.cloudflare.com/workers/previews/custom-domains/). Verify from outside: `curl -sI <preview-url>` without credentials must be refused or redirected to the Access login, not return the app.

## Supabase / Hyperdrive

- Preview Hyperdrive config points at a SEPARATE Supabase project (not the production project, not a production schema).
- Runtime secrets for Previews live in Cloudflare (`wrangler preview base-config secret put NAME`), not in the repo.
- Supabase migrations for preview run in the preview command against the preview project only.

## Rollback readiness

- Migrations are backward compatible (expand/contract): `wrangler rollback` reverts code, not data or schema.
- The team knows the command: `npx wrangler rollback`.

## Container leftovers (only if Containers are used)

After a Preview is deleted a generated container app may remain: `npx wrangler containers list`. Report leftovers whose name starts with `<worker>_<preview>_`.
