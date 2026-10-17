# Doctor - diagnosa kesehatan `.pawang` & artefak

Tujuan: satu pass diagnostik untuk menjawab "apakah proyek ini sehat untuk dipakai alur pawang?". Hanya membaca dan menyarankan. Tidak mengedit, commit, install, build, atau pindah branch.

## Sumber pemeriksaan

Jalankan berurutan, lalu ringkas. Jangan dump isi file.

### 1. Kesehatan `.pawang`

```bash
node .pawang/kit.js check
node .pawang/kit.js status
```

`check` exit 1 berarti ada file atau config rusak. `status` memberi ringkasan: config, spec aktif plus progres step, findings (hitungan plus P0/P1), review, handoff, history, tema.

### 2. Kesehatan AGENTS.md & artefak skill

Dari folder skill ini:

```bash
node scripts/docs-health.mjs
```

Cek `AGENTS.md` dan artefak skill: section Commands, tautan ber-pemicu, dan duplikasi dengan `.pawang/`. `docs/` hanya warisan proyek lama (brownfield) yang ditautkan; laporkan sebagai legacy, bukan struktur wajib.

- `.pawang/context/coding-standards.html` ada dan valid (konvensi proyek).
- `.pawang/prototype/` bila ada: `index.html`, `kit.js`, `tokens.css`, `kit.css`, `.manifest.json`.
- Artefak skill dikenal yang terpasang (mis. `PRODUCT.md`, `DESIGN.md`, `blueprint/`, `figr/`, `CODING_STANDARDS.md`, `GLOSSARY.md`): laporkan dan cek tautannya; jangan menebak yang tak dikenal.

### 3. Audit skill pihak ketiga

Bila user sedang memasang atau menilai skill pihak ketiga:

```bash
node scripts/skill-precheck.mjs <folder-skill>
```

### 4. Drift tema

```bash
node .pawang/kit.js theme --check
```

Kalau drift terdeteksi, **sarankan `node .pawang/kit.js theme --refresh`**, jangan jalankan sendiri tanpa memberi tahu.

### 5. Kelengkapan & konfigurasi

- File wajib `.pawang/`: `kit.js`, `config.json`, `theme.json`, dan isi `context/` (`project-overview.html`, `build-plan.html`, `current-feature.html`, `findings.html`, `review.html`, `handoff.html`, `coding-standards.html`).
- `.pawang/prototype/` opsional (artefak generated); bila ada, periksa kelengkapannya di §2.
- `config.json` valid (kegagalan validasi sudah terlihat dari `kit.js check`).
- `.gitignore` masih memuat aturan pengabaian bahan mentah `reference/`: file asli dan folder `_work/`.
- Git singkat: branch, bersih/kotor, commit terakhir, ahead/behind upstream. Bukan repo git = masalah setup.

### 6. State kerja

- Spec aktif setengah jalan: laporkan step checked/unchecked, arahkan ke `implement` atau `status`.
- Findings P0/P1 berstatus `open` atau `fixed`: sebutkan ID-nya, karena memblokir `complete`.

## Output

Format ringkas:

```
Kesehatan: Lulus | Perlu perhatian | Terblokir
.pawang: ...
Dokumen: ...
Tema: ...
Konfigurasi: ...
Git: ...
Catatan: ... (hanya bila ada peringatan)
Urutan perbaikan: ...
```

Label: **Lulus** bila semua sehat; **Perlu perhatian** bila ada peringatan yang tidak menghalangi; **Terblokir** bila file wajib hilang, config tidak valid, atau bukan repo git.

## Urutan perbaikan (prioritas)

1. File wajib hilang: tawarkan membuat ulang stub lewat `node .pawang/kit.js init` **setelah izin user**. `init` hanya membuat yang belum ada, tidak menimpa pekerjaan. Ini satu-satunya perbaikan yang boleh dijalankan.
2. `config.json` tidak valid: perbaiki dulu, jangan bekerja saat konfigurasi ambigu.
3. Bukan repo git: inisialisasi git sebelum memakai siklus build.
4. Tema drift: `node .pawang/kit.js theme --refresh`.
5. `AGENTS.md` atau dokumen bermasalah: arahkan ke reference `agents-md`; `docs/` lama (legacy) cukup ditautkan atau diarsipkan.
6. `.pawang/prototype/` bermasalah: arahkan ke `prototype-figr`/`prototype-kit` (companion) setelah izin user.
7. Spec aktif belum selesai: `implement` atau `status`.
8. Findings P0/P1 terbuka: bawa ke spec fix atau `implement`; yang `fixed` di-audit ulang.
9. Semua sehat: lanjut dengan `status` untuk progres atau tulis spec fitur berikutnya.

## Batas

- **Hanya baca plus saran.** Satu-satunya perbaikan yang boleh dijalankan: membuat stub yang hilang via `kit.js init`, itu pun setelah izin user.
- Diagnosa, lalu urutkan perbaikan dari langkah terkecil.
- Ragu soal pola stack spesifik? Tandai "perlu review", jangan memvonis gagal.
- Ringkas. Sekali pass harus terasa seperti checklist, bukan audit.
