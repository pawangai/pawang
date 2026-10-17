# Review kode - pahami & nilai kode hasil AI

Tujuan: membaca, menjelaskan, dan menilai kode yang sudah ada melalui 12 lensa (pilih 3-6 yang relevan), lalu menyampaikan pemahaman dan risiko yang bisa ditindaklanjuti. Review ini read-only dan tidak membutuhkan `.pawang/`; jangan jalankan `adopt` hanya karena user menempelkan kode.

Review membantu membaca, bukan membuktikan. Ini bukan pengganti test, typecheck, atau menjalankan kode. Tandai temuan sebagai dugaan beralasan sampai diverifikasi.

## Kapan dipakai

Gunakan reference ini saat user:

- menempelkan atau melampirkan kode, diff, PR, branch, atau file lalu minta penjelasan, review, pengecekan kebenaran, atau mencari penyebab bug;
- meminta review kode hasil AI, termasuk "kode ini sudah benar?", "kenapa ini error?", "ini aman diterima?", atau "di mana seharusnya logika ini";
- ingin belajar membaca kode atau memahami satu konsep memakai kodenya sendiri.

Jangan pakai untuk menulis fitur, mendesain UI, atau menyiapkan test. Untuk perbaikan setelah review, lanjutkan ke `fix-debug.md` atau `implement.md`; untuk temuan durable di siklus fitur, lanjutkan ke `audit.md`.

## Pilih mode

| Mode             | Kapan                                                                      | Keluaran                                                      |
| ---------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Jelaskan**     | User ingin paham kode.                                                     | Ringkasan + peta alur.                                        |
| **Review Cepat** | Potongan kode atau file tunggal tanpa titik acuan.                         | Temuan per lensa, urut risiko.                                |
| **Review Penuh** | Ada diff nyata (PR/branch/perubahan sejak commit) dan idealnya spec/issue. | Tiga sumbu terpisah: Standards, Spec, Comprehension.          |
| **Belajar**      | User ingin memahami satu konsep memakai kodenya.                           | Definisi singkat + contoh di kode + satu pertanyaan lanjutan. |

Jika mode tidak jelas, pakai **Review Cepat**.

## Langkah kerja

1. **Pahami konteks dulu.** Baca seluruh kode yang diberikan sebelum menilai. Catat bahasa/framework, tujuan, dan apa yang tidak terlihat (file lain, skema DB, konfigurasi). Jangan menyimpulkan perilaku bagian yang tidak ada; sebut sebagai asumsi atau pertanyaan.
2. **Pilih 3-6 lensa yang relevan.** Jangan memakai ke-12 lensa pada setiap kode. Lensa tanpa temuan tidak perlu ditulis; laporan panjang menyembunyikan temuan penting.
3. **Telusuri jalur nyata.** Ikuti kode dengan input konkret: normal, kosong, dan salah. Bug sering muncul dari jalur yang tidak diuji di kepala pembuatnya.
4. **Susun hasil** urut dari yang paling berisiko. Sertakan bukti, file/baris atau nama fungsi, dan langkah perbaikan.

## 12 lensa

### Alur

- **Control flow** - urutan eksekusi. Tanda bahaya: `return`/`continue` terlalu awal, kondisi terbalik atau tidak lengkap, loop mengubah koleksi saat iterasi, `await` hilang, cabang `else` tidak ada padahal ada kasus ketiga.
- **Data flow** - perjalanan data. Tanda bahaya: bentuk data berubah antar lapisan tanpa pemetaan, satu fitur tersebar tanpa sumber data jelas, input user dipakai tanpa validasi/sanitasi, data disalin lalu berubah tidak sinkron.
- **Error flow** - saat gagal. Tanda bahaya: hanya happy path, `catch` kosong atau hanya `console.log`, error ditangani di lapisan yang salah, pesan teknis bocor, tidak ada state loading/error/kosong.

### Data

- **Scope** - di mana nilai bisa diakses. Tanda bahaya: variabel dipakai di luar blok/fungsi, closure menangkap nilai usang (stale closure), global/modul-level diubah banyak tempat, shadowing, kode dipindah masih merujuk variabel lama.
- **Input/output** - kontrak. Tanda bahaya: argumen tidak cocok dengan pemanggil, bentuk return berbeda antar cabang (objek/string/undefined), kontrak tidak terdokumentasi dan tidak diketik, nilai default menutupi data hilang.
- **State** - data yang berubah. Tanda bahaya: state diduplikasi (props + lokal, cache + DB), satu bagian diperbarui tetapi turunannya lupa, state turunan disimpan terpisah, state terlalu tinggi/rendah, tidak ada state awal/loading/gagal.

### Runtime

- **Side effect / pure function** - apakah fungsi hanya menghitung atau juga mengubah dunia. Tanda bahaya: logika murni tercampur side effect, side effect tersembunyi di fungsi yang terdengar membaca, efek berjalan berulang di render/loop/retry, efek setengah berhasil tanpa penanganan.
- **Request-response** - siklus HTTP. Tanda bahaya: metode tidak sesuai (GET mengubah data), selalu 200 saat gagal atau 500 untuk input user, tidak ada validasi/otorisasi di server, bentuk error tidak konsisten, pagination/batas ukuran/timeout tidak dipikirkan.
- **Concurrency** - banyak hal bersamaan. Tanda bahaya: baca-ubah-tulis tanpa transaksi/penguncian, respons lama menimpa state baru, tombol bisa ditekan dua kali, antrean tanpa penanganan job gagal/macet, operasi retry/webhook tidak idempoten.

### Struktur

- **Abstraksi** - menyembunyikan kerumitan. Tanda bahaya: helper sekali pakai, lapisan pembungkus tanpa nilai, terlalu banyak lompatan file, logika sama disalin, nama menyembunyikan efek (`getUser` yang menulis DB), duplikasi yang sudah ada di proyek.
- **Modularitas** - satu bagian satu tugas. Tanda bahaya: file raksasa, logika bisnis di komponen UI, query DB di route, dependensi melingkar, file baru di folder yang tidak sesuai konvensi.
- **Arsitektur** - bentuk keseluruhan. Tanda bahaya: perubahan di sisi yang salah (filter/agregasi di aplikasi, validasi hanya di UI), melanggar batas lapisan, pola/dependensi baru tanpa alasan, hak akses hanya di UI tanpa penegakan server.

## Review Penuh - tiga sumbu

Dipakai saat ada diff nyata dan idealnya spec/issue. Standards dan Spec mengikuti skill `code-review` karya Matt Pocock (MIT); jika skill itu tersedia, ikuti prosedurnya untuk dua sumbu tersebut. Ringkasan di bawah membuat reference ini tetap bisa dipakai sendiri. Comprehension adalah sumbu tambahan Pawang.

### 1. Tentukan titik acuan dan diff

Titik acuan adalah apa pun yang user sebut (SHA, branch, tag, `main`, `HEAD~5`). Jika tidak disebut, tanyakan.

```sh
git rev-parse <titik-acuan>
git diff <titik-acuan>...HEAD
git log <titik-acuan>..HEAD --oneline
```

Pastikan ref valid dan diff tidak kosong sebelum lanjut. Jika perubahan belum di-commit, `git diff <titik-acuan>...HEAD` bisa kosong; cek `git status --porcelain` dan pakai `git diff <titik-acuan>` (termasuk working tree), lalu tanyakan apakah diff sudah final. Tanpa akses git, minta user menempel/melampirkan diff.

### 2. Cari sumber spec

Urutan: issue yang disebut user (mis. `#42`) → fetch lewat `docs/agents/issue-tracker.md` bila ada (brownfield setup Matt Pocock) → path spec yang diberikan user → `.pawang/context/current-feature.html` hanya bila cocok dengan branch/issue/commit (baca lewat `node .pawang/kit.js extract` bila `.pawang/` ada) → file spec di `docs/`, `specs/`, atau `.scratch/` → referensi issue di pesan commit → tanyakan. Jika tidak ada spec, lewati sumbu Spec dan catat "no spec available".

### 3. Kumpulkan sumber standar

Baca dokumen yang mengatur cara menulis kode: `.pawang/context/coding-standards.html` (extract), `AGENTS.md`, `CODING_STANDARDS.md`, `CONTRIBUTING.md`, design system. Standar repo yang terdokumentasi selalu menang atas baseline. Lewati hal yang sudah ditegakkan tooling (lint, typecheck).

Baseline bau kode (Fowler, _Refactoring_ bab 3) selalu ikut sebagai penilaian, bukan pelanggaran keras:

- **Mysterious Name** - nama tidak menjelaskan fungsi; ganti nama.
- **Duplicated Code** - logika sama di beberapa hunk; ekstrak.
- **Feature Envy** - method lebih banyak mengakses data objek lain; pindahkan.
- **Data Clumps** - field/parameter selalu bersama; jadikan satu tipe.
- **Primitive Obsession** - primitif mewakili konsep domain; buat tipe kecil.
- **Repeated Switches** - cascade `switch`/`if` pada tipe sama berulang; polimorfisme atau satu peta.
- **Shotgun Surgery** - satu perubahan memaksa edit tersebar; kumpulkan dalam satu modul.
- **Divergent Change** - satu modul diubah karena alasan tidak terkait; pisahkan.
- **Speculative Generality** - abstraksi untuk kebutuhan yang tidak ada di spec; hapus.
- **Message Chains** - navigasi `a.b().c().d()` panjang; sembunyikan di satu method.
- **Middle Man** - hanya mendelegasikan; panggil target langsung.
- **Refused Bequest** - subclass mengabaikan warisan; gunakan komposisi.

### 4. Jalankan tiga lintasan terpisah

Jika subagent tersedia, jalankan Standards, Spec, dan Comprehension secara paralel dengan konteks masing-masing. Jika tidak, kerjakan berurutan; selesaikan satu sumbu sebelum membuka berikutnya dan jangan membawa kesimpulan antar-lintasan.

- **Standards** - beri diff, commit, sumber standar, dan baseline. Laporkan per file/hunk: (a) pelanggaran standar terdokumentasi dengan menyebut aturannya; (b) bau baseline dengan nama dan kutipan hunk. Bedakan pelanggaran keras dari penilaian. Di bawah 400 kata.
- **Spec** - beri diff, commit, dan isi spec. Laporkan: (a) kebutuhan yang hilang/parsial; (b) perilaku yang tidak diminta (scope creep); (c) kebutuhan yang tampak diimplementasi tetapi salah. Kutip baris spec. Di bawah 400 kata.
- **Comprehension** - beri diff dan commit, lalu pilih 3-6 lensa dan telusuri perilaku: alur, data, state, error, runtime. Bau kode dan duplikasi diserahkan ke Standards agar tidak dilaporkan dua kali. Di bawah 400 kata.

### 5. Gabungkan

Tampilkan di bawah tiga judul `## Standards`, `## Spec`, `## Comprehension`. Jangan menggabung atau meranking ulang lintas sumbu. Tutup dengan satu baris ringkasan: jumlah temuan per sumbu dan temuan terburuk di dalam tiap sumbu. Jangan memilih satu pemenang lintas sumbu. Jika Spec dilewati, sebutkan alasannya.

## Format hasil

Untuk Review Cepat, Jelaskan, dan Belajar, sesuaikan panjang dengan ukuran kode. Untuk Review Cepat gunakan:

```text
**Ringkasan**: 2-3 kalimat: apa yang dilakukan kode ini dan seberapa yakin Anda.

**Peta alur** (jika lebih dari satu langkah): urutan input sampai hasil, termasuk percabangan error.

**Temuan** (urut dari paling berisiko)
- [Lensa] Apa yang terjadi, di baris/fungsi mana, dan mengapa itu masalah. Sertakan input konkret yang memicunya.

**Hal yang sudah baik** (singkat, hanya jika ada)

**Pertanyaan/tindak lanjut**: hal yang tidak bisa dipastikan dari kode ini, dan perintah siap pakai.
```

Untuk mode Jelaskan, pakai Ringkasan dan Peta alur, lalu jelaskan istilah penting dengan bahasa sederhana. Untuk mode Belajar, mulai dari definisi satu kalimat, tunjukkan konsep di kode user, lalu beri satu pertanyaan yang bisa ia ajukan saat membaca kode serupa.

## Prinsip penilaian

- **Konkret, bukan umum.** "Error flow lemah" tidak berguna. "Jika `fetch` gagal di baris 14, `data` tetap `undefined` dan baris 18 melempar error tanpa pesan" berguna.
- **Bedakan bukti dari dugaan.** Sebut mana yang terlihat di kode dan mana yang bergantung pada file yang tidak Anda lihat.
- **Jangan menambah gaya pribadi sebagai kesalahan.** Preferensi penamaan/format bukan temuan, kecuali melanggar standar yang user sebutkan.
- **Hormati konvensi proyek.** `AGENTS.md`, design system, performance budget, dan `coding-standards` adalah ukuran, bukan opini Anda.
- **Arahkan, jangan hanya menyalahkan.** Setiap temuan penting disertai langkah perbaikan atau pertanyaan yang jelas.
- **Gunakan bahasa user** dan jelaskan istilah teknis jika ada tanda ia pemula.
- **Jangan mengutip secret.** Laporkan kategori teredaksi + file:line + remediasi.

## Prinsip kolaborasi

- **User pemilik keputusan.** Konvensi repo, aturan companion, dan ADR adalah default, bukan veto.
- Jika aturan Pawang, aturan companion, dan ADR/docs bentrok: tunjukkan bedanya, jelaskan konsekuensinya, lalu tanya. Jangan memilih satu pihak tanpa terlihat.
- **ADR/keputusan boleh diubah user.** Jika user mengubah keputusan, perbarui dokumen sumbernya + tanggal/alasan; jangan mempertahankan aturan lama demi konsistensi dan jangan menambah duplikat.
- **Rollback adalah untuk fitur yang sudah diimplementasikan**, bukan untuk catatan keputusan. Jika keputusan salah: perbarui ADR/catatan keputusan; jika sudah jadi fitur, gunakan `rollback.md`. Rollback tidak otomatis membalik `AGENTS.md`/`.pawang/` dan tidak memulihkan data destruktif.
- Jangan menyalin aturan companion ke Pawang; biarkan masing-masing bekerja di tempatnya.

## Companion `code-review` (opsional)

Pawang tidak membundel atau memasang companion ini. Ini companion opsional di luar daftar companion alur (`companions.md`); aturan pasangnya ada di sini.

- **Jika `docs/agents/` sudah ada** (setup Matt Pocock dijalankan lebih dulu): itu brownfield. Jangan hapus, pindahkan, atau salin isinya ke `.pawang/`. Baca `docs/agents/issue-tracker.md` untuk sumbu Spec dan pertahankan blok `## Agent skills` di `AGENTS.md`/`CLAUDE.md` (file yang dipilih setup). Jangan jalankan setup ulang hanya untuk review.
- **Jika belum ada:** default pakai diff + spec eksplisit. Bila `.pawang/` ada, ekstrak `current-feature.html` dan `coding-standards.html` lewat `kit.js`; bila tidak, minta spec/diff dari user. Jangan jalankan setup tanpa izin.
- **Jika user secara eksplisit memilih setup upstream:** minta izin, pasang `code-review` + `setup-matt-pocock-skills` dengan precheck, lalu perlakukan `docs/agents/` sebagai brownfield. Setup itu menulis `docs/agents/issue-tracker.md`, `domain.md`, `triage-labels.md` (hanya jika `triage` terpasang), dan blok `## Agent skills`; jangan salin isinya ke `.pawang/`.
- Setelah user menyetujui dan precheck, pasang companion:

  ```sh
  npx skills add mattpocock/skills --skill code-review -a opencode
  ```

- Hanya jika user memilih setup upstream, pasang juga setup-nya, lalu jalankan `/setup-matt-pocock-skills` sekali:

  ```sh
  npx skills add mattpocock/skills --skill setup-matt-pocock-skills -a opencode
  ```

- Jika companion dipakai, jangan ulangi Standards/Spec dengan fallback; Pawang hanya menambahkan sumbu Comprehension.

## Batas

- **Read-only.** Jangan mengedit kode, membuat/menghapus file, atau menulis state `.pawang/`. Jika user meminta perbaikan, buat sebagai pekerjaan terpisah lewat `fix-debug.md`/`implement.md`.
- **Jangan mengarang perilaku** bagian yang tidak terlihat; sebut asumsi atau pertanyaan.
- **Bukan pengganti verifikasi.** Sarankan test/typecheck/run bila klaim bergantung pada perilaku runtime.
- **Temuan durable** (perlu dilacak sampai `closed`) hanya lewat `audit.md`; review ini tidak menulis `findings.html`.
