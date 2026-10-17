# Agreed decisions (from the design interview)

| Area | Decision |
|---|---|
| Deploy | Workers Builds (Cloudflare Git integration). Preview: `wrangler preview`. Production: `wrangler deploy` |
| CI | GitHub Actions: lint, typecheck, unit, integration; then E2E against the Preview URL |
| Merge | Only via PR with a ruleset; all required checks green; auto-delete head branches |
| Preview URL | Stable Preview URL per branch (updated each push) + Deployment URL per deploy |
| Cleanup | GitHub Actions job on PR closed runs `wrangler preview delete` (safety net; Cloudflare only auto-deletes the least recently used Preview at plan limits) |
| Rollback | `npx wrangler rollback` (fast). Then fix forward on a `fix/...` branch through the normal flow |
| Databases | One preview Supabase project + one preview Hyperdrive config, shared by all branches. D1/R2/KV: one shared preview set |
| Migrations | Backward compatible (expand/contract). Production migrations run in the Workers Builds **deploy command** before `wrangler deploy`; preview migrations run in the **Preview command** before `wrangler preview`. Never in the build command (it runs on every branch) |
| Secrets | Preview runtime secrets in Cloudflare (`wrangler preview base-config secret put`). CI secrets in GitHub Secrets. The skill never handles secret values |
| Access | Per Worker public or internal. Internal: checklist for Cloudflare Access + verification from outside |
| Skills | `cicd-worker` builds; `cicd-worker-audit` checks (read-only) and is run at the start and end of `cicd-worker` |
| Audit scope | Repo + Cloudflare via read-only `wrangler` + GitHub via `gh` (rulesets, secret names) |
| New resources | Created only after confirmation per resource; production never touched |
| Tests | Detect and report only; the team writes tests |
| Package manager | Detected from the lockfile (pnpm for the original project) |
| Language | Skill content in English; replies in the user's language |

Known trade-off of the shared preview database: two branches that change the schema can collide. Warn the user when two open PRs both contain migrations.
