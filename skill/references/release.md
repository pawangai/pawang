# Release - persiapan deploy Render / Vercel

Tujuan: menyiapkan konfigurasi dan bukti kesiapan deploy Render atau Vercel secara lokal. Ini bukan tombol deploy: berhenti sebelum aksi eksternal apa pun kecuali user memberi persetujuan eksplisit di percakapan saat ini.

## Aturan inti

- **Tanpa deploy.** Jangan deploy, menghubungkan provider, membuat service remote, menyetel env remote, push, atau publish tanpa izin eksplisit.
- **Tanpa nilai rahasia.** Baca `.env.example` untuk nama variabel saja. **Jangan buka `.env` atau file rahasia lain**, dan jangan menulis nilai secret ke file mana pun.
- Opsional saja. Jangan jadikan langkah wajib siklus build.
- Perubahan sekecil mungkin; setup deploy tidak boleh jadi framework DevOps besar.

## Input

- tanpa argumen: inspeksi proyek, rekomendasikan Render atau Vercel bila target jelas, kalau tidak tanya;
- `render` atau `vercel`: siapkan target itu;
- `check`: laporan kesiapan read-only;
- `config`: fokus file config lokal provider.

## Langkah 1 - baca proyek

Baca `AGENTS.md`, state `.pawang/` yang relevan (`node .pawang/kit.js status`, lalu `extract` build-plan atau project-overview bila perlu), manifest dan lockfile, config framework, Dockerfile, `render.yaml` / `vercel.json`, `.env.example`, README, dan state git.

Identifikasi: tipe app (static, SSR, API, worker, CLI, monorepo, hybrid); perintah build/start/dev/test; output directory; package manager; kebutuhan runtime (versi Node/Python, Docker, database, cache, object storage, queue, cron, migrasi); env by name only; health path atau smoke path.

## Langkah 2 - pilih bentuk provider

**Render**: static site, web service, background worker, cron job, atau service plus database. **Vercel**: deployment framework (setting otomatis), output statis, serverless/edge, atau proyek monorepo dengan root directory.

Kalau provider kurang cocok, bilang terus terang dan rekomendasikan target lain. Contoh: worker long-running condong ke Render; situs frontend Next.js atau Astro condong ke Vercel.

## Langkah 3 - verifikasi lokal

Jalankan hanya cek lokal non-destruktif yang sesuai `AGENTS.md`:

- install hanya bila dependency sudah ada atau user menyetujui;
- perintah build;
- perintah test bila dideklarasikan;
- perintah preview/start bila aman, lalu smoke test health path;
- lint/typecheck hanya bila sudah jadi perintah standar proyek.

Command hilang: laporkan celahnya, jangan mengarang kepastian. Command butuh secret: sebutkan nama env-nya dan lewati cek itu.

## Langkah 4 - siapkan config lokal

Hanya saat target jelas atau user meminta config.

**Render**: utamakan `render.yaml` bila butuh setup yang bisa diulang atau lebih dari satu service. Isi: tipe service, build command, start command untuk web service, publish path untuk static site, health check path bila diketahui, nama env tanpa nilai. Region atau plan hanya bila user menyebut.

**Vercel**: buat `vercel.json` hanya bila default tidak cukup. Banyak proyek Vercel tidak butuh file config. Isi seperlunya: build command bila beda dari default, output directory bila perlu, rewrite atau headers bila aplikasi membutuhkan, install command hanya bila package manager tidak bisa disimpulkan.

Untuk keduanya: update `.env.example` dengan nama yang kurang, catatan deploy pendek di README hanya bila sudah ada section deploy atau user meminta. **Tidak pernah menulis nilai secret.**

## Langkah 5 - release packet

Tutup dengan paket ringkas:

- **Target** - Render atau Vercel, dan alasannya.
- **Shape** - static site, web service, framework app, worker, atau hybrid.
- **Config changed** - file yang dibuat/diubah, atau "none".
- **Checks run** - command dan hasilnya.
- **Env needed** - nama saja.
- **Smoke test** - path atau command persis untuk diverifikasi setelah deploy.
- **Blockers** - yang wajib dibereskan sebelum ship.
- **Next action** - langkah provider persisnya, berhenti sebelum aksi eksternal kecuali disetujui.

## Larangan

- Menambah config provider kalau default platform lebih baik.
- Menyembunyikan build gagal, env hilang, atau output path tak diketahui.
- Menjalankan aksi provider yang menyentuh remote tanpa izin eksplisit di percakapan saat ini.
