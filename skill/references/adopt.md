# Adopt - pindai & adopsi proyek

Tujuan: AGENTS.md ditulis dari fakta, bukan dugaan. Pindai proyek (berbasis bukti), wawancara singkat, lalu profilnya diserahkan ke `agents-md.md` — langkah pertama alur pawang.

## Aturan

1. **Hanya baca**, kecuali dua dengan izin user: izin rahasia `opencode.json` (langkah 4), pasang paket alat skill (langkah 10). Profil tidak disimpan sebagai file.
2. **Berbasis bukti** (path/nama paket). "Tidak ditemukan" ≠ "tidak dipakai".
3. **Jangan buka rahasia.** `.env*`/`.dev.vars*` selain `*.example` tidak dibaca lewat tool apa pun; catat keberadaannya. Nama env var dari file contoh, `wrangler.jsonc`, `worker-configuration.d.ts`.
4. **Pengamanan berlapis.** Izin `opencode.json` tetap berlaku — ditolak di sana berarti jangan lewat jalur lain, termasuk shell.
5. **Isi mengalahkan nama folder.**

## Langkah

### 1. Pindai

Dari folder skill ini:

```
node scripts/scan.mjs "<path-proyek>"
```

Keluarannya profil ringkas: status, stack, deploy, binding Cloudflare, env var (nama saja), MCP/skill/plugin, CI/CD, dokumen, peringatan, yang belum terdeteksi. Penanda di `references/markers.json` — alat baru ditambah di sana, bukan di script. Kalau pindai sudah menjawab, jangan telusuri manual; buka file hanya untuk hal relevan.

### 2. Tentukan status

Skrip hanya menduga: **scaffold** (kode bawaan tanpa logika bisnis — katakan apa adanya) / **awal / berjalan / matang** (sebut modul yang ada, alur jalan, yang kosong). Dugaan vs isi kode berbeda? Ikuti isi kode + alasannya.

### 3. Periksa kecocokan

Cocokkan bahasa/runtime dengan target deploy + database (mis. Go di Workers, SQLite native di Workers); tidak cocok = hentikan, tanya user. Cermati "Peringatan" dan `[dugaan]`. Bukan scaffold? Jalankan `node scripts/check-layout.mjs "<path-proyek>"` (lihat `layout.md`) + masukkan temuan penting ke profil.

### 4. Amankan file rahasia (izin user)

Cek dulu (tidak menulis):

```
node scripts/harden-permissions.mjs "<path-proyek>"
```

Skrip melaporkan aturan `read`/`edit`/`bash` untuk `.env*`/`.dev.vars*` yang belum ada di `opencode.json`. Kurang? Tunjukkan; `--apply` setelah user setuju (hanya menambah; aturan user utuh; file berkomentar tidak ditulis ulang). Batas: `bash` berbasis pola (tidak kedap); `grep` mencocokkan pola pencarian, bukan path. Pengaman tambahan: `.dev.vars` dummy, secret asli via `wrangler secret put`, rahasia masuk `.gitignore`. Tanpa file rahasia & bukan proyek OpenCode = lewati.

### 5. Wawancara user

Satu giliran, maks ~6 pertanyaan, hanya yang tak terjawab bukti:

1. **Mode:** prototype atau produksi? (selalu)
2. **Deploy:** Workers/Vercel/VPS-Docker/belum; untuk Workers: `wrangler deploy` manual, GitHub Actions, atau Workers Builds? (yang terakhir tak terlihat dari repo)
3. **Paket/toolchain:** pnpm/npm/bun/yarn; Vite/Vite+/lainnya. (kalau ambigu)
4. **Database:** D1, Postgres (Supabase/Neon), SQLite, belum.
5. **Data model:** entitas + relasi. (selalu)
6. **Auth/multi-tenant:** kalau relevan.

`[dugaan]` (mis. Vite+, `.impeccable`) → satu pertanyaan singkat.

**Turunan prototype** (masuk AGENTS.md): data dinamis di DB/storage sungguhan sejak awal — bukan mock/array hardcode; tiap alur tulis diverifikasi E2E (isi form → muncul → muat ulang → tetap ada); data awal lewat seed, bukan di komponen.

### 6. Susun profil

Hanya fakta terbukti/dijawab user: status + 1 kalimat · mode (+ aturan prototype) · stack · deploy + caranya · data (DB + model) · test + perintah · CI/CD · alat agent · alat kualitas/desain + perintah · ketidakcocokan & hal terbuka.

### 7. Serahkan ke agents-md.md

Lanjutkan dengan profil ini; ke AGENTS.md hanya yang memengaruhi perilaku agent.

Bila proyek sudah punya `AGENTS.md` (brownfield), ekstrak tiga jenis isinya: konvensi → `.pawang/context/coding-standards.html`; keputusan → `## Keputusan penting`; larangan → `## Jangan`. Detail per-area lama tetap di tempatnya — tautkan, jangan pindahkan.

| Temuan                         | Masuk sebagai                                                                                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Script test/lint/build/dev     | `## Commands` (salin persis)                                                                                                                                                                                                             |
| E2E / Fallow / Impeccable      | Perintah E2E + aturan alur tulis data; perintah analisis; peta dokumen UI                                                                                                                                                                |
| MCP/skill/companion terpasang  | Satu baris alat yang tersedia; companion Pawang dicatat di `## Companion` (lihat `companions.md`)                                                                                                                                        |
| Cloudflare Workers             | Perintah dev/deploy/`wrangler types`; larangan baca/commit `.dev.vars`; daftar binding                                                                                                                                                   |
| Aturan prototype / tata letak  | Konvensi & Jangan; `## Repository layout` lewat `layout.md`                                                                                                                                                                              |
| Artefak skill dikenal          | `PRODUCT.md`/`DESIGN.md`, `blueprint/`, `figr/`, `.pawang/figr/`, `CODING_STANDARDS.md`, `GLOSSARY.md`, `docs/` lama: tautkan di peta dokumen dengan pemicu; tak dikenal -> tanya user (maks ~6 pertanyaan satu giliran, jangan menebak) |
| Fitur dokumen                  | Peta dokumen: `.pawang/reference/<jenis>/spesifikasi.html`, baca sebelum mengubah fitur itu (dibuat `document.md`)                                                                                                                       |
| Ketidakcocokan diputuskan user | Keputusan penting                                                                                                                                                                                                                        |

### 7b. Satukan file agent ganda (opsional, izin user)

Jika ada `CLAUDE.md`, `GEMINI.md`, atau `.claude/`, audit dulu:

```bash
node scripts/link-agent-files.mjs "<path-proyek>"
```

Migrasikan isi unik sebelum symlink (lihat `agent-files.md`): konvensi/ADR panjang ke `docs/conventions/`/`docs/adr/` opt-in, keputusan pendek ke `AGENTS.md`, aturan khusus digabung atau disimpan di `.claude/`. Jangan symlink seluruh `.claude` bila ada settings/hooks. `--apply` hanya setelah user setuju.

### 8. Inisiasi `.pawang/` (kalau user ingin alur pawang)

Setelah AGENTS.md beres: salin `assets/kit.js` (folder skill) ke `.pawang/kit.js`, jalankan `node .pawang/kit.js init` (scaffold + deteksi tema sekali), lalu isi `build-plan` (daftar fitur user, ID stabil) dan `project-overview` (dari profil) via `kit.js render` — JSON lewat stdin, skema di `workflow.md`; bila ada konvensi, render `coding-standards` (`{ "sections": [...] }`) ke `.pawang/context/coding-standards.html`. `.html` di `.pawang/` hanya lewat kit.js; jangan mengedit HTML mentah.

### 9. Tawarkan tinjauan lanjutan

Tawarkan `advisor.md` (tooling, test, CI, konvensi, skill); jangan jalankan tanpa persetujuan.

### 10. Tawarkan paket alat skill (izin user)

Tiga skill alat — tawarkan sekali, jelaskan biaya konteks per sesi, lewati yang terpasang; hemat konteks: pasang saat dibutuhkan lewat `advisor.md`. Urutan wajib (pemeriksa dipercaya lebih dulu):

1. **skill-inspector**: `npx skills add https://github.com/nvidia/skillspector --skill skill-inspector -a opencode`. Belum ada pemeriksanya — cek dengan `node scripts/skill-precheck.mjs` (salinan sementara), baca `SKILL.md`, cek audit/sumber di skills.sh, tunjukkan ke user, baru pasang.
2. **find-skills**: `npx skills add https://github.com/vercel-labs/skills --skill find-skills -a opencode` — periksa dulu (`skill-precheck.mjs` + inspector).
3. **skill-creator**: `npx skills add https://github.com/anthropics/skills --skill skill-creator -a opencode` — sama.

### 11. Tawarkan companion sesuai kebutuhan (izin user)

Jangan pasang default. Tawarkan hanya bila proyek membutuhkannya; daftar lengkap dan cara pasang ada di `companions.md`.

- Proyek memakai Figr/DS → `figr-to-prototype` (hulu) + `prototype-kit` (hilir). Hentikan lane Figr sampai companion terpasang.
- Butuh dokumen Figr atau wawancara plan mendalam → `grill-me` + `grilling`. Fallback `grilling` bila `grill-me` tidak bisa dipanggil.
- Catat companion yang terpasang sebagai satu baris di `## Companion` AGENTS.md; jangan menginventaris semua skill.

Tanpa `-y`, tingkat proyek, commit ke git; laporkan tambahan beban konteks (`doctor.md`). Skill berikutnya wajib lewat pemeriksaan lapis `advisor.md`.

## Mode audit

AGENTS.md sudah ada: bandingkan dengan profil (perintah/path/stack/deploy usang?) dan laporkan sebelum menulis ulang.

## Monorepo

Pindai = satu baris per workspace (`apps/*`, `packages/*`, `services/*`); detail satu app = pindai path app itu. Aturan monorepo di `agents-md.md`.

## Keterbatasan

Konfigurasi dashboard (Workers Builds, binding), secret, skill/MCP global, folder ter-ignore: tanyakan, jangan tebak.
