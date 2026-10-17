---
name: prototype-kit
description: Ubah screen Figr/React (TSX) menjadi prototype HTML statis berbasis design system, hasilnya selalu disimpan di .pawang/prototype. Sumber bisa hasil figr-to-prototype (prototype/src + prototype/packages/shared/ui) atau, bila mandiri, blueprint/references/figr + package/design-system. Alur - baca aturan, scan, rencana + estimasi disetujui dulu, kit (token, ikon, komponen), data, screen, verifikasi, serah-terima ke /feature. Pakai untuk /prototype, 'prototype html', 'ubah ke html', 'kunci tampilan', 'buat kit', 'estimasi prototype', atau saat figr/design system berubah dan prototype perlu disinkronkan. Bila DS belum dikelola figr-to-prototype dan figr memakai UI, ikon, atau token yang belum ada di DS, DS diperluas lebih dulu.
---

# prototype-kit: kunci tampilan dari Figr + design system

Posisi di alur kerja:

    plan -> /overview -> [prototype-kit] -> /feature -> build

Bila proyeknya dikelola `figr-to-prototype`, rantainya:

    figr/ -> figr-to-prototype -> prototype/ (React, dinamis, DS master) -> [prototype-kit] -> .pawang/prototype/ (HTML statis)

## Lokasi

Tiga variabel dipakai di seluruh dokumen ini. Tentukan mode dulu, lalu isi variabelnya.

**Mode rantai** bila `prototype/packages/shared/ui/index.css` **dan** `prototype/.figr-raw/` ada (artinya `figr-to-prototype` sudah berjalan). Selain itu **mode mandiri**. Bila keduanya tidak cocok dan lokasi bawaan tidak ada, tanyakan lokasinya ke user. Jangan mengarang isi.

| Variabel | Mode rantai | Mode mandiri | Peran |
|---|---|---|---|
| `SRC` | `prototype/src` | `blueprint/references/figr` | Apa yang tampil: halaman, rute, data, alur |
| `DS` | `prototype/packages/shared/ui` | `package/design-system` | Bagaimana tampilannya: token, ikon, resep komponen, aturan UI/UX |
| `OUT` | `.pawang/prototype` | `.pawang/prototype` | Keluaran prototype HTML. **Selalu di sini.** |

Rencana proyek (kedua mode): `blueprint/context/project-overview.md` (bagian UI/UX), cadangan `blueprint/project-plan.md`, bila ada.

**Jangan menulis `prototype/` di akar repo.** Pada mode rantai folder itu adalah proyek React milik `figr-to-prototype`; menulis ke sana menimpanya. Semua keluaran hanya ke `OUT`.

Setiap keputusan desain dibuat sekali di kit, nilainya dari DS, bukan dari tebakan atau class Tailwind mentah. Komunikasi dalam bahasa Indonesia, singkat. Ukur pekerjaan dalam putaran (satu build berisi beberapa file yang bisa dicek user), bukan jam. Format laporan mengikuti `blueprint/context/ai-interaction.md` jika ada: ringkas, daftar untuk enumerasi, tabel untuk matriks.

**Skill ini plan-first.** Jangan menulis file prototype sebelum user menyetujui rencana (Langkah 2). Pada mode rantai, hulu (`figr-to-prototype`) tidak pernah meminta persetujuan; seluruh persetujuan diminta di sini.

**Aksi pertama (kondisional):** jika `blueprint/.state/` ada dan `AGENTS.md` mendefinisikan dashboard activity contract, publish `running` ke `blueprint/.state/run.json` sebelum inspeksi atau tool call lain. Jika tidak ada, lewati. Gunakan ulang file yang sudah termuat di sesi; baca ulang hanya jika belum ada atau berubah.

## Output

Nama tetap: folder `prototype/` dan zip `prototype.zip`, apa pun nama repo atau modulnya. Jangan memakai akhiran seperti `prototype-admin`. Folder induk `.pawang/` yang memisahkannya dari `prototype/` di akar repo. Untuk beberapa repo, pisahkan lewat folder induk tambahan bila perlu.

```
.pawang/prototype/          # = OUT
├── index.html          # shell + router hash (#/rute)
├── catalog.html        # katalog kit: semua komponen dan variannya
├── tokens.css          # DIHASILKAN dari index.css DS (ds_to_tokens.py), jangan edit tangan
├── prototype.css             # gaya komponen; hanya memakai token DS
├── icons.js            # SVG inline: ikon DS dulu, cadangan lucide
├── prototype.js              # komponen (fungsi -> HTML), router, dialog, toast
├── data/<modul>.js     # data dummy per modul
├── screens/<modul>.js  # rute + render per screen
└── .manifest.json      # hash file sumber (SRC + DS) untuk sinkronisasi
```

Istilah "kit" di dokumen ini berarti `prototype.css` + `prototype.js` + `tokens.css` + `icons.js` (komponen, token, ikon yang dipakai semua screen). Objek global di `prototype.js` tetap `K` (`K.route`, `K.*`).

Titik awal: `assets/prototype-starter/` (sudah jalan dan memakai token DS). Salin ke `OUT`, jangan menulis ulang. `data/sample.js` dan `screens/sample.js` hanya contoh: ganti dengan yang asli dan perbarui tag `<script>` di `index.html`, kalau tidak `check_prototype.py` menandai ikon contoh yang tidak ada di `icons.js`.

Skrip membuat folder `OUT` sendiri. Di lingkungan tanpa repo (mis. claude.ai), tulis ke folder kerja `.pawang/prototype/`, lalu zip dengan folder akar bernama `prototype/` ke `/mnt/user-data/outputs/prototype.zip` (mis. `cd .pawang && zip -r prototype.zip prototype`) dan sajikan filenya.

## Alur kerja

### 0. Baca aturan dan konteks (urutan penting)
1. Repo: `AGENTS.md` (root dan `apps/*/`; pada mode rantai juga `prototype/AGENTS.md`, karena `scan_repo.py` dengan `SRC=prototype/src` tidak menemukannya otomatis), `docs/specs/`, `blueprint/context/project-overview.md` bagian UI/UX. Ambil niat tampilan dan daftar screen/rute dari sini.
2. DS: `AGENTS.md` atau `instructions.md` -> `design.md` -> `guides/*.md` yang relevan -> grep `index.css` untuk nilai persis -> cek `src/components/` sebelum membuat komponen baru. Catat urutan otoritas DS (biasanya `index.css` > `design.md`/`guides` > `src/components` > guide struktur halaman) dan daftar deviasi yang sudah diketahui. Jika implementasi komponen DS bertentangan dengan guide, ikuti guide. Pada mode rantai baca juga `DS/CHANGELOG.md` (perubahan DS dari hulu) bila ada.
3. Jika file-file itu tidak ada, katakan terus terang dan lanjut dari struktur kode. Link Drive pribadi tidak bisa dibuka; minta file di-upload.
4. Jika ada skill audit atau generate khusus DS di sesi ini (mis. `*-ds-audit-generate`), pakai untuk audit visual atau komponen baru.

### 1. Inventaris
```bash
python scripts/scan_repo.py $SRC --ds $DS --manifest .pawang/prototype/.manifest.json
```
Pada mode rantai pakai `SRC=prototype/src`, **bukan** `prototype/`: bila repo = `prototype/`, skrip ikut menghitung `.figr-raw` dan `packages` sebagai modul dan daftar komponen UI kosong.

Laporan: modul, rute, komponen `ui/`, ikon lucide, estimasi, aturan dan guides DS, komponen DS yang muncul, dan KESENJANGAN (token atau peran tipografi yang dipakai screen tetapi tidak ada di DS, mis. `bg-danger-soft`). Jangan membaca ratusan file satu per satu.

### 2. Rencana, estimasi, dan satu gerbang persetujuan
Sajikan satu rencana pendek lalu **berhenti menunggu persetujuan**:

- **Arah tampilan**: satu-dua kalimat, diturunkan dari DS dan `project-overview.md` (bukan ditanyakan dari nol). Tanyakan hanya yang belum dijawab keduanya (mis. kepadatan, referensi aplikasi).
- **Screen yang dibuat**: default dari rute `SRC` dan plan; user boleh menambah, mengurangi, mengurutkan. Satu baris per screen berisi keadaan nyata yang ditampilkan (bukan cangkang kosong). Pada mode rantai, `prototype/src/screens.figr.json` memuat varian keadaan tiap screen (loading, error, empty); jadikan itu daftar keadaan yang ditawarkan. Condongkan ke sedikit screen, bukan semua.
- **Estimasi**: angka dari `scan_repo.py` (kit 3 putaran + sekitar 1 putaran per 6 file screen, plus-minus 25%). Asumsi prototype visual (data dummy, navigasi, dialog dasar); fungsional penuh sekitar 2x. Pada mode rantai, alur dinamis (mis. booking) sudah hidup di `prototype/` React; versi HTML tetap visual statis. Sajikan tabel per tahap.
- **Perubahan DS**, tergantung mode:
  - **Mode mandiri**: setiap UI, ikon, token, atau komponen di `SRC` yang tidak ada di DS **ditambahkan ke DS**, bukan ditambal di kit. Sajikan satu tabel: item, jenis (token / ikon / komponen / aturan), nilai atau bentuk yang diusulkan, asal (file), dan file DS yang akan disentuh. Persetujuan gerbang ini mencakup perubahan DS. Untuk item yang ditolak user, pakai fallback dan tandai "belum di DS" di katalog dan laporan: token -> peran DS terdekat yang sah, ikon -> SVG lucide, komponen -> rakit dari token DS.
  - **Mode rantai**: DS dikerjakan hulu, jadi tabel kesenjangan **harus kosong**. Jika tidak kosong, hentikan dan kembalikan ke `figr-to-prototype` (langkah 5, tambahkan ke DS); jangan mengubah DS dari sini, supaya hanya satu skill yang memegang DS. Karena hulu tidak meminta persetujuan, sajikan di rencana satu bagian **"Perubahan DS dari hulu"** dari entri `DS/CHANGELOG.md` yang belum pernah disetujui (bila `.pawang/prototype/.manifest.json` sudah ada: entri baru sejak itu; bila belum: semua entri), berisi apa, nilai, alasan, asumsi. Persetujuan gerbang ini mencakup perubahan tersebut. Bagi item yang ditolak, minta user membatalkan commit DS-nya di hulu (perubahan DS seharusnya berada di commit terpisah), lalu pakai fallback "belum di DS" seperti di atas.

Sesuaikan rencana jika user keberatan. Tulis file hanya setelah disetujui.

### 3. Perbarui DS (mode mandiri saja, dan hanya bila ada item yang disetujui di tabel Langkah 2)
Pada mode rantai lewati langkah ini: DS dipegang `figr-to-prototype`.

DS adalah sumber kebenaran. Perbarui DS **lebih dulu**, baru hasilkan token dan ikon dari DS, supaya kit tidak pernah memuat nilai yang tidak ada di DS.

Aturan:
- **Hanya menambah.** Jangan mengubah atau menghapus token, ikon, komponen, atau aturan yang sudah ada. Hanya tambahkan yang dipakai screen yang masuk cakupan; jangan melengkapi set "sekalian".
- Ikuti konvensi penamaan dan format yang sudah ada di tiap berkas. Baca entri tetangga sebelum menulis.
- Ambil nilai dari `SRC`, bukan dari tebakan, lalu tentukan perannya. Jika nilainya sama dengan token yang sudah ada, pakai token itu dan jangan membuat yang baru. Cek kontras AA untuk setiap pasangan warna baru.
- Tempat perubahan (urutan otoritas DS):
  | Jenis | Berkas DS |
  |---|---|
  | Token (warna, radius, bayangan, peran tipografi) | `index.css` (`@theme` atau `@utility`) |
  | Ikon | `src/components/Icon/Icon.tsx`, objek `PATHS`, satu baris per ikon dengan format yang sama dengan entri lain. Ambil data SVG dari lucide: jalankan `build_icons.py --names <Nama> <file-sementara.js>` lalu salin isinya |
  | Komponen atau varian | resep di `guides/components.md`; implementasi di `src/components/<Nama>/` bila DS menyimpan implementasi dengan konvensi itu |
  | Aturan baru | `design.md` atau guide terkait |
  Jika DS punya changelog atau daftar deviasi, catat penambahan di sana.
- Setelah selesai: `git diff --stat $DS` harus hanya memuat penambahan. Jalankan ulang `ds_to_tokens.py` dan `build_icons.py --ds` pada Langkah 4.
- Jika DS tidak bisa ditulis (tidak ada di repo, atau di luar akses), jangan melewati langkah ini diam-diam: tulis usulan sebagai `.pawang/prototype/design-system-additions.md` (item, nilai, berkas tujuan) dan pakai fallback di kit dengan tanda "belum di DS".

### 4. Bangun kit (sebelum satu pun screen)
Baca `references/ds-mapping.md` (cara menerjemahkan resep DS ke kit) dan `references/prototype-conventions.md` (kontrak komponen). Urutan:
1. **Token**: `python scripts/ds_to_tokens.py $DS .pawang/prototype/tokens.css`. Nama token sama persis dengan DS (`--color-primary`, `--radius-sm`, `--type-body`, `--shadow-card`). Jangan menulis nilai warna atau ukuran dengan tangan. Jika DS tidak punya `index.css`, hentikan dan laporkan; jangan mengarang nilai pengganti. Jalankan ulang setiap kali `index.css` berubah.
2. **Ikon**: `python scripts/build_icons.py $SRC .pawang/prototype/icons.js --ds $DS`. Semua ikon sudah ada di `Icon.tsx` DS (Langkah 3 pada mode mandiri, hulu pada mode rantai), jadi skrip harus melaporkan 0 ikon dari lucide (kecuali item yang ditolak user, yang ditandai "belum di DS"). Pada mode rantai, angka tidak nol berarti DS belum lengkap: kembali ke hulu.
3. **prototype.css dan prototype.js**: untuk tiap komponen DS yang dipakai screen (lihat laporan scan), ambil resepnya di `guides/components.md` dan terjemahkan ke `prototype.css` dengan token. Pakai nama dan varian DS (Button, StatusPill, Chip, Tabs, Dialog, Callout, EmptyState, ErrorState, Skeleton, dan seterusnya) agar pemetaan React -> HTML satu-satu. Bangun hanya komponen yang dipakai screen, termasuk komponen yang baru ditambahkan ke DS.
4. **catalog.html**: render semua komponen dan variannya, termasuk keadaan hover, disabled, error, empty, loading yang disebut guide. User mereview kit di sini sekali.
5. Jalankan `python scripts/check_prototype.py .pawang/prototype/` sampai bersih.

### 5. Data
Turunkan `data/<modul>.js` dari data sumber. **Mode mandiri:** data figr; salin bentuk objek. **Mode rantai:** data sudah dipusatkan, jadi sumbernya **seed** di `prototype/src/store/db.ts` (dan `prototype/src/data/seed/`), bukan konstanta lama; HTML statis mengambil cuplikan seed dan tidak ikut mekanisme db. Ringkas ke 5-15 baris per entitas, pertahankan field yang tampil. Teks UI memakai bahasa DS (mis. Bahasa Indonesia). Data tidak boleh ditulis di dalam file screen. Untuk teks yang berhubungan klaim (ketersediaan, ETA, kredensial, klinis) ikuti aturan copy DS. Gunakan konten realistis, bukan lorem ipsum.

### 6. Screen per modul
Urut dari modul terkecil ke terbesar. Satu modul = satu `screens/<modul>.js`, rute dari `routes.tsx` lewat `K.route`. Aturan:
- Screen hanya memanggil `K.*` dan membaca `DATA.*`. Tanpa hex, tanpa `style=""` selain dimensi atau variabel, tanpa token karangan. Setiap warna, font, dan spasi berasal dari variabel `tokens.css`.
- Struktur halaman mengikuti guide pola DS (urutan header, konten, CTA, footer) bila ada, dan layout sumber bila memang berbeda (mis. rail + daftar + detail).
- Butuh varian baru? Tambahkan ke kit dan katalog dulu, baru dipakai. Jika itu juga belum ada di DS, ia harus masuk DS dulu (mode mandiri: Langkah 3; mode rantai: kembali ke hulu).
- Tampilkan keadaan yang bermakna (daftar terisi, terpilih, kosong, error), bukan hanya keadaan default. Desktop-first cukup.
- Satu build boleh memuat beberapa screen; tulis tiap file sekali. Screen berat (canvas flow, editor langkah) cukup versi visual statis, tandai di laporan.

### 7. Verifikasi
Cek tambahan: `build_icons.py --ds` melaporkan 0 ikon dari lucide, dan (mode mandiri) `git diff $DS` hanya penambahan. `check_prototype.py` harus bersih: ikon ada, rute terdaftar, setiap `var(--...)` ada di `tokens.css`, tidak ada warna mentah, `:focus-visible` ada, tidak ada dark mode bila DS light-only. Lalu self-check yang tidak bisa diotomatisasi: pasangan teks/latar memenuhi kontras AA, elemen interaktif punya nama aksesibel (ikon-saja butuh `aria-label`), satu CTA utama per konteks.

### 8. Serah-terima
- Zip menjadi `prototype.zip` (satu folder akar `prototype/`, dari `.pawang/prototype/`) bila diminta atau bila tidak ada repo. Pastikan tidak ada nama `prototype-*`.
- **Commit `.pawang/prototype/` termasuk `.manifest.json`; jangan masukkan ke `.gitignore`** (pastikan juga `.pawang/` tidak terabaikan oleh ignore global). Token dan mockup adalah referensi build yang harus bertahan melewati context clear atau pindah mesin.
- Tunjuk langkah berikutnya: jalankan `/feature` pada fitur UI pertama. Sebutkan lokasi mockup secara eksplisit, **`.pawang/prototype/`**, karena `/feature` sebelumnya mendeteksi `prototype/` di akar. Bila `/feature` belum mengenali lokasi ini, sesuaikan `/feature`, bukan lokasi keluaran. `/feature` menautkan mockup sebagai Design reference spec dan menjadikan porting token ke `@theme` di `globals.css` sebagai langkah build pertamanya. Mockup HTML dibuang saat `/complete` fitur itu.
- **Perubahan DS** (mode mandiri) dilaporkan terpisah (daftar item dan berkas yang disentuh). Sarankan commit tersendiri sebelum commit `.pawang/prototype/`, mis. `feat(design-system): tambah ikon dan token untuk <modul>`. Pada mode rantai, perubahan DS sudah dilaporkan hulu dan masuk commit terpisahnya; di sini cukup rujuk. Jangan commit kecuali diminta user.
- Laporan akhir 2-3 kalimat: apa yang jadi, asumsi, perubahan DS, dan item yang masih ditandai "belum di DS". Prototype ini mengunci tampilan; ia tidak membangun aplikasi.

## Sinkronisasi saat sumber atau DS berubah
```bash
python scripts/scan_repo.py $SRC --ds $DS --diff .pawang/prototype/.manifest.json --manifest .pawang/prototype/.manifest.json
```
Pada mode rantai, urutannya: Figr berubah -> `figr-to-prototype` (mode sync) memperbarui `prototype/` dan DS -> baru jalankan perintah di atas. Diff memisahkan file sumber dan file DS (`ds:...`). **DS berubah** -> jalankan ulang `ds_to_tokens.py` (dan `build_icons.py` bila `Icon` berubah) -> `prototype.css` dan katalog untuk resep yang berubah -> `check_prototype.py`. **Sumber berubah** -> data -> screen yang terdampak. Jangan membangun ulang modul yang tidak berubah.

## Hal yang sering salah
- Menulis `prototype/` di akar repo pada mode rantai. Itu proyek React; keluaran hanya ke `.pawang/prototype/`.
- Mengubah DS dari sini pada mode rantai. Pemiliknya `figr-to-prototype`; kesenjangan dikembalikan ke sana.
- Membuat screen dulu lalu merapikan desain belakangan. Itu persis bolak-balik yang mau dihindari.
- Menulis file sebelum rencana disetujui.
- Menyalin class Tailwind mentah atau warna dari screen React ke HTML. Terjemahkan lewat resep dan token DS.
- Menulis `tokens.css` dengan tangan, atau menambah token, ikon, atau komponen di kit tanpa menambahkannya ke DS lebih dulu.
- Menambah dark mode, atau mengubah atau menghapus nilai DS yang sudah ada. Perubahan DS hanya penambahan.
- Memakai ikon lucide langsung di kit padahal bisa ditambahkan ke `Icon.tsx` DS.
- Menambah ke DS lebih dari yang dipakai screen.
- Mengikuti implementasi komponen DS yang menyimpang dari guide (cek daftar deviasi di aturan DS).
- Mengisi data dengan ratusan baris.
- Memasukkan `.pawang/prototype/` ke `.gitignore`.
