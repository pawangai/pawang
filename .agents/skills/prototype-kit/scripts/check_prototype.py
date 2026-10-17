#!/usr/bin/env python3
"""Cek prototype HTML terhadap kit + design system.

Pemakaian: check_prototype.py <folder-prototype>
Error (exit 1): file wajib hilang, ikon belum ada, var(--token) tidak terdefinisi, hex/warna mentah di luar tokens.css,
                :focus-visible tidak ada di kit.css, dark mode padahal DS light-only.
Warning       : rute belum terdaftar, style inline selain dimensi/variabel.
Ini versi otomatis dari self-check DS: token ada, tidak ada hex, fokus keyboard terlihat.
"""
import re, sys
from pathlib import Path

def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    root = Path(sys.argv[1]); errs, warns = [], []
    rd = lambda f: (root / f).read_text(errors="ignore") if (root / f).exists() else ""
    for f in ["index.html", "catalog.html", "tokens.css", "kit.css", "kit.js", "icons.js"]:
        if not (root / f).exists():
            errs.append(f"file wajib hilang: {f}")
    tokens, kitcss = rd("tokens.css"), rd("kit.css")
    defined = set(re.findall(r"(--[\w-]+)\s*:", tokens)) | set(re.findall(r"(--[\w-]+)\s*:", kitcss))
    known = set(re.findall(r"^\s*['\"]([\w-]+)['\"]\s*:", rd("icons.js"), re.M))

    scan = [root / "kit.css", root / "kit.js"] + sorted(root.glob("screens/*.js")) + sorted(root.glob("*.html")) + sorted(root.glob("kit-*.js")) + sorted(root.glob("kit-*.css"))
    used_icons, routes, links = set(), set(), set()
    for p in scan:
        if p.exists():
            defined |= set(re.findall(r"(--[\w-]+)\s*:", p.read_text(errors="ignore")))
    for p in scan:
        if not p.exists():
            continue
        t = p.read_text(errors="ignore"); n = str(p.relative_to(root))
        for v in sorted(set(re.findall(r"var\((--[\w-]+)", t))):
            if v not in defined:
                errs.append(f"{n}: var({v}) tidak ada di tokens.css (token tidak ada di DS; jangan dikarang, laporkan ke user)")
        for m in re.finditer(r"(?<![&\w])#([0-9a-fA-F]{3,8})\b", t):
            if len(m.group(1)) in (3, 4, 6, 8) and not t[max(0, m.start()-6):m.start()].endswith(("href=\"", "href='")):
                errs.append(f"{n}: warna mentah #{m.group(1)} (pakai token dari tokens.css)")
        used_icons |= set(re.findall(r"icon\s*:\s*['\"]([\w-]+)['\"]", t)) | set(re.findall(r"K\.icon\(\s*['\"]([\w-]+)['\"]", t)) | set(re.findall(r"data-icon=\"([\w-]+)\"", t))
        routes |= set(re.findall(r"K\.route\(\s*['\"]([^'\"]+)['\"]", t))
        links |= set(re.findall(r"""(?:href=["']#|\bto\s*:\s*['"]|,\s*['"])(/[\w/:.-]*)""", t))
        for m in re.finditer(r'style="([^"]*)"', t):
            s = m.group(1)
            if s and not re.fullmatch(r"(\s*--[\w-]+:[^;]+;?|\s*(width|height|min-height|margin|padding|flex|overflow|display|justify-content|align-items|gap)[^;]*;?)+\s*|[^\"]*\$\{[^}]*\}[^\"]*", s):
                warns.append(f"{n}: style inline di luar dimensi/variabel: {s[:50]}")
    if ":focus-visible" not in kitcss:
        errs.append("kit.css: tidak ada :focus-visible (DS mewajibkan indikator fokus keyboard terlihat)")
    if "light-only" in tokens and re.search(r"prefers-color-scheme\s*:\s*dark", tokens + kitcss):
        errs.append("dark mode ditemukan, padahal DS light-only (jangan tambah dark mode)")
    for i in sorted(used_icons - known):
        errs.append(f"ikon belum ada di icons.js: {i}")
    pats = [re.compile("^" + re.sub(r":[^/]+", "[^/]+", r) + "$") for r in routes]
    for l in sorted(links):
        l2 = l.rstrip("/") or "/"
        if routes and not any(p.match(l2) for p in pats):
            warns.append(f"link ke rute belum terdaftar: {l}")
    if not routes:
        warns.append("belum ada K.route di screens/")
    for e in sorted(set(errs)): print("ERROR  ", e)
    for w in sorted(set(warns)): print("WARNING", w)
    print(f"\n{len(known)} ikon, {len(routes)} rute, {len(set(errs))} error, {len(set(warns))} warning")
    sys.exit(1 if errs else 0)

if __name__ == "__main__":
    main()
