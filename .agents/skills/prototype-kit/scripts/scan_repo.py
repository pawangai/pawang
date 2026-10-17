#!/usr/bin/env python3
"""Inventaris repo frontend untuk estimasi + sinkronisasi prototype HTML.

Pemakaian:
  scan_repo.py <repo> [--ds <folder-design-system>] [--manifest out.json] [--diff old.json] [--json]
"""
import argparse, hashlib, json, math, re, sys
from collections import defaultdict
from pathlib import Path

SKIP = {"node_modules", ".git", "dist", "build", ".next", "__pycache__"}
CODE = {".ts", ".tsx", ".js", ".jsx", ".vue", ".css"}

def files(root):
    for p in sorted(root.rglob("*")):
        if p.is_file() and not (set(p.relative_to(root).parts) & SKIP):
            yield p

def sha(p):
    return hashlib.sha1(p.read_bytes()).hexdigest()[:12]

def module_of(rel):
    parts = rel.parts
    if parts[0] == "screens" and len(parts) > 2:
        return parts[1]
    return parts[0] if len(parts) > 1 else "(root)"

COLOR_FAM = r"primary|training|danger|warning|success|surface|muted|subtle|foreground|navy|green|maroon|chart|avatar|skeleton|whatsapp|rating|placeholder|on-dark|info"
ROLE_FAM = r"h[1-6]|display|title|stat|lead|body|prose|label|nav|small|caption|micro|eyebrow"

def ds_report(ds, texts):
    d = Path(ds).resolve()
    t = re.sub(r"/\*.*?\*/", "", (d / "index.css").read_text(), flags=re.S) if (d / "index.css").exists() else ""
    colors = set(re.findall(r"--color-([\w-]+)\s*:", t))
    roles = set(re.findall(r"@utility\s+text-([\w-]+)", t))
    comps = sorted(p.name for p in (d / "src/components").iterdir() if p.is_dir()) if (d / "src/components").is_dir() else []
    blob = "\n".join(texts)
    used = {c: len(re.findall(r"\b%s\b" % c, blob)) for c in comps}
    gaps = {}
    for m in re.finditer(r"\b(?:bg|text|border|ring|fill|stroke|divide|from|to|via|outline)-((?:%s)[\w-]*)" % COLOR_FAM, blob):
        n = m.group(1).rstrip("-")
        if n not in colors and not re.fullmatch(r"\d+", n):
            gaps[f"warna:{n}"] = gaps.get(f"warna:{n}", 0) + 1
    for m in re.finditer(r"\btext-((?:%s)[\w-]*)" % ROLE_FAM, blob):
        n = m.group(1).rstrip("-")
        if n not in roles and n not in colors and not re.fullmatch(r"(small|body|label)", n):
            gaps[f"peran-tipografi:{n}"] = gaps.get(f"peran-tipografi:{n}", 0) + 1
    rules = [str(p.relative_to(d)) for p in d.rglob("*") if p.is_file() and p.name.lower() in ("agents.md", "instructions.md", "design.md")]
    guides = sorted(p.name for p in (d / "guides").glob("*.md")) if (d / "guides").is_dir() else []
    files = {"ds:" + str(p.relative_to(d)): sha(p) for p in sorted(d.rglob("*")) if p.is_file() and p.suffix in (".css", ".md", ".tsx", ".ts", ".json") and ".figr" not in p.parts}
    return {"path": str(d), "aturan": rules, "guides": guides, "warna": len(colors), "peran_tipografi": len(roles),
            "komponen": comps, "dipakai_repo": {k: v for k, v in sorted(used.items(), key=lambda kv: -kv[1]) if v}, "kesenjangan": gaps, "_files": files}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("repo"); ap.add_argument("--manifest"); ap.add_argument("--diff"); ap.add_argument("--json", action="store_true"); ap.add_argument("--ds")
    a = ap.parse_args()
    root = Path(a.repo).resolve()
    if not root.is_dir():
        sys.exit(f"bukan folder: {root}")

    all_files = list(files(root))
    rels = {str(p.relative_to(root)): p for p in all_files}
    rules = [r for r in rels if Path(r).name.upper() in ("AGENTS.MD", "AGENT.MD", "CLAUDE.MD")]
    specs = [r for r in rels if r.startswith("docs/specs/") or "/docs/specs/" in r]

    mods = defaultdict(lambda: {"files": 0, "lines": 0})
    screens = defaultdict(int)
    icons, ui_exports, routes, tokens = set(), defaultdict(list), [], []
    for r, p in rels.items():
        if p.suffix not in CODE:
            continue
        txt = p.read_text(errors="ignore")
        m = module_of(Path(r))
        mods[m]["files"] += 1; mods[m]["lines"] += txt.count("\n") + 1
        if r.startswith("screens/") and p.suffix in (".tsx", ".jsx", ".vue"):
            screens[module_of(Path(r))] += 1
        for blk in re.findall(r'import\s*\{([^}]+)\}\s*from\s*["\']lucide-react["\']', txt):
            icons.update(x.strip().split(" as ")[0] for x in blk.split(",") if x.strip())
        if re.match(r"(ui|components)/", r):
            ui_exports[r] = re.findall(r"export\s+(?:default\s+)?(?:function|const|class)\s+(\w+)", txt)
        if re.search(r"(^|/)routes?\.(tsx|ts|jsx|js)$", r):
            routes += re.findall(r'path=["\']([^"\']+)["\']', txt)
        if p.suffix == ".css" and re.search(r"@theme|--color-", txt):
            tokens.append(r)

    # estimasi: kit 3 putaran + ~1 putaran / 6 file screen
    per = {m: math.ceil(n / 6) for m, n in screens.items()}
    total = 3 + sum(per.values())
    est = {"putaran": total, "rentang": [math.floor(total * .75), math.ceil(total * 1.25)], "per_modul": per}

    dsr = None
    if a.ds:
        texts = [p.read_text(errors="ignore") for r, p in rels.items() if p.suffix in (".ts", ".tsx", ".jsx", ".vue")]
        dsr = ds_report(a.ds, texts)
    manifest = {r: sha(p) for r, p in rels.items() if p.suffix in CODE or p.suffix == ".json"}
    if dsr:
        manifest.update(dsr.pop("_files"))
    diff = None
    if a.diff:
        old = json.loads(Path(a.diff).read_text())
        old = old.get("files", old)
        diff = {
            "ditambah": sorted(set(manifest) - set(old)),
            "dihapus": sorted(set(old) - set(manifest)),
            "diubah": sorted(r for r in manifest if r in old and manifest[r] != old[r]),
        }
    if a.manifest:
        out = Path(a.manifest); out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps({"files": manifest}, indent=1))

    data = {"repo": str(root), "aturan_repo": rules, "specs": specs[:20], "modul": mods, "screens": screens,
            "rute": sorted(set(routes)), "ui_export": ui_exports, "ikon_lucide": sorted(icons), "token_css": tokens,
            "estimasi": est, "diff": diff, "design_system": dsr}
    if a.json:
        print(json.dumps(data, indent=1, default=dict)); return

    print(f"# Inventaris: {root.name}")
    print(f"\nAGENTS.md/CLAUDE.md : {', '.join(rules) or 'TIDAK ADA'}")
    print(f"docs/specs          : {len(specs)} file" + (f" ({specs[0]} ...)" if specs else " (TIDAK ADA)"))
    print(f"token css           : {', '.join(tokens) or '-'}")
    print(f"rute terdeteksi     : {len(set(routes))}")
    print(f"ikon lucide dipakai : {len(icons)}  {' '.join(sorted(icons)[:40])}")
    print("\n## Modul (file / baris / screen)")
    for m, v in sorted(mods.items(), key=lambda kv: -kv[1]["lines"]):
        print(f"- {m:14} {v['files']:4} / {v['lines']:6} / {screens.get(m, 0):3}")
    if dsr:
        print(f"\n## Design system: {dsr['path']}")
        print(f"aturan  : {', '.join(dsr['aturan']) or 'TIDAK ADA'}  (baca urutan baca di sana dulu)")
        print(f"guides  : {', '.join(dsr['guides']) or '-'}")
        print(f"token   : {dsr['warna']} warna, {dsr['peran_tipografi']} peran tipografi; komponen DS: {len(dsr['komponen'])}")
        print("nama komponen DS yang muncul di repo: " + (", ".join(f"{k}({v})" for k, v in list(dsr['dipakai_repo'].items())[:25]) or "-"))
        print(f"KESENJANGAN token yang dipakai repo tapi tidak ada di DS ({len(dsr['kesenjangan'])}):")
        for k, v in sorted(dsr["kesenjangan"].items(), key=lambda kv: -kv[1])[:20]:
            print(f"  - {k}  x{v}")
    print("\n## Komponen UI")
    for f, ex in ui_exports.items():
        print(f"- {f}: {', '.join(ex)}")
    print(f"\n## Estimasi\n{total} putaran (rentang {est['rentang'][0]}–{est['rentang'][1]}), kit = 3")
    for m, n in sorted(per.items(), key=lambda kv: -kv[1]):
        print(f"- {m}: {n}")
    if diff:
        print("\n## Perubahan sejak manifest lama")
        for k, v in diff.items():
            print(f"- {k}: {len(v)}" + (f"  (termasuk {sum(x.startswith('ds:') for x in v)} file design system -> jalankan ulang ds_to_tokens.py)" if any(x.startswith('ds:') for x in v) else ""))
            for x in v[:40]:
                print(f"    {x}")

if __name__ == "__main__":
    main()
