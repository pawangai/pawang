# Lite - Pawang di surface tanpa shell, Node, atau repo persisten

Tujuan: tetap memberi nilai dari alur Pawang di chat web tanpa berpura-pura menjalankan state, test, atau git. Lite adalah mode baca + artifact, bukan alur otonom.

## Kapan dipakai

Pakai lite bila salah satu tidak tersedia: shell, Node, git, atau repo proyek yang bisa ditulis. Contoh: claude.ai Chat, ChatGPT Chat, Gemini app, Perplexity chat, atau sandbox yang tidak punya Node.

Full tetap dipakai di Claude Code, Cowork, ChatGPT Work/Codex, Gemini CLI, Antigravity, dan opencode.

## Aturan

1. Jangan menulis atau mengedit `.pawang/`, HTML state, history, atau git.
2. Jangan menjalankan `kit.js`; jangan mengaku sudah menjalankannya.
3. Semua output adalah artifact/Markdown dan diberi label `DRAFT — belum masuk .pawang`.
4. Jangan mengarang hasil test, commit, atau deploy. Minta output/diff dari user.
5. Dua gerbang tetap ada: user menyetujui artifact, lalu implement/commit hanya di surface full.
6. Companion tidak tersedia di lite. Jangan menawarkan pemasangan atau meniru script-nya.
7. Jangan meminta secret. Minta versi redaksi atau potongan kode yang relevan.

## Yang bisa

| Tugas                                                                               | Reference                                        | Output                                         |
| ----------------------------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------- |
| Adopt ringan: wawancara + baca file yang diberikan, tanpa `scan.mjs`/`check-layout` | `adopt.md`, `agents-md.md`                       | Profil proyek + draft `AGENTS.md`              |
| Build plan / project overview                                                       | `plans.md`                                       | `build-plan.md`, `project-overview.md`         |
| Spec fitur / fix / brief                                                            | `feature.md`, `fix-debug.md`, `brief-explore.md` | Spec Markdown siap dipindahkan ke surface full |
| 4 dokumen Figr + prompt                                                             | `figr-docs.md`, `figr-prompt.md`                 | Markdown + prompt Figr                         |
| Review kode / diff / PR                                                             | `review-code.md`                                 | Findings + risiko, tanpa mengklaim test        |
| Audit manual read-only                                                              | `audit.md`                                       | Tabel temuan P0-P3                             |
| Spesifikasi dari dokumen contoh                                                     | `document.md`                                    | Spesifikasi Markdown                           |
| Handoff / advisor                                                                   | `handoff.md`, `advisor.md`                       | Catatan lanjut + rekomendasi                   |
| Check manual                                                                        | `check.md`                                       | Penilaian dari bukti yang user berikan         |

## Yang tidak bisa

`implement`, `complete`, `rollback`, `release`, `tests`, `ci`, `ci-audit`, `prototype`, `prototype-figr`, `parallel`, `orchestrate`, `theme`, `agent-files`, dan semua yang membutuhkan `kit.js`, git, worktree, atau companion.

## Alur singkat

1. Sebutkan mode lite dan batasnya dalam satu kalimat.
2. Pilih satu reference dari tabel, baca, lalu kerjakan hanya tugas itu.
3. Tandai artifact sebagai draft; jangan menulis state.
4. Akhiri dengan langkah lanjutan di surface full, misalnya: `Lanjutkan di Claude Code/Gemini CLI: pawang, implement fitur ini.`

## Handoff ke full

Sertakan: tujuan, keputusan yang sudah disetujui, artifact/diff yang relevan, pertanyaan terbuka, dan file yang perlu dibaca. Jangan menyalin seluruh percakapan.
