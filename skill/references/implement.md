# Implement - eksekusi spec

Tujuan: bangun `current-feature.html` yang sudah disetujui user, langkah demi langkah, sampai siap diverifikasi. Setelah semua step beres, lanjut ke check.md dan audit.md tanpa menunggu perintah - itu siklus otonom (workflow.md bagian 4).

## Sebelum mulai

1. `node .pawang/kit.js status` untuk orientasi.
2. `node .pawang/kit.js extract .pawang/context/current-feature.html` untuk baca spec lengkap.
3. **Pastikan spec sudah disetujui user** (gerbang review pertama). Spec masih stub? Arahkan ke feature.md atau fix-debug.md; jangan mengarang spec sendiri. Jangan menimpa spec aktif.
4. Pakai **`branch` persis dari spec**. Jangan bekerja di branch default. Jangan implement spec milik checkout lain.

## Resume aman

Progres hidup di checkbox, bukan di chat. Dari hasil extract, cari step pertama dengan `"done": false` - mulai dari situ. `git status` membantu membedakan pekerjaan selesai dan belum. Jangan mengulang step yang sudah ditandai.

## Rollback (type: rollback)

Spec rollback tidak boleh dibalik dengan `git revert` seluruh commit. Setelah spec disetujui dan preflight bersih, buat branch dari branch default dengan `git switch -c <branch>`; jika branch sudah ada, stop dan tanya user. Jangan bekerja di branch default. Ambil target/parent dari `rollback.targetCommit`/`rollback.targetParent`; keduanya harus SHA penuh (40/64 sesuai object format), parent tunggal, target ancestor `HEAD`, dan working tree hanya berisi spec rollback (tidak ada perubahan produk lain). Cocokkan parent dengan `git rev-parse <target>^`; jika kosong atau beda, stop. Cek `git rev-list --parents -n 1 <target>` harus tepat dua kolom (commit + satu parent); merge commit → stop. Pratinjau diff dengan `git apply --stat` sebelum apply.

Terapkan hanya diff produk:

```bash
git diff --binary <target-parent> <target-commit> -- . \
  ':(exclude).pawang/**' ':(exclude)AGENTS.md' ':(exclude)prototypes/**' \
  ':(exclude).agents/**' ':(exclude).claude/**' ':(exclude)CLAUDE.md' \
  ':(exclude)skills-lock.json' ':(exclude)opencode.json' \
  ':(exclude)docs/adr/**' ':(exclude)docs/agents/**' |
  git apply --reverse --3way --index
```

Stop bila diff produk kosong, ada konflik, atau ada path terlindungi/decision docs yang staged atau berubah — kecuali `.pawang/context/current-feature.html` (spec rollback aktif). Tampilkan staged diff dan status. Jika konflik, laporkan path dan commit lanjutan; jangan membersihkan index dengan reset/stash. Jangan auto-resolve atau memperluas rollback. `docs/adr/**` dan `docs/agents/**` hanya diproses setelah keputusan user, sebagai langkah terpisah.

## Loop per step

Untuk setiap step, berurutan:

1. Buat perubahan **terkecil yang koheren** dan memenuhi `doneWhen`.
2. Tambahkan test terfokus bila step mengandung logika dan runner sudah ada. **Jangan install dependency atau runner baru kecuali spec mengotorisasi.**
3. Jalankan cek tersempit yang berguna sambil iterasi. Jangan jalankan Verify penuh tiap step; itu sekali di akhir.
4. Review diff sendiri: cakupan kontrak, otorisasi dan scope data, error handling, scope bocor, perubahan tak terkait.
5. Step lulus? Tandai `done: true` dengan render ulang seluruh JSON:

```bash
node .pawang/kit.js extract .pawang/context/current-feature.html > /tmp/spec.json
# ubah satu field: step terkait -> "done": true
node .pawang/kit.js render current-feature --in /tmp/spec.json
```

**Jangan mengubah field lain** saat menandai. Kalau saat mengeksekusi ternyata spec yang salah, berhenti dan revisi spec - jangan improvisasi.

## Otonomi setelah semua step

Semua step ditandai selesai? Lanjut **tanpa menunggu perintah**:

1. Jalankan perintah Verify dari `AGENTS.md` (atau build + test yang benar-benar dideklarasikan). Jangan klaim lulus tanpa outputnya.
2. Jalankan verifikasi perilaku lewat check.md.
3. Jalankan audit.md, termasuk jalur review independen bila `config.review.independentExecution` memilihnya.
4. Perbaiki findings yang menjadi tugasmu: tandai `fixed` setelah cek lulus, **bukan `closed`** - hanya audit yang menutup setelah re-review. Perbaikan yang gagal diulang sampai `config.autonomous.maxRepairAttempts` (default 2), lalu berhenti dan lapor user.

Henti darurat (bukan gerbang, tapi pengaman): macet melewati batas percobaan, butuh keputusan produk, atau pekerjaan bakal keluar scope - **berhenti dan lapor user**.

## Batas

- **Jangan install dependency baru tanpa otorisasi spec.**
- **Jangan keluar scope spec.** Butuh perubahan di luar `inScope`? Stop dan tanya.
- Jangan membuat abstraksi, service, atau config surface yang tidak diminta kebutuhan sekarang.
- Jangan commit, merge, atau push. Commit adalah gerbang izin di complete.md.
- Jangan menulis HTML `.pawang/` mentah; selalu via `kit.js`.

## Menandai findings

Kalau spec menargetkan temuan (lihat field `fixes` pada spec fix di fix-debug.md), perbaikan yang lulus cek ditandai `fixed` di `.pawang/context/findings.html` lewat render findings: extract JSON yang ada, ubah `status` entri terkait, render ulang. Status `closed` hanya datang dari audit re-review.

## Sebelum menutup

Bandingkan setiap item `inScope` dan tiap `doneWhen` dengan diff akhir. Lengkapi kontrak yang kurang **sebelum** menyerahkan ke check/audit. Lalu laporkan singkat ke user: branch, perubahan per area, cek yang dijalankan, status findings/review, dan langkah berikutnya. Gate penutup dan izin commit ada di complete.md.
