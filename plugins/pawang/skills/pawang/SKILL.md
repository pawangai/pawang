---
name: pawang
description: "Alur kerja agent otonom berbasis spec di .pawang (HTML via kit.js): rencanakan fitur, implement, check, audit, complete; orkestrasi paralel dalam satu fitur dan batch lintas fitur/tiket; plus adopsi proyek, AGENTS.md, tata letak, build plan/project plan/roadmap/MVP, inisiatif besar lintas sesi (wayfinder), dokumen rujukan, handoff, prototype Figr/DS, review/baca kode (kode AI, diff/PR, 12 lensa; pilih 3-6), penyatuan file agent (AGENTS.md/.agents, CLAUDE.md/GEMINI.md), CI/CD (pipeline, hook, ruleset, preview, audit CI), dan tooling. Gunakan saat user menyebut pawang, fitur/spec, paralel/batch, CI/CD/pipeline/audit CI, menulis build plan/project plan/roadmap/MVP, inisiatif besar/wayfinder, adopsi proyek, menulis/meninjau AGENTS.md, dokumen contoh, meminta review/penjelasan kode, atau merapikan file agent/CLAUDE.md."
---

# pawang - alur kerja agent otonom

Tujuan: mengendalikan satu alur kerja utuh untuk membangun perangkat lunak, dari adopsi proyek sampai fitur selesai, dengan spec sebagai pusat dan state di folder `.pawang/`. Setelah spec disetujui, agent bekerja otonom; manusia hanya hadir di dua gerbang.

## Surface: full atau lite

- **Full** bila surface punya shell, Node, git, dan repo proyek yang bisa ditulis (Claude Code, Cowork, ChatGPT Work/Codex, Gemini CLI, Antigravity, opencode). Jalankan alur penuh.
- **Lite** bila salah satunya tidak ada (claude.ai Chat, ChatGPT Chat, Gemini app, Perplexity chat, atau sandbox tanpa Node/git). Baca `references/lite.md`; jangan menulis `.pawang/`, jangan menjalankan `kit.js`, dan jangan mengaku sudah test/commit. Untuk implement/complete, hentikan dan arahkan ke surface full.

## Prinsip

- **Dua gerbang manusia saja**: (1) review spec `current-feature.html`, (2) izin commit/merge di `complete`. Selebihnya otonom: implement → check → audit → perbaikan findings → siap complete berjalan sendiri. Henti darurat: macet melewati `autonomous.maxRepairAttempts`, butuh keputusan produk, atau pekerjaan keluar scope.
- **User pemilik keputusan.** Aturan proyek, companion, dan ADR adalah default; jika bentrok, tunjukkan dan minta keputusan. Keputusan lama boleh diubah user (perbarui dokumen + tanggal); rollback untuk fitur yang sudah diimplementasikan, bukan catatan keputusan.
- **Progressive disclosure.** File ini hanya peta. Pilih **satu** reference sesuai tugas, baca, kerjakan. Jangan membaca banyak reference sekaligus.
- **Path skill.** Script dijalankan dari folder yang memuat `SKILL.md` ini, bukan dari root proyek. Di Claude Code gunakan `${CLAUDE_SKILL_DIR}`; di agent lain, resolusi path folder skill sebelum menjalankan `node scripts/...`.
- **HTML state `.pawang/` HANYA dibuat lewat `node .pawang/kit.js`.** Agent mengirim JSON, kit.js yang menulis HTML. Jangan pernah menulis atau mengedit HTML state mentah. Pengecualian: `.pawang/prototype/` = artefak generated prototype-kit; `.pawang/figr/` = dokumen sumber Figr (Markdown) + prompt; `.pawang/figr/diagrams/` = viewer HTML generated `kit.js`.
- **Baca state hemat.** Mulai dari `node .pawang/kit.js status` (ringkasan semua). `extract` hanya file yang benar-benar perlu.
- **Aturan dua lapis.** `AGENTS.md` = peta + perintah + `## Jangan` + `## Keputusan penting` + pemicu tautan; `.pawang/` = state kerja + konvensi (`context/coding-standards.html`) + prototype + rujukan + riwayat. `docs/` tidak dibuat secara default; `docs/` lama atau opt-in user (termasuk `docs/agents/`) dideteksi dan ditautkan. Detail aturan anti-duplikasi ada di `references/workflow.md`.
- **Belum ada `.pawang/` di proyek?** Mulai dari `references/adopt.md` (pindai proyek), lalu salin `kit.js` ke `.pawang/kit.js` dan jalankan `init`.
- **Companion terpisah.** Figr, wawancara mendalam, dan inisiatif besar (wayfinder) membutuhkan companion di `.agents/skills/`; Pawang core tidak membundelnya. Lihat `references/companions.md`; pasang hanya dengan izin user, jangan meniru script/gayanya.
- **Orkestrator = agent utama.** Satu-satunya penulis `.pawang/`, history, build-plan, dan git. Worker read-only tidak menulis apa pun; worker implementasi hanya menulis di worktree-nya. Cap: 3 read-only, 2 browser, 2 write. Detail di `references/parallel.md`; batch lintas fitur di `references/orchestrate.md`.

## Peta topik

| Kelompok | Tugas                                                    | Reference                      |
| -------- | -------------------------------------------------------- | ------------------------------ |
| Dasar    | Aturan inti `.pawang`, kit.js, skema data, gerbang       | `references/workflow.md`       |
| Dasar    | Mode lite (chat web tanpa shell/Node/repo)               | `references/lite.md`           |
| Setup    | Pindai & adopsi proyek                                   | `references/adopt.md`          |
| Setup    | Tulis/rawat AGENTS.md                                    | `references/agents-md.md`      |
| Setup    | Tentukan/audit tata letak repo                           | `references/layout.md`         |
| Setup    | Rekomendasi tooling, dokumentasi, skill                  | `references/advisor.md`        |
| Setup    | Pasang/periksa companion (grilling, wayfinder, Figr)     | `references/companions.md`     |
| Setup    | Satukan file agent ganda (AGENTS.md/.agents)             | `references/agent-files.md`    |
| Setup    | Pasang/rawat CI/CD, hook, ruleset, preview               | `references/ci.md`             |
| Rencana  | Tulis build-plan & project-overview (wayfinder)          | `references/plans.md`          |
| Rencana  | Tulis 4 dokumen Figr (PRD, flow, desain, edge)           | `references/figr-docs.md`      |
| Rencana  | Susun prompt Figr Design dari 4 dokumen                  | `references/figr-prompt.md`    |
| Rencana  | Tulis spec fitur dari build-plan                         | `references/feature.md`        |
| Rencana  | Tulis spec fix ad-hoc                                    | `references/fix-debug.md`      |
| Rencana  | Tulis spec rollback                                      | `references/rollback.md`       |
| Rencana  | Preview fitur berikut / eksplorasi ide                   | `references/brief-explore.md`  |
| Rencana  | Mockup HTML & tema sebelum fitur UI                      | `references/prototype.md`      |
| Bangun   | Prototype Figr/DS → HTML statis                          | `references/prototype-figr.md` |
| Bangun   | Eksekusi spec step-by-step                               | `references/implement.md`      |
| Bangun   | Dispatch paralel dalam satu fitur (cek/audit/step)       | `references/parallel.md`       |
| Bangun   | Orkestrasi batch lintas fitur/tiket                      | `references/orchestrate.md`    |
| Bangun   | Setup unit / browser test                                | `references/tests.md`          |
| Periksa  | Verifikasi perilaku + walkthrough manual                 | `references/check.md`          |
| Periksa  | Audit kualitas/keamanan + findings                       | `references/audit.md`          |
| Periksa  | Review/baca kode (kode AI, diff/PR, 12 lensa; pilih 3-6) | `references/review-code.md`    |
| Periksa  | Audit CI/CD read-only                                    | `references/ci-audit.md`       |
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
batch      plans → orchestrate (spec batch) ──GERBANG: review spec batch──► worker paralel
          → check/audit per cabang → merge sequential → complete ──GERBANG: izin commit/merge batch──► arsip
kapan saja  status · doctor · review kode · file agent · handoff · tests · ci · ci-audit · rollback · release · document
```

## Kesalahan umum

- Membaca banyak reference sekaligus, atau menyalin isi satu lapis ke lapis lain (duplikasi).
- Menulis/mengedit HTML state di `.pawang/` langsung, bukan lewat `kit.js` (kecuali artefak generated `.pawang/prototype/` dan `.pawang/figr/diagrams/`).
- Memakai lane A (`prototypes/`) padahal proyek punya Figr; lane B ada di `references/prototype-figr.md`.
- Memakai lane Figr/grill/wayfinder tanpa companion, memasangnya diam-diam, atau memakai wayfinder tanpa tracker GitHub; lihat `references/companions.md`.
- Menulis build-plan sebelum peta wayfinder selesai, atau menyalin peta/tiket GitHub ke `.pawang/`.
- Menaruh 4 dokumen Figr di `figr/` atau menjadikan HTML diagram sebagai sumber; sumbernya `.pawang/figr/*.md` (Mermaid).
- Memakai alur audit untuk review kode tempelan/PR tanpa spec, atau memakai review kode untuk menggantikan check/audit fitur.
- Mengarang CI/pipeline atau menjalankan aksi remote (push, ruleset, secret, deploy) saat setup CI tanpa izin; atau menganggap preview aman tanpa memeriksa isolasi binding. Lihat `references/ci.md`/`references/ci-audit.md`.
- Menjalankan worker paralel tanpa cap, membiarkan worker menulis `.pawang/`/git, atau memparalelkan perbaikan findings.
- Memakai batch untuk satu fitur atau untuk item yang dependen/file-nya beririsan; membuat satu squash commit untuk seluruh batch.
- Memasang `to-spec`/`to-tickets`/`implement`/`implement-spec` sebagai companion; konsepnya sudah ada di core.
- Meng-symlink `CLAUDE.md`/`GEMINI.md`/`.claude` sebelum isi uniknya dimigrasikan, atau meng-symlink seluruh `.claude` padahal ada settings/hooks.
- Mulai implement sebelum spec disetujui, atau commit/merge tanpa izin.
- Melanjutkan pekerjaan di luar scope spec tanpa bertanya.
