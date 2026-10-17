# Layout - letak folder & penamaan file

Tujuan: setiap jenis file punya satu tempat dan satu aturan nama, sehingga repo tetap rapi walau banyak agent dan sesi menulis kode. Reference ini menulis section `## Repository layout` di AGENTS.md (lewat `agents-md.md`), menyediakan audit deterministik, dan memandu perapian.

Aturan teks mudah dilanggar, jadi 3 lapis: **aturan** (section `## Repository layout` di AGENTS.md, dibaca setiap sesi), **audit** (`node scripts/check-layout.mjs`, deterministik), dan **perapian** (pindah file, dengan persetujuan).

## Prinsip

1. **Letakkan menurut peran.** Satu jenis file, satu tempat.
2. **Folder adalah namespace.** Nama file tidak mengulang nama folder: `scripts/seed-users.mjs`, bukan `script-seed-users.mjs`.
3. **kebab-case** untuk file dan folder. Pengecualian sah: komponen React/Vue/Svelte PascalCase, hook `useXxx`, file khusus alat (`README.md`, `AGENTS.md`, `Dockerfile`, `wrangler.jsonc`), file rute framework (`__root.tsx`, `$id.tsx`, `+page.svelte`). Kalau repo punya gaya dominan yang konsisten, ikuti dan catat di AGENTS.md.
4. **Nama menjelaskan isi.** Skrip memakai pola kata-kerja-objek (`seed-users`, `migrate-db`). Dilarang nama sementara/duplikat: `final`, `copy`, `backup`, `old`, `new`, `temp`, `draft`, `v2`, `test2`, dan nama generik `utils`, `helpers`, `misc`, `common`.
5. **Root bersih.** Root hanya konfigurasi, dokumen standar, dan folder tingkat atas yang terdaftar di `## Repository layout`. Tidak ada file kode di root.
6. **Jangan spekulatif.** Folder baru dibuat saat file pertamanya ada. Jangan memecah jadi package sebelum ada konsumen kedua.
7. **`shared` bukan tempat sampah.** Isinya harus bertema (`ui/`, `design-system/`, `lib/`). Kode yang dipakai satu app tetap di app itu; naik ke `shared` saat dipakai dua app.

## Preset

Pilih satu, konfirmasi ke user kalau ambigu, lalu patuhi. `.pawang/`, `prototypes/`, `prototype/`, dan `figr/` = folder sah alur pawang; tulis selalu di tabel `## Repository layout` supaya audit mengenalinya (folder tanpa pendaftaran ditandai "folder tidak terdaftar").

**Aplikasi tunggal** (satu deployable, atau prototype):

```
src/            kode aplikasi (routes, components, lib, db)
scripts/        skrip satu tujuan: seed, migrasi data, utilitas dev
tests/          unit dan integration
e2e/            test E2E
.pawang/        state kerja pawang: context, reference, prototype, history (lihat workflow.md)
prototypes/     lane A: mockup HTML & theme.css sebelum fitur UI
prototype/      lane B: hasil figr-to-prototype (React + shared/ui)
figr/           lane B: sumber desain Figr
```

**Monorepo** (dua deployable atau lebih, atau kode bersama):

```
apps/<nama>/                satu deployable; wrangler.jsonc ada di sini
packages/
  database/                 skema, migrasi, klien DB, seed
  contracts/                skema dan tipe kontrak antar app (tanpa logika)
  shared/
    ui/                     komponen UI bersama
    design-system/          token, tema, primitif
    lib/                    utilitas murni per tema (lib/dates, lib/money)
scripts/                    skrip level repo, satu tujuan per file
tests/  e2e/
.pawang/  prototypes/  prototype/  figr/
```

Dua lane prototype, pilih satu: **lane A** menulis mockup HTML statis di `prototypes/` + `prototypes/theme.css` (tanpa Figr); **lane B** mengalirkan `figr/` -> `figr-to-prototype` -> `prototype/` (React + DS di `prototype/packages/shared/ui`) -> `prototype-kit` -> `.pawang/prototype/` (HTML statis generated, di-commit). Bila ada Figr, DS Figr menang atas `prototypes/theme.css` dan lane A tidak dipakai.

`docs/` bukan folder alur: hanya proyek lama (brownfield) yang sudah punya `docs/`; deteksi dan tautkan di peta dokumen `AGENTS.md`, jangan pindahkan. Konvensi baru ditulis ke `.pawang/context/coding-standards.html`.

Arah dependensi (tegakkan dengan alat kalau ada): `apps` boleh memakai `packages`; `packages` tidak mengimpor dari `apps`; `shared/ui` boleh memakai `shared/design-system`; `contracts` tidak bergantung pada paket lain; `database` tidak bergantung pada UI. Alat yang cocok: Fallow (kalau terpasang), dependency-cruiser, `eslint-plugin-boundaries`. Jangan menjanjikan konfigurasi spesifik sebelum memeriksa dokumentasi alatnya.

## Mode

### 1. Define: menulis aturan

1. Ambil profil dari `adopt.md` (monorepo atau bukan, jumlah deployable, stack); kalau belum ada, jalankan `adopt.md` dulu.
2. Pilih preset. Tanyakan hanya kalau ambigu (satu pertanyaan).
3. Tulis section berikut lewat `agents-md.md` — hanya folder yang sudah ada atau segera dibuat, maksimal ~15 baris:

```markdown
## Repository layout

Preset: <aplikasi tunggal | monorepo>.

| Lokasi                | Isi                              | Aturan                           |
| --------------------- | -------------------------------- | -------------------------------- |
| `apps/<nama>/`        | satu deployable                  | `wrangler.jsonc` di sini         |
| `packages/database/`  | skema, migrasi, klien DB, seed   | hanya di sini                    |
| `packages/contracts/` | skema dan tipe kontrak antar app | tanpa logika                     |
| `packages/shared/ui/` | komponen UI bersama              | memakai design-system            |
| `scripts/`            | skrip satu tujuan                | `scripts/<kata-kerja-objek>.mjs` |
| `.pawang/`            | state kerja pawang               | context/history lewat kit.js     |
| `.pawang/prototype/`  | HTML statis generated            | artefak prototype-kit, di-commit |
| `prototypes/`         | lane A: mockup HTML & tema       | hapus setelah dipakai            |
| `prototype/`          | lane B: React + DS hasil Figr    | `packages/shared/ui`             |
| `figr/`               | lane B: sumber desain Figr       | hanya bila memakai Figr          |

Penamaan: kebab-case. Folder adalah namespace (jangan ulangi nama folder di nama file). Dilarang: final, copy, backup, old, new, temp, v2, utils, helpers, misc.
Sebelum membuat file baru: tentukan lokasinya dari tabel ini. Kalau tidak ada yang cocok, tanya user. Jangan membuat folder baru di root.
```

Folder tingkat atas yang tertulis dalam backtick di section ini otomatis dianggap sah oleh skrip audit.

### 2. Audit: memeriksa

```
node scripts/check-layout.mjs "<path-proyek>"
```

Skrip hanya membaca; melaporkan: file kode di root, awalan yang mengulang nama folder, nama sementara/duplikat, gaya nama, nama generik, folder root tak terdaftar (dengan saran tujuan, mis. `database` → `packages/database`), paket tanpa `package.json`, dan kode langsung di `packages/shared`. Opsi: `--preset=single|monorepo`, `--all`, `--strict` (exit 1 bila ada ERROR, untuk CI). Aturan di `references/layout-rules.json`; ubah di sana, bukan di script.

Laporan = temuan + saran, bukan perintah. Sebagian WARN bisa disengaja; tanyakan kalau ragu.

### 3. Tidy: memindahkan

Jangan memindahkan apa pun tanpa persetujuan user.

1. Jalankan audit, susun rencana tabel `dari -> ke`. Cari juga referensinya: `package.json` (scripts), `tsconfig` (`paths`, `include`), `wrangler` (`main`, `assets`), konfigurasi Vite/Vitest/Playwright, workflow CI, tautan `docs/` lama (brownfield, bila ada), dan impor.
2. Tunjukkan rencana ke user; kerjakan per kelompok kecil (semua skrip dulu, lalu database, lalu shared), bukan sekaligus.
3. Pindahkan dengan `git mv` supaya riwayat terjaga; perbarui semua referensi dalam kelompok yang sama.
4. Verifikasi tiap kelompok: typecheck, test unit, build, E2E bila terdampak (perintah dari `## Commands` AGENTS.md). Gagal = kembalikan kelompok itu, laporkan, jangan lanjut.
5. Jangan mencampur perapian dengan perubahan fitur; jangan menyentuh folder generate/vendor; jangan menghapus file — file yang tampak salinan ditanyakan.
6. Jangan commit kecuali user memintanya; sarankan satu commit per kelompok.
7. Setelah selesai, audit lagi dan pastikan `## Repository layout` sudah sesuai kenyataan.

## Menegakkan terus-menerus

- Section di AGENTS.md adalah aturan untuk agent.
- Pengaman keras: tambahkan `node scripts/check-layout.mjs . --strict` ke CI atau hook pra-commit.
- Nama file juga bisa ditegakkan linter (mis. `unicorn/filename-case`); baca dokumentasinya dulu.
