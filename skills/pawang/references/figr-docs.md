# Dokumen Figr - 4 dokumen + prompt desain

Tujuan: dari wawancara dan bahan proyek, hasilkan `01-PRD.md`, `02-user-flows.md`, `03-interface-designs.md`, `04-edge-cases.md` di `.pawang/figr/`, lalu prompt siap tempel untuk Figr Design. Empat dokumen ini sumber kebenaran sebelum Figr; `figr/` baru muncul setelah Figr menghasilkan prototype.

## Kapan dipakai

- User minta PRD, user flow, spec desain, atau edge case untuk Figr.
- Banyak prototype FE perlu dikonsolidasi menjadi satu aplikasi modular.
- Empat dokumen sudah ada dan user mau mulai generate prototype di Figr; lanjut ke `figr-prompt.md`.

## Wajib grill dulu

Panggil skill `grilling` (companion `mattpocock/skills`) dan biarkan ia mewawancarai user. Jika `grilling` tidak tersedia, tawarkan pemasangan (lihat `companions.md`); jangan meniru gayanya sendiri. Wayfinder tidak dipakai di sini: output-nya peta tiket, bukan empat dokumen Figr.

- Bentuk wawancara: **design tree**, **frontier**, dan **round**. Ajukan seluruh frontier dalam satu ronde, bernomor, dengan rekomendasi jawaban; tunggu jawaban sebelum ronde berikutnya.
- Cari fakta sendiri dari repo/prototype; user hanya menjawab keputusan.
- Selesai bila frontier kosong. Cabang yang ditunda masuk **Keputusan terbuka**, bukan dikarang.
- Jangan menulis empat dokumen sebelum wawancara selesai atau user menyatakan cabang yang ditunda.

Konteks awal untuk grill: jenis proyek, ringkasan prototype (jika ada), konflik yang sudah terlihat, dan tujuan akhir (empat dokumen + prompt Figr).

## Input

- Brief user dan jenis proyek (lihat tabel di bawah).
- Prototype yang sudah ada: zip/folder dengan `routes.tsx`, `screens.figr.json`, atau `main.tsx` + `screens/`.
- Kode yang menentukan keputusan: shell/layout, router, tipe status/enum, komentar kebijakan, mock data yang janggal.
- Inventaris angka: hitung dari file, jangan mengarang. Bila ada banyak prototype, inventaris manual dengan `rg`/Read atau pakai script milik companion/user setelah izin. Pawang tidak membundel script Python.

## Urutan menulis

Tulis berurutan; dokumen berikut merujuk ID dan nomor dari dokumen sebelumnya.

1. `01-PRD.md` — menetapkan konflik `C1..`, keputusan `Q1..`, dan daftar screen.
2. `02-user-flows.md` — merujuk konflik PRD dan nomor screen.
3. `03-interface-designs.md` — memakai angka inventaris dan flow→frame.
4. `04-edge-cases.md` — merujuk frame dan flow; ringkasan dihitung ulang.

## Kerangka inti

### 01-PRD.md

- Ringkasan: dari apa menjadi apa; sebut satu shell, satu design system, satu auth/akun.
- Masalah: tabel per modul/halaman + akar masalah dengan bukti kode.
- Tujuan dan non-tujuan ber-ID (`G1..`); non-tujuan mencegah scope melebar.
- Pengguna dan peran: hanya yang terlihat di kode/permintaan; tandai "bukan daftar final".
- Arsitektur target: struktur folder, kontrak modul, aturan impor, router.
- Shell: rail/menu/panel, perilaku permission, breakpoint, aksesibilitas. Untuk proyek non-modul, ganti dengan header/navigasi halaman.
- Pemetaan modul/halaman: route, menu, tabel redirect URL lama → baru.
- Konflik `C1..`: konflik, bukti, rekomendasi, status (`Wajib`/`Usulan`/`[KEPUTUSAN]`).
- Requirement fungsional `FR-n` (P0–P2) dan non-fungsional `NFR-n`.
- Migrasi/urutan build bila menggabungkan prototype; risiko dan trade-off.
- Keputusan terbuka `Q1..` dan metrik keberhasilan.

### 02-user-flows.md

- Mulai dari `F0` navigasi shell, lalu auth/akun, lalu alur domain.
- Pilih diagram: `stateDiagram-v2` untuk siklus status, `flowchart` untuk alur layar/keputusan, `sequenceDiagram` untuk interaksi peran/sistem.
- Rujuk nomor screen asli (`Setujui run #120`); tulis enum persis seperti kode.
- Transisi tanpa screen pemicu ditandai `[ASUMSI]`.
- Maksimal ±25 node per diagram; pecah bila lebih.
- Jebakan Mermaid: hindari `;`, kata cadangan (`end`, `graph`), dan bentuk `[/teks/]` yang mengandung `/` atau `*`; kutip label bila perlu.

### 03-interface-designs.md

- Shell: tabel lebar kolom dan sisa konten per viewport; hitung dari angka nyata.
- Tiga mode bila relevan: Standar, Master-detail, Canvas.
- Rail/menu/panel: ukuran, state (`default · hover · active · focus · badge · tersembunyi`), isi per modul.
- Flow → frame: tabel `Flow | urutan frame` memakai nomor screen.
- Inventaris frame: `# · Screen · Route baru · Layout · State tersedia · Frame`; tandai hasil heuristik untuk verifikasi manual.
- Konvensi nama frame: `{modul}/{bagian}/{#nomor} {Nama} — {state}`; kosakata state seragam.
- Jangan menggambar ulang isi screen yang sudah ada; fokus pada shell dan frame baru.

### 04-edge-cases.md

Format baris tetap:

```
| EC-XX-NN | Skenario | Perilaku yang diharapkan | Frame | Sev | Dasar |
```

- `XX` = area, `NN` unik; `Sev` = `K` kritis, `T` tinggi, `S` sedang, `R` rendah.
- `Dasar` = `P` terlihat di prototype/kode, `U` usulan. Jangan menyamarkan usulan sebagai bukti.
- `Frame` = nomor screen yang harus punya state/dialog, atau `baru`.
- Area minimal: shell/navigasi, auth/sesi, permission, form/data, jaringan/waktu, dan satu area per domain.
- Perilaku harus konkret ("Composer dinonaktifkan; hanya Kirim template"), bukan "tangani dengan baik".
- Jangan menggandakan state standar (loading/error/empty) per screen; satu baris umum cukup.
- Akhiri dengan ringkasan severity/dasar dan dua daftar: blocker desain, butuh keputusan produk.

## Penyesuaian jenis proyek

| Jenis                               | Fokus tambahan                                                       | Penyesuaian                                               |
| ----------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------- |
| ERP / aplikasi internal multi-modul | peran/izin, fitur kembar, migrasi, pemisahan tugas, data sensitif    | kerangka penuh; shell rail + panel kedua                  |
| Konsolidasi banyak prototype        | istilah/route lama, konflik lintas modul, strategi strangler         | inventaris + tabel redirect                               |
| Web profile / company profile       | tujuan, audiens, halaman wajib, pengelola konten, SEO, CTA           | PRD: sitemap + metrik konversi; flow pengunjung → CTA     |
| Landing page / e-commerce           | penawaran, funnel, pembayaran, stok, retur, analitik, privasi        | flow funnel penuh; edge case pembayaran/stok/kupon        |
| Aplikasi mobile/web konsumen        | persona, aktivitas inti, onboarding, notifikasi, offline, monetisasi | flow onboarding + pemulihan akun; edge case izin/jaringan |
| Dashboard / internal tool kecil     | keputusan dari data, sumber, kesegaran, ekspor                       | satu-dua flow; edge case data kosong/terlambat            |

Jangan menampilkan bagian kosong demi kelengkapan. Jika user menolak menjawab, tulis sebagai keputusan terbuka dan jelaskan dampaknya.

## Penanda kejujuran

- `[ASUMSI]` — disimpulkan; tidak ada screen/kode yang membuktikan.
- `[KEPUTUSAN DIBUTUHKAN]` — user/produk harus memilih.
- `Wajib` — bertentangan dengan kebijakan yang tertulis di kode.
- Edge case: `P` bukti, `U` usulan.

## Diagram

- **Sumber tetap Mermaid di Markdown.** Jangan mengganti flow/ERD/class diagram dengan HTML/CSS manual: sulit diedit, cepat drift, dan tidak bisa dibaca Figr sebagai diagram editable.
- Empat dokumen Figr tetap `.md` + blok ` ```mermaid `.
- ERD/class diagram tambahan (bila perlu): `.pawang/figr/05-erd.md`, `.pawang/figr/06-class-model.md`, tetap Mermaid.
- Viewer HTML opsional, generated lewat kit.js:

  ```bash
  node .pawang/kit.js render diagram --from .pawang/figr/02-user-flows.md
  node .pawang/kit.js render diagram --from .pawang/figr/05-erd.md
  ```

  Output default `.pawang/figr/diagrams/<nama>.html`; `--out <file>` bila perlu path lain. HTML memuat sumber Mermaid dan Mermaid.js CDN; jangan diedit manual.

- Yang dikirim ke Figr tetap Markdown, bukan HTML diagram.
- Validasi Mermaid opsional: jalankan `mmdc` bila tersedia. Jika tidak, katakan diagram belum dirender; jangan menyatakan valid.

## Verifikasi

- Angka yang sama (jumlah frame, screen, duplikasi) konsisten di semua dokumen.
- Setiap `[KEPUTUSAN DIBUTUHKAN]` di PRD punya padanan di "Keputusan terbuka".
- Nomor screen di flow/edge case ada di inventaris atau `screens.figr.json`.
- Tidak ada klaim yang tidak bisa ditunjuk sumbernya.
- Hitung ulang ringkasan edge case; jangan mengandalkan perkiraan.
- Jika alat validasi/render tidak ada, sebutkan yang belum terverifikasi.

## Handoff

1. Setelah empat dokumen disetujui, isi template di `figr-prompt.md` dan simpan hasilnya di `.pawang/figr/prompt.md`.
2. Lampirkan empat Markdown (bukan HTML diagram) ke Figr Design bersama prototype lama dan template dokumen bila ada.
3. Hasil Figr diletakkan di `figr/`, lalu lanjut ke `prototype-figr.md`.
4. `.pawang/figr/` adalah dokumen sumber (Markdown, di-commit); `figr/` adalah output mentah. Jangan mencampur keduanya.

## Larangan

- Menulis dokumen sebelum grill selesai, atau mengganti grill dengan tebakan.
- Mengarang angka, screen, route, enum, atau konflik tanpa sumber.
- Menambah/mengurangi screen dari daftar acuan tanpa persetujuan user.
- Menaruh empat dokumen di `figr/` atau mencampurnya dengan output mentah Figr.
- Menjadikan HTML diagram sebagai sumber kebenaran.
- Menyalin seluruh isi dokumen sumber Figr ke reference ini; cukup kontrak dan aturan kerjanya.
