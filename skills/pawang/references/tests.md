# Tests - siapkan unit atau browser test

Tujuan: menyalakan gerbang pengujian secara sadar. Testing opsional sampai proyek punya perintah test asli di `AGENTS.md`. Reference ini jalur setup eksplisitnya, bukan izin menulis suite besar.

## Pilih mode

- `/tests` atau `/tests unit`: setup unit testing native stack. Baca hanya bagian **Mode unit**.
- `/tests browser`: setup harness browser yang bisa diulang. Baca hanya bagian **Mode browser**.
- Permintaan eksplisit "browser" atau "end-to-end" memilih mode browser. Nama runner saja (misal "Playwright") tetap permintaan unit dengan preferensi runner, bukan izin install otomasi browser.
- User minta dua-duanya? Tanya mana dulu, selesaikan satu per satu.
- **Jangan install dependency tanpa persetujuan user.** Pakai package manager proyek.
- Jangan commit, merge, push, atau mulai pekerjaan fitur dari sini.

## Mode unit

### 1. Inspeksi

Baca secukupnya: Commands di `AGENTS.md`, manifest (`package.json`, `pyproject.toml`, `go.mod`, dst), config test yang ada, file test yang ada, lockfile, perintah `Verify` dan workflow terkait bila ada, plus coding-standards lewat `node .pawang/kit.js extract .pawang/context/coding-standards.html`. Deteksi stack dari file, jangan berasumsi.

### 2. Pilih setup terkecil

Pakai runner yang sudah ada bila ada. Kalau tidak ada: JS/TS pakai Vitest (kecuali proyek jelas memakai Jest), Python pytest, Go `go test`, Rust `cargo test`, PHP PHPUnit. Stack tidak jelas? Tanya, jangan menebak.

Minimal: tanpa coverage, browser, CI, snapshot, atau arsitektur test besar kecuali diminta.

### 3. Terapkan diff terkecil

1. Tambah dependency/config test yang kurang.
2. Tambah atau rapikan script test.
3. Tambah satu contoh test kecil untuk logika nyata; kalau tidak ada, test helper mini untuk membuktikan runner jalan.
4. Update Commands di `AGENTS.md` dengan perintah test asli dan watch bila ada.
5. Kalau `Verify` sudah ada, sisipkan perintah test di antara typecheck dan build. **Jangan membuat CI atau menambah Verify hanya karena `/tests` dipanggil**; setup CI eksplisit ada di `ci.md`.
6. Update coding-standards di `.pawang/` hanya bila perlu catatan test spesifik stack, lewat `kit.js render coding-standards`.

### 4. Verifikasi

Jalankan perintah test, lalu `Verify` sebagai gerbang akhir bila ada. **Suite kosong bukan lulus**: kalau runner melaporkan nol test, perbaiki contoh test dulu. Jangan sembunyikan kegagalan install atau verifikasi, laporkan persis apa yang gagal.

### 5. Laporan

Sebutkan: runner dipilih/dipakai ulang, command yang ditambah/diubah, status `Verify`, contoh test, hasil verifikasi, follow-up. Tampilkan ringkasan diff.

## Mode browser

### 1. Inspeksi

Baca: Commands/`Verify` di `AGENTS.md`, manifest dan lockfile, config browser/e2e yang ada, perintah build/dev/preview, aturan ignore, coding-standards, dan state git. Jangan install atau edit apa pun saat inspeksi.

### 2. Pilih harness terkecil

Pakai runner browser yang sudah terbukti di proyek. Untuk web app JS/TS tanpa runner, condong ke Playwright Test. Pilih satu smoke path **lewat surface nyata** yang membuktikan harness bisa menjalankan app dan mengamati perilaku, bukan sekadar fixture statis. Jangan menyimpan state auth, profil, trace, video, atau screenshot ke git kecuali sudah jadi konvensi aman proyek.

### 3. Ajukan setup dulu

Sebelum mengedit, sebutkan: runner, perintah install persisnya, file yang akan ditambah/diubah, surface yang diuji, perintah `Browser tests` yang akan didokumentasikan, dan limitasi (server, build, auth, browser chrome). Instal dependency dan unduhan browser binary butuh persetujuan user.

### 4. Buat harness

Diff terkecil: dependency dan config, satu smoke test relevan, script `test:browser`, lalu dokumentasikan `Browser tests: <command>` di Commands `AGENTS.md`. Siklus server hanya bila perintah proyek aman dan runner bisa start/stop andal. **Jangan menambah browser test ke `Verify` atau CI kecuali user memintanya terpisah atau proyek sudah mensyaratkannya.** Abaikan artifact hasil test yang harus lokal.

### 5. Verifikasi

Jalankan perintah yang didokumentasikan. Runner lulus tanpa test, test salah surface, atau browser tidak benar-benar diluncurkan = bukan setup sukses. Kalau kredensial atau dependensi lain menghalangi, laporkan harness belum lengkap, jangan melemahkan test.

## Integrasi dengan alur pawang

- Setelah `AGENTS.md` punya perintah test, spec fitur memakai test sebagai gerbang perubahan berlogika, dan `check` memakainya sebagai bukti yang bisa diulang.
- Browser suite melengkapi bukti langsung. Suite hijau tidak otomatis membuktikan fidelity visual, profil auth nyata, atau browser chrome; hanya klaim yang benar-benar diamati test.
- **Runner e2e milik user**: bila proyek memakai runner e2e pengguna (folder `.e2e/` dengan `report.json`, konfigurasi di root proyek), pakai hasilnya sebagai bukti tambahan saat `check`. `.e2e/` hanya dibaca, jangan pernah diedit. Saat debugging kegagalan, baca dulu trace di `.e2e/results/<test>/trace.md`.
