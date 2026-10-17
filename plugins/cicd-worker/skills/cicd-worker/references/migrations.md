# Migrations and rollback

## Why the placement matters

Workers Builds runs the **build command on every branch**, then:
- production branch: the **deploy command** (default `npx wrangler deploy`)
- other branches: the **Preview command** (default `npx wrangler preview`)

So a migration inside the build command would run for previews too (and with production credentials if configured that way). Put migrations only here:

| Where | Command (example, pnpm) |
|---|---|
| Deploy command (production) | `pnpm run db:migrate:prod && npx wrangler deploy` |
| Preview command | `pnpm run db:migrate:preview && npx wrangler preview` |

If the migration fails, `&&` stops the deploy: production keeps running the previous code.

Build variables and secrets are set per trigger in Workers Builds, so production and preview builds can hold different DB URLs. Build variables are not available at runtime.

## package.json scripts

D1:
```json
"db:migrate:prod": "wrangler d1 migrations apply DB --remote",
"db:migrate:preview": "wrangler d1 migrations apply PREVIEW_DB --remote --config wrangler.preview-migrations.jsonc"
```
The build token must be allowed to edit D1 (check the token in Workers Builds settings).

Supabase (Postgres behind Hyperdrive), with the Supabase CLI as a devDependency:
```json
"db:migrate:prod": "supabase db push --db-url \"$SUPABASE_PROD_DB_URL\"",
"db:migrate:preview": "supabase db push --db-url \"$SUPABASE_PREVIEW_DB_URL\""
```
Store each URL as a Workers Builds secret on the matching trigger only (production trigger holds the prod URL, preview trigger holds the preview URL). The preview trigger must never hold the production URL. The skill never reads or writes these values.

## Backward compatible migrations (expand/contract)

`wrangler rollback` reverts code, not data or schema. To keep a rollback safe, the previous code version must still work on the new schema:

1. Expand: add columns/tables as nullable or with defaults; do not rename or drop in the same release.
2. Deploy code that uses the new shape (still tolerates the old).
3. Contract: remove old columns in a LATER release, after the new code has been stable.

Flag any migration containing DROP, RENAME, NOT NULL without default, or type changes, and ask the user to split it.

## Shared preview database caution

All branches share one preview database. If two open PRs both add migrations, they can conflict. When you see this, tell the user to merge one first or temporarily give one branch its own database (override both `previews.d1_databases` and the preview migrations config on that branch).

## Rollback

```bash
npx wrangler rollback            # roll back to the previous production version
```
Then fix forward on a `fix/...` branch through the normal flow. If the bad release included a destructive migration, a code rollback alone is not enough; this is why step 3 above matters.
