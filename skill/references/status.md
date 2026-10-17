# Status - orientasi & langkah berikutnya

Tujuan: baca state tanpa mengubah apa pun, laporkan posisi sekarang dalam beberapa baris, dan akhiri dengan **satu** langkah berikutnya yang spesifik.

## Cara kerja

1. **Selalu mulai dari `node .pawang/kit.js status`.** Satu perintah ini sudah merangkum config, spec aktif + progres step, batch, findings, review, handoff, history, dan tema. Jangan menyalin isi file.
2. Baca `.pawang/context/coding-standards.html` **hanya bila terkait langsung** dengan pertanyaan atau pekerjaan saat ini; `docs/` lama hanya bila ditautkan `AGENTS.md`. Jangan menjelajah default.
3. Cek git ringan: branch saat ini, bersih atau kotor, kira-kira berapa file berubah, subjek commit terakhir.
4. `kit.js check` bila ada kecurigaan integritas atau status melaporkan ada yang rusak.

## Bentuk laporan

Ringkas dan scannable, bukan dump file:

```
Status: fitur 4 - Export PDF, step 2/3 selesai
Batch: 3 item - 1 running, 2 ready, 0 blocked (integration/batch-2026-10-17)
Build-plan: 5/9 selesai, berikutnya: 6 - Notifikasi email
Findings: 1 P1 open (F-02), 1 P2 fixed menunggu re-review (F-04)
Review: pending, target sudah bukan HEAD (basi)
Git: branch feature/export-pdf, 2 file belum di-commit

Next: /implement step 3 - tombol unduh PDF
```

Tambahkan baris `Watch:` bila ada yang perlu diwaspadai, mis. spec dikerjakan di branch default, findings `fixed` yang masih memblokir, atau review basi.

## Pilih SATU langkah berikutnya

| Kondisi                                                                     | Langkah                                                                                                         |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Config atau integritas rusak (`kit.js check` exit 1)                        | Perbaiki lewat panduan doctor.md.                                                                               |
| Batch punya item `ready`/`running`                                          | orchestrate.md - sebut frontier dan item berikutnya.                                                            |
| Spec aktif, masih ada step belum `done`                                     | implement.md - sebut step berikutnya.                                                                           |
| Spec aktif, semua step selesai, belum `verified`                            | check.md (atau `guide` bila user mau mencoba manual).                                                           |
| P0/P1 berstatus `open`                                                      | Perbaikan: tambahkan step di spec aktif lewat implement.md; tanpa spec aktif, buat spec fix lewat fix-debug.md. |
| P0/P1 berstatus `fixed`                                                     | audit.md - re-review lalu tutup ke `closed`.                                                                    |
| Review `pending`, `changes-requested`, basi, atau belum ada padahal diminta | audit.md, mode review independen (`/audit independent current`).                                                |
| Spec `verified`, findings bersih, review clear                              | complete.md.                                                                                                    |
| Tidak ada spec aktif, build-plan masih ada item belum                       | feature.md - sebut item berikutnya.                                                                             |
| Semua build-plan selesai                                                    | Laporan milestone: sebut apa yang selesai, usul lanjutan (hardening, rilis, dokumentasi).                       |

Kalau tak ada spec aktif tapi masih ada temuan P0/P1, spec fix baru bisa dibuat lewat fix-debug.md. **Sebut satu perintah saja**, jangan daftar panjang; user menjalankannya sendiri.

## Aturan

- **Read-only mutlak.** Tidak menulis file, tidak commit, tidak ganti branch, tidak install, tidak menjalankan build atau test.
- **Jujur soal celah.** File rusak atau belum ada? Katakan apa adanya, jangan menebak.
- Jangan menyarankan membuat build-plan kedua; proyek ini satu build-plan.
- Jangan mengubah status spec atau findings dari sini, sekalipun terlihat sudah jelas - arahkan ke perintah yang berwenang.
