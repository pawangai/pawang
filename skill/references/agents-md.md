# AGENTS.md - menulis & merawat peta proyek

Tujuan: agent baru langsung bekerja tanpa memindai seluruh repo, dan hanya membaca detail yang dibutuhkan tugasnya. AGENTS.md = INDEKS + aturan inti (lapis pertama aturan dua lapis di `workflow.md`), bukan ensiklopedia. Dibaca SETIAP sesi — setiap baris membayar token berulang.

## Prinsip

1. Target 40-100 baris; lewat 150, pindahkan konvensi rinci ke `.pawang/context/coding-standards.html`; larangan tetap satu baris; keputusan ringkas.
2. Tulis hanya yang TIDAK bisa disimpulkan dari kode: perintah, konvensi tak tertulis, keputusan + alasan, jebakan, larangan.
3. Jangan salin README/daftar file/penjelasan framework. Perintah harus spesifik, bisa diperiksa, dan benar-benar ada (`package.json`, Makefile).

## Dua lapis

| Lapis       | Isi                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md` | peta, Commands (termasuk Verify), `## Jangan`, `## Keputusan penting`, tautan berpemicu                                                     |
| `.pawang/`  | state kerja + konvensi (`context/`), prototype generated, rujukan (`reference/`), riwayat (`history/`) — lewat kit.js (lihat `workflow.md`) |

Anti-duplikasi: state, spec, findings, review, handoff, history, dan spesifikasi dokumen hanya di `.pawang/`. Konvensi hanya di `.pawang/context/coding-standards.html` (render `coding-standards`, skema `sections`). Larangan hanya di `## Jangan`; keputusan permanen hanya di `## Keputusan penting`. `docs/` yang sudah ada — termasuk `docs/agents/` hasil setup companion pilihan user — adalah brownfield: tetap di tempatnya, ditautkan, tidak dipindah/disalin. `docs/` baru hanya atas keputusan eksplisit user; `docs/conventions/` dan `docs/adr/` adalah opt-in untuk konvensi/ADR panjang.

Sumber kanonik file agent: `AGENTS.md` + `.agents/`. `CLAUDE.md`/`GEMINI.md` dan subfolder `.claude` yang tumpang tindih di-symlink setelah isi unik dimigrasikan; `settings.json`/hooks `.claude` tetap nyata. Detail di `agent-files.md`.

## Pola indeks (progressive disclosure)

### Yang tetap di AGENTS.md

- Ringkasan; **Cara kerja** (dispatch subagent, 3 baris, tepat setelah Ringkasan); stack.
- **`## Commands`**: perintah dasar + **Verify** urut **typecheck → test → build**. Alur `.pawang` memakainya saat `check`; salin persis dari script, jangan mengarang.
- **`## Repository layout`** (maks ~15 baris; dibaca tiap agent membuat file) — ditulis lewat `layout.md`.
- **`## Jangan`**: larangan keras satu baris per larangan, jangan hanya tautan. Contoh: "Jangan edit file di `migrations/` yang sudah ada."
- **`## Keputusan penting`**: satu baris per keputusan + alasan singkat + tanggal.
- Peta dokumen.

### Yang dipindah

Konvensi rinci → `.pawang/context/coding-standards.html` lewat `node .pawang/kit.js render coding-standards` (skema `sections`). Konvensi/ADR panjang yang user pilih → `docs/conventions/`/`docs/adr/`, lalu tautkan dari peta dokumen. State/spec/findings/review/handoff → `.pawang/`. `docs/` lama brownfield tidak dipindah; cukup ditautkan dari peta dokumen.

### Format tautan: wajib pemicu "kapan dibaca"

Tautan berjudul saja tidak membantu agent memutuskan:

```markdown
## Peta dokumen (baca hanya yang relevan dengan tugasmu)

- `.pawang/context/coding-standards.html`: baca SEBELUM mengubah skema, migrasi, query, atau menambah endpoint.
- `.pawang/figr/`: 4 dokumen sumber Figr + prompt; baca sebelum desain/prototype Figr (lihat `figr-docs.md`).
- `.pawang/reference/<jenis>/spesifikasi.html`: baca sebelum mengubah fitur dokumen <jenis> (lihat `document.md`).
- `.pawang/context/current-feature.html`: spec aktif checkout ini; baca lewat `node .pawang/kit.js extract`.
- `apps/<app>/docs/API.md`: dokumen lama app (brownfield); baca saat mengubah endpoint app itu — jangan dipindah.
```

### Struktur folder

```
AGENTS.md
.pawang/          # state kerja pawang (lihat workflow.md)
  context/        # state aktif + coding-standards.html
  figr/           # 4 dokumen Figr + prompt (Markdown); diagrams/ generated
  reference/      # rujukan dokumen per jenis
  prototype/      # HTML statis prototype-kit (generated)
  history/        # arsip pekerjaan selesai
docs/             # brownfield / opt-in user; tidak dibuat default
```

### Aturan memecah

- Per AREA TUGAS (database, api, ui), bukan topik kecil — file kecil bertebaran = agent membuka banyak file.
- Ideal 50-150 baris per area konvensi; maksimal dua lompatan dari AGENTS.md.
- Jangan impor otomatis (mis. `@path` Claude Code) untuk file yang dibaca sesuai kebutuhan — impor ikut dimuat tiap sesi; pakai path biasa dalam backtick.

### Format keputusan penting

```markdown
## Keputusan penting

- Harga disimpan dalam sen — menghindari galat pembulatan; 2026-10-16.
- Uang keluar selalu lewat satu service — audit jadi satu titik; 2026-10-16.
```

Satu baris per keputusan; tulis tanggal agar keputusan lama mudah ditinjau. Keputusan lama boleh diubah user: perbarui baris yang ada + tanggal baru; jangan menambah baris duplikat.

## Proses

1. Kenali proyek lewat `adopt.md` (pindai + wawancara); profilnya sudah ada di percakapan? Pakai itu — jangan inspeksi repo manual. Profil tidak disimpan sebagai file.
2. Pertanyaan inti sudah di `adopt.md`; tanyakan sisanya (keputusan desain, larangan), maks 3 sekaligus; jangan menebak arsitektur.
3. Susun dengan template; hapus bagian kosong.
4. Konvensi panjang/spesifik area → `.pawang/context/coding-standards.html` lewat `render coding-standards` + tautkan dengan pemicu.
5. Verifikasi: perintah valid; `## Commands` ada dengan Verify urut typecheck → test → build; tautan menunjuk file yang ada, mis.:

```sh
grep -oE '`(\.pawang|docs)/[^`]*`' AGENTS.md | tr -d '`' | sed 's/[:#].*//' | xargs -I{} sh -c 'test -e "{}" || echo "HILANG: {}"'
```

6. Pastikan tidak ada duplikasi dengan README. Serahkan ringkas satu kalimat; AGENTS.md besar? Sarankan `advisor.md`.

## Dari profil ke AGENTS.md

Hanya yang memengaruhi perilaku agent:

- Perintah: salin persis dari script → `## Commands`.
- E2E/Fallow/Impeccable/MCP/skill: satu baris cara pakai, bukan inventaris.
- Konvensi → `.pawang/context/coding-standards.html`; larangan → `## Jangan`; keputusan permanen → `## Keputusan penting`.
- Artefak skill yang dikenal (PRODUCT.md, DESIGN.md, blueprint/, figr/, `.pawang/figr/`, `docs/agents/`, `docs/conventions/`, `docs/adr/`, CODING_STANDARDS.md, GLOSSARY.md, dll.): rute atau tautkan di peta dokumen berpemicu. Yang tidak dikenal: tanya user, jangan dipindah atau disalin.
- `CLAUDE.md`/`GEMINI.md`/`.claude`: audit dan satukan lewat `agent-files.md`; jangan symlink sebelum isi unik dimigrasikan.
- Companion terpasang (`grill-me`/`grilling`, `figr-to-prototype`, `prototype-kit`): satu baris di `## Companion` (nama + kapan dipakai). Jangan menginventaris semua skill; cara pasang di `companions.md`.
- "scaffold": AGENTS.md sangat pendek; jangan mengarang struktur.
- Jangan tulis nilai env/rahasia; nama variabel boleh bila perlu.
- Fitur dokumen: `.pawang/reference/<jenis>/spesifikasi.html` ada → baris peta dokumen per jenis + larangan: "Jangan mengubah teks/tata letak dokumen tanpa memperbarui spesifikasi dan menjalankan verifikasi (lihat `document.md`)."
- Tata letak: `## Repository layout` lewat `layout.md`; folder tingkat atas di sana (backtick) otomatis sah — pastikan `.pawang/`, `.pawang/figr/`, `prototypes/`, `prototype/`, dan `figr/` terdaftar bila ada.

## Template AGENTS.md

```markdown
# AGENTS.md

## Ringkasan

<1-2 kalimat: aplikasi apa, untuk siapa, tahap apa (prototype/produksi)>

## Cara kerja

- Dispatch subagent untuk pekerjaan independen paralel (pencarian luas, riset, review, test). Brief lengkap: tujuan, file, yang dikesampingkan, format hasil.
- Jangan dispatch untuk tugas kecil, langkah bergantung, atau file yang sama dengan agent lain.
- Verifikasi hasil subagent sebelum dipakai.

## Stack

<bahasa, framework, DB, library kunci>

## Companion (bila terpasang)

- `grill-me`/`grilling`: wawancara dokumen Figr/plan mendalam.
- `figr-to-prototype` + `prototype-kit`: lane Figr; hanya bila proyek memakai Figr.

## Repository layout

<ditulis lewat `layout.md`>

## Commands

- Install: `...`
- Dev: `...`
- Test (satu file): `...`
- Lint/typecheck: `...`
- Verify: `<typecheck> && <test> && <build>` (typecheck → test → build; dipakai alur .pawang saat check)

## Jangan (aturan keras)

- <larangan satu baris>

## Keputusan penting

- <keputusan> — <alasan singkat>; <tanggal>.

## Peta dokumen (baca hanya yang relevan dengan tugasmu)

- `.pawang/context/coding-standards.html`: baca saat ...
- `.pawang/context/current-feature.html`: baca lewat `node .pawang/kit.js extract` saat ...
- `docs/conventions/<area>.md`: baca sebelum mengubah <area> (opt-in).
- `docs/adr/<nnnn>-<topik>.md`: baca sebelum mengubah <keputusan> (opt-in).
```

Baris `docs/...` hanya ditambahkan bila `docs/` sudah ada (brownfield/opt-in user) dan ditautkan; jangan membuat `docs/` baru secara default.

## Monorepo

- Root: hal global + peta dokumen bersama. `apps/<nama>/AGENTS.md`: khusus app + peta dokumennya; jangan ulang root.
- Root menyebutkan tiap app punya AGENTS.md sendiri.

## Kesalahan umum

- Dokumen panjang jarang diperbarui; perintah/tautan usang.
- Tautan tanpa pemicu; larangan penting tidak ditulis satu baris di `## Jangan`; keputusan lama tanpa tanggal/revisi.
- Memecah terlalu halus sampai agent membuka banyak file.
- Status sementara dicampur ke AGENTS.md (tempatnya `.pawang/context/handoff.html`, lihat `handoff.md`).
