#!/usr/bin/env python3
"""Read-only CI/CD audit for Cloudflare Workers repos (Worker Previews model).

Usage:
    python audit.py [REPO_ROOT] [--remote] [--json]

Local checks always run. --remote additionally runs READ-ONLY `gh` and
`wrangler` commands; anything that cannot be checked is reported as
UNKNOWN, never guessed. This script never writes to the repo, GitHub or
Cloudflare.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

try:
    import tomllib  # py3.11+
except ModuleNotFoundError:  # pragma: no cover
    tomllib = None

SKIP_DIRS = {"node_modules", ".git", ".wrangler", "dist", "build", ".next", ".output", ".svelte-kit"}
MIN_WRANGLER = (4, 135, 0)

# binding key -> (name field used to identify the resource, human label)
RESOURCE_BINDINGS = {
    "kv_namespaces": ("id", "KV"),
    "d1_databases": ("database_id", "D1"),
    "r2_buckets": ("bucket_name", "R2"),
    "hyperdrive": ("id", "Hyperdrive"),
    "vectorize": ("index_name", "Vectorize"),
    "analytics_engine_datasets": ("dataset", "Analytics Engine"),
    "pipelines": ("pipeline", "Pipelines"),
    "secrets_store_secrets": ("secret_name", "Secrets Store"),
}
# bindings that need attention but are not simple "separate resource" cases
SPECIAL = ["durable_objects", "containers", "queues", "workflows", "services",
           "triggers", "routes", "ai", "browser", "images"]

findings: list[dict] = []


def add(level: str, area: str, msg: str, fix: str = "") -> None:
    findings.append({"level": level, "area": area, "message": msg, "fix": fix})


# ---------- helpers ----------
def strip_jsonc(text: str) -> str:
    out, i, n, in_str, esc = [], 0, len(text), False, False
    while i < n:
        c = text[i]
        if in_str:
            out.append(c)
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                in_str = False
            i += 1
            continue
        if c == '"':
            in_str = True
            out.append(c)
            i += 1
        elif text.startswith("//", i):
            while i < n and text[i] != "\n":
                i += 1
        elif text.startswith("/*", i):
            j = text.find("*/", i + 2)
            i = n if j == -1 else j + 2
        else:
            out.append(c)
            i += 1
    cleaned = "".join(out)
    return re.sub(r",(\s*[}\]])", r"\1", cleaned)  # trailing commas


def load_config(path: Path) -> dict | None:
    try:
        raw = path.read_text(encoding="utf-8")
        if path.suffix == ".toml":
            return tomllib.loads(raw) if tomllib else None
        return json.loads(strip_jsonc(raw))
    except Exception as e:  # noqa: BLE001
        add("WARN", "config", f"Cannot parse {path}: {e}")
        return None


def find_files(root: Path, names: set[str]) -> list[Path]:
    hits = []
    for p in root.rglob("*"):
        if any(part in SKIP_DIRS for part in p.parts):
            continue
        if p.is_file() and p.name in names:
            hits.append(p)
    return sorted(hits)


def run(cmd: list[str], cwd: Path | None = None, timeout: int = 60) -> tuple[int, str]:
    try:
        r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout)
        return r.returncode, (r.stdout or "") + (r.stderr or "")
    except Exception as e:  # noqa: BLE001
        return 127, str(e)


def parse_ver(v: str) -> tuple[int, ...] | None:
    m = re.search(r"(\d+)\.(\d+)\.(\d+)", v or "")
    return tuple(int(x) for x in m.groups()) if m else None


# ---------- local checks ----------
def detect_pm(root: Path) -> str:
    for lock, pm in [("pnpm-lock.yaml", "pnpm"), ("bun.lockb", "bun"), ("bun.lock", "bun"),
                     ("yarn.lock", "yarn"), ("package-lock.json", "npm")]:
        if (root / lock).exists():
            return pm
    return "unknown"


def check_package(root: Path) -> dict:
    info = {"scripts": {}, "tools": [], "wrangler_version": None}
    pj = root / "package.json"
    if not pj.exists():
        add("WARN", "package", "No package.json at repo root (monorepo? check workspaces).")
        return info
    data = json.loads(pj.read_text(encoding="utf-8"))
    deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
    info["scripts"] = data.get("scripts", {})
    wr = deps.get("wrangler")
    info["wrangler_version"] = wr
    if not wr:
        add("FAIL", "wrangler", "wrangler is not a project dependency.",
            "Add it: <pm> add -D wrangler@latest (Worker Previews needs >= 4.135.0; "
            "Workers Builds uses the version in package.json).")
    else:
        v = parse_ver(wr)
        if v and v < MIN_WRANGLER:
            level = "WARN" if wr[:1] in "^~" else "FAIL"
            add(level, "wrangler", f"wrangler spec {wr} has a lower bound below 4.135.0 "
                "(Worker Previews requires >= 4.135.0; the lockfile may resolve higher).",
                "Bump the spec: <pm> add -D wrangler@latest, then check the installed version.")
        elif not v:
            add("INFO", "wrangler", f"wrangler version spec '{wr}' - confirm resolved version >= 4.135.0.")
    for tool in ["vitest", "jest", "@cloudflare/vitest-pool-workers", "playwright", "@playwright/test",
                 "cypress", "eslint", "biome", "@biomejs/biome", "typescript", "supabase"]:
        if tool in deps:
            info["tools"].append(tool)
    sc = info["scripts"]
    for name, label in [("lint", "lint"), ("typecheck", "typecheck"), ("test", "unit test"), ("build", "build")]:
        if name not in sc:
            add("WARN", "scripts", f"No `{name}` script ({label}).",
                f"Add a `{name}` script to package.json, or tell the CI template which command to use.")
    if not any(k in sc for k in ("test:integration", "test:int", "integration")):
        add("WARN", "tests", "No integration test script found (test:integration).",
            "Report only - the team decides test content. Template job is skipped until a script exists.")
    if not any(k in sc for k in ("test:e2e", "e2e")) and not {"playwright", "@playwright/test", "cypress"} & set(info["tools"]):
        add("WARN", "tests", "No E2E tooling/script found (test:e2e / Playwright / Cypress).",
            "Report only - E2E job stays a placeholder until a script exists.")
    return info


def check_wrangler_configs(root: Path) -> list[dict]:
    cfgs = []
    files = find_files(root, {"wrangler.jsonc", "wrangler.json", "wrangler.toml"})
    files = [f for f in files if "preview-migrations" not in f.name]
    if not files:
        add("FAIL", "wrangler", "No wrangler.jsonc/json/toml found.",
            "Create one (cicd-worker can scaffold it).")
        return cfgs
    if len(files) > 1:
        add("INFO", "monorepo", f"{len(files)} Worker configs found - each Worker is audited separately.")
    for f in files:
        cfg = load_config(f)
        if cfg is None:
            continue
        rel = str(f.relative_to(root))
        entry = {"path": rel, "name": cfg.get("name"), "bindings": {}, "has_previews": "previews" in cfg}
        previews = cfg.get("previews") or {}
        if "previews" not in cfg:
            add("FAIL", f"{rel}", "No `previews` block (required by Worker Previews; may be empty).",
                'Add "previews": {} at minimum, then isolate each binding below.')
        for key, (idfield, label) in RESOURCE_BINDINGS.items():
            prod = cfg.get(key) or []
            prev = previews.get(key) or []
            if not prod:
                continue
            entry["bindings"][key] = {"prod": len(prod), "preview": len(prev)}
            prev_by_name = {b.get("binding") or b.get("name"): b for b in prev}
            for b in prod:
                bname = b.get("binding") or b.get("name")
                pb = prev_by_name.get(bname)
                if pb is None:
                    add("FAIL", f"{rel}", f"{label} binding `{bname}` has no entry in previews.{key} "
                        "- the Preview will not have this binding.",
                        f"Create a preview-safe {label} resource and add it under previews.{key}.")
                elif pb.get(idfield) == b.get(idfield) and pb.get(idfield) is not None:
                    add("FAIL", f"{rel}", f"{label} binding `{bname}` in previews points at the SAME "
                        f"resource as production ({idfield}={b.get(idfield)}). Previews would touch production data.",
                        f"Point previews.{key} at a separate {label} resource.")
        for key in SPECIAL:
            if key in cfg:
                entry["bindings"][key] = True
        if "durable_objects" in cfg and "durable_objects" not in previews:
            add("INFO", f"{rel}", "Durable Objects: each Preview gets its own namespace automatically. "
                "If code reads env.<DO binding>, add previews.durable_objects.bindings, otherwise 1101 errors.")
        if cfg.get("containers") and not previews.get("containers"):
            add("FAIL", f"{rel}", "Containers declared at top level but not in previews.containers "
                "(not inherited).", "Add previews.containers (and DO binding if read from env).")
        if cfg.get("queues", {}).get("consumers"):
            add("WARN", f"{rel}", "Queue consumers cannot target a Preview; messages a Preview sends to a "
                "production queue are consumed by production.", "Point previews.queues.producers at a separate queue.")
        if cfg.get("services"):
            add("WARN", f"{rel}", "Service bindings from a Preview call the bound Worker's PRODUCTION deployment.",
                "Use ctx.exports for same-Worker calls, or accept production behaviour.")
        if cfg.get("workflows"):
            add("WARN", f"{rel}", "Workflow bindings in a Preview use an existing Workflow (shared instances).",
                "Deploy a dedicated non-production Workflow and bind the Preview to it.")
        if cfg.get("triggers", {}).get("crons"):
            add("INFO", f"{rel}", "Cron Triggers target production only; test scheduled logic via a test route.")
        if cfg.get("d1_databases"):
            if not any(f.parent == (root / rel).parent and "preview-migrations" in f.name
                       for f in root.rglob("wrangler.preview-migrations.*")):
                add("WARN", f"{rel}", "D1 in use but no wrangler.preview-migrations.jsonc found.",
                    "Create it (same DB as previews.d1_databases) so preview migrations target the right DB.")
        cfgs.append(entry)
    return cfgs


def check_workflows(root: Path) -> None:
    wf_dir = root / ".github" / "workflows"
    files = sorted(list(wf_dir.glob("*.yml")) + list(wf_dir.glob("*.yaml"))) if wf_dir.exists() else []
    if not files:
        add("FAIL", "github-actions", "No GitHub Actions workflows found.",
            "cicd-worker can generate ci.yml, e2e-preview.yml and preview-cleanup.yml.")
        return
    text = "\n".join(f.read_text(encoding="utf-8", errors="ignore") for f in files)
    if "pull_request" not in text:
        add("FAIL", "github-actions", "No workflow triggers on pull_request.")
    if not re.search(r"wrangler\s+preview\s+delete", text):
        add("FAIL", "cleanup", "No job runs `wrangler preview delete` (Previews pile up after PRs close).",
            "Add preview-cleanup.yml (trigger: pull_request closed).")
    if re.search(r"wrangler\s+versions\s+upload", text) or "--preview-alias" in text:
        add("WARN", "legacy", "Legacy `wrangler versions upload` / --preview-alias in workflows. "
            "Version URLs only reach PRODUCTION resources.", "Migrate to `wrangler preview`.")
    if "CLOUDFLARE_API_TOKEN" in text and "head.repo.full_name" not in text:
        add("WARN", "security", "Workflows use Cloudflare secrets without a fork check "
            "(github.event.pull_request.head.repo.full_name == github.repository).",
            "Add the fork guard to jobs that use Cloudflare credentials.")


def check_migrations(root: Path) -> None:
    has_sb = (root / "supabase").exists() or (root / "supabase" / "migrations").exists()
    if has_sb:
        add("INFO", "supabase", "supabase/ directory found: ensure preview uses a SEPARATE Supabase project "
            "and a separate Hyperdrive config; apply migrations via preview command, not the build command.")
    for p in root.rglob("migrations"):
        if any(part in SKIP_DIRS for part in p.parts):
            continue
        if p.is_dir():
            add("INFO", "migrations", f"Migration dir: {p.relative_to(root)} - must stay backward compatible "
                "(expand/contract) so `wrangler rollback` of code remains safe.")
            break


# ---------- remote checks (read-only) ----------
def remote_checks(root: Path) -> None:
    if shutil.which("gh"):
        rc, out = run(["gh", "auth", "status"], root)
        if rc != 0:
            add("UNKNOWN", "github", "gh not authenticated - cannot inspect rulesets/secrets.", "Run: gh auth login")
        else:
            rc, repo = run(["gh", "repo", "view", "--json", "nameWithOwner,defaultBranchRef,deleteBranchOnMerge"], root)
            if rc == 0:
                r = json.loads(repo)
                nwo = r["nameWithOwner"]
                if not r.get("deleteBranchOnMerge"):
                    add("WARN", "github", "Automatically delete head branches is OFF.",
                        "Enable in Settings > General, or: gh api -X PATCH repos/%s -f delete_branch_on_merge=true" % nwo)
                rc, rs = run(["gh", "api", f"repos/{nwo}/rulesets"], root)
                if rc == 0:
                    rulesets = json.loads(rs or "[]")
                    if not rulesets:
                        add("FAIL", "github", "No repository rulesets - nothing forces CI to pass before merge.",
                            "cicd-worker can create one (gh api, after your confirmation).")
                    else:
                        add("INFO", "github", "Rulesets: " + ", ".join(x.get("name", "?") for x in rulesets) +
                            " - verify required status check names match workflow job names.")
                else:
                    add("UNKNOWN", "github", "Could not read rulesets (permissions?).")
                for kind in ("secrets", "variables"):
                    rc, s = run(["gh", "api", f"repos/{nwo}/actions/{kind}"], root)
                    if rc == 0:
                        names = [x["name"] for x in json.loads(s).get(kind, [])]
                        if kind == "secrets":
                            for need in ("CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"):
                                if need not in names:
                                    add("FAIL", "github", f"Actions secret {need} missing (needed by cleanup job).",
                                        f"gh secret set {need}")
                    else:
                        add("UNKNOWN", "github", f"Could not list Actions {kind}.")
            else:
                add("UNKNOWN", "github", "gh repo view failed - not a GitHub repo or no remote?")
    else:
        add("UNKNOWN", "github", "gh CLI not installed - GitHub side not checked.")

    wr = ["npx", "--no-install", "wrangler"] if (root / "node_modules" / ".bin" / "wrangler").exists() else None
    if not wr:
        add("UNKNOWN", "cloudflare", "wrangler not installed locally (run the package manager install first) - "
            "Cloudflare side not checked.")
        return
    rc, out = run(wr + ["whoami"], root)
    if rc != 0 or "not authenticated" in out.lower():
        add("UNKNOWN", "cloudflare", "wrangler not logged in - resources not checked.", "Run: npx wrangler login")
        return
    for label, cmd in [("D1", ["d1", "list", "--json"]), ("KV", ["kv", "namespace", "list"]),
                       ("R2", ["r2", "bucket", "list"]), ("Hyperdrive", ["hyperdrive", "list"])]:
        rc, o = run(wr + cmd, root)
        add("INFO", "cloudflare", f"{label} resources ({'ok' if rc == 0 else 'unreadable'}):\n" + o.strip()[:1500])


# ---------- output ----------
ORDER = {"FAIL": 0, "WARN": 1, "UNKNOWN": 2, "INFO": 3}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("root", nargs="?", default=".")
    ap.add_argument("--remote", action="store_true")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    root = Path(a.root).resolve()

    pm = detect_pm(root)
    pkg = check_package(root)
    cfgs = check_wrangler_configs(root)
    check_workflows(root)
    check_migrations(root)
    if a.remote:
        remote_checks(root)

    findings.sort(key=lambda f: ORDER[f["level"]])
    summary = {lvl: sum(1 for f in findings if f["level"] == lvl) for lvl in ORDER}
    result = {"root": str(root), "package_manager": pm, "package": pkg, "workers": cfgs,
              "summary": summary, "findings": findings}
    if a.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"Repo: {root}\nPackage manager: {pm}\nWorkers: " +
              (", ".join(f"{c['name']} ({c['path']})" for c in cfgs) or "none"))
        print("Summary: " + ", ".join(f"{k}={v}" for k, v in summary.items()) + "\n")
        for f in findings:
            print(f"[{f['level']}] ({f['area']}) {f['message']}")
            if f["fix"]:
                print(f"        fix: {f['fix']}")
    return 1 if summary["FAIL"] else 0


if __name__ == "__main__":
    sys.exit(main())
