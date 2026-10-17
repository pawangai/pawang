---
name: pawang
description: Alur kerja agent otonom berbasis spec di .pawang (HTML via kit.js): rencanakan fitur, implement, check, audit, complete; plus adopsi proyek, AGENTS.md, tata letak, build plan/project plan/roadmap/MVP, dokumen rujukan, handoff, prototype Figr/DS, review/baca kode (kode AI, diff/PR, 12 lensa; pilih 3-6), dan tooling. Gunakan saat user menyebut pawang, fitur/spec, menulis build plan/project plan/roadmap/MVP, adopsi proyek, dokumen contoh, atau meminta review/penjelasan kode.
---

# pawang - alur kerja agent otonom

Tujuan: mengendalikan satu alur kerja utuh untuk membangun perangkat lunak, dari adopsi proyek sampai fitur selesai, dengan spec sebagai pusat dan state di folder `.pawang/`. Setelah spec disetujui, agent bekerja otonom; manusia hanya hadir di dua gerbang.

## Prinsip

- **Dua gerbang manusia saja**: (1) review spec `current-feature.html`, (2) izin commit/merge di `complete`. Selebihnya otonom: implement → check → audit → perbaikan findings → siap complete berjalan sendiri. Henti darurat: macet melewati `autonomous.maxRepairAttempts`, butuh keputusan produk, atau pekerjaan keluar scope.
- **User pemilik keputusan.** Aturan proyek, companion, dan ADR adalah default; jika bentrok, tunjukkan dan minta keputusan. Keputusan lama boleh diubah user (perbarui dokumen + tanggal); rollback untuk fitur yang sudah diimplementasikan, bukan catatan keputusan.
- **Progressive disclosure.** File ini hanya peta. Pilih **satu** reference sesuai tugas, baca, kerjakan. Jangan membaca banyak reference sekaligus.
- **HTML state `.pawang/` HANYA dibuat lewat `node .pawang/kit.js`.** Agent mengirim JSON, kit.js yang menulis HTML. Jangan pernah menulis atau mengedit HTML state mentah. Pengecualian: `.pawang/prototype/` = artefak generated prototype-kit; `.pawang/figr/` = dokumen sumber Figr (Markdown) + prompt; `.pawang/figr/diagrams/` = viewer HTML generated `kit.js`.
- **Baca state hemat.** Mulai dari `node .pawang/kit.js status` (ringkasan semua). `extract` hanya file yang benar-benar perlu.
- **Aturan dua lapis.** `AGENTS.md` = peta + perintah + `## Jangan` + `## Keputusan penting` + pemicu tautan; `.pawang/` = state kerja + konvensi (`context/coding-standards.html`) + prototype + rujukan + riwayat. `docs/` tidak dibuat secara default; `docs/` lama atau opt-in user (termasuk `docs/agents/`) dideteksi dan ditautkan. Detail aturan anti-duplikasi ada di `references/workflow.md`.
- **Belum ada `.pawang/` di proyek?** Mulai dari `references/adopt.md` (pindai proyek), lalu salin `kit.js` ke `.pawang/kit.js` dan jalankan `init`.
- **Companion terpisah.** Figr dan wawancara mendalam membutuhkan companion di `.agents/skills/`; Pawang core tidak membundelnya. Lihat `references/companions.md`; pasang hanya dengan izin user, jangan meniru script/gayanya.

## Peta topik

| Kelompok | Tugas                                                    | Reference                      |
| -------- | -------------------------------------------------------- | ------------------------------ |
| Dasar    | Aturan inti `.pawang`, kit.js, skema data, gerbang       | `references/workflow.md`       |
| Setup    | Pindai & adopsi proyek                                   | `references/adopt.md`          |
| Setup    | Tulis/rawat AGENTS.md                                    | `references/agents-md.md`      |
| Setup    | Tentukan/audit tata letak repo                           | `references/layout.md`         |
| Setup    | Rekomendasi tooling, dokumentasi, skill                  | `references/advisor.md`        |
| Setup    | Pasang/periksa companion (grill, Figr)                   | `references/companions.md`     |
| Rencana  | Tulis build-plan & project-overview                      | `references/plans.md`          |
| Rencana  | Tulis 4 dokumen Figr (PRD, flow, desain, edge)           | `references/figr-docs.md`      |
| Rencana  | Susun prompt Figr Design dari 4 dokumen                  | `references/figr-prompt.md`    |
| Rencana  | Tulis spec fitur dari build-plan                         | `references/feature.md`        |
| Rencana  | Tulis spec fix ad-hoc                                    | `references/fix-debug.md`      |
| Rencana  | Tulis spec rollback                                      | `references/rollback.md`       |
| Rencana  | Preview fitur berikut / eksplorasi ide                   | `references/brief-explore.md`  |
| Rencana  | Mockup HTML & tema sebelum fitur UI                      | `references/prototype.md`      |
| Bangun   | Prototype Figr/DS → HTML statis                          | `references/prototype-figr.md` |
| Bangun   | Eksekusi spec step-by-step                               | `references/implement.md`      |
| Bangun   | Setup unit / browser test                                | `references/tests.md`          |
| Periksa  | Verifikasi perilaku + walkthrough manual                 | `references/check.md`          |
| Periksa  | Audit kualitas/keamanan + findings                       | `references/audit.md`          |
| Periksa  | Review/baca kode (kode AI, diff/PR, 12 lensa; pilih 3-6) | `references/review-code.md`    |
| Selesai  | Gate akhir, arsip, commit, landing                       | `references/complete.md`       |
| Rawat    | Orientasi & satu langkah berikutnya                      | `references/status.md`         |
| Rawat    | Diagnosa kesehatan `.pawang` & docs                      | `references/doctor.md`         |
| Rawat    | Catatan lanjut sesi                                      | `references/handoff.md`        |
| Rawat    | Persiapan deploy tanpa deploy                            | `references/release.md`        |
| Dokumen  | Spesifikasi dari dokumen contoh                          | `references/document.md`       |

## Alur singkat

```
(sekali)  adopt → agents-md → kit.js init → plans (build-plan + project-overview)
per fitur (brief) → (figr-docs → figr-prompt) → (prototype | prototype-figr) → feature ──GERBANG: review spec──► implement
          → check → audit → (perbaikan findings) → complete ──GERBANG: izin commit/merge──► arsip
kapan saja  status · doctor · review kode · handoff · tests · rollback · release · document
```

## Kesalahan umum

- Membaca banyak reference sekaligus, atau menyalin isi satu lapis ke lapis lain (duplikasi).
- Menulis/mengedit HTML state di `.pawang/` langsung, bukan lewat `kit.js` (kecuali artefak generated `.pawang/prototype/` dan `.pawang/figr/diagrams/`).
- Memakai lane A (`prototypes/`) padahal proyek punya Figr; lane B ada di `references/prototype-figr.md`.
- Memakai lane Figr/grill tanpa companion, atau memasangnya diam-diam; lihat `references/companions.md`.
- Menaruh 4 dokumen Figr di `figr/` atau menjadikan HTML diagram sebagai sumber; sumbernya `.pawang/figr/*.md` (Mermaid).
- Memakai alur audit untuk review kode tempelan/PR tanpa spec, atau memakai review kode untuk menggantikan check/audit fitur.
- Mulai implement sebelum spec disetujui, atau commit/merge tanpa izin.
- Melanjutkan pekerjaan di luar scope spec tanpa bertanya.
