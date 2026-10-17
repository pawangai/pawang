# End-to-end verification with a throwaway PR

Ask the user to do this once after setup. Mark each line verified / failed / not yet.

1. Create branch `chore/cicd-smoke` with a trivial change; push; open a PR.
2. CI jobs (Lint, Typecheck, Unit tests, Integration tests, Build) run and are listed as required in the ruleset.
3. Workers Builds creates the Preview; the PR comment shows the Preview URL; check run `Workers Builds: <worker>` is green.
4. The Preview URL matches `PREVIEW_URL_TEMPLATE_<WORKER>` (branch naming is correct).
5. Isolation proof: write a marker row/object through the Preview, then confirm it is NOT in production D1/KV/R2/Supabase.
6. E2E job waits for Workers Builds, then runs against the Preview URL.
7. Break CI on purpose (or the E2E): the ruleset blocks merging. Fix it and confirm it turns green.
8. Internal Workers: `curl -sI <preview-url>` without credentials is refused or redirected to login.
9. Merge the PR: the head branch is deleted; the cleanup job runs `wrangler preview delete`; the Preview URL stops serving (the docs only promise deletion through that command or plan limits, so confirm in the dashboard).
10. CI on `main` runs; Workers Builds runs the deploy command (migrations first if configured); production updates.
11. Rollback drill (optional but recommended): `npx wrangler rollback`, confirm production reverted, then roll forward.
12. If the Worker uses Containers: `npx wrangler containers list` shows no leftover app for the deleted Preview.

Finish by running `cicd-worker-audit` with `--remote` and reporting the result.
