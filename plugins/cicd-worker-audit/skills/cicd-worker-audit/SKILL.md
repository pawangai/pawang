---
name: cicd-worker-audit
description: Read-only audit of a Cloudflare Workers repo's CI/CD setup against the Worker Previews model (wrangler preview, previews block, Workers Builds, GitHub Actions, rulesets). Use whenever the user wants to check, review, verify or debug CI/CD for a Cloudflare Worker - "audit CI/CD", "is my preview setup correct", "why does my preview touch production data", "check bindings for previews", "cek CI CD worker", "periksa preview", "kenapa deploy gagal" - and also as the final verification step of the cicd-worker skill. Reports missing preview bindings (D1, KV, R2, Hyperdrive, Supabase), shared production resources, missing cleanup, weak PR rulesets and wrangler version problems. Never changes anything.
---

# cicd-worker-audit

Inspect a Cloudflare Workers repository and report what is wrong or missing for the agreed CI/CD flow. This skill only reads. Fixing is the job of `cicd-worker`, and only after the user confirms.

Reply to the user in the language they write in (usually Indonesian). Keep identifiers and commands in English.

> Script dijalankan dari folder skill ini (path yang memuat `SKILL.md`); di Claude Code gunakan `${CLAUDE_SKILL_DIR}`. Jangan mengasumsikan cwd proyek.

## The target flow (what "correct" means)

Branch -> PR -> GitHub Actions CI (lint, typecheck, unit, integration) -> Workers Builds runs `wrangler preview` -> E2E in GitHub Actions against the Preview URL -> ruleset requires all checks -> merge -> Preview deleted -> CI on `main` -> Workers Builds runs `wrangler deploy` -> production. Rollback uses `wrangler rollback`.

Why this matters: Worker Previews isolate a branch only where the `previews` block binds a _separate_ resource. A binding that is missing or that points at the production resource is the most dangerous failure, because a preview can then write to production data.

## Procedure

1. **Run the scanner** from the repo root (or the path the user gives):
   ```bash
   python <skill-dir>/scripts/audit.py . --remote
   ```
   Drop `--remote` if the user did not want GitHub/Cloudflare inspected. The remote part only runs read-only `gh` and `wrangler` commands (rulesets, secret _names_, resource lists). If `gh` or `wrangler` is not logged in, the script reports UNKNOWN. Report UNKNOWN as "could not check" and never guess.
2. **Read the findings** (`FAIL`, `WARN`, `UNKNOWN`, `INFO`). Then do the checks the script cannot do. Read `references/manual-checks.md` for the list (dashboard settings, Workers Builds commands, Cloudflare Access, preview naming).
3. **Report** with the template below. Group by severity, say why each finding matters in one sentence, and give the fix. Offer to run `cicd-worker` to apply fixes.

## Report template

```
## CI/CD audit: <repo or worker name>
Verdict: READY / NEEDS WORK / UNSAFE  (UNSAFE = a preview can reach production data)

### Must fix (FAIL)
- <finding> - why it matters - fix
### Should fix (WARN)
### Could not check (UNKNOWN) - what is needed to check it
### Looks good
```

Use `UNSAFE` whenever a preview binding equals the production resource, or a binding is missing and the Worker reads it at runtime.

## Rules

- Never run a command that writes: no `wrangler ... create/delete/put/deploy/preview`, no `gh api -X POST/PATCH/PUT/DELETE`, no `gh secret set`. If a fix is needed, print the command for the user instead.
- Never print secret values. Secret and variable _names_ are fine.
- Monorepo: audit each Worker separately and say which Worker each finding belongs to.
- Test tools (unit/integration/E2E): report what exists or is missing. Do not write tests.
- Treat Cloudflare behaviour as fast-moving (Worker Previews is new). When a finding depends on docs details, confirm against https://developers.cloudflare.com/workers/previews/ before asserting it.
