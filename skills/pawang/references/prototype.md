# Prototype - kunci tampilan sebelum fitur UI

Tujuan: menyepakati arah visual lewat mockup statis dan satu file tema bersama, sebelum menulis kode aplikasi. Prototype adalah langkah pra-build, cepat dan sekali pakai. Satu-satunya output yang bertahan: `prototypes/theme.css`.

File ini adalah **lane A** dan HANYA untuk proyek tanpa Figr. Bila proyek punya folder `figr/` atau design system Figr, jangan pakai lane A — pakai `prototype-figr.md` (lane B). Prototype lane B disimpan di `.pawang/prototype/`, bukan `prototypes/`.

## Aturan dasar

- **Plan-first.** Kumpulkan look & pages, ajukan plan, tunggu persetujuan. Jangan menulis file sebelum user setuju.
- **Semua file `.pawang/` hanya lewat `kit.js`.** Mockup di `prototypes/` bukan file `.pawang`, jadi ditulis langsung sebagai HTML statis biasa.
- **Satu sumber tema.** `prototypes/theme.css` merestyling semua mockup sekaligus. Semua warna, font, dan spacing mockup diambil dari variabel theme, jangan hard-code.
- **Di-commit, bukan gitignore.** `prototypes/` hidup singkat di git: lahir di sini, dibuang saat fitur UI pertama `complete`.
- **Berhenti setelah menulis.** Prototype mengunci tampilan, bukan membangun aplikasi.

## Langkah 1 - baca rencana yang sudah ada

Baca bagian UI/UX di project-overview supaya kamu menyempurnakan niat user, bukan bertanya dari nol. Kalau belum ada, pakai build-plan sebagai gantinya. State dibaca lewat kit, bukan dibuka manual:

```bash
node .pawang/kit.js extract .pawang/context/project-overview.html
```

## Langkah 2 - tanya look & pages

Seed pertanyaan dari isi rencana. Tanya singkat:

- **Look & feel** - konfirmasi atau sesuaikan vibe (light/dark, minimal/rich, density, dsb). Minta contoh app/situs yang ingin terasa mirip.
- **Warna & font** - arah accent dan font (misal mono untuk konten kode).
- **Halaman mana** - layar yang mau dibuat sekarang. Default rute kunci dari rencana; user boleh menambah, membuang, atau mengurutkan. Condong ke sedikit layar, bukan semua.

Jawaban user plus rencana = brief untuk mockup.

## Langkah 3 - ajukan plan, lalu tunggu

Sajikan plan pendek lalu berhenti:

- arah tema dalam 1-2 kalimat (vibe, accent, font);
- daftar layar yang akan dimock, satu baris per layar tentang apa yang ditampilkan (state nyata yang menguji tema, bukan cangkang kosong).

**Tulis nol file sampai user setuju.** Sesuaikan plan bila user menolak.

## Langkah 4 - tulis satu tema

Setelah disetujui, tulis `prototypes/theme.css`: variabel CSS untuk surfaces, text, accent, state komponen, font stack, dan skala kecil. Ikuti template token di `references/theme-variables.css` (relatif folder skill ini). Nilai contoh di sana wajib diturunkan ulang dari brief, bukan disalin mentah.

File ini deliverable utama dan output durable. Jaga tetap satu sumber tema.

## Langkah 5 - mock tiap layar

Untuk tiap layar yang disetujui, tulis `prototypes/<screen>.html` mandiri yang me-link `theme.css`:

- Konten dummy realistis, bukan lorem ipsum.
- Tampilkan state yang penting (data terisi, kosong, error, mid-action), bukan cangkang kosong.
- HTML + CSS murni. Tanpa framework, tanpa build step. Beberapa baris JS inline untuk toggle tampilan boleh, tidak lebih.
- Semua nilai visual dari variabel `theme.css`.
- Desktop-first sudah cukup.

## Setelah mockup jadi, berhenti

Minta user membuka file di browser dan beriterasi soal tampilan. Catat keputusan tampilan yang disetujui (vibe, accent, font, alasan) di `notes` spec fitur supaya tidak hilang saat mockup dihapus. Langkah berikutnya konkret: tulis spec `feature` untuk fitur UI pertama. Spec itu menaut mockup sebagai `references.design` dan menjadikan porting `theme.css` ke stylesheet aplikasi sebagai step pertama.

Setelah tema diporting ke aplikasi, jalankan:

```bash
node .pawang/kit.js theme --refresh
```

supaya laporan kit ikut tema project. Mockup HTML tetap di `prototypes/` sebagai referensi build dan dibuang saat fitur UI pertama `complete`.

## Larangan

- Menulis mockup sebelum persetujuan.
- Menulis atau mengedit HTML `.pawang/` manual (selalu `node .pawang/kit.js render <tipe>`).
- Hard-code nilai theme di mockup.
- Menambah `prototypes/` ke `.gitignore`.
- Membuat beberapa varian yang hanya beda warna atau copy; varian harus beda struktur.
- Menyambungkan mockup ke mutasi data atau backend nyata; mockup read-only dengan data dummy.
- Mempromosikan HTML mockup mentah ke produksi; port token ke stylesheet aplikasi lalu tulis UI sungguhan.
- Menambah layar di luar plan yang disetujui.
- Menganggap mockup sebagai bukti verifikasi; verifikasi tetap lewat `check` pada app yang berjalan.
