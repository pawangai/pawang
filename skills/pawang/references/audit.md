# Audit - verifikasi kualitas & keamanan

Tujuan: periksa kode tanpa mengubahnya, catat temuan durable di `.pawang/context/findings.html`, dan bila diminta jalankan review independen dengan satu request/receipt aktif di `review.html`. Audit menutup temuan `fixed`, tapi tidak pernah memperbaiki kode.

## Cakupan dan lensa

| Kontrol | Pilihan                                                                                                                  |
| ------- | ------------------------------------------------------------------------------------------------------------------------ |
| Cakupan | `current` (default: spec aktif + delta branch), `changed` (perubahan lokal), `full` (seluruh proyek), atau path tertentu |
| Lensa   | `quality`, `security`, `performance`, `tests`; default semuanya                                                          |

Laporan dipisah per lensa. **Lensa sempit bukan audit luas**: sebutkan apa yang tidak diperiksa dan jangan menyiratkan lensa lain ikut lulus.

## Lensa paralel

Bila ada dua lensa atau lebih dan subagent tersedia, dispatch satu worker read-only per lensa dengan diff ref + cakupan. Aturan lengkap di `parallel.md`; ringkasnya:

- Worker tidak menulis `findings.html`, tidak memberi ID final, dan tidak mengubah kode.
- Parent menggabungkan hasil, menghapus duplikat, memberi ID `F-xx`, lalu menulis ledger **sekali**.
- Perbaikan findings selalu sequential; re-audit boleh paralel lagi setelah perbaikan.
- Jangan kutip secret; parent meredaksi kategori + file:line.
- Cap 3 worker read-only; tanpa subagent, jalankan lensa berurutan.

## Alur audit biasa

1. **Kumpulkan konteks**: spec aktif, `findings.html` (untuk ID/status saja), `review.html`, `coding-standards.html` bila lensa butuh, git status + diff. Untuk `current`, mulai dari diff spec; ikuti hanya caller, dependency, dan test yang perlu untuk membuktikan temuan.
2. **Jalankan signal yang sudah ada saja**: lint, typecheck, test, build - perintah yang sudah dideklarasikan. **Jangan install tool baru.**
3. **Review kode secara segar** dari bukti nyata: jalur kode yang tercapai, kontrak yang dilanggar, boundary yang gagal. Jangan nitpick gaya yang tidak menandakan drift. Menemukan secret? **Jangan pernah mengutip nilainya** - laporkan kategori teredaksi + file:line + remediasi. Untuk diff/PR di luar siklus fitur, pakai tiga sumbu di `review-code.md`; temuan durable tetap dicatat di sini.
4. **Tulis temuan** ke `findings.html` lewat `kit.js render findings` (extract JSON, tambah entri). Satu blok per temuan dengan field: `id`, `severity`, `status`, `title`, `file`, `found`, `why`, `fix`, `resolution`.
5. **Lapor**: temuan duluan urut severity (P0 sampai P3), lalu perintah yang dijalankan dan cakupan. Ringkasan singkat.

**Ledger tidak pernah menentukan apa yang direview.** Review kode dari nol setiap pass; menjadikan temuan lama sebagai checklist justru menyembunyikan cacat baru dari perbaikan sebelumnya.

## Severity dan status

| Severity | Arti                                                                    |
| -------- | ----------------------------------------------------------------------- |
| `P0`     | Data loss, security break, atau kode yang tidak boleh ship.             |
| `P1`     | Bug kemungkinan besar, kontrak rusak, guard hilang, duplikasi berisiko. |
| `P2`     | Masalah maintainability yang layak dibereskan sebelum fitur ditutup.    |
| `P3`     | Cleanup kecil atau kandidat follow-up.                                  |

| Status       | Arti                                                             | Blokir complete (P0/P1) |
| ------------ | ---------------------------------------------------------------- | ----------------------- |
| `unverified` | Dugaan, belum ada bukti; lead, bukan cacat.                      | Tidak                   |
| `open`       | Terkonfirmasi, belum diperbaiki.                                 | Ya                      |
| `fixed`      | Sudah diperbaiki, belum direview ulang.                          | Ya                      |
| `closed`     | Diperbaiki dan sudah diverifikasi ulang oleh audit.              | Tidak                   |
| `accepted`   | Tidak diperbaiki atas keputusan eksplisit user (alasan dicatat). | Tidak                   |
| `invalid`    | Terbukti salah setelah diteliti ulang (bukti dicatat).           | Tidak                   |

Aturan: ID `F-01`, `F-02`, ... sekuensial dan **tidak pernah didaur ulang atau dinomori ulang** selama entrinya hidup. implement.md menandai `fixed`; **hanya audit yang memindahkan ke `closed`** setelah melihat kode perbaikan dan memastikan cacat asli hilang tanpa cacat baru. `accepted` butuh keputusan eksplisit user di sesi saat ini plus alasannya; jangan pernah mengatasnamakan user. `invalid` butuh bukti re-examine. P0/P1 `open` atau `fixed` memblokir complete.md.

## Review independen

Satu request/receipt aktif di `review.html`. **Builder tidak boleh me-review pekerjaannya sendiri.**

**Phase A - builder menyiapkan request.** Setelah spec `verified` dan semua step selesai: tulis request `pending` lewat `kit.js render review` dengan `targetCommit` = HEAD saat ini, `specHash` (hash byte spec `current-feature.html`), dan `requestedExecution` dari `config.review.independentExecution` (default `automatic`).

**Phase B - reviewer segar menilai.** Reviewer adalah subagent atau sesi baru **tanpa konteks builder**. Ia menilai delta `targetCommit` dari nol dengan empat lensa, menjalankan check bila diminta, lalu menulis receipt lewat render:

- `state`: `passed` atau `changes-requested`;
- field `verdict`, `commands`, `evidence`, `findings`, `remainingRisk`;
- section **Bukti / Commands / Findings / Risiko sisa** - semuanya non-kosong; tulis `None` bila memang kosong.

**Receipt basi = tidak ada receipt.** Kalau `targetCommit` bukan HEAD lagi atau byte spec berubah, review harus diulang penuh - jangan mengedit receipt lama. `changes-requested`? Builder memperbaiki lewat implement.md, lalu request baru untuk delta penuh. Builder melanjutkan (mis. ke complete) hanya setelah receipt `passed` yang current.

Bentuk JSON review:

```json
{
  "state": "pending",
  "targetCommit": "<sha>",
  "specHash": "<sha256>",
  "requestedExecution": "automatic",
  "verdict": "",
  "commands": [],
  "evidence": [],
  "findings": [],
  "remainingRisk": []
}
```

`state`: `none` | `pending` | `passed` | `changes-requested`.

## Aturan

- Audit tidak mengedit source, tidak install, tidak commit/merge/push.
- Mockup/prototype bukan bukti kualitas; audit tetap pada kode yang berjalan.
- Satu-satunya tulisan: `findings.html` (dan `review.html` di mode independen). Semua lewat `kit.js render`.
- Jangan fetch/pull atau menjalankan tool audit berbasis jaringan tanpa izin.
- Temuan dulu, ringkasan belakangan. Setiap temuan sedapat mungkin punya file:line.
- Saran perbaikan = yang terkecil yang menghilangkan risiko; hormati pola proyek di atas saran generik.
- Tandai hipotesis sebagai `unverified` bila bukti runtime/profiling belum ada; jangan naikkan ke P0/P1 tanpa jalur kode nyata yang membuktikan.
