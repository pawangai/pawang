# Doctor - diagnosa kesehatan `.pawang` & artefak

Tujuan: satu pass diagnostik untuk menjawab "apakah proyek ini sehat untuk dipakai alur pawang?". Hanya membaca dan menyarankan. Tidak mengedit, commit, install, build, atau pindah branch.

## Sumber pemeriksaan

Jalankan berurutan, lalu ringkas. Jangan dump isi file.

### 1. Kesehatan `.pawang`

```bash
node .pawang/kit.js check
node .pawang/kit.js status
```

`check` exit 1 berarti ada file atau config rusak. `status` memberi ringkasan: config, spec aktif plus progres step, batch, findings (hitungan plus P0/P1), review, handoff, history, tema.

### 2. Kesehatan AGENTS.md & artefak skill

Dari folder skill ini:

```bash
node scripts/docs-health.mjs
```

Cek `AGENTS.md` dan artefak skill: section Commands, tautan ber-pemicu, dan duplikasi dengan `.pawang/`. `docs/` hanya warisan proyek lama (brownfield) yang ditautkan; laporkan sebagai legacy, bukan struktur wajib.

- `.pawang/context/coding-standards.html` ada dan valid (konvensi proyek).
- `prototypes/` bila ada (lane A): `theme.css` + minimal satu `.html`; pastikan tidak di-`.gitignore` (`git check-ignore -q prototypes`).
- `.pawang/prototype/` bila ada (lane B): `index.html`, `kit.js`, `tokens.css`, `kit.css`, `.manifest.json`; manifest valid menurut `kit.js check`; pastikan `.manifest.json` tidak di-`.gitignore`.
- `.pawang/figr/` bila ada: `01-PRD.md`, `02-user-flows.md`, `03-interface-designs.md`, `04-edge-cases.md`, `prompt.md`; `diagrams/` opsional.
- Artefak skill dikenal yang terpasang (mis. `PRODUCT.md`, `DESIGN.md`, `blueprint/`, `figr/`, `.pawang/figr/`, `CODING_STANDARDS.md`, `GLOSSARY.md`): laporkan dan cek tautannya; jangan menebak yang tak dikenal.
- Lane B aktif (`figr/`, `prototype/packages/shared/ui`, atau `.pawang/prototype/`) tetapi `figr-to-prototype`/`prototype-kit` belum terpasang: **WARN** (bukan blocker), lalu tawarkan pemasangan lewat `companions.md`. Bila lane B tidak aktif, companion yang tidak terpasang bukan masalah kesehatan.
- Tracker wayfinder ada (`docs/agents/issue-tracker.md`) tetapi `wayfinder`/`setup-matt-pocock-skills` belum terpasang, atau sebaliknya: **WARN**, tawarkan pemasangan lewat `companions.md`. `docs/agents/` adalah brownfield/opt-in; jangan disalin ke `.pawang/`. Untuk tracker GitHub, cek `gh auth status`.

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
- `.pawang/context/batch.html` opsional (state batch sementara); bila ada, pastikan valid lewat `kit.js check`.
- `.pawang/prototype/` opsional (artefak generated); bila ada, periksa kelengkapannya di §2.
- `.pawang/figr/` opsional (dokumen sumber Markdown); bila ada, periksa kelengkapannya di §2.
- `config.json` valid (kegagalan validasi sudah terlihat dari `kit.js check`).
- `.gitignore` masih memuat aturan pengabaian bahan mentah `reference/`: file asli dan folder `_work/`.
- `.gitignore` **tidak** mengabaikan `prototypes/` atau `.pawang/prototype/.manifest.json`; keduanya wajib di-commit.
- Git singkat: branch, bersih/kotor, commit terakhir, ahead/behind upstream. Bukan repo git = masalah setup.
- Workflow CI ada tetapi tidak menjalankan `Verify` yang sama, atau permission/triggernya lebar: sarankan `ci-audit.md`. Doctor tetap read-only; jangan mengubah workflow dari sini.

### 6. State kerja

- Spec aktif setengah jalan: laporkan step checked/unchecked, arahkan ke `implement` atau `status`.
- Batch aktif: laporkan item `running`/`ready`/`blocked`, branch integration, dan apakah Gate 1 sudah disetujui; arahkan ke `orchestrate`.
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
6. `prototypes/` bermasalah: arahkan ke `prototype.md`; regenerasi `theme.css`/mockup setelah izin user. `.pawang/prototype/` bermasalah: arahkan ke `prototype-figr`/`prototype-kit`; companion lane B belum terpasang = WARN, tawarkan pemasangan. `.pawang/figr/` tidak lengkap: arahkan ke `figr-docs.md`/`figr-prompt.md`.
7. Spec aktif belum selesai: `implement` atau `status`.
8. Findings P0/P1 terbuka: bawa ke spec fix atau `implement`; yang `fixed` di-audit ulang.
9. Semua sehat: lanjut dengan `status` untuk progres atau tulis spec fitur berikutnya.

## Batas

- **Hanya baca plus saran.** Satu-satunya perbaikan yang boleh dijalankan: membuat stub yang hilang via `kit.js init`, itu pun setelah izin user.
- Diagnosa, lalu urutkan perbaikan dari langkah terkecil.
- Ragu soal pola stack spesifik? Tandai "perlu review", jangan memvonis gagal.
- Ringkas. Sekali pass harus terasa seperti checklist, bukan audit.
