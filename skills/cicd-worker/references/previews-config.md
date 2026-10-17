# Preview configuration reference

Source: https://developers.cloudflare.com/workers/previews/configuration/ and /resources/ (re-check; feature is new).

## Where settings live

- Top level = production. `previews` block = every Preview. Previews do NOT inherit production settings.
- `previews` is required, but may be empty.
- Top level only: `assets`, `compatibility_date`, `compatibility_flags`.
- Needs its own entry in `previews`: `vars`, storage/data bindings (KV, D1, R2, Hyperdrive, Vectorize, Analytics Engine, Pipelines, Secrets Store), Queue producers, Workflows, `define`, `tail_consumers`.
- Do not put Queue consumers, Cron Triggers or routes in `previews`; they do not target Previews.
- If `wrangler preview` warns that bindings are missing, the URL is live but incomplete: copy the missing bindings into `previews` with preview-safe values.

## Binding matrix (what isolates, what needs a separate resource)

| Binding | Isolation |
|---|---|
| Durable Objects / Containers | Automatic per Preview. If code reads `env.<DO>`, also declare it in `previews.durable_objects.bindings`, otherwise the Worker can return error 1101. Containers are not inherited: declare in `previews.containers` too |
| `kv_namespaces`, `d1_databases`, `r2_buckets`, `vectorize`, `analytics_engine_datasets`, `pipelines` | Only if `previews` points at a different resource (id / database_id / bucket_name / index_name / dataset) |
| `hyperdrive` | Needs a separate Hyperdrive config pointing at a separate database or schema, created manually |
| `queues.producers` | Separate queue. Consumers cannot target a Preview; messages sent to a production queue are consumed by production |
| `workflows` | Binds to an existing Workflow (shared instances). Deploy a dedicated non-production Workflow for isolation |
| Service bindings | Preview calls the bound Worker's PRODUCTION deployment. Use `ctx.exports` for same-Worker calls |
| Cron Triggers, routes | Production only. Test scheduled logic through a test route on the Preview URL |

## Example `previews` block (JSONC)

```jsonc
{
  "name": "my-api",
  "compatibility_date": "2026-10-13",
  "vars": { "ENVIRONMENT": "production" },
  "d1_databases":  [{ "binding": "DB",      "database_name": "my-api",         "database_id": "<PROD_D1_ID>" }],
  "kv_namespaces": [{ "binding": "CACHE",   "id": "<PROD_KV_ID>" }],
  "r2_buckets":    [{ "binding": "UPLOADS", "bucket_name": "my-api-uploads" }],
  "hyperdrive":    [{ "binding": "SUPABASE","id": "<PROD_HYPERDRIVE_ID>" }],
  "previews": {
    "vars": { "ENVIRONMENT": "preview" },
    "d1_databases":  [{ "binding": "DB",      "database_name": "my-api-preview", "database_id": "<PREVIEW_D1_ID>" }],
    "kv_namespaces": [{ "binding": "CACHE",   "id": "<PREVIEW_KV_ID>" }],
    "r2_buckets":    [{ "binding": "UPLOADS", "bucket_name": "my-api-uploads-preview" }],
    "hyperdrive":    [{ "binding": "SUPABASE","id": "<PREVIEW_HYPERDRIVE_ID>" }]
  }
}
```

## D1 preview migrations file

`wrangler.preview-migrations.jsonc` (same database as `previews.d1_databases`):

```jsonc
{
  "d1_databases": [
    { "binding": "PREVIEW_DB", "database_name": "my-api-preview", "database_id": "<PREVIEW_D1_ID>", "migrations_dir": "migrations" }
  ]
}
```

Apply: `npx wrangler d1 migrations apply PREVIEW_DB --remote --config wrangler.preview-migrations.jsonc`. If several Previews share one database, apply once per push, not once per Preview.

## Creating preview resources (each one only after the user confirms)

```bash
npx wrangler d1 create <name>-preview
npx wrangler kv namespace create <NAME>_PREVIEW
npx wrangler r2 bucket create <name>-uploads-preview
# Hyperdrive: the USER runs this; the connection string is a secret.
npx wrangler hyperdrive create <name>-preview --connection-string "$PREVIEW_SUPABASE_DB_URL"
```

Use the returned IDs in the `previews` block. Supabase: connect Hyperdrive to the SEPARATE Supabase preview project (use the pooler/direct connection string Supabase documents for Hyperdrive), never to production.

## Secrets for Previews

```bash
npx wrangler preview base-config secret put SECRET_NAME      # for every NEW Preview
npx wrangler preview secret put SECRET_NAME --name <branch>  # one Preview only
```
Changes to base secrets affect only Previews created afterwards.

## Plan limits

100 Previews per Worker on Free, 500 on paid; 100 deployments per Preview. At a limit Cloudflare deletes the least recently used Preview / oldest deployment. This is why the cleanup job exists.
