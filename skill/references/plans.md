# Rencana - build-plan dan project-overview

Tujuan: menulis dua state rencana proyek lewat `node .pawang/kit.js`: `context/build-plan.html` (roadmap fitur yang bisa dicentang) dan `context/project-overview.html` (apa yang dibangun dan kenapa). User pemilik keputusan; agent mencatat jawaban dan fakta, bukan mengarang.

## Kapan dipakai

Gunakan `plans` saat:

- memulai proyek baru atau mengubah arah produk;
- menyusun roadmap/MVP atau menentukan urutan build;
- ada bahan Figr (`01-PRD.md` sampai `04-edge-cases.md`) yang perlu diterjemahkan menjadi rencana;
- project-overview masih kosong atau sudah tidak sesuai kenyataan.

Jangan pakai untuk bug, perbaikan kecil, atau fitur tunggal yang sudah jelas; itu `fix` atau `feature`. Jangan menulis plan di luar `.pawang/`: bukan di `blueprint/`, bukan di `docs/`. Pawang hanya menulis lewat kit.js.

## Sumber keputusan

Pilih sumber berdasarkan situasi; bila jelas, langsung pakai satu jalur atau gabungkan:

- **A. Wawancara terstruktur.** Tanyakan keputusan yang hanya ada di kepala user, satu giliran maksimal sekitar enam pertanyaan. Cabang yang wajib: problem dan success measure; users/roles; MVP in/out; data; tech dan constraints; monetization; UI/UX dan platform; deployment; usage/constraints; build order. Cari fakta sendiri dari repo sebelum bertanya, supaya user hanya menjawab keputusan. Jawaban yang ditunda menjadi `(belum diputuskan)`.
- **B. File Figr.** Baca `01-PRD.md`, `02-user-flows.md`, `03-interface-designs.md`, `04-edge-cases.md` dari folder `figr/`. Bawa fakta; konfirmasi proposal. Bila user menyebut file yang tidak tersedia, minta file itu; jangan mengarang isinya.
- **C. Kombinasi.** Pakai Figr sebagai kerangka, lalu wawancara hanya untuk keputusan terbuka, konflik, atau bagian yang tidak dicakup (mis. monetization).

## Langkah

1. **Cek state lama.** Jalankan `node .pawang/kit.js extract .pawang/context/build-plan.html` dan `node .pawang/kit.js extract .pawang/context/project-overview.html`. Jika sudah ada, ini pembaruan: pertahankan wording, urutan, ID, dan item selesai yang tidak diminta berubah.
2. **Kumpulkan keputusan.** Jalankan jalur A, B, atau C. Untuk Figr, ringkas per bagian; jangan menempel diagram Mermaid atau inventaris frame. Tandai setiap ketidakpastian sebagai `(belum diputuskan)`.
3. **Susun draft penuh.** Tulis kedua dokumen dalam bentuk yang akan dirender: `items` untuk build-plan; `summary`, `problem`, `users`, `stack`, `data`, `ui`, `deployment`, `constraints` untuk project-overview. Periksa tidak ada kontradiksi antar-keduanya.
4. **BERHENTI untuk persetujuan user.** Ini gerbang. Tulis nol file sebelum user menyetujui. Tunjukkan draft lengkap, bukan ringkasan.
5. **Render setelah disetujui.** Build-plan:

   ```bash
   node .pawang/kit.js render build-plan <<'JSON'
   { "items": [ { "id": "1", "text": "Fitur pertama - outcome yang terlihat user", "done": false } ] }
   JSON
   ```

   Project-overview:

   ```bash
   node .pawang/kit.js render project-overview <<'JSON'
   { "summary": "...", "problem": "...", "users": "...", "stack": ["..."], "data": ["..."], "ui": "...", "deployment": "...", "constraints": "..." }
   JSON
   ```

6. **Arahkan ke fitur.** Setelah render, lanjut ke `references/feature.md` untuk item build-plan pertama yang belum selesai.

## Aturan build-plan

- Satu baris = satu outcome berukuran fitur yang bisa di-spec dan dibangun sendiri; bukan "Database" atau "Rapikan tampilan", bukan juga "Habits, streak, ringkasan, dan deploy".
- Urutkan menurut dependensi dan nilai: item awal membuka item berikutnya.
- Jangan masukkan langkah pra-build: scaffold, setup, dan prototype bukan fitur. Mulai dari irisan nyata pertama.
- Jika project-overview punya target deployment, jadikan deployment readiness item terakhir.
- ID stabil. Tambah item baru di akhir; jangan menomori ulang item lama.
- Setelah fitur pertama ship, jangan mengganti plan. Pertahankan item selesai dan ID-nya; tambahkan item baru di ujung.
- Bug dan perubahan kecil tak terencana masuk `fix`, bukan roadmap.
- Setiap item harus tertaut ke fitur yang dijelaskan project-overview. Jangan menambah fitur tanpa memperbarui overview lebih dulu.
- Pecah item besar menjadi `4a`, `4b` saat spec fitur, bukan sebelum.

## Aturan project-overview

- Isi field di atas sesuai keputusan user. Tulis keputusan apa adanya; jangan memperhalus atau menambah maksud.
- Unknown menjadi `(belum diputuskan)` lalu tanyakan. Jangan mengarang user, data, stack, deployment, atau constraint.
- `constraints` hanya fakta yang dinyatakan user: skala, local vs internet-facing, tenancy, keamanan/compliance, non-requirement eksplisit. Jangan mengubah unknown menjadi asumsi enterprise, multi-tenant, atau single-user.
- Perbarui overview hanya bila arah produk, users, data, stack, UI/UX, atau deployment berubah. Fitur baru yang tidak mengubah arah cukup jadi baris build-plan.
- Jaga konsistensi dengan build-plan: stack, scope, dan deployment tidak boleh bertentangan.

## Bila memakai Figr

- Baca keempat file; file yang tidak ada dilaporkan, bukan ditebak.
- Bawa sebagai fakta: roles dan enum dari kode, route/screen, temuan dengan Basis P, dan semua yang ditandai **Wajib**.
- Konfirmasi proposal: `[ASUMSI]`, `[KEPUTUSAN DIBUTUHKAN]`, "Usulan", Q terbuka, dan edge case Basis U. Sebelum dikonfirmasi, tulis `(belum diputuskan)`, bukan requirement.
- Bila jawaban user bertentangan dengan file Figr, user menang. Sebut kontradiksinya sekali agar file sumber bisa diperbaiki.
- Ringkas, jangan tempel diagram atau inventaris frame. Sebut referensi file dan ID-nya.
- Akhiri baris build-plan dengan traceability, mis. `(FR-4, flow F3, EC-BK-01..04)`.
- Urutkan: P0 sebelum P1/P2, dependensi, fase migrasi, lalu daftar blocker desain. Jika MVP memotong P1/P2, kelompokkan di bawah `## Post-MVP`.

## Pemeriksaan akhir

- Build-plan minimal satu item, semua `id` unik, `done` boolean; item baru unchecked.
- Semua item feature-sized; tidak ada langkah scaffold atau prototype.
- Tidak ada kontradiksi stack, scope, atau deployment antara kedua dokumen.
- Setiap keputusan berasal dari jawaban user, proposal yang dikonfirmasi, atau fakta sumber. Asumsi tidak boleh tampil sebagai requirement.
- Unknown tertulis `(belum diputuskan)`, bukan diisi tebakan.
- Bila sumber Figr: angka dan ID konsisten dengan file sumber; kontradiksi dilaporkan.

## Larangan

- Menulis file sebelum user menyetujui draft.
- Menebak keputusan user atau mengisi unknown dengan asumsi yang terdengar masuk akal.
- Item build-plan yang terlalu teknis, terlalu besar, atau tidak terlihat user.
- Mengganti, menomori ulang, atau menghapus item yang sudah selesai.
- Menaruh plan di `blueprint/` atau `docs/`, atau mengedit HTML `.pawang/` manual.
- Menambah fitur di build-plan tanpa memperbarui project-overview.
