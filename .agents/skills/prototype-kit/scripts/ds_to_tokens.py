#!/usr/bin/env python3
"""Ubah index.css design system (Tailwind v4 @theme + @utility) menjadi tokens.css untuk prototype HTML.

Pemakaian: ds_to_tokens.py <folder-design-system | index.css> <prototype/tokens.css>

Keluaran:
  :root { --color-*, --radius-*, --container-*, --font-*, --spacing }   (nama token SAMA dengan DS)
  --type-<peran>  : shorthand font per peran tipografi (dipakai kit.css: font:var(--type-body))
  --shadow-<nama> : dari @utility shadow-*
  .text-<peran>, .shadow-<nama> : kelas yang namanya sama dengan utility DS
Tidak ada nilai yang dikarang: semua berasal dari index.css.
"""
import re, sys
from pathlib import Path

def decls(body):
    return dict((k.strip(), v.strip()) for k, v in re.findall(r"([\w-]+)\s*:\s*([^;]+);", body))

def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    src, out = Path(sys.argv[1]), Path(sys.argv[2])
    css = src / "index.css" if src.is_dir() else src
    raw = css.read_text()
    txt = re.sub(r"/\*.*?\*/", "", raw, flags=re.S)
    fonts = re.findall(r'@import\s+url\([^)]*\);', raw)
    theme = "".join(re.findall(r"@theme[^{]*\{([^}]*)\}", txt))
    root = re.findall(r"(--[\w-]+)\s*:\s*([^;]+);", theme)
    light = False
    dm = (src / "design.md") if src.is_dir() else None
    if dm and dm.exists():
        head = dm.read_text()[:800].lower()
        light = "light only" in head or "modes: none" in head

    lines = [f"/* DIBUAT oleh ds_to_tokens.py dari {css.name}. Jangan edit tangan: ubah DS lalu jalankan ulang. */",
             f"/* ds-modes: {'light-only' if light else 'unspecified'} */"]
    lines += fonts
    lines.append(":root{")
    lines += [f"  {k}:{v.strip()};" for k, v in root]
    types, shadows, other = [], [], []
    for name, body in re.findall(r"@utility\s+([\w-]+)\s*\{([^}]*)\}", txt):
        d = decls(body)
        if name.startswith("text-") and "font-size" in d:
            role = name[5:]
            fam = d.get("font-family", "var(--font-sans)")
            lines.append(f"  --type-{role}:{d.get('font-weight','400')} {d['font-size']}/{d.get('line-height','1.5')} {fam};")
            if "letter-spacing" in d:
                lines.append(f"  --type-{role}-ls:{d['letter-spacing']};")
            types.append((role, d))
        elif name.startswith("shadow-"):
            lines.append(f"  --shadow-{name[7:]}:{d.get('box-shadow','none')};")
            shadows.append(name[7:])
        else:
            other.append((name, d))
    lines.append("}")
    for role, d in types:
        extra = (f"letter-spacing:var(--type-{role}-ls);" if "letter-spacing" in d else "") + (f"text-transform:{d['text-transform']};" if "text-transform" in d else "")
        lines.append(f".text-{role}{{font:var(--type-{role});{extra}}}")
    for s in shadows:
        lines.append(f".shadow-{s}{{box-shadow:var(--shadow-{s})}}")
    for name, d in other:
        lines.append(f".{name}{{" + ";".join(f"{k}:{v}" for k, v in d.items()) + "}")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines) + "\n")
    colors = [k for k, _ in root if k.startswith("--color-")]
    print(f"{out}: {len(root)} token (:root), {len(colors)} warna, {len(types)} peran tipografi, {len(shadows)} shadow, mode={'light-only' if light else 'tidak disebut'}")

if __name__ == "__main__":
    main()
