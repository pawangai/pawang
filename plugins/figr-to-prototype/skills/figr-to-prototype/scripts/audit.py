#!/usr/bin/env python3
"""Audit prototype Figr terhadap design system (hanya membaca, tidak mengubah apa pun).

  python audit.py --root ./prototype              # laporan markdown ke stdout
  python audit.py --root ./prototype --json out.json --full
  python audit.py --root ./prototype --strict     # exit code 2 bila ada error

`vp check` menangkap format/lint/tipe. Skrip ini menangkap hal yang tidak bisa ditangkap
linter: token yang tidak ada di DS, class di luar sistem, duplikasi komponen DS, ikon di luar DS,
data yang tertanam di file screen, dan keutuhan kontrak Figr.
"""
import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

CODE_EXT = {".ts", ".tsx", ".js", ".jsx"}
SEV_ORDER = {"error": 0, "warn": 1, "info": 2}

# ---------------------------------------------------------------- pemetaan lokal -> DS
# level: drop-in (ganti saja) | adapt (ganti + sesuaikan pemanggil) | keep (tidak ada padanan -> kandidat promote)
LOCAL_TO_DS = {
    "Button": ("Button", "adapt", "hanya untuk yang `onClick`. Yang memakai `to` (react-router) JANGAN diganti `href`: <a> memicu reload penuh dan menghilangkan ?figr_screen= — pertahankan wrapper tipis. Ukuran default lokal `sm`, DS `md`"),
    "CountBadge": ("CountBadge", "adapt", "DS butuh `count` (number) + `label`; tone `neutral` tidak ada"),
    "StatusPill": ("StatusPill", "adapt", "tone DS: success|warning|danger|neutral — tone lokal `info`/`training` tidak ada (training = Badge kind=training; info = celah DS); prop `dot` tidak ada"),
    "Chip": ("Chip", "adapt", "prop `count` tidak ada di DS"),
    "Avatar": ("Avatar", "adapt", "`name` wajib di DS; size sm|md|lg (bukan angka); `icon` tidak didukung; `tone` -> `colorKey`"),
    "TextInput": ("Input", "adapt", "prop `mono` tidak didukung (font-mono hanya untuk dokumentasi DS)"),
    "SearchField": ("Input", "adapt", "pakai `SearchInput` dari DS"),
    "Toggle": ("Switch", "adapt", "DS Switch berlaku langsung; label teks default Aktif/Nonaktif"),
    "Dialog": ("Dialog", "adapt", "`footer`->`actions`; `width` (px)->`size` sm|md; `description` hanya string; `icon`/`tone`/`busy` tidak ada (tone danger = tombol `danger` di actions)"),
    "Skeleton": ("Skeleton", "drop-in", "DS memakai `bg-border` untuk blok skeleton"),
    "ListSkeleton": ("SkeletonList", "adapt", "`rows`->`count`, `avatar`->`leading`"),
    "DetailSkeleton": ("SkeletonDetail", "adapt", "`cards` -> `fields`"),
    "ErrorState": ("ErrorState", "adapt", "`body`->`message`; `compact` tidak ada"),
    "DetailError": ("ErrorState", "adapt", "sama dengan ErrorState"),
    "EmptyState": ("EmptyState", "adapt", "`body`->`message`; `action` (node) -> `onAction`+`actionLabel`"),
}
# Ikon lucide -> nama ikon DS (hanya yang setara secara visual). Sisanya = celah ikon DS.
LUCIDE_TO_DS = {
    "Plus": "plus", "X": "x", "Mail": "mail", "Loader2": "loader", "Loader": "loader",
    "AlertTriangle": "alert", "TriangleAlert": "alert", "ArrowRight": "arrow-right", "Star": "star",
    "Search": "search", "Calendar": "calendar", "Clock": "clock", "Check": "check", "Minus": "minus",
    "Phone": "phone", "MapPin": "pin", "Home": "home", "House": "home", "Menu": "menu",
    "Upload": "upload", "File": "file", "Lightbulb": "lightbulb", "ChevronDown": "chevron-down",
    "ChevronLeft": "chevron-left", "ChevronRight": "chevron-right",
}
# Komponen lokal yang SENGAJA tidak diganti walau namanya mirip DS (alasan ditampilkan di laporan).
KEEP_NOTES = {
    "PanelTabs": "tab berbasis route (`to`); DS Tabs untuk ganti konten di tempat, bukan navigasi antar halaman",
}
ICON_LIBS = ("lucide-react", "react-icons", "@heroicons", "@tabler/icons", "phosphor-react", "@phosphor-icons")

PREFIXES = ("bg", "text", "border", "ring", "divide", "fill", "stroke", "outline",
            "decoration", "accent", "caret", "placeholder", "shadow", "font", "rounded", "animate")
SIDES = {"t", "b", "l", "r", "x", "y", "s", "e", "tl", "tr", "bl", "br", "tt"}
PALETTE = r"(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}"
KW = {
    "bg": {"none", "cover", "contain", "center", "top", "bottom", "left", "right", "fixed", "local",
           "scroll", "repeat", "no", "clip", "origin", "linear", "gradient", "auto", "blend", "transparent", "current", "inherit"},
    "text": {"left", "center", "right", "justify", "start", "end", "wrap", "nowrap", "balance", "pretty",
             "ellipsis", "clip", "transparent", "current", "inherit", "xs", "sm", "base", "lg", "xl",
             "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl"},
    "border": {"solid", "dashed", "dotted", "double", "hidden", "none", "collapse", "separate", "spacing", "transparent", "current", "inherit"},
    "ring": {"inset", "offset", "transparent", "current", "inherit"},
    "divide": {"x", "y", "reverse", "solid", "dashed", "dotted", "double", "none", "transparent", "current"},
    "outline": {"none", "dashed", "dotted", "double", "offset", "hidden", "transparent", "current"},
    "fill": {"none", "current", "inherit", "transparent"}, "stroke": {"none", "current", "inherit", "transparent"},
    "decoration": {"solid", "double", "dotted", "dashed", "wavy", "auto", "from", "transparent", "current"},
    "accent": {"auto"}, "caret": {"transparent", "current"}, "placeholder": set(),
    "shadow": {"none", "inner"},
    "font": {"thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black",
             "sans", "serif", "mono", "stretch", "variant"},
    "rounded": {"none", "full"},
}
DEFAULT_SHADOWS = {"xs", "sm", "md", "lg", "xl", "2xl"}


def load_tokens(ds_css: Path) -> dict:
    css = ds_css.read_text()
    return {
        "color": set(re.findall(r"--color-([\w-]+)\s*:", css)),
        "radius": set(re.findall(r"--radius-([\w-]+)\s*:", css)),
        "font": set(re.findall(r"--font-([\w-]+)\s*:", css)),
        "container": set(re.findall(r"--container-([\w-]+)\s*:", css)),
        "roles": set(re.findall(r"@utility text-([\w-]+)", css)),
        "shadow": set(re.findall(r"@utility shadow-([\w-]+)", css)),
        "animate": set(re.findall(r"--animate-([\w-]+)\s*:", css)),
    }


def classify(prefix: str, rest: str, tok: dict):
    """Kembalikan (rule, pesan) bila class bermasalah, None bila aman."""
    rest = re.sub(r"/\d+$", "", rest)
    first = rest.split("-")[0]
    if rest.isdigit():
        return None
    if prefix == "text":
        if rest in tok["roles"] or rest in tok["color"] or first in KW["text"]:
            return None
    elif prefix == "font":
        if rest in tok["font"] or rest in KW["font"] or first in ("stretch", "variant"):
            return None
    elif prefix == "animate":
        if rest in tok["animate"] or rest in ("none", "spin", "ping", "pulse", "bounce"):
            return None
    elif prefix == "shadow":
        if rest in tok["shadow"] or rest in KW["shadow"]:
            return None
        if rest in DEFAULT_SHADOWS:
            return ("off-scale", f"`shadow-{rest}` bukan efek DS (card|float|header)")
    elif prefix == "rounded":
        if rest in tok["radius"] or rest in KW["rounded"]:
            return None if rest != "full" else ("off-scale", "`rounded-full` -> pakai `rounded-pill`")
        if first in SIDES:
            sub = "-".join(rest.split("-")[1:])
            if not sub or sub in tok["radius"] or sub in KW["rounded"] or sub.isdigit():
                return None
        return ("off-scale", f"`rounded-{rest}` di luar skala radius DS ({', '.join(sorted(tok['radius']))})")
    else:
        if rest in tok["color"] or first in KW.get(prefix, set()):
            return None
        if first in SIDES and prefix in ("border", "divide"):
            sub = "-".join(rest.split("-")[1:])
            if not sub or sub.isdigit() or sub in tok["color"]:
                return None
        if first == "offset":
            sub = "-".join(rest.split("-")[1:])
            if sub.isdigit() or sub in tok["color"]:
                return None
    if re.fullmatch(PALETTE, rest):
        return ("off-system-palette", f"`{prefix}-{rest}` palet bawaan Tailwind, bukan token DS")
    return ("undefined-token", f"`{prefix}-{rest}` tidak ada di DS -> tidak akan ter-style. Pakai token yang ada, atau tambahkan ke DS (references/ds-sync.md)")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    ap.add_argument("--root", default=".", help="folder prototype (berisi src/ dan packages/shared/ui)")
    ap.add_argument("--json", help="tulis hasil lengkap ke file JSON")
    ap.add_argument("--full", action="store_true", help="tampilkan semua temuan, bukan 6 contoh per aturan")
    ap.add_argument("--strict", action="store_true", help="exit code 2 bila ada temuan error")
    args = ap.parse_args()

    root = Path(args.root)
    src, ds = root / "src", root / "packages/shared/ui"
    if not src.exists() or not (ds / "index.css").exists():
        sys.exit("[error] butuh <root>/src dan <root>/packages/shared/ui/index.css (jalankan scaffold.py dulu)")
    tok = load_tokens(ds / "index.css")
    ds_components = sorted(p.name for p in (ds / "src/components").iterdir() if p.is_dir())
    icon_src = (ds / "src/components/Icon/Icon.tsx")
    ds_icons = set()
    if icon_src.exists():
        m = re.search(r"export type IconName\s*=([^;]+);", icon_src.read_text())
        ds_icons = set(re.findall(r'"([a-z-]+)"', m.group(1))) if m else set()

    findings = []  # dict(rule, sev, file, line, msg)

    def add(rule, sev, file, line, msg):
        findings.append({"rule": rule, "sev": sev, "file": str(file.relative_to(root)) if file else "-",
                         "line": line, "msg": msg})

    files = [p for p in sorted(src.rglob("*")) if p.is_file() and p.suffix in CODE_EXT | {".css"}]
    role_re = "|".join(sorted((re.escape(r) for r in tok["roles"]), key=len, reverse=True))
    class_re = re.compile(r"(?<![\w-])(" + "|".join(PREFIXES) + r")-([a-z0-9][a-z0-9.\-/]*)")
    lucide_names: dict[str, list[str]] = defaultdict(list)
    exports: dict[str, Path] = {}
    seen_undefined = set()

    for f in files:
        text = f.read_text(errors="ignore")
        for i, line in enumerate(text.splitlines(), 1):
            for m in re.finditer(r"(?<![&\w])#[0-9a-fA-F]{3,8}\b", line):
                if "href" in line[max(0, m.start() - 12):m.start()]:
                    continue
                add("hex-color", "error", f, i, f"hex `{m.group()}` -> pakai token warna DS")
            if re.search(r"(?<![\w-])dark:", line):
                add("dark-variant", "error", f, i, "`dark:` — DS hanya light theme")
            for m in re.finditer(r"(?<![\w-])[a-z][a-z0-9-]*-\[[^\]\s]+\]", line):
                add("arbitrary-value", "warn", f, i, f"nilai arbitrer `{m.group()}`")
            if f.suffix in CODE_EXT:
                for m in re.finditer(r"(?<![\w-])(?:[a-z]+:)*text-(xs|sm|base|lg|xl|[2-9]xl)\b", line):
                    add("non-role-text-size", "warn", f, i, f"`text-{m.group(1)}` bukan role tipografi DS (text-small, text-body, text-h*, ...)")
                if re.search(r"(?<![\w-])font-mono\b", line):
                    add("font-mono", "warn", f, i, "`font-mono` hanya untuk contoh kode di dokumentasi DS, bukan UI")
                for chunk in re.findall(r"[\"'`]([^\"'`\n]{8,})[\"'`]", line):
                    toks = chunk.split()
                    has_role = any(re.fullmatch(r"(?:[a-z]+:)*text-(?:" + role_re + ")", t) for t in toks) if role_re else False
                    mods = [t for t in toks if re.match(r"(?:[a-z]+:)*(font-(bold|semibold|medium|extrabold|normal|light)|tracking-|leading-)", t)]
                    if has_role and mods:
                        add("role-restated", "warn", f, i, f"role tipografi + `{mods[0]}`: satu role lengkap per node (gunakan text-small-strong / text-caption-strong bila perlu tebal)")
                for m in class_re.finditer(line):
                    res = classify(m.group(1), m.group(2).rstrip("."), tok)
                    if res:
                        key = (f, i, m.group(0))
                        if key not in seen_undefined:
                            seen_undefined.add(key)
                            rule, msg = res
                            add(rule, "error" if rule == "undefined-token" else "warn", f, i, msg)
                if re.search(r"figr-ds-[\w]+", line):
                    add("ds-import-unresolved", "error", f, i, "import `figr-ds-*` tidak akan ter-resolve di struktur ini -> pakai alias `@shared/ui/...`")
                m = re.match(r"export (?:default )?(?:function|const) ([A-Z][A-Za-z0-9]*[a-z][A-Za-z0-9]*)\b", line)
                if m and ("ui" in f.parts or "components" in f.parts):
                    exports[m.group(1)] = f
            if f.suffix == ".css" and re.search(r"figr-ds-[\w]+", line):
                add("ds-import-unresolved", "error", f, i, "@import `figr-ds-*` -> arahkan ke ../packages/shared/ui/index.css")

    # Import ikon dibaca per BERKAS, bukan per baris: setelah `vp check --fix` import dipecah jadi banyak baris.
    for f in files:
        if f.suffix not in CODE_EXT:
            continue
        ftext = f.read_text(errors="ignore")
        for m in re.finditer(r"import\s*\{([^}]+)\}\s*from\s*[\"']([^\"']+)[\"']", ftext):
            if m.group(2).startswith(ICON_LIBS):
                at = ftext[:m.start()].count("\n") + 1
                for n in m.group(1).split(","):
                    n = n.strip().split(" as ")[0].strip()
                    if n:
                        lucide_names[n].append(f"{f.relative_to(root)}:{at}")

    # --- ikon di luar DS
    mapped = {n for n in lucide_names if LUCIDE_TO_DS.get(n) in ds_icons}
    gap = sorted(set(lucide_names) - mapped)
    for n in sorted(mapped):
        add("third-party-icons", "warn", None, 0, f"{n} -> ganti dengan <Icon name=\"{LUCIDE_TO_DS[n]}\" /> ({len(lucide_names[n])}x)")
    for n in gap:
        add("icon-gap", "warn", None, 0, f"{n} tidak punya padanan di Icon DS ({len(lucide_names[n])}x) -> tambahkan ke DS Icon (ds-sync.md), lalu ganti")

    # --- duplikasi komponen DS & kandidat promote
    for name, f in sorted(exports.items()):
        if name in LOCAL_TO_DS:
            dsn, level, note = LOCAL_TO_DS[name]
            add("duplicate-ds-component", "warn", f, 0, f"`{name}` menduplikasi DS `{dsn}` [{level}] — {note}")
        elif name in ds_components:
            add("duplicate-ds-component", "warn", f, 0, f"`{name}` bernama sama dengan komponen DS `{name}` [cek kecocokan API]")
        else:
            why = KEEP_NOTES.get(name, "tidak ada padanan di DS")
            add("promote-candidate", "warn", f, 0, f"`{name}` — {why} -> pindahkan ke DS sebagai komponen (ds-sync.md); DS adalah master")

    # --- data & tipe tertanam di screen
    for f in sorted((src / "screens").rglob("*.tsx")) if (src / "screens").exists() else []:
        for i, line in enumerate(f.read_text(errors="ignore").splitlines(), 1):
            m = re.match(r"(?:export )?const ([A-Z][A-Z0-9_]{2,})(?:\s*:[^=]+)?\s*=\s*[\[{]", line)
            if m:
                add("inline-data", "warn", f, i, f"data/konstanta `{m.group(1)}` tertanam di screen -> pindahkan ke src/data/ (data mock) atau biarkan bila hanya konstanta UI kecil")

    # --- data terpusat (src/store) dan pemakaian DS
    store_ready = (src / "store/db.ts").exists()
    for f in sorted((src / "screens").rglob("*.tsx")) if (src / "screens").exists() else []:
        text = f.read_text(errors="ignore")
        for m in re.finditer(r"import\s*\{([^}]+)\}\s*from\s*[\"']\.\./data/[^\"']+[\"']", text):
            consts = [n.strip() for n in m.group(1).split(",") if re.fullmatch(r"[A-Z][A-Z0-9_]{2,}", n.strip().split(" as ")[0])]
            if consts:
                line_no = text[:m.start()].count("\n") + 1
                add("direct-data-import", "warn", f, line_no,
                    f"screen membaca konstanta data langsung ({', '.join(consts)}) -> baca lewat db/useDbQuery (data-layer.md)")
        for i, line in enumerate(text.splitlines(), 1):
            if re.search(r"useState(?:<[^>]*>)?\(\s*(?:\[\.\.\.)?[A-Z][A-Z0-9_]{2,}\b", line):
                add("local-copy-of-data", "warn", f, i, "state lokal menyalin data konstanta -> pindahkan ke db agar konsisten antar screen")
            if store_ready and re.search(r"\buseMockQuery\(", line):
                add("legacy-mock-query", "warn", f, i, "useMockQuery membaca data lokal -> useDbQuery(scope, key, (s, { empty }) => ...)")
    for f in files:
        for i, line in enumerate(f.read_text(errors="ignore").splitlines(), 1):
            for m in re.finditer(r"from\s+[\"']@shared/ui/([^\"']+)[\"']", line):
                target = ds / "src" / m.group(1)
                if not (target.is_dir() or any(target.with_suffix(e).exists() for e in (".ts", ".tsx"))):
                    add("ds-missing-import", "error", f, i, f"`@shared/ui/{m.group(1)}` tidak ada di DS -> tambahkan ke DS (ds-sync.md)")

    # --- konsistensi DS (DS diedit sebagai master, jadi dokumen dan kode harus tetap sejalan)
    idx = ds / "components.md"
    if idx.exists():
        idx_text = idx.read_text()
        for name in ds_components:
            if name not in idx_text:
                add("ds-docs-drift", "warn", idx, 0, f"komponen `{name}` ada di src/components tetapi belum tercatat di components.md")
    for name in ds_components:
        if not (ds / "src/components" / name / "index.ts").exists():
            add("ds-docs-drift", "warn", ds / "src/components" / name, 0, f"komponen `{name}` tanpa index.ts")
    if icon_src.exists():
        ic = icon_src.read_text()
        keys = set(re.findall(r'^\s*(?:"([a-z-]+)"|([a-z]+))\s*:\s*(?:<|\()', ic.split("const PATHS")[1], re.M)) if "const PATHS" in ic else set()
        keys = {a or b for a, b in keys}
        if keys and keys != ds_icons:
            diff = sorted(keys ^ ds_icons)
            add("ds-docs-drift", "error", icon_src, 0, f"IconName tidak sinkron dengan PATHS: {', '.join(diff)}")

    # --- kontrak Figr
    manifest, raw = src / "screens.figr.json", root / ".figr-raw/fe-admin"
    if not manifest.exists():
        add("figr-contract", "error", None, 0, "src/screens.figr.json hilang")
    else:
        try:
            data = json.loads(manifest.read_text())
            routes_tsx = (src / "routes.tsx").read_text() if (src / "routes.tsx").exists() else ""
            segs = {r["route"].strip("/").split("/")[0] for r in data.get("screens", {}).values() if r.get("route")}
            for s in sorted(segs):
                if f'"/{s}' not in routes_tsx:
                    add("figr-contract", "error", manifest, 0, f"route `/{s}` ada di manifest tapi tidak di routes.tsx")
            if (raw / "screens.figr.json").exists() and json.loads((raw / "screens.figr.json").read_text()) != data:
                add("figr-contract", "error", manifest, 0, "isi screens.figr.json berbeda dari hasil Figr — jangan diubah")
        except json.JSONDecodeError:
            add("figr-contract", "error", manifest, 0, "screens.figr.json bukan JSON valid")
    usi = src / "useScreenInit.ts"
    if not usi.exists() or "figr_screen" not in usi.read_text():
        add("figr-contract", "error", usi, 0, "useScreenInit.ts hilang atau tidak lagi membaca ?figr_screen=")

    findings.sort(key=lambda x: (SEV_ORDER[x["sev"]], x["rule"], x["file"], x["line"]))
    counts = defaultdict(int)
    for x in findings:
        counts[(x["sev"], x["rule"])] += 1

    if args.json:
        Path(args.json).write_text(json.dumps({"counts": {f"{k[0]}:{k[1]}": v for k, v in counts.items()},
                                               "findings": findings}, indent=2, ensure_ascii=False))

    n_err = sum(v for (s, _), v in counts.items() if s == "error")
    n_warn = sum(v for (s, _), v in counts.items() if s == "warn")
    n_info = sum(v for (s, _), v in counts.items() if s == "info")
    out = [f"# Audit prototype — {n_err} error · {n_warn} warn · {n_info} info\n",
           f"Token DS terbaca: {len(tok['color'])} warna, {len(tok['roles'])} role tipografi, "
           f"{len(tok['radius'])} radius, {len(ds_components)} komponen, {len(ds_icons)} ikon.\n",
           "| Severity | Aturan | Jumlah |", "|---|---|---|"]
    for (sev, rule), v in sorted(counts.items(), key=lambda kv: (SEV_ORDER[kv[0][0]], -kv[1])):
        out.append(f"| {sev} | {rule} | {v} |")
    by_rule = defaultdict(list)
    for x in findings:
        by_rule[(x["sev"], x["rule"])].append(x)
    for (sev, rule), items in sorted(by_rule.items(), key=lambda kv: (SEV_ORDER[kv[0][0]], kv[0][1])):
        out.append(f"\n## [{sev}] {rule} ({len(items)})")
        shown = items if args.full else items[:6]
        for x in shown:
            loc = f"{x['file']}:{x['line']}" if x["line"] else x["file"]
            out.append(f"- `{loc}` — {x['msg']}" if x["file"] != "-" else f"- {x['msg']}")
        if len(items) > len(shown):
            out.append(f"- … +{len(items) - len(shown)} lagi (--full atau --json untuk semuanya)")
    try:
        print("\n".join(out))
    except BrokenPipeError:  # mis. `| head`
        pass
    if args.strict and n_err:
        sys.exit(2)


if __name__ == "__main__":
    main()
