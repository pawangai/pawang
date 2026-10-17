---
name: pawang
description: Alur kerja agent otonom berbasis spec di folder .pawang (HTML dibuat lewat kit.js): rencanakan fitur, kerjakan, verifikasi, audit, selesaikan; plus adopsi proyek, penulisan AGENTS.md, tata letak, spesifikasi dokumen rujukan, handoff, prototype dari Figr/DS, dan rekomendasi tooling. Gunakan saat user menyebut pawang, mengerjakan fitur/spec, mengadopsi proyek, atau membuat dokumen meniru contoh.
---

# pawang - alur kerja agent otonom

Tujuan: mengendalikan satu alur kerja utuh untuk membangun perangkat lunak, dari adopsi proyek sampai fitur selesai, dengan spec sebagai pusat dan state di folder `.pawang/`. Setelah spec disetujui, agent bekerja otonom; manusia hanya hadir di dua gerbang.

## Prinsip

- **Dua gerbang manusia saja**: (1) review spec `current-feature.html`, (2) izin commit/merge di `complete`. Selebihnya otonom: implement → check → audit → perbaikan findings → siap complete berjalan sendiri. Henti darurat: macet melewati `autonomous.maxRepairAttempts`, butuh keputusan produk, atau pekerjaan keluar scope.
- **Progressive disclosure.** File ini hanya peta. Pilih **satu** reference sesuai tugas, baca, kerjakan. Jangan membaca banyak reference sekaligus.
- **Semua file `.pawang/` berformat HTML dan HANYA dibuat lewat `node .pawang/kit.js`.** Agent mengirim JSON, kit.js yang menulis HTML. Jangan pernah menulis atau mengedit HTML mentah. Pengecualian: `.pawang/prototype/` adalah artefak generated prototype-kit (HTML statis + runtime `kit.js` sendiri), bukan state yang diedit manual.
- **Baca state hemat.** Mulai dari `node .pawang/kit.js status` (ringkasan semua). `extract` hanya file yang benar-benar perlu.
- **Aturan dua lapis.** `AGENTS.md` = peta + perintah + `## Jangan` + `## Keputusan penting` + pemicu tautan; `.pawang/` = state kerja + konvensi (`context/coding-standards.html`) + prototype + rujukan + riwayat. `docs/` hanya proyek lama (brownfield) yang dideteksi dan ditautkan, tidak dibuat. Detail aturan anti-duplikasi ada di `references/workflow.md`.
- **Belum ada `.pawang/` di proyek?** Mulai dari `references/adopt.md` (pindai proyek), lalu salin `kit.js` ke `.pawang/kit.js` dan jalankan `init`.

## Peta topik

| Kelompok | Tugas                                              | Reference                      |
| -------- | -------------------------------------------------- | ------------------------------ |
| Dasar    | Aturan inti `.pawang`, kit.js, skema data, gerbang | `references/workflow.md`       |
| Setup    | Pindai & adopsi proyek                             | `references/adopt.md`          |
| Setup    | Tulis/rawat AGENTS.md                              | `references/agents-md.md`      |
| Setup    | Tentukan/audit tata letak repo                     | `references/layout.md`         |
| Setup    | Rekomendasi tooling, dokumentasi, skill            | `references/advisor.md`        |
| Rencana  | Tulis spec fitur dari build-plan                   | `references/feature.md`        |
| Rencana  | Tulis spec fix ad-hoc                              | `references/fix-debug.md`      |
| Rencana  | Tulis spec rollback                                | `references/rollback.md`       |
| Rencana  | Preview fitur berikut / eksplorasi ide             | `references/brief-explore.md`  |
| Rencana  | Mockup HTML & tema sebelum fitur UI                | `references/prototype.md`      |
| Bangun   | Prototype Figr/DS → HTML statis                    | `references/prototype-figr.md` |
| Bangun   | Eksekusi spec step-by-step                         | `references/implement.md`      |
| Bangun   | Setup unit / browser test                          | `references/tests.md`          |
| Periksa  | Verifikasi perilaku + walkthrough manual           | `references/check.md`          |
| Periksa  | Audit kualitas/keamanan + findings                 | `references/audit.md`          |
| Selesai  | Gate akhir, arsip, commit, landing                 | `references/complete.md`       |
| Rawat    | Orientasi & satu langkah berikutnya                | `references/status.md`         |
| Rawat    | Diagnosa kesehatan `.pawang` & docs                | `references/doctor.md`         |
| Rawat    | Catatan lanjut sesi                                | `references/handoff.md`        |
| Rawat    | Persiapan deploy tanpa deploy                      | `references/release.md`        |
| Dokumen  | Spesifikasi dari dokumen contoh                    | `references/document.md`       |

## Alur singkat

```
(sekali)  adopt → agents-md → kit.js init → build-plan + project-overview
per fitur (brief) → (prototype | prototype-figr) → feature ──GERBANG: review spec──► implement
          → check → audit → (perbaikan findings) → complete ──GERBANG: izin commit/merge──► arsip
kapan saja  status · doctor · handoff · tests · rollback · release · document
```

## Kesalahan umum

- Membaca banyak reference sekaligus, atau menyalin isi satu lapis ke lapis lain (duplikasi).
- Menulis/mengedit file `.html` di `.pawang/` langsung, bukan lewat `kit.js` (kecuali artefak generated `.pawang/prototype/`).
- Memakai lane A (`prototypes/`) padahal proyek punya Figr; lane B ada di `references/prototype-figr.md`.
- Mulai implement sebelum spec disetujui, atau commit/merge tanpa izin.
- Melanjutkan pekerjaan di luar scope spec tanpa bertanya.
