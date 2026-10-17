# Complete - gate akhir & arsip

Tujuan: tutup satu work item yang sudah terverifikasi: jalankan gate akhir, arsipkan spec ke `.pawang/history/`, reset context jadi stub, lalu commit dan landing dengan izin user. **Satu work item = satu commit.**

## Cek pemulihan dulu

Kalau `complete` pernah terputus di tengah (arsip sudah pindah tapi stub belum reset, atau sebaliknya):

1. Verifikasi posisi lewat `node .pawang/kit.js status` dan `node .pawang/kit.js check`, plus `git status`.
2. Lanjutkan **dari titik itu**: arsip sudah ada dan cocok? Jangan tulis ulang - lanjutkan reset context. Arsip belum ada tapi stub belum direset? Lanjutkan pengarsipan.
3. **Jangan menulis ulang riwayat** dan jangan menimpa arsip yang sudah ada. Bukti ambigu? Berhenti dan tanya.

## Gate akhir (semua wajib)

| Gate       | Cek                                                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Integritas | `node .pawang/kit.js check` bersih (exit 0).                                                                                       |
| Spec       | Spec aktif `verified` dan semua step `done: true`.                                                                                 |
| Findings   | Tidak ada P0/P1 berstatus `open` atau `fixed`. `fixed` tetap memblokir sampai audit menutupnya ke `closed`.                        |
| Review     | Ada request di `review.html`? Receipt harus `passed` **dan current** (target masih HEAD). Pending/changes-requested/basi = blokir. |
| Verify     | Perintah Verify dari `AGENTS.md` (atau build + test yang dideklarasikan) lewat di sesi ini.                                        |

Jangan mengklaim "lulus" tanpa menyebut perintah atau outputnya. Gate gagal? Kembali ke implement.md atau audit.md.

## Safety pass (wajib, hard stop)

Sebelum commit, pastikan **tidak ada file mentah di `.pawang/reference/` yang ter-stage git**. Docx/pdf/png/jpeg asli berisi data pribadi dan hanya `spesifikasi.html` serta `reference.anon.txt` yang boleh ikut commit.

```bash
git status --porcelain .pawang/reference/
git diff --cached --name-only .pawang/reference/
```

Ada file mentah yang lolos? Unstage, laporkan, hentikan proses. Ini pengaman data pribadi, bukan saran.

## Arsip ke history

Render arsip dengan `--out`, memakai JSON hasil `extract` spec + tambahan:

```bash
node .pawang/kit.js render history-feature --out .pawang/history/features/03-nama.html --in /tmp/arsip.json
```

- Skema arsip = skema spec + `"completedAt"` + `"findings"`. Hanya entri `closed`/`accepted`/`invalid` yang ikut arsip; `fixed` tetap tinggal di ledger.
- Penamaan: fitur `NN-nama.html`, rebuild `NN-nama--build-N.html`; fix ke `history/fixes/`; rollback ke `history/rollbacks/YYYY-MM-DD-<target-archive-stem>.html` (termasuk `--build-N` bila target rebuild).
- Baca ulang arsip dengan `kit.js extract` untuk memastikan isinya lengkap sebelum mengganti apa pun.
- Fitur: centang item build-plan via `render build-plan` (extract JSON, ubah `done: true`, render ulang). Fix tidak menyentuh build-plan.
- Rollback: tulis arsip rollback, baca ulang untuk memastikan lengkap, lalu uncheck item build-plan target (`done: false`) memakai `origin.buildPlanId`; catat path arsip rollback. Jangan hapus arsip fitur asli. Jika arsip atau uncheck gagal, hentikan dan laporkan; jangan menebak. Wajibkan `origin.buildPlanId`. Fallback arsip lama: ambil prefix `^(\d+[a-z]?)`, buang leading zero, lowercase huruf, lalu cocokkan persis dengan ID build-plan; ambigu → tanya user.

## Reset context

Setelah arsip aman:

1. Render ulang `current-feature` ke stub kosong (JSON minimal sesuai skema di workflow.md).
2. Render ulang `findings` menjadi `{ "items": [] }` **hanya kalau** tidak ada entri `open`/`fixed`/`unverified` tersisa; entri yang belum selesai tetap tinggal dengan ID-nya, jangan dihapus.
3. Render ulang `review` menjadi `{ "state": "none" }`.
4. Semua lewat `kit.js render`; jangan pernah menulis atau mengedit HTML mentah.

## Commit (gerbang izin user)

1. Tunjukkan diff lengkapnya (produk + arsip + reset context) beserta usulan pesan commit: `feat:`, `fix:`, atau `revert:`.
2. **Minta izin eksplisit user. Jangan commit sebelum diizinkan.**
3. Satu commit untuk satu work item; jangan mencampur pekerjaan lain. Uncommitted step work itu wajar - commit ini yang membungkusnya.

## Landing (izin terpisah)

Ikuti `config.git.landing`:

| Nilai          | Aksi                                                      | Izin                   |
| -------------- | --------------------------------------------------------- | ---------------------- |
| `local-merge`  | Squash-merge work commit ke branch default.               | Izin merge terpisah.   |
| `pull-request` | Push branch kerja + buka PR (squash merge oleh provider). | Izin push+PR terpisah. |

Push ke upstream atau branch default **selalu butuh izin tambahan lagi** di chat saat ini. Izin commit bukan izin merge; izin merge bukan izin push. Jangan pernah menganggap perintah "complete", config, atau "kelihatannya bagus" sebagai izin.

## Penutup

Laporkan: hash commit, path arsip, status landing, dan langkah berikutnya. Orientasi berikutnya lewat status.md; fitur selanjutnya lewat feature.md.
