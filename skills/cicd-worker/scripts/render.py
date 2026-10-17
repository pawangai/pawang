#!/usr/bin/env python3
"""Render GitHub Actions workflows and the PR ruleset for the Worker Previews flow.

Writes files only into the repo you point at, never overwrites without --force,
and never talks to GitHub or Cloudflare. Applying the ruleset is a separate,
user-confirmed step (see SKILL.md).

Example:
    python render.py --root . --worker my-api --worker my-web:apps/web --approvals 1
Worker spec: NAME or NAME:RELATIVE_DIR (dir holding that Worker's wrangler config).
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

TPL = Path(__file__).resolve().parent.parent / "assets" / "templates"

PM = {
    "pnpm": {"run": "pnpm run", "exec": "pnpm exec", "install": "pnpm install --frozen-lockfile",
             "setup": [
                 "      - uses: pnpm/action-setup@v4",
                 "      - uses: actions/setup-node@v4",
                 "        with:",
                 "          node-version: 22",
                 "          cache: pnpm",
             ]},
    "npm": {"run": "npm run", "exec": "npx --no-install", "install": "npm ci",
            "setup": ["      - uses: actions/setup-node@v4", "        with:", "          node-version: 22",
                      "          cache: npm"]},
    "yarn": {"run": "yarn", "exec": "yarn", "install": "yarn install --frozen-lockfile",
             "setup": ["      - uses: actions/setup-node@v4", "        with:", "          node-version: 22",
                       "          cache: yarn"]},
    "bun": {"run": "bun run", "exec": "bunx", "install": "bun install --frozen-lockfile",
            "setup": ["      - uses: oven-sh/setup-bun@v2"]},
}

# script name -> (job id, display name = required status check context)
CI_JOBS = [
    ("lint", "lint", "Lint"),
    ("typecheck", "typecheck", "Typecheck"),
    ("test", "unit", "Unit tests"),
    ("test:integration", "integration", "Integration tests"),
    ("build", "build", "Build"),
]


def setup_steps(pm: str, install: bool = True) -> str:
    lines = list(PM[pm]["setup"])
    if install:
        lines += ["      - run: " + PM[pm]["install"]]
    return "\n".join(lines) + "\n"


def write(path: Path, text: str, force: bool, written: list[str]) -> None:
    if path.exists() and not force:
        print(f"SKIP (exists, use --force): {path}")
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    written.append(str(path))
    print(f"WROTE {path}")


def render_ci(pm: str, scripts: dict, branch: str) -> tuple[str, list[str]]:
    jobs, checks = [], []
    for script, job_id, display in CI_JOBS:
        alt = {"test:integration": ["test:int", "integration"]}.get(script, [])
        name = script if script in scripts else next((a for a in alt if a in scripts), None)
        if not name:
            print(f"NOTE: no `{script}` script - job '{display}' not generated (report as a gap).")
            continue
        checks.append(display)
        jobs.append(f"""  {job_id}:
    name: "{display}"
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
{setup_steps(pm)}      - run: {PM[pm]['run']} {name}
""")
    if not jobs:
        raise SystemExit("No runnable scripts found in package.json; add lint/typecheck/test/build first.")
    text = f"""name: CI

on:
  pull_request:
  push:
    branches: [{branch}]

permissions:
  contents: read

concurrency:
  group: ci-${{{{ github.ref }}}}
  cancel-in-progress: true

jobs:
""" + "\n".join(jobs)
    return text, checks


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".")
    ap.add_argument("--pm", choices=PM.keys(), help="default: detected from lockfile")
    ap.add_argument("--worker", action="append", required=True, help="NAME or NAME:DIR (repeatable)")
    ap.add_argument("--branch", default="main")
    ap.add_argument("--approvals", type=int, default=1, help="required PR approvals in the ruleset")
    ap.add_argument("--health-path", default="/", help="path polled before E2E starts, must return 200")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()

    root = Path(a.root).resolve()
    pm = a.pm
    if not pm:
        for lock, name in [("pnpm-lock.yaml", "pnpm"), ("bun.lockb", "bun"), ("bun.lock", "bun"),
                           ("yarn.lock", "yarn"), ("package-lock.json", "npm")]:
            if (root / lock).exists():
                pm = name
                break
    if not pm:
        raise SystemExit("Cannot detect package manager; pass --pm.")

    pkg = json.loads((root / "package.json").read_text(encoding="utf-8"))
    scripts = pkg.get("scripts", {})
    workers = []
    for spec in a.worker:
        name, _, d = spec.partition(":")
        workers.append((name, d or "."))

    wf = root / ".github" / "workflows"
    written: list[str] = []

    ci_text, checks = render_ci(pm, scripts, a.branch)
    write(wf / "ci.yml", ci_text, a.force, written)

    e2e_script = "test:e2e" in scripts
    tpl = (TPL / "e2e-preview.yml.tpl").read_text(encoding="utf-8")
    for name, _dir in workers:
        var = re.sub(r"[^A-Za-z0-9]", "_", name).upper()
        text = (tpl.replace("__WORKER_VAR__", var).replace("__WORKER__", name)
                .replace("__HEALTH_PATH__", a.health_path).replace("__PM_RUN__", PM[pm]["run"])
                .replace("__SETUP_STEPS__", setup_steps(pm)))
        fname = "e2e-preview.yml" if len(workers) == 1 else f"e2e-preview-{name}.yml"
        write(wf / fname, text, a.force, written)
        checks.append(f"E2E (Preview: {name})")
        checks.append(f"Workers Builds: {name}")
    if not e2e_script:
        print("NOTE: no `test:e2e` script yet - the E2E job will fail until the team adds it. "
              "Add the script (or remove the e2e workflow and its ruleset check) before enforcing the ruleset.")

    delete_steps = []
    for name, d in workers:
        wd = f"\n        working-directory: {d}" if d != "." else ""
        delete_steps.append(
            f"      - name: Delete Preview ({name})\n"
            f"        run: |\n"
            f"          {PM[pm]['exec']} wrangler preview delete --name \"$BRANCH\" --skip-confirmation "
            f"|| echo \"Preview not found (already deleted?)\"{wd}\n")
    text = ((TPL / "preview-cleanup.yml.tpl").read_text(encoding="utf-8")
            .replace("__SETUP_STEPS__", setup_steps(pm)).replace("__DELETE_STEPS__", "".join(delete_steps)))
    write(wf / "preview-cleanup.yml", text, a.force, written)

    check_lines = ",\n".join(f'          {{ "context": {json.dumps(c)} }}' for c in checks)
    rs = (TPL / "ruleset.json.tpl").read_text(encoding="utf-8").replace("__DEFAULT_BRANCH__", a.branch) \
        .replace("__APPROVALS__", str(a.approvals)).replace("__CHECKS__", check_lines)
    json.loads(rs)  # validate
    write(root / ".github" / "rulesets" / f"protect-{a.branch}.json", rs, a.force, written)

    print("\nRequired status checks in the ruleset:")
    for c in checks:
        print(f"  - {c}")
    print("\nNext: review the files, then apply the ruleset only after the user confirms:\n"
          f"  gh api -X POST repos/{{owner}}/{{repo}}/rulesets --input .github/rulesets/protect-{a.branch}.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
