#!/usr/bin/env python3
"""Rasio kontras WCAG 2.x antara dua warna. Dipakai saat menambah token warna ke DS (docs DS mencatat rasionya).

  python contrast.py "#c2410c" "#fff7ed"
  python contrast.py danger danger-soft --css prototype/packages/shared/ui/index.css   # nama token dari index.css

Teks normal butuh >= 4.5:1, teks besar/ikon >= 3:1.
"""
import argparse
import re
import sys
from pathlib import Path


def lum(hex_: str) -> float:
    h = hex_.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    lin = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)


def resolve(v: str, css: str | None) -> str:
    if v.startswith("#"):
        return v
    if not css:
        sys.exit(f"[error] '{v}' bukan hex; beri --css untuk membaca nama token")
    m = re.search(rf"--color-{re.escape(v)}\s*:\s*(#[0-9a-fA-F]{{3,6}})", Path(css).read_text())
    if not m:
        sys.exit(f"[error] token --color-{v} tidak ditemukan di {css}")
    return m.group(1)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    ap.add_argument("fg")
    ap.add_argument("bg")
    ap.add_argument("--css")
    a = ap.parse_args()
    fg, bg = resolve(a.fg, a.css), resolve(a.bg, a.css)
    l1, l2 = sorted((lum(fg), lum(bg)), reverse=True)
    ratio = (l1 + 0.05) / (l2 + 0.05)
    print(f"{fg} di atas {bg}: {ratio:.2f}:1 — teks normal {'LULUS' if ratio >= 4.5 else 'GAGAL'} (4.5), "
          f"teks besar/ikon {'LULUS' if ratio >= 3 else 'GAGAL'} (3)")


if __name__ == "__main__":
    main()
