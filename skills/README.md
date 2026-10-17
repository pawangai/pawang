# Skills Pawang

Folder ini berisi core `pawang/` (ikut npm, dipasang `npx pawang init`) dan empat companion sumber. Companion **tidak ikut npm `pawang`** dan dipasang terpisah dari repo GitHub.

## Pasang

Core (alternatif `npx pawang init`):

```bash
npx skills add pawangai/pawang --skill pawang -a opencode
```

Plugin marketplace (Claude/ChatGPT/Codex) dan bundle lite ada di README utama; sumber bundle ada di `plugins/pawang/` dan `plugins/<companion>/`.

Companion (plugin terpisah): `/plugin install figr-to-prototype@pawang` dan seterusnya.

Companion (source/GitHub):

```bash
npx skills add pawangai/pawang \
  --skill figr-to-prototype prototype-kit -a opencode

npx skills add pawangai/pawang \
  --skill cicd-worker cicd-worker-audit -a opencode
```

Atau lewat CLI Pawang:

```bash
pawang companion list
pawang companion info <nama>
pawang companion add <nama> --run
```

## Peringatan

- `--list` menampilkan empat companion ini **dan** core `pawang`; pada source tertentu bisa ikut `.agents/skills/` pengembangan. Selalu pakai `--skill` eksplisit; **jangan `--all`**.
- Aset `.skill` di GitHub Releases tersedia sebagai fallback offline.
- Semua companion membutuhkan **Python 3**. `figr-to-prototype`/`prototype-kit` membutuhkan Node/npm; `cicd-worker`/`cicd-worker-audit` membutuhkan `wrangler`/`gh`.
- Jalankan `skill-precheck` dan baca `SKILL.md` sebelum memakai script.
- Lisensi: MIT (lihat `LICENSE` repo), kecuali komponen pihak ketiga yang lisensinya dicantumkan di folder masing-masing.

## Daftar

| Companion           | Peran                                               | Dependensi             |
| ------------------- | --------------------------------------------------- | ---------------------- |
| `figr-to-prototype` | Figr → scaffold `prototype/` React + design system  | Python 3, Node/npm     |
| `prototype-kit`     | React/Figr → HTML statis di `.pawang/prototype/`    | Python 3, Node/npm     |
| `cicd-worker`       | CI/CD Cloudflare Workers: preview, deploy, rollback | Python 3, wrangler, gh |
| `cicd-worker-audit` | Audit read-only CI/CD Cloudflare Workers            | Python 3, wrangler, gh |
