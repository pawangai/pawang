# AGENTS.md

## Ringkasan

Pawang = SATU skill besar + CLI pemasang (`npx pawang init`). Struktur mengikuti pola `zip/e2e.zip`: `skill/SKILL.md` hanya peta routing; detail per topik di `skill/references/` (satu file per topik, mandiri, dibaca SATU per tugas). Visi: memperluas pawang meniru alur `zip/my-app.zip` (Blueprints) agar menjadi alur kerja agent lengkap: onboarding → rencana → loop feature → implement → check → audit → complete → otomasi.

## Cara kerja

- Agent utama = orkestrator: satu-satunya penulis `.pawang/`, history, build-plan, dan git.
- Dispatch subagent untuk pekerjaan independen paralel (cek, audit, eksplorasi, step disjoint). Brief pointer + hemat token: tujuan, klaim/step, file, yang dikesampingkan, format hasil <150 kata.
- Cap: 3 read-only, 2 browser, 2 write. Perbaikan findings selalu sequential; step dependen/file sama sequential.
- Jangan dispatch untuk tugas kecil; verifikasi hasil subagent sebelum dipakai.

## Stack

- Node.js >= 18, ESM (`.mjs`), zero dependency — tanpa build, lint, typecheck.
- Test = selftest bawaan kit.js; tanpa framework.

## Repository layout

- `bin/cli.mjs` — CLI pemasang (`init`, `--project`, `--target`, `--force`).
- `skill/SKILL.md` — peta routing; hanya prinsip, tabel topik→reference, alur, kesalahan umum.
- `skill/references/<topik>.md` — detail, satu topik per file, mandiri (+ data: markers.json, layout-rules.json, gap-signals.md, spec-template.md, theme-variables.css). Orkestrasi: `parallel.md` (dalam satu fitur) dan `orchestrate.md` (batch lintas fitur).
- `skill/scripts/*.mjs` — deterministik, zero-dep, tanpa LLM.
- `skill/assets/kit.js` — generator/pembaca state `.pawang` (HTML); disalin ke `.pawang/kit.js` di proyek user.
- `assets/`, `README.md`, `LICENSE` — materi npm (lihat `files` package.json).
- `.agents/skills/` — companion terpasang (proyek): `wayfinder` + `grilling` + `domain-modeling` + `research` + `prototype` + `setup-matt-pocock-skills` (mattpocock/skills), `figr-to-prototype`, dan `prototype-kit`; bukan skill baru Pawang. Daftar companion alur ada di `skill/references/companions.md`; companion review kode opsional diatur di `skill/references/review-code.md`.
- Alat advisor global (bukan companion alur): `find-skills` + `skill-creator`; `skill-inspector` belum terpasang. Jangan duplikasi di project.
- `evals/` — definisi tes skill (tidak ikut npm).
- `pawang-workspace/` — snapshot/fixture/hasil eval (gitignored).
- `zip/` — KOTAK MASUK bahan skill, lokal (gitignored): skill/paket skill mentah ditaruh di sini sebelum diolah. Bahan dibaca DARI `zip/` (bukan salinan luar repo). Sekarang: `e2e.zip` (model struktur), `my-app.zip` (model alur Blueprints), `skills-package.zip` (sudah diserap), `writing-your-plans.skill`, `figr-to-prototype.skill`, `prototype-kit.skill`, `figr-prototype-consolidation.skill` (keempatnya sudah diserap sebagai reference/kontrak; tetap sumber + companion).

## Commands

- Test: `npm test` (kit.js selftest + `link-agent-files.mjs --selftest` + `bin/cli.mjs --version`)
- Cek terbit: `npm run pack:dry`
- Verify: `npm test && npm run pack:dry` (repo ini tanpa typecheck/build)

## Jangan (aturan keras)

- Tetap SATU skill: kemampuan baru = file di `skill/references/` + satu baris di tabel peta `SKILL.md`. Jangan pecah pawang jadi banyak skill.
- Membuat/menyerap/mengubah skill: WAJIB lewat alur `skill-creator` (draf → prompt uji dengan/tanpa → evaluasi → iterasi) + `node skill/scripts/skill-precheck.mjs <folder>`; hasil serapan = reference + baris peta, bukan skill baru.
- Bahan serapan dibaca dari `zip/`; jangan membaca salinan di luar repo.
- Wayfinder: peta/tiket keputusan di GitHub Issues; build-plan baru ditulis setelah peta selesai; jangan menyalin peta/tiket ke `.pawang/`.
- Dua lapis secara default: `AGENTS.md` + `.pawang/`. Pawang tidak membuat docs/ sendiri; docs/ yang sudah ada (termasuk subfolder agents, conventions, adr hasil opt-in user) = brownfield, dideteksi & ditautkan, tidak dipindah/disalin. docs/ baru hanya atas keputusan eksplisit user.
- File agent: `AGENTS.md` + `.agents/` kanonik; `CLAUDE.md`/`GEMINI.md` dan subfolder `.claude` yang tumpang tindih di-symlink setelah migrasi. Jangan symlink seluruh `.claude` bila ada settings/hooks; aturan di `agent-files.md`.
- Konvensi → `.pawang/context/coding-standards.html`; larangan → `## Jangan`; keputusan → `## Keputusan penting`.
- Jangan menulis/mengedit HTML state `.pawang/context|history` manual — selalu lewat `kit.js`. Pengecualian: `.pawang/prototype/` = artefak generated prototype-kit; `.pawang/figr/` = dokumen sumber Figr (Markdown) + prompt; `.pawang/figr/diagrams/` = viewer HTML generated `kit.js`.
- Prototype lane: ada Figr → DS Figr menang (`.pawang/prototype/kit.js` = runtime; `.pawang/kit.js` = state CLI, jangan ditimpa). Tanpa Figr → lane A (mockup HTML di folder prototypes).
- File di luar daftar `files` package.json tidak ikut terbit ke npm.

## Keputusan penting

- Dua kit.js dengan peran berbeda (A): `.pawang/kit.js` state CLI dan `.pawang/prototype/kit.js` runtime prototype-kit; jangan disatukan — 2026-10-17.
- Font-family dan font-size dasar mengikuti project; ukuran lain relatif (em) — 2026-10-17.
- Dua lapis: konvensi ke coding-standards.html, larangan/keputusan di AGENTS.md; docs/ hanya brownfield atau opt-in eksplisit user — 2026-10-17.
- Bahan skill dibaca dari `zip/`, bukan salinan luar repo; artefak tak dikenal → tanya user — 2026-10-17.
- `.pawang/figr/` = 4 dokumen Figr + prompt (Markdown, di-commit); folder `figr` di root proyek = output mentah Figr; jangan dicampur — 2026-10-17.
- Diagram HTML dirender lewat `kit.js render diagram` (Mermaid tetap sumber di Markdown; HTML generated) — 2026-10-17.
- Plan memakai `grilling` untuk keputusan bercabang satu sesi dan `wayfinder` untuk inisiatif besar lintas sesi; `grill-me` dihapus. Figr docs tetap memakai `grilling`; wayfinder tidak dipakai untuk 4 dokumen Figr — 2026-10-17.
- Wayfinder memakai GitHub Issues (`docs/agents/issue-tracker.md`) dan user-invoked; peta/tiket bukan build-plan. Build-plan + project-overview tetap ditulis ke `.pawang/` setelah peta selesai — 2026-10-17.
- `docs/agents/` (tracker + domain docs) adalah opt-in user; `GLOSSARY.md`/`docs/adr/` milik `domain-modeling` adalah brownfield companion, jangan disalin ke `.pawang/` — 2026-10-17.
- Companion dipasang terpisah di `.agents/skills/` (izin user, precheck, commit); Pawang core tidak membundel companion/script Python. Serapan prototype Figr = kontrak, script tetap companion — 2026-10-17.
- Pawang fleksibel terhadap agent/companion lain; bentrok aturan/ADR → tunjukkan dan tanya user. User pemilik keputusan dan boleh mengubah keputusan lama; catat perubahan — 2026-10-17.
- Rollback hanya membalik perilaku produk; catatan keputusan/ADR tidak dikembalikan otomatis. Rollback memakai guard `git apply --reverse --3way --index`, protected paths diperluas, dan item build-plan di-uncheck saat complete — 2026-10-17.
- File agent disatukan: `AGENTS.md` + `.agents/` kanonik; `CLAUDE.md`/`GEMINI.md` dan subdir `.claude` yang tumpang tindih di-symlink setelah migrasi; settings/hooks `.claude` tetap nyata. docs/conventions dan docs/adr opt-in untuk konvensi/ADR panjang — 2026-10-17.
- Guard prototype: `kit.js check` memvalidasi `references.design` dan `.pawang/prototype/.manifest.json` (manifest rusak = error, format lama/kosong = warning); companion lane B hilang = warning di `doctor`; cleanup `prototypes/` hanya di `complete`, `.pawang/prototype/` tidak pernah dihapus — 2026-10-17.
- Orkestrasi paralel: agent utama satu-satunya penulis state/git; worker read-only atau worktree-only; cap 3 read-only / 2 browser / 2 write; repair findings sequential. Implementasi paralel hanya jika `steps[].files` terisi, disjoint, tanpa migrasi/skema bersama — 2026-10-17.
- Batch lintas fitur: state sementara `batch.html` via kit.js; Gate 1 review spec batch (satu approval, bisa tolak per item); Gate 2 izin commit/merge batch; satu commit per fitur + satu merge batch; satu work item per worktree — 2026-10-17.
- `triage` tetap companion user-invoked; `.out-of-scope/` brownfield. Jangan pasang `to-spec`/`to-tickets`/`implement`/`implement-spec` sebagai companion — 2026-10-17.

## Arah (roadmap, model: `zip/my-app.zip`)

- Sudah setara: adopt, feature, implement, check, audit (+review), complete, fix-debug, rollback, brief-explore, status, doctor, tests, prototype, release, handoff, document.
- Sudah ditambah: penyatu file agent (`agent-files.md` + `link-agent-files.mjs`) — `AGENTS.md`/`.agents` kanonik, symlink setelah migrasi; `docs/conventions|adr` opt-in.
- Sudah diserap: plans (`writing-your-plans` → `skill/references/plans.md`, termasuk syarat grilling), dokumen Figr (`figr-prototype-consolidation` → `skill/references/figr-docs.md` + `skill/references/figr-prompt.md`), **kontrak** prototype Figr (`figr-to-prototype` + `prototype-kit` → `skill/references/prototype-figr.md`; script Python/aset tetap companion, tidak dibundel), review kode (`ai-code-comprehension` → `skill/references/review-code.md`; 12 lensa + tiga sumbu). Rollback hardening dari `my-app.zip` (guard git, protected paths, build-plan uncheck) sudah masuk `rollback.md`/`implement.md`/`complete.md`.
- Sudah ditambah: wayfinder sebagai companion plan inisiatif besar (GitHub Issues + `docs/agents/`); `grill-me` dihapus, `grilling` tetap.
- Sudah ditambah: orkestrasi paralel (`parallel.md`) dan batch lintas fitur (`orchestrate.md` + `batch.html`); TDD/spec durable/tracer-bullet masuk `feature.md`/`plans.md`/`implement.md`; `triage` tetap companion.
- Kandidat reference baru: `ci`, otomasi opt-in bounded.
- Gerbang tetap DUA (review spec, izin commit/merge); otomasi tidak boleh melonggarkan gerbang tanpa keputusan tertulis.

## Agent skills

### Issue tracker

GitHub Issues in `pawangai/pawang`; use `gh`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: `GLOSSARY.md` + `docs/adr/` at the root. See `docs/agents/domain.md`.

## Peta dokumen (baca hanya yang relevan dengan tugasmu)

- `skill/SKILL.md`: mulai di sini saat mengubah perilaku skill.
- `skill/references/workflow.md`: baca sebelum mengubah `kit.js`, skema JSON, tema, atau gerbang.
- `skill/references/agents-md.md`: konten produk (panduan AGENTS.md proyek user) — bukan panduan menyusun AGENTS.md repo ini.
- `skill/references/review-code.md`: review/baca kode (12 lensa, tiga sumbu, companion opt-in).
- `skill/references/parallel.md`: orkestrator dispatch dalam satu fitur (cap, brief hemat, guard worktree).
- `skill/references/orchestrate.md`: batch lintas fitur/tiket (`batch.html`, frontier, merge sequential, dua gerbang).
- `skill/references/agent-files.md`: satukan `AGENTS.md`/`.agents` dengan symlink `CLAUDE.md`/`GEMINI.md`/`.claude` setelah migrasi.
- `skill/references/advisor.md`: aturan memasang/membuat/menyerap skill.
- `skill/references/companions.md`: daftar companion, kapan perlu, cara pasang.
- `docs/agents/issue-tracker.md`: tracker GitHub + operasi wayfinder (map, tiket, blocking).
- `docs/agents/domain.md`: aturan konsumsi `GLOSSARY.md`/`docs/adr/` (single-context).
- `skill/references/figr-docs.md`: alur 4 dokumen Figr + aturan diagram.
- `skill/references/figr-prompt.md`: template prompt Figr Design (<1000 karakter).
- `.pawang/context/coding-standards.html`: konvensi repo (baca sebelum mengubah kode/dokumen).
- `.pawang/context/build-plan.html`: roadmap aktif; baca lewat `node .pawang/kit.js extract`.
- `evals/evals.json`: definisi prompt uji; hasil run ada di `pawang-workspace/`.
- `zip/e2e.zip` / `zip/my-app.zip`: rujukan bentuk skill / alur fase saat menambah konten baru.
