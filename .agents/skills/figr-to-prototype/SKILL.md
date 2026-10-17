---
name: figr-to-prototype
description: Membuat dan merawat folder prototype/ dari hasil generate Figr yang ditaruh di folder figr/ (prototype screen seperti "fe-admin" dan UI design system, zip maupun sudah di-unzip, nama file bebas). Menyusunnya menjadi scaffold monorepo (src/ untuk prototype, packages/shared/ui/ untuk design system sebagai source of truth), memasang toolchain Vite+ (vp check, vp build), memusatkan data prototype ke satu model data dinamis agar alur seperti booking bisa dipakai penuh, menyinkronkan DS di prototype/ dengan perubahan Figr berikutnya, dan menyerahkan hasilnya ke prototype-kit (HTML statis di .pawang/prototype). Pakai skill ini setiap kali user menyebut folder figr, hasil Figr, fe-admin, prototype screen, design-system.zip, "buat prototype dari figr", "rapikan prototype", "sinkronkan DS", "update DS prototype", "pusatkan data prototype", "alur booking di prototype", atau Figr baru saja di-generate ulang, walaupun user tidak menyebut kata "skill".
---

# Figr to Prototype

Mengubah hasil mentah Figr (kumpulan file tanpa `package.json`, `index.html`, atau konfigurasi build, dengan data
dan state tersebar per screen) menjadi proyek `prototype/` yang bisa dijalankan, diperiksa, dan dirawat, tanpa
mengubah tampilan dan tanpa merusak kontrak Figr-nya.

Figr akan men-generate ulang berkali-kali. Karena itu skill ini **bisa diulang**: apa yang sudah dirapikan atau
ditambahkan tidak boleh hilang saat hasil Figr baru masuk.

## Folder dan perannya

```
figr/                        MASUKAN. Hasil Figr mentah. Tidak pernah diedit skill.
├─ <apa saja>.zip            zip atau folder unzip, nama bebas; jenisnya dikenali dari isi:
└─ <apa saja>/               prototype screen = ada main.tsx + screens/   ·   design system = ada index.css + src/components/

prototype/                   KELUARAN. Dikelola skill.
├─ AGENTS.md  package.json  index.html  vite.config.ts  tsconfig.json
├─ src/                      prototype screen (boleh dirapikan)
│  ├─ store/                 data terpusat (db.ts, useDbQuery.ts) — dibuat skill, bukan dari Figr
│  ├─ screens.figr.json      kontrak Figr, jangan diubah
│  └─ useScreenInit.ts       kontrak Figr (?figr_screen=), jangan diubah
├─ packages/shared/ui/       design system = MASTER (source of truth)
└─ .figr-raw/                salinan Figr terakhir yang sudah diterapkan + PENDING-MERGE.md

.pawang/prototype/           HILIR. HTML statis buatan prototype-kit (bukan wilayah skill ini; lihat "Hilir").
```

## Dua mode (dipilih otomatis oleh `scaffold.py`)

- **init**: `prototype/packages/shared/ui` belum ada, artinya belum ada master. `prototype/` dibuat dari `figr/`;
  DS di `prototype/` dimulai dari salinan DS Figr. Butuh prototype screen **dan** design system di `figr/`.
- **sync**: DS di `prototype/` sudah ada, jadi ia **master**. Perbedaan dari `figr/` digabung dengan aturan tiga arah:
  Figr hanya menambah atau memperbarui yang belum disentuh lokal; bila sebuah file berubah di kedua sisi, **lokal
  menang** dan konfliknya dicatat. Tidak ada yang pernah ditimpa diam-diam.

Jadi "DS jadi source of truth" berlaku sejak DS itu ada di `prototype/`. Sebelum itu, `figr/` adalah satu-satunya sumber.

## Alur

### 0. Baca dulu
Baca `AGENTS.md` repo bila ada. Lalu baca DS dengan urutan yang ditetapkannya: `instructions.md` (AGENTS DS) →
`design.md` → `guides/*.md` yang relevan → grep `index.css` → cek `src/components/`. Di mode sync, baca juga
`.figr-raw/PENDING-MERGE.md` dan `packages/shared/ui/CHANGELOG.md` bila ada: itu riwayat keputusan sebelumnya.

### 1. Scaffold / sync
```bash
python scripts/scaffold.py [--figr figr] [--out prototype] [--pm npm|pnpm|yarn|bun]
```
Skrip membaca isi `figr/`, memilih yang **terbaru** bila ada beberapa kandidat sejenis (yang lain dilaporkan
"diabaikan"), lalu menjalankan mode init atau sync. Di mode init ia juga melakukan *wiring*: `package.json`
(vite-plus dipin ke versi saat itu), `index.html`, `vite.config.ts`, `tsconfig.json`, `AGENTS.md`, kit `src/store/`,
dan menulis ulang import `figr-ds-*` di `src/index.css`. File yang sudah ada tidak pernah ditimpa oleh wiring.
Di mode sync, item `[manual]` dicatat di `.figr-raw/PENDING-MERGE.md`; selesaikan sesuai `references/ds-sync.md` bagian 4.

### 2. Baseline
```bash
cd prototype && <pm> install && npx vp build && npx vp check
```
Catat hasilnya sebelum mengubah apa pun. Normal pada hasil Figr awal: build lolos, `vp check` gagal hanya karena
format. Lihat `references/vite-plus.md` untuk jebakan yang sudah ditemui.

### 3. Format, di langkah tersendiri
`npx vp check --fix`. Ini memecah baris panjang menjadi ratusan baris (perilaku yang diharapkan). Format **sebelum**
refactor supaya diff refactor hanya berisi perubahan makna. `packages/shared/ui` tidak ikut diformat (disengaja).

### 4. Audit
```bash
python scripts/audit.py --root prototype [--full] [--json audit.json]
```
Baca laporannya, jangan hanya meneruskan angkanya. Yang paling penting: `undefined-token` (class tanpa style tanpa
pesan error), `ds-missing-import`, `duplicate-ds-component`, `promote-candidate`, `icon-gap`,
`direct-data-import` / `local-copy-of-data` / `legacy-mock-query` (data belum terpusat), `ds-docs-drift`
(DS tidak sinkron dengan dokumennya), dan `figr-contract`.

### 5. Refactor, berurutan dari risiko terkecil
Tabel padanan dan keputusan ada di `references/ds-mapping.md`, **baca sebelum mengganti komponen apa pun**.

1. Perbaiki `undefined-token` yang punya padanan di DS (mis. `bg-skeleton` → `Skeleton`).
2. Bersihkan warning lint yang nyata tanpa mengubah perilaku.
3. Ganti komponen lokal yang duplikat DS (*drop-in*, lalu *adapt*).
4. **Perbarui DS** untuk yang tidak punya padanan (*add-to-ds*): token, ikon, komponen admin. DS adalah master, jadi
   prototype harus mengikuti DS dan DS harus memuat semua yang dipakai prototype. Caranya, file mana yang ikut
   berubah, dan cek kontras ada di `references/ds-sync.md`.
5. **Pusatkan data**: model data dinamis di `src/store`, screen membaca/menulis lewat db, bukan konstanta dan
   `useState` lokal. Langkahnya di `references/data-layer.md`.
6. Rapikan `font-mono`, `role-restated`, dan ukuran teks di luar role (lihat `guides/typography.md`).

Setelah tiap kelompok: `npx vp check` dan `npx vp build`. Untuk perubahan visual atau data, jalankan `npx vp dev`
dan buka layar terkait dengan `?figr_screen=<id>` (id di `src/screens.figr.json`), termasuk `?sim=loading|error|empty`.

### 6. Verifikasi dan laporan
Jalankan `vp check`, `vp test run` (bila ada tes), `vp build`, dan audit sekali lagi. Laporkan:

1. **Hasil**: angka sebelum → sesudah (audit, `vp check`, tes, ukuran build).
2. **Yang diubah** per kelompok.
3. **Tambahan DS**: satu daftar (apa, nilai, alasan, kontras untuk warna, asumsi, file DS yang disentuh). Ini
   pemberitahuan, bukan permintaan izin: skill ini tidak meminta persetujuan. Persetujuan adalah tugas hilir.
4. **Yang sengaja tidak diubah dan alasannya.**
5. **Yang belum terverifikasi**: terutama paritas visual bila tidak ada alat browser. Katakan terus terang.

## Hilir: HTML statis (`prototype-kit`)

Setelah `prototype/` rapi, hasilnya diteruskan ke skill **`prototype-kit`** untuk membuat prototype HTML statis.
Keluarannya masuk ke **`.pawang/prototype/`** di root repo (sejajar dengan `figr/` dan `prototype/`). Nama
`prototype` aman karena folder induk `.pawang/` yang memisahkannya; skill hilir sendiri mewajibkan nama folder
`prototype/` dan zip `prototype.zip`.

`prototype-kit` adalah versi baru dari `react-to-html-prototype` (skrip dan aset identik). Bedanya: plan-first
(berhenti menunggu persetujuan rencana), kesenjangan DS **ditambahkan ke DS** (bukan ditambal di kit), dan
serah-terima ke `/feature`. Gunakan satu saja: pemicu keduanya tumpang tindih ("prototype html", "ubah ke html").
Bila hanya `react-to-html-prototype` yang terpasang, alurnya sama, tetapi ia hanya melaporkan kesenjangan.

```
repo/
├─ figr/                 masukan Figr
├─ prototype/            proyek React (skill ini)
└─ .pawang/prototype/    HTML statis (skill hilir): index.html, catalog.html, tokens.css, kit.css, kit.js,
                         icons.js, data/, screens/, .manifest.json
```

**Bawaan `prototype-kit` yang harus ditimpa di rantai ini.** Ia mengasumsikan `blueprint/references/figr/**` sebagai
sumber, `package/design-system/**` sebagai DS, dan menulis `prototype/` di akar repo bila ada `blueprint/`. Di sini
tidak ada yang berlaku: beri path eksplisit seperti di bawah, dan **tulis hanya ke `.pawang/prototype/`**. Menulis
`prototype/` di akar akan menimpa proyek React.

**Gerbang sebelum masuk hilir.** DS adalah master dan sudah memuat semua yang dipakai prototype, jadi tabel
kesenjangan di Langkah 2 `prototype-kit` (dan Langkah 3 "perbarui DS") harus **kosong**. Penambahan DS hanya
dikerjakan skill ini (langkah 5), supaya tidak ada dua skill yang mengubah DS dengan cara berbeda. Bila tabel itu
tidak kosong, hentikan dan kembali ke langkah 5. Periksa:

- `audit.py`: `undefined-token`, `icon-gap`, `ds-missing-import`, `ds-docs-drift` = 0
- `build_icons.py ... --ds`: 0 ikon dari lucide (tidak ada daftar "KESENJANGAN DS")
- `scan_repo.py`: tidak ada "KESENJANGAN token"

**Persetujuan ada di hilir.** `prototype-kit` berhenti menunggu persetujuan rencana (Langkah 2). Karena penambahan DS
sudah dikerjakan di sini, tabel kesenjangannya kosong dan perubahan DS tidak akan ikut tampil di gerbang itu. Tutup
celahnya: saat menyusun rencana hilir, sertakan bagian **"Perubahan DS dari hulu"** yang diambil dari entri
`packages/shared/ui/CHANGELOG.md` sejak serah-terima terakhir (apa, nilai, alasan, asumsi), supaya user menyetujui atau
menolaknya di sana. Perubahan DS harus berada di commit terpisah (atau minimal terpisah di working tree) agar
penolakan bisa dibatalkan tanpa menyentuh yang lain.

**Perintah** (dari root repo; skrip hilir membuat folder `.pawang/prototype/` sendiri):

```bash
S=<folder skill prototype-kit>/scripts
python $S/scan_repo.py prototype/src --ds prototype/packages/shared/ui --manifest .pawang/prototype/.manifest.json
python $S/ds_to_tokens.py prototype/packages/shared/ui .pawang/prototype/tokens.css
python $S/build_icons.py prototype/src .pawang/prototype/icons.js --ds prototype/packages/shared/ui
python $S/check_prototype.py .pawang/prototype/
```
Selebihnya (rencana → kit → data → screen → verifikasi) ikuti `SKILL.md` `prototype-kit`, dengan penyesuaian ini:

- **Repo = `prototype/src`, bukan `prototype/`.** Bila repo = `prototype/`, `scan_repo.py` ikut menghitung `.figr-raw` dan
  `packages` sebagai modul dan daftar komponen UI kosong. Akibatnya `AGENTS.md` tidak ditemukan otomatis; baca
  `prototype/AGENTS.md` secara manual.
- **Sumber data = seed** di `src/store/db.ts` (dan `src/data/seed/`), bukan konstanta lama di `data/`. HTML statis
  mengambil cuplikan seed; ia tidak ikut mekanisme db.
- **Statis vs dinamis.** Alur yang bisa dijalankan penuh (mis. booking) hidup di `prototype/` React. Versi HTML tetap
  visual statis; fungsional penuh kira-kira 2 kali kerja (estimasi skill hilir).
- **`tokens.css` dihasilkan** dari `index.css` DS master; jangan diedit tangan.
- **Aturan "DS hanya penambahan"** milik `prototype-kit` (`git diff --stat` DS) berlaku. Satu pengecualian wajar dari
  skill ini: hitungan di `design.md` ("N color tokens") dan `components.md` ("N components") ikut diperbarui saat
  menambah; itu pembukuan, bukan perubahan nilai.
- **Serah-terima.** Commit `.pawang/prototype/` termasuk `.manifest.json` (jangan di-`.gitignore`), dan commit
  perubahan DS terpisah sebelumnya. `prototype-kit` menunjuk `/feature` sebagai langkah berikut dan menyebut bahwa
  ia mendeteksi `prototype/`; **belum diverifikasi** apakah `/feature` juga mencari `.pawang/prototype/`. Periksa
  sebelum mengandalkannya.

**Sinkron berantai.** Figr berubah → `scaffold.py` (mode sync) → `prototype/` berubah → perbaiki DS bila perlu → gerbang
di atas → `scan_repo.py --diff .pawang/prototype/.manifest.json --manifest .pawang/prototype/.manifest.json`, lalu bangun
ulang hanya modul HTML yang berubah. Skill ini tidak pernah menulis ke `.pawang/`; folder itu wilayah skill hilir.

## Aturan yang tidak boleh dilanggar

- **Skill ini tidak meminta persetujuan** untuk perubahan DS, data, maupun refactor. Bila ada pilihan yang sama masuk
  akal, pilih yang mengikuti pola yang sudah ada, catat sebagai asumsi (laporan dan `CHANGELOG.md`), lanjutkan.
  Persetujuan diminta skill hilir (`prototype-kit`) pada rencananya.
- **`figr/` tidak pernah diedit.** Ia masukan mentah.
- **Jangan menimpa perubahan lokal dengan hasil Figr.** Lokal (master) menang; konflik dicatat, bukan dipilih diam-diam.
- **Jangan mengubah `src/screens.figr.json`, `src/useScreenInit.ts`, `src/ui/states.tsx`**, dan jangan mengganti nama
  route di `routes.tsx`. Figr bergantung padanya (`?figr_screen=`, `?sim=`). Bungkus, jangan edit.
- **Jangan mengganti `Button` ber-`to` dengan `href` DS**: `<a>` memicu reload penuh dan membuang `?figr_screen=`.
- **Jangan menambah ke DS tanpa memperbarui dokumennya** (`components.md`, `guides/*`, `design.md`) dan mencatatnya di
  `CHANGELOG.md`. Audit `ds-docs-drift` menjaganya.
- **Jangan menambah `package.json` di dalam DS** dan jangan memformat DS otomatis.
- **Jangan menyalin data dari db ke `useState`**, dan jangan menaruh JSX/fungsi di seed.
- **Jangan membuat screen booking sendiri.** Bila Figr menghasilkannya, hubungkan ke store (`data-layer.md` bagian 4).
- **Jangan menulis atau mengedit `.pawang/`** dari skill ini, dan jangan melanjutkan ke hilir selama gerbang kesenjangan belum kosong. Jangan biarkan skill hilir menulis `prototype/` di akar repo: itu menimpa proyek React.
- **Jangan membuat file config lint/format terpisah** (`.eslintrc`, `.prettierrc`, `.oxlintrc`); semuanya di `vite.config.ts`.
- **Jangan mengklaim "tampilan sama"** tanpa benar-benar membuka layarnya. Build lolos tidak membuktikan styling
  benar (CSS yang tidak ter-load lolos build tanpa error).

## File dalam skill ini

- `scripts/scaffold.py`: baca `figr/`, mode init/sync, rekonsiliasi tiga arah, wiring
- `scripts/audit.py`: audit kepatuhan DS, data terpusat, dan konsistensi DS (hanya membaca)
- `scripts/contrast.py`: rasio kontras WCAG untuk token warna baru
- `references/ds-sync.md`: DS sebagai master: menambah ke DS, menggabungkan Figr baru
- `references/data-layer.md`: model data dinamis, migrasi, alur booking, pengujian
- `references/ds-mapping.md`: padanan komponen/ikon/token, tingkat keputusan
- `references/vite-plus.md`: perintah, konfigurasi, dan jebakan Vite+ yang sudah diuji
- `assets/`: template `index.html`, `vite.config.ts`, `tsconfig.json`, `AGENTS.md`, `.gitignore`, dan kit `store-kit/`
