# CI - pasang & rawat pipeline

Tujuan: beri proyek satu jalur verifikasi CI yang konsisten dengan `Verify`, tanpa menjadikan Pawang alat deploy. Default local-first: file CI disiapkan lokal; semua aksi remote menunggu izin eksplisit user di percakapan saat ini.

## Batas

- **Tanpa aksi remote tanpa izin**: jangan push, membuat/mengubah ruleset, menyetel secret, membuat resource, deploy, atau rollback remote.
- **Tanpa nilai rahasia.** Sebut nama env/variabel saja; jangan buka `.env` atau menyalin nilai secret ke file/log.
- **Jangan menimpa CI yang ada.** Baca dulu, usulkan diff terkecil, tunjukkan perubahan.
- Opsional: bukan langkah wajib siklus fitur. Deploy tetap di `release.md`.

## Input

- tanpa argumen atau `setup`: inspeksi, usulkan setup minimal, lalu berhenti sebelum aksi remote;
- `check`: laporan kesiapan read-only; audit mendalam lewat `ci-audit.md`.

## Inspeksi

Baca secukupnya: `AGENTS.md` (Commands/`Verify`), manifest + lockfile, workflow yang ada, hook, runtime pin (`.nvmrc`, `.python-version`, dll.), branch default, konfigurasi provider, dan state git. Deteksi stack dari file; jangan berasumsi.

## Satu `Verify`

- `Verify` = typecheck → test → build, memakai perintah yang sudah dideklarasikan di `AGENTS.md`.
- Perintah hilang? Laporkan celahnya; **jangan mengarang test, runner, atau urutan baru**.
- CI harus menjalankan `Verify` yang sama persis, bukan pipeline berbeda.
- Bukti utama tetap `Verify` lokal; CI adalah penegakan remote. Jangan klaim "CI hijau" tanpa run yang benar-benar ada.

## Workflow minimal

Pakai provider yang sudah dipakai proyek. Jika proyek di GitHub dan belum ada CI, workflow minimal:

- trigger `pull_request` + push ke branch default;
- permission minimal, umumnya `contents: read`;
- concurrency untuk membatalkan run lama;
- install lockfile-safe (`npm ci`, `pnpm install --frozen-lockfile`, dst.);
- runtime dipin sesuai proyek;
- satu job `Verify`.

Default **tidak** menambah matrix, coverage, browser test, security scanner, atau cache pihak ketiga kecuali diminta. Action dipin ke SHA bila jadi konvensi repo; minimal versi stabil. Nama required check harus sama dengan nama job — jangan mewajibkan check yang tidak ada (PR bisa deadlock). Jangan memasukkan nilai input mentah ke YAML/shell tanpa validasi/kutip.

## Hook pre-push (opt-in)

Tawarkan, jangan paksa. Pola: `.githooks/pre-push` (executable) + `git config core.hooksPath .githooks`; script `prepare` hanya bila proyek sudah memakai npm script. Hook mempercepat umpan balik lokal, **bukan** pengaman: `git push --no-verify` melewatinya.

## Ruleset / gerbang remote

Required checks, review wajib, larangan force-push, dan proteksi hapus branch adalah perubahan remote. Terapkan hanya setelah push dan **izin terpisah**; jangan menganggap setup lokal sebagai izin. Tunjukkan nama check, branch target, dan konsekuensinya.

## Preview & deploy (opsional)

Berlaku bila proyek punya preview environment; detail provider ada di companion/`release.md`.

- **Isolasi harus dibuktikan per binding.** Preview yang memakai database, KV, R2, queue, service, atau workflow produksi **bukan** preview aman. Jangan percaya klaim "otomatis terisolasi".
- E2E hanya setelah health check preview; cleanup preview saat PR ditutup, dan kegagalan cleanup harus terlihat — jangan ditelan.
- Migrasi memakai expand/contract dan dijalankan di tahap deploy/preview, bukan build. Rollback kode tidak otomatis membalik skema; siapkan fix-forward.
- Deploy setelah merge; secret hanya nama; fork PR tidak boleh mendapat secret; rollback/fix-forward didokumentasikan.
- Cloudflare Workers: detail binding, `wrangler preview`, Workers Builds, dan template ada di companion `cicd-worker`; jangan menyalin script/template ke proyek Pawang.

## Laporan

Sebutkan: file yang dibuat/diubah, perintah `Verify` dan hasilnya, status "prepared locally, remote untouched", blocker, dan satu langkah berikutnya (push/PR/ruleset) yang butuh izin.

## Larangan

- Push, deploy, rollback, ruleset, secret, atau resource remote tanpa izin eksplisit.
- Menimpa CI yang ada atau mengarang test/runner.
- Menambah matrix/coverage/browser/security scan secara default.
- Menjalankan template generator mentah tanpa memeriksa output (`--force`, placeholder, action tag).
