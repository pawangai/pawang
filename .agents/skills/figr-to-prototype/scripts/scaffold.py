#!/usr/bin/env python3
"""Buat / sinkronkan folder prototype/ dari hasil generate Figr di folder figr/.

  python scaffold.py                          # figr/ -> prototype/ (default)
  python scaffold.py --figr figr --out prototype --pm pnpm

Isi figr/ boleh campuran: zip maupun sudah di-unzip, prototype screen maupun UI design system,
dengan nama apa pun. Jenisnya dikenali dari isinya:
  prototype screen : ada main.tsx dan folder screens/
  design system    : ada index.css dan src/components/

Dua mode, dipilih otomatis:
  init  prototype/packages/shared/ui BELUM ada -> belum ada master. prototype/ dibuat dari figr/,
        DS di prototype/ dimulai dari salinan DS Figr.
  sync  prototype/packages/shared/ui SUDAH ada -> DS di prototype/ adalah MASTER (source of truth).
        Perbedaan dari figr/ digabung ke prototype/ dengan aturan tiga arah (lihat reconcile()).

Hasil:
  prototype/src/                    <- prototype screen (boleh dirapikan)
  prototype/packages/shared/ui/     <- design system (master)
  prototype/.figr-raw/{fe-admin,design-system}/   <- salinan Figr terakhir yang sudah diterapkan
  prototype/.figr-raw/PENDING-MERGE.md            <- perubahan Figr yang belum selesai digabung
  prototype/package.json, index.html, vite.config.ts, tsconfig.json, AGENTS.md, src/store/
"""
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

ASSETS = Path(__file__).resolve().parent.parent / "assets"
SKIP = shutil.ignore_patterns("node_modules", ".git", "__MACOSX", ".DS_Store")
KINDS = {  # jenis -> (marker, label)
    "prototype": (["main.tsx", "screens"], "prototype screen"),
    "ds": (["index.css", "src/components"], "design system"),
}
RAW_DIR = {"prototype": "fe-admin", "ds": "design-system"}
LOCAL_DIR = {"prototype": "src", "ds": "packages/shared/ui"}

# Rentang versi cadangan bila `npm view` tidak bisa dijalankan (offline).
FALLBACK = {
    "react": "^19.0.0", "react-dom": "^19.0.0", "react-router-dom": "^7.0.0",
    "recharts": "^3.0.0", "lucide-react": "^0.400.0", "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0", "@vitejs/plugin-react": "^5.0.0",
    "typescript": "^5.6.0", "@types/react": "^19.0.0", "@types/react-dom": "^19.0.0",
    "vite-plus": "1.2.0", "@types/node": "^22.0.0",
}


# ------------------------------------------------------------------ util berkas
def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def skipped(p: Path) -> bool:
    return any(x in p.parts for x in ("node_modules", ".git", "__MACOSX")) or p.name == ".DS_Store"


def tree_hashes(root: Path, exclude_prefix: tuple[str, ...] = ()) -> dict[str, str]:
    out = {}
    for p in sorted(root.rglob("*")):
        if p.is_file() and not skipped(p):
            rel = p.relative_to(root).as_posix()
            if not rel.startswith(exclude_prefix):
                out[rel] = sha(p)
    return out


def newest_mtime(p: Path) -> float:
    if p.is_file():
        return p.stat().st_mtime
    ts = [f.stat().st_mtime for f in p.rglob("*") if f.is_file() and not skipped(f)]
    return max(ts, default=p.stat().st_mtime)


def find_root(base: Path, markers: list[str]) -> Path | None:
    """Folder terdangkal di bawah base yang memuat semua marker (zip sering punya folder pembungkus)."""
    hits = []
    for d in [base, *[p for p in base.rglob("*") if p.is_dir()]]:
        if skipped(d):
            continue
        if all((d / m).exists() for m in markers):
            hits.append(d)
    return min(hits, key=lambda p: len(p.parts)) if hits else None


# ------------------------------------------------------------------ baca figr/
def discover(figr: Path, tmp: Path) -> dict[str, list[tuple[Path, Path, float]]]:
    """-> {jenis: [(root, sumber, mtime)]}. Zip diekstrak ke folder sementara."""
    found: dict[str, list] = {k: [] for k in KINDS}
    for kind, (markers, _) in KINDS.items():  # figr/ sendiri langsung berisi satu hasil
        if all((figr / m).exists() for m in markers):
            found[kind].append((figr, figr, newest_mtime(figr)))
    for item in sorted(figr.iterdir()):
        if item.name.startswith(".") or item.name == "__MACOSX":
            continue
        if item.is_file() and item.suffix.lower() == ".zip":
            base = tmp / item.stem
            with zipfile.ZipFile(item) as z:
                z.extractall(base)
        elif item.is_dir():
            base = item
        else:
            continue
        for kind, (markers, _) in KINDS.items():
            root = find_root(base, markers)
            if root:
                found[kind].append((root, item, newest_mtime(item)))
    return found


def explicit(path: str, kind: str, tmp: Path) -> list:
    p = Path(path)
    base = p
    if p.suffix.lower() == ".zip":
        base = tmp / f"explicit-{kind}"
        with zipfile.ZipFile(p) as z:
            z.extractall(base)
    root = find_root(base, KINDS[kind][0])
    if not root:
        sys.exit(f"[error] {path}: bukan {KINDS[kind][1]} (butuh: {', '.join(KINDS[kind][0])})")
    return [(root, p, newest_mtime(p))]


def choose(found: dict) -> dict[str, Path | None]:
    chosen = {}
    for kind, cands in found.items():
        label = KINDS[kind][1]
        if not cands:
            chosen[kind] = None
            continue
        cands = sorted(cands, key=lambda c: c[2], reverse=True)
        chosen[kind] = cands[0][0]
        print(f"[figr] {label}: {cands[0][1].name}")
        for _, src, _ in cands[1:]:
            print(f"[figr]   diabaikan (lebih lama): {src.name}")
    return chosen


# ------------------------------------------------------------------ wiring
def npm_latest(pkg: str) -> str:
    try:
        r = subprocess.run(["npm", "view", pkg, "version"], capture_output=True, text=True, timeout=25)
        v = r.stdout.strip().splitlines()[-1] if r.stdout.strip() else ""
        if re.fullmatch(r"\d+\.\d+\.\d+", v):
            return v if pkg == "vite-plus" else f"^{v}"
    except (OSError, subprocess.TimeoutExpired):
        pass
    return FALLBACK[pkg]


def used_packages(src: Path) -> set[str]:
    pkgs = set()
    for f in src.rglob("*"):
        if f.suffix not in (".ts", ".tsx", ".js", ".jsx"):
            continue
        for m in re.finditer(r"""from\s+["']([^"'./][^"']*)["']""", f.read_text(errors="ignore")):
            name = m.group(1)
            parts = name.split("/")
            pkgs.add("/".join(parts[:2]) if name.startswith("@") else parts[0])
    return {p for p in pkgs if not p.startswith("@shared/") and not p.startswith("figr-ds-")
            and p not in ("vite-plus", "node:url")}


def write_package_json(out: Path, pm: str) -> str:
    pj = out / "package.json"
    vp = npm_latest("vite-plus")
    deps = {"react": npm_latest("react"), "react-dom": npm_latest("react-dom")}
    for p in sorted(used_packages(out / "src")):
        if p not in ("react", "react-dom"):
            deps[p] = npm_latest(p) if p in FALLBACK else "latest"
    dev = {"vite-plus": vp}
    for p in ("@vitejs/plugin-react", "@tailwindcss/vite", "tailwindcss", "typescript",
              "@types/react", "@types/react-dom", "@types/node"):  # @types/node: vite.config.ts memakai node:url
        dev[p] = npm_latest(p)
    # vite-plus sudah membawa core Vite dan Vitest sendiri. Override ini hanya mencegah plugin
    # pihak ketiga (mis. @tailwindcss/vite, yang peer-depend pada `vite`) menarik salinan Vite kedua.
    ov = {"vite": f"npm:@voidzero-dev/vite-plus-core@{vp}"}
    new = {
        "name": f"{out.resolve().name}", "private": True, "type": "module",
        "scripts": {"dev": "vp dev", "build": "vp build", "preview": "vp preview", "check": "vp check"},
        "dependencies": deps, "devDependencies": dev,
    }
    if pm == "pnpm":
        new["pnpm"] = {"overrides": ov}
    elif pm == "yarn":
        new["resolutions"] = ov
    else:
        new["overrides"] = ov
    if pj.exists():
        old = json.loads(pj.read_text())
        added = []
        for k in ("dependencies", "devDependencies"):
            old.setdefault(k, {})
            for n, v in new[k].items():
                if n not in old[k]:
                    old[k][n] = v
                    added.append(n)
        pj.write_text(json.dumps(old, indent=2) + "\n")
        return "package.json: " + (f"ditambah {', '.join(added)}" if added else "tidak ada dependency baru")
    pj.write_text(json.dumps(new, indent=2) + "\n")
    return f"package.json dibuat (vite-plus {vp}, override untuk {pm})"


def wire(out: Path, pm: str, first_time: bool) -> list[str]:
    log = []
    for name, target in (("index.html", "index.html"), ("vite.config.ts", "vite.config.ts"),
                         ("tsconfig.json", "tsconfig.json"), ("AGENTS.md", "AGENTS.md"),
                         ("gitignore.txt", ".gitignore")):
        dest = out / target
        if dest.exists():
            log.append(f"{target}: sudah ada, dilewati")
        else:
            shutil.copy(ASSETS / name, dest)
            log.append(f"{target}: dibuat")
    if first_time and not (out / "src/store").exists():
        shutil.copytree(ASSETS / "store-kit", out / "src/store")
        log.append("src/store/: kit data terpusat disalin (lihat references/data-layer.md)")
    log.append(write_package_json(out, pm))

    css = out / "src" / "index.css"
    ds_css = (out / "packages/shared/ui/index.css").read_text()
    if css.exists():
        text = orig = css.read_text()
        text = re.sub(r'@import\s+(?:url\()?["\']figr-ds-[^"\']+/index\.css["\']\)?\s*;',
                      '@import "../packages/shared/ui/index.css";', text)
        # DS sudah mengimpor font yang sama; impor ganda hanya memboroskan request.
        for m in re.findall(r'@import\s+url\([^)]*fonts\.googleapis[^)]*\)\s*;\n?', text):
            if m.strip() in ds_css:
                text = text.replace(m, "")
        if "packages/shared/ui/src" not in text:
            text = text.replace('@source "./";', '@source "./";\n@source "../packages/shared/ui/src";')
        if text != orig:
            css.write_text(text)
            log.append("src/index.css: import DS diarahkan ke packages/shared/ui, @source ditambahkan")
    return log


# ------------------------------------------------------------------ rekonsiliasi
def reconcile(new_root: Path, raw_root: Path, local_root: Path, exclude: tuple[str, ...] = ()):
    """Gabungkan hasil Figr baru ke lokal dengan aturan tiga arah.

    baseline = salinan Figr terakhir yang sudah diterapkan (raw), new = Figr sekarang, local = prototype/.
    Lokal selalu menang bila ia sudah diubah; Figr hanya menambah atau memperbarui yang belum disentuh lokal.
    """
    new = tree_hashes(new_root, exclude)
    old = tree_hashes(raw_root, exclude) if raw_root.exists() else None
    applied, manual = [], []

    def put(f):
        (local_root / f).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(new_root / f, local_root / f)
        applied.append(f)

    for f in sorted(new):
        local = local_root / f
        if not local.exists():
            if old is not None and f in old:
                if old[f] != new[f]:
                    manual.append((f, "berubah di Figr, tapi sudah dihapus/dipindah di lokal"))
                continue  # Figr tidak berubah: keputusan lokal dihormati
            put(f)
            continue
        if sha(local) == new[f]:
            continue
        if old is None or f not in old:
            manual.append((f, "nama sama sudah ada di lokal dengan isi berbeda, tidak ada baseline"))
        elif old[f] == new[f]:
            continue  # Figr tidak berubah; perbedaannya murni lokal
        elif sha(local) == old[f]:
            put(f)  # lokal belum pernah disentuh -> aman diperbarui
        else:
            manual.append((f, "berubah di Figr DAN di lokal -> versi lokal dipertahankan"))
    if old is not None:
        for f in sorted(set(old) - set(new)):
            manual.append((f, "dihapus di Figr -> putuskan apakah ikut dihapus di lokal"))
    return applied, manual


def snapshot(src: Path, dest: Path) -> None:
    if dest.exists():
        shutil.rmtree(dest)
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(src, dest, ignore=SKIP)


def write_pending(out: Path, manual: dict[str, list]) -> None:
    pending = out / ".figr-raw/PENDING-MERGE.md"
    lines = []
    if pending.exists():
        lines = [l for l in pending.read_text().splitlines() if l.startswith("- [ ]")]
    for kind, items in manual.items():
        for f, why in items:
            line = f"- [ ] [{kind}] `{f}` — {why}"
            if line not in lines:
                lines.append(line)
    if lines:
        head = ["# Perubahan Figr yang belum digabung", "",
                "Hapus baris setelah selesai. .figr-raw sudah diganti versi terbaru, jadi daftar ini",
                "satu-satunya pengingat. [ds] = design system (master di prototype/), [prototype] = src/.", ""]
        pending.write_text("\n".join(head + lines) + "\n")
        print(f"[pending] {len(lines)} item tercatat di .figr-raw/PENDING-MERGE.md")


# ------------------------------------------------------------------ mode
def run_init(chosen, out: Path, pm: str, force: bool) -> None:
    missing = [KINDS[k][1] for k, v in chosen.items() if v is None]
    if missing:
        sys.exit(f"[error] mode init butuh prototype screen DAN design system; belum ada: {', '.join(missing)}")
    src = out / "src"
    if src.exists() and any(src.iterdir()) and not force:
        sys.exit("[error] prototype/src sudah berisi file tetapi DS belum ada. Pakai --force bila memang mau mulai ulang.")
    for kind, root in chosen.items():
        local = out / LOCAL_DIR[kind]
        if local.exists():
            shutil.rmtree(local)
        shutil.copytree(root, local, ignore=SKIP)
        snapshot(root, out / ".figr-raw" / RAW_DIR[kind])
        print(f"[init] {LOCAL_DIR[kind]}/ <- {KINDS[kind][1]}: {len(tree_hashes(local))} file")
    for line in wire(out, pm, first_time=True):
        print(f"[wire] {line}")


def run_sync(chosen, out: Path, pm: str) -> None:
    manual_all = {}
    for kind, root in chosen.items():
        if root is None:
            print(f"[sync] {KINDS[kind][1]}: tidak ada di figr/, dilewati")
            continue
        raw = out / ".figr-raw" / RAW_DIR[kind]
        # .figr/ di DS = metadata generate (hash manifest); tidak ikut digabung.
        exclude = (".figr/",) if kind == "ds" else ()
        applied, manual = reconcile(root, raw, out / LOCAL_DIR[kind], exclude)
        snapshot(root, raw)
        tag = "DS (master)" if kind == "ds" else "prototype"
        print(f"[sync] {tag}: {len(applied)} diterapkan otomatis, {len(manual)} perlu keputusan")
        for f in applied:
            print(f"  [auto]   {f}")
        for f, why in manual:
            print(f"  [manual] {f} — {why}")
        if manual:
            manual_all[kind] = manual
        if kind == "ds" and applied:
            print("  [!] DS berubah -> jalankan audit.py; tambahan Figr bisa memengaruhi token/komponen yang dipakai")
    write_pending(out, manual_all)
    for line in wire(out, pm, first_time=False):
        print(f"[wire] {line}")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    ap.add_argument("--figr", default="figr", help="folder hasil Figr (default: figr)")
    ap.add_argument("--out", default="prototype", help="folder tujuan (default: prototype)")
    ap.add_argument("--pm", default="npm", choices=["npm", "pnpm", "yarn", "bun"])
    ap.add_argument("--force", action="store_true", help="mode init: timpa prototype/src yang sudah ada (destruktif)")
    ap.add_argument("--fe", help="(opsional) path prototype screen, melewati deteksi figr/")
    ap.add_argument("--ds", help="(opsional) path design system, melewati deteksi figr/")
    args = ap.parse_args()

    out = Path(args.out)
    mode = "sync" if (out / "packages/shared/ui/index.css").exists() else "init"
    with tempfile.TemporaryDirectory() as t:
        tmp = Path(t)
        if args.fe or args.ds:
            found = {"prototype": explicit(args.fe, "prototype", tmp) if args.fe else [],
                     "ds": explicit(args.ds, "ds", tmp) if args.ds else []}
        else:
            figr = Path(args.figr)
            if not figr.is_dir():
                sys.exit(f"[error] folder {figr}/ tidak ditemukan. Taruh hasil Figr (zip atau unzip) di sana.")
            found = discover(figr, tmp)
        chosen = choose(found)
        if not any(chosen.values()):
            sys.exit("[error] tidak ada prototype screen maupun design system Figr yang dikenali di sumber.")
        out.mkdir(parents=True, exist_ok=True)
        if mode == "init":
            print("[mode] init — prototype/ belum punya DS, jadi belum ada master; DS dimulai dari salinan DS Figr")
            run_init(chosen, out, args.pm, args.force)
        else:
            print("[mode] sync — DS di prototype/ adalah master; Figr hanya menambah, tidak menimpa perubahan lokal")
            run_sync(chosen, out, args.pm)
    print(f"\nLangkah berikut: cd {out} && <pm> install && npx vp check --fix && npx vp build, lalu audit.py")


if __name__ == "__main__":
    main()
