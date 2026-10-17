# Workers Builds checklist (dashboard; cannot be done from the repo)

Cloudflare dashboard > Workers & Pages > <Worker> > Settings > Build.

1. **Git connection**: repository connected, production branch = `main`.
2. **Branch control > Enable Preview Builds**: on. Every push to a non-production branch then runs the build command followed by the Preview command.
3. **Existing Worker (created before Worker Previews)**: choose "Set up Worker Previews" in the banner. It is a one-time, irreversible switch; configure the `previews` block first (previews do not use production settings). New Workers already use Worker Previews.
4. **Preview command**: `npx wrangler preview`, or `<pm> run db:migrate:preview && npx wrangler preview` (custom commands must invoke `npx wrangler preview`).
5. **Deploy command**: `npx wrangler deploy`, or `<pm> run db:migrate:prod && npx wrangler deploy`.
6. **Build command**: only the build (`<pm> run build`). No migrations here.
7. **Build variables and secrets**: set per trigger. Migration DB URLs go here (prod trigger = prod URL, preview trigger = preview URL).
8. **Root directory** (monorepo): one connection per Worker, pointing at that Worker's folder.
9. **Build token**: edit permission for Workers Scripts and for resources used by migrations (for example D1 Edit).

## Preview URL template (needed by the E2E workflow)

Default workers.dev shape: `<preview-name>-<worker-name>.<subdomain>.workers.dev`, and the preview name defaults to the git branch.

1. Open the first real PR; read the Preview URL in the Workers Builds PR comment.
2. Set a repository variable with the `{branch}` placeholder, for example:
   ```bash
   gh variable set PREVIEW_URL_TEMPLATE_MY_API --body "https://{branch}-my-api.<subdomain>.workers.dev"
   ```
3. If branch names containing `/` or other characters are transformed in the URL, adjust the template or use simple branch names (`feature-login`), and make the cleanup job use the same name.

Custom domain Previews use `<preview-name>.app.example.com`; see https://developers.cloudflare.com/workers/previews/custom-domains/.

## Cloudflare Access (internal Workers)

Preview URLs are public by default. For each internal Worker:
1. Protect its Previews with Cloudflare Access (account-wide, per Worker, or per hostname; see the custom-domains page above).
2. Allow the team's email domain, plus specific external reviewers if needed.
3. For E2E in GitHub Actions create an Access **service token** and store `CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET` as GitHub secrets; the E2E template sends them as headers. Playwright must send the same headers (`extraHTTPHeaders`).
4. Verify from outside: `curl -sI <preview-url>` without credentials must not return the app.
