#!/usr/bin/env python3
"""Bangun icons.js dari daftar ikon lucide yang dipakai repo (SVG asli, bukan tulis tangan).

Pemakaian:
  build_icons.py <repo> <.pawang/prototype/icons.js>          # daftar ikon diambil dari import lucide-react di repo
  build_icons.py --names Bell,CheckCircle2 <out.js>   # daftar manual
  tambahkan  --ds <folder-design-system>  agar ikon dari src/components/Icon/Icon.tsx DS dipakai lebih dulu;
  lucide hanya mengisi ikon yang tidak ada di DS (dilaporkan, karena DS biasanya melarang pustaka ikon pihak ketiga).
Butuh jaringan ke registry npm (paket lucide-static). Ikon yang tidak ketemu dilaporkan.
"""
import re, subprocess, sys, tempfile, tarfile, json
from pathlib import Path

# Ikon yang dipakai prototype.js sendiri (default komponen, shell, tombol kembali); selalu disertakan.
KIT_CORE = ["Search", "Info", "X", "Check", "Plus", "ChevronDown", "ChevronRight", "ArrowLeft", "Bell", "AlertTriangle"]

ALIAS = {"XCircle": "circle-x", "Grid3x3": "grid-3x3", "AlertCircle": "circle-alert", "AlertTriangle": "triangle-alert", "CheckCircle": "circle-check", "CheckCircle2": "circle-check", "HelpCircle": "circle-help", "MoreHorizontal": "ellipsis", "MoreVertical": "ellipsis-vertical"}

def kebab(n):
    s = re.sub(r"(?<=[a-z])(?=[A-Z])|(?<=[A-Za-z])(?=\d)", "-", n)
    return s.lower()

def collect(repo):
    names = set()
    for p in Path(repo).rglob("*"):
        if p.suffix in (".ts", ".tsx", ".js", ".jsx") and "node_modules" not in p.parts:
            for blk in re.findall(r'import\s*\{([^}]+)\}\s*from\s*["\']lucide-react["\']', p.read_text(errors="ignore")):
                names |= {x.strip().split(" as ")[0] for x in blk.split(",") if x.strip()}
    return sorted(n for n in names if n[0].isupper() and n not in ("LucideIcon", "LucideProps"))

DS_ALIAS = {"alert-triangle": "alert", "triangle-alert": "alert", "map-pin": "pin", "loader-2": "loader", "loader-circle": "loader", "file-text": "file"}

def ds_icons(ds):
    f = Path(ds) / "src/components/Icon/Icon.tsx"
    if not f.exists():
        return {}
    body = re.search(r"PATHS[^=]*=\s*\{(.*?)\n\};", f.read_text(), re.S)
    res = {}
    for m in re.finditer(r'^\s*"?([\w-]+)"?\s*:\s*(.+?),\s*$', body.group(1) if body else "", re.M):
        v = m.group(2).strip()
        v = re.sub(r"^<>|</>$", "", v).strip()
        res[m.group(1)] = v
    return res

def main():
    a = sys.argv[1:]
    ds = None
    if "--ds" in a:
        i = a.index("--ds"); ds = a[i + 1]; del a[i:i + 2]
    if len(a) == 3 and a[0] == "--names":
        names, out = [x for x in a[1].split(",") if x], Path(a[2])
    elif len(a) == 2:
        names, out = collect(a[0]), Path(a[1])
    else:
        sys.exit(__doc__)
    names = sorted(set(names) | set(KIT_CORE))
    dsmap = ds_icons(ds) if ds else {}
    tmp = Path(tempfile.mkdtemp())
    r = subprocess.run(["npm", "pack", "lucide-static", "--silent"], cwd=tmp, capture_output=True, text=True)
    if r.returncode:
        sys.exit("npm pack gagal (jaringan?):\n" + r.stderr[-400:])
    with tarfile.open(next(tmp.glob("*.tgz"))) as t:
        t.extractall(tmp)
    icons_dir = tmp / "package" / "icons"
    out_map, missing = {}, []
    from_ds, from_lucide = [], []
    for n in names:
        k = kebab(n)
        dk = k if k in dsmap else DS_ALIAS.get(k)
        if dk in dsmap:
            out_map[k] = dsmap[dk]; from_ds.append(k); continue
        f = icons_dir / f"{k}.svg"
        if not f.exists() and n in ALIAS:
            f = icons_dir / f"{ALIAS[n]}.svg"
        if not f.exists():
            missing.append(n); continue
        inner = re.search(r"<svg[^>]*>(.*)</svg>", f.read_text(), re.S).group(1)
        out_map[k] = re.sub(r"\s+", " ", inner).strip(); from_lucide.append(k)
    out.parent.mkdir(parents=True, exist_ok=True)
    body = ",\n".join(f" {json.dumps(k)}:{json.dumps(v)}" for k, v in sorted(out_map.items()))
    out.write_text("/* Dibuat oleh build_icons.py dari lucide-static. Jangan edit tangan; jalankan ulang. */\nwindow.K_ICONS = {\n" + body + "\n};\n")
    print(f"{len(out_map)} ikon ditulis ke {out} (dari DS: {len(from_ds)}, lucide: {len(from_lucide)})")
    if ds and from_lucide:
        print("KESENJANGAN DS (ikon tidak ada di Icon.tsx DS, diisi lucide; konfirmasi ke user): " + ", ".join(from_lucide))
    if missing:
        print(f"{len(missing)} tidak ditemukan (alias/nama lama, tambahkan manual): {', '.join(missing)}")

if __name__ == "__main__":
    main()
