# AGENTS.md

## Ringkasan

Pawang = SATU skill besar + CLI pemasang (`npx pawang init`). Struktur mengikuti pola `zip/e2e.zip`: `skills/pawang/SKILL.md` hanya peta routing; detail per topik di `skills/pawang/references/` (satu file per topik, mandiri, dibaca SATU per tugas). Visi: memperluas pawang meniru alur `zip/my-app.zip` (Blueprints) agar menjadi alur kerja agent lengkap: onboarding → rencana → loop feature → implement → check → audit → complete → otomasi.

## Cara kerja

- Agent utama = orkestrator: satu-satunya penulis `.pawang/`, history, build-plan, dan git.
- Dispatch subagent untuk pekerjaan independen paralel (cek, audit, eksplorasi, step disjoint). Brief pointer + hemat token: tujuan, klaim/step, file, yang dikesampingkan, format hasil <150 kata.
- Cap: 3 read-only, 2 browser, 2 write. Perbaikan findings selalu sequential; step dependen/file sama sequential.
- Jangan dispatch untuk tugas kecil; verifikasi hasil subagent sebelum dipakai.

## Stack

- Node.js >= 18, ESM (`.mjs`), zero dependency — tanpa build, lint, typecheck.
- Test = selftest bawaan kit.js; tanpa framework.

## Repository layout

- `bin/cli.mjs` — CLI pemasang (`init`, `--project`, `--target`, `--force`) + companion (`list`, `info`, `add`).
- `skills/pawang/` — core Pawang (SKILL.md, references, scripts, assets, companions.json); ikut npm dan disalin `npx pawang init`.
- `skills/pawang/SKILL.md` — peta routing; hanya prinsip, tabel topik→reference, alur, kesalahan umum.
- `skills/pawang/references/<topik>.md` — detail, satu topik per file, mandiri (+ data: markers.json, layout-rules.json, gap-signals.md, spec-template.md, theme-variables.css). Orkestrasi: `parallel.md` (dalam satu fitur) dan `orchestrate.md` (batch lintas fitur).
- `skills/<nama>/` — sumber empat companion (`figr-to-prototype`, `prototype-kit`, `cicd-worker`, `cicd-worker-audit`); tidak ikut npm; dipasang via `npx skills add pawangai/pawang --skill <nama>`.
- `skills/pawang/companions.json` — metadata CLI `pawang companion list|info|add`.
- `skills/pawang/scripts/*.mjs` — deterministik, zero-dep, tanpa LLM.
- `skills/pawang/assets/kit.js` — generator/pembaca state `.pawang` (HTML); disalin ke `.pawang/kit.js` di proyek user.
- `skills/pawang/references/lite.md` — mode lite untuk surface tanpa shell/Node/git/repo; output artifact, tanpa `.pawang/`.
- `plugins/pawang/` + `plugins/<companion>/` — bundle plugin generated dari `skills/pawang` dan empat companion repo (`.claude-plugin/plugin.json`, `plugin.json`, README, LICENSE, salinan skill); di-commit, tidak ikut npm.
- `.claude-plugin/marketplace.json` + `.agents/plugins/marketplace.json` — katalog plugin (Claude/ChatGPT/Codex); generated oleh `scripts/sync-plugin.mjs`.
- `scripts/sync-plugin.mjs`, `check-plugin.mjs`, `pack-plugin.mjs` — generate/validasi/zip bundle plugin + lite + arsip `.skill`.
- `.github/workflows/verify.yml` — `npm test` + `plugin:pack` + `pack:dry` + artifact ZIP/`.skill`; `release.yml` — tag `v*` melampirkan ZIP/`.skill` ke GitHub Releases.
- `dist/` — ZIP plugin/lite + arsip `.skill` (gitignored).
- `assets/`, `README.md`, `LICENSE` — materi npm (lihat `files` package.json).
- `.agents/skills/` — companion terpasang (proyek): `wayfinder` + `grilling` + `domain-modeling` + `research` + `prototype` + `setup-matt-pocock-skills` (mattpocock/skills), `figr-to-prototype`, dan `prototype-kit`; bukan skill baru Pawang. Daftar companion alur ada di `skills/pawang/references/companions.md`; companion review kode opsional diatur di `skills/pawang/references/review-code.md`.
- Alat advisor global (bukan companion alur): `find-skills` + `skill-creator`; `skill-inspector` belum terpasang. Jangan duplikasi di project.
- `evals/` — definisi tes skill (tidak ikut npm).
- `pawang-workspace/` — snapshot/fixture/hasil eval (gitignored).
- `zip/` — KOTAK MASUK bahan skill, lokal (gitignored): skill/paket skill mentah ditaruh di sini sebelum diolah. Bahan dibaca DARI `zip/` (bukan salinan luar repo). Sekarang: `e2e.zip` (model struktur), `my-app.zip` (model alur Blueprints), `skills-package.zip` (sudah diserap), `writing-your-plans.skill`, `figr-to-prototype.skill`, `prototype-kit.skill`, `figr-prototype-consolidation.skill` (keempatnya sudah diserap sebagai reference/kontrak; tetap sumber + companion), `cicd-worker.skill` + `cicd-worker-audit.skill` (bahan companion Cloudflare; detail tidak diserap ke core). Salinan publik empat companion aktif (Figr + CICD) ada di `skills/`. Bukan sumber distribusi; yang dirilis hanya hasil olahan di `skills/`.

## Commands

- Test: `npm test` (kit.js selftest + `link-agent-files.mjs --selftest` + `bin/cli.mjs --version` + `bin/cli.mjs companion list` + `scripts/check-plugin.mjs`)
- Plugin: `npm run plugin:sync` (generate bundle + katalog), `npm run plugin:check`, `npm run plugin:pack` (ZIP full + lite)
- Cek terbit: `npm run pack:dry`
- Verify: `npm test && npm run plugin:pack && npm run pack:dry` (repo ini tanpa typecheck/build)

## Jangan (aturan keras)

- Tetap SATU skill: kemampuan baru = file di `skills/pawang/references/` + satu baris di tabel peta `SKILL.md`. Jangan pecah pawang jadi banyak skill.
- Membuat/menyerap/mengubah skill: WAJIB lewat alur `skill-creator` (draf → prompt uji dengan/tanpa → evaluasi → iterasi) + `node skills/pawang/scripts/skill-precheck.mjs <folder>`; hasil serapan = reference + baris peta, bukan skill baru.
- Bahan serapan dibaca dari `zip/`; jangan membaca salinan di luar repo.
- Jangan mempublikasikan arsip mentah `zip/`; audit provenance/lisensi sebelum merilis companion.
- Wayfinder: peta/tiket keputusan di GitHub Issues; build-plan baru ditulis setelah peta selesai; jangan menyalin peta/tiket ke `.pawang/`.
- Dua lapis secara default: `AGENTS.md` + `.pawang/`. Pawang tidak membuat docs/ sendiri; docs/ yang sudah ada (termasuk subfolder agents, conventions, adr hasil opt-in user) = brownfield, dideteksi & ditautkan, tidak dipindah/disalin. docs/ baru hanya atas keputusan eksplisit user.
- File agent: `AGENTS.md` + `.agents/` kanonik; `CLAUDE.md`/`GEMINI.md` dan subfolder `.claude` yang tumpang tindih di-symlink setelah migrasi. Jangan symlink seluruh `.claude` bila ada settings/hooks; aturan di `agent-files.md`.
- Konvensi → `.pawang/context/coding-standards.html`; larangan → `## Jangan`; keputusan → `## Keputusan penting`.
- Jangan menulis/mengedit HTML state `.pawang/context|history` manual — selalu lewat `kit.js`. Pengecualian: `.pawang/prototype/` = artefak generated prototype-kit; `.pawang/figr/` = dokumen sumber Figr (Markdown) + prompt; `.pawang/figr/diagrams/` = viewer HTML generated `kit.js`.
- Prototype lane: ada Figr → DS Figr menang (`.pawang/prototype/kit.js` = runtime; `.pawang/kit.js` = state CLI, jangan ditimpa). Tanpa Figr → lane A (mockup HTML di folder prototypes).
- File di luar daftar `files` package.json tidak ikut terbit ke npm.
- Jangan mengedit `plugins/<nama>/` atau katalog marketplace manual; ubah `skills/` lalu `npm run plugin:sync`. `dist/` tidak di-commit.

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
- Plugin marketplace: bundle core `pawang` + empat companion repo sebagai plugin terpisah di `plugins/<nama>` (generated, di-commit); companion pihak ketiga tidak didistribusikan ulang. Lite = artifact upload (`dist/pawang-lite.zip`), bukan plugin terpisah; nama skill core tetap `pawang` — 2026-10-17.
- Katalog plugin ada di `.claude-plugin/marketplace.json` (Claude/ChatGPT) dan `.agents/plugins/marketplace.json` (Codex); `plugin:sync` satu-satunya penulis bundle/katalog — 2026-10-17.
- Pawang fleksibel terhadap agent/companion lain; bentrok aturan/ADR → tunjukkan dan tanya user. User pemilik keputusan dan boleh mengubah keputusan lama; catat perubahan — 2026-10-17.
- Rollback hanya membalik perilaku produk; catatan keputusan/ADR tidak dikembalikan otomatis. Rollback memakai guard `git apply --reverse --3way --index`, protected paths diperluas, dan item build-plan di-uncheck saat complete — 2026-10-17.
- File agent disatukan: `AGENTS.md` + `.agents/` kanonik; `CLAUDE.md`/`GEMINI.md` dan subdir `.claude` yang tumpang tindih di-symlink setelah migrasi; settings/hooks `.claude` tetap nyata. docs/conventions dan docs/adr opt-in untuk konvensi/ADR panjang — 2026-10-17.
- Guard prototype: `kit.js check` memvalidasi `references.design` dan `.pawang/prototype/.manifest.json` (manifest rusak = error, format lama/kosong = warning); companion lane B hilang = warning di `doctor`; cleanup `prototypes/` hanya di `complete`, `.pawang/prototype/` tidak pernah dihapus — 2026-10-17.
- Orkestrasi paralel: agent utama satu-satunya penulis state/git; worker read-only atau worktree-only; cap 3 read-only / 2 browser / 2 write; repair findings sequential. Implementasi paralel hanya jika `steps[].files` terisi, disjoint, tanpa migrasi/skema bersama — 2026-10-17.
- Batch lintas fitur: state sementara `batch.html` via kit.js; Gate 1 review spec batch (satu approval, bisa tolak per item); Gate 2 izin commit/merge batch; satu commit per fitur + satu merge batch; satu work item per worktree — 2026-10-17.
- `triage` tetap companion user-invoked; `.out-of-scope/` brownfield. Jangan pasang `to-spec`/`to-tickets`/`implement`/`implement-spec` sebagai companion — 2026-10-17.
- CI/CD core generik & local-first (`ci.md`/`ci-audit.md`); detail Cloudflare Workers (wrangler preview, binding, Workers Builds, template/script) tetap companion, bukan bundel core. Preview tidak dianggap aman tanpa isolasi per binding — 2026-10-17.
- Companion Figr/CICD tinggal di repo yang sama di `skills/`, distribusi via plugin terpisah (`plugins/<nama>`) atau `npx skills add pawangai/pawang --skill <nama>`, bukan npm. `--all` dilarang karena ikut memasang core `pawang` dan, tergantung source, `.agents/skills/` pengembangan — 2026-10-17.
- Satu folder sumber `skills/`: `skills/pawang/` = core (ikut npm), `skills/<nama>/` = companion (tidak ikut npm). `package.json files` hanya membawa `skills/pawang` — 2026-10-17.

## Arah (roadmap, model: `zip/my-app.zip`)

- Sudah setara: adopt, feature, implement, check, audit (+review), complete, fix-debug, rollback, brief-explore, status, doctor, tests, ci (+audit), prototype, release, handoff, document.
- Sudah ditambah: penyatu file agent (`agent-files.md` + `link-agent-files.mjs`) — `AGENTS.md`/`.agents` kanonik, symlink setelah migrasi; `docs/conventions|adr` opt-in.
- Sudah diserap: plans (`writing-your-plans` → `skills/pawang/references/plans.md`, termasuk syarat grilling), dokumen Figr (`figr-prototype-consolidation` → `skills/pawang/references/figr-docs.md` + `skills/pawang/references/figr-prompt.md`), **kontrak** prototype Figr (`figr-to-prototype` + `prototype-kit` → `skills/pawang/references/prototype-figr.md`; script Python/aset tetap companion, tidak dibundel), review kode (`ai-code-comprehension` → `skills/pawang/references/review-code.md`; 12 lensa + tiga sumbu). Rollback hardening dari `my-app.zip` (guard git, protected paths, build-plan uncheck) sudah masuk `rollback.md`/`implement.md`/`complete.md`.
- Sudah ditambah: wayfinder sebagai companion plan inisiatif besar (GitHub Issues + `docs/agents/`); `grill-me` dihapus, `grilling` tetap.
- Sudah ditambah: orkestrasi paralel (`parallel.md`) dan batch lintas fitur (`orchestrate.md` + `batch.html`); TDD/spec durable/tracer-bullet masuk `feature.md`/`plans.md`/`implement.md`; `triage` tetap companion.
- Sudah ditambah: `ci.md` (pipeline generik local-first) + `ci-audit.md` (audit CI/CD read-only); detail Cloudflare Workers tetap companion (`cicd-worker`/`cicd-worker-audit`). Kandidat berikutnya: otomasi opt-in bounded.
- Sudah ditambah: plugin marketplace core + empat companion repo (`plugins/<nama>` + dua katalog), mode lite (`references/lite.md` + `dist/pawang-lite.zip`), dan workflow verify/release untuk ZIP plugin.
- Gerbang tetap DUA (review spec, izin commit/merge); otomasi tidak boleh melonggarkan gerbang tanpa keputusan tertulis.

## Agent skills

### Issue tracker

GitHub Issues in `pawangai/pawang`; use `gh`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: `GLOSSARY.md` + `docs/adr/` at the root. See `docs/agents/domain.md`.

## Peta dokumen (baca hanya yang relevan dengan tugasmu)

- `skills/pawang/SKILL.md`: mulai di sini saat mengubah perilaku skill.
- `skills/pawang/references/workflow.md`: baca sebelum mengubah `kit.js`, skema JSON, tema, atau gerbang.
- `skills/pawang/references/lite.md`: mode lite untuk surface tanpa shell/Node/git/repo.
- `skills/pawang/references/agents-md.md`: konten produk (panduan AGENTS.md proyek user) — bukan panduan menyusun AGENTS.md repo ini.
- `skills/pawang/references/review-code.md`: review/baca kode (12 lensa, tiga sumbu, companion opt-in).
- `skills/pawang/references/parallel.md`: orkestrator dispatch dalam satu fitur (cap, brief hemat, guard worktree).
- `skills/pawang/references/orchestrate.md`: batch lintas fitur/tiket (`batch.html`, frontier, merge sequential, dua gerbang).
- `skills/pawang/references/agent-files.md`: satukan `AGENTS.md`/`.agents` dengan symlink `CLAUDE.md`/`GEMINI.md`/`.claude` setelah migrasi.
- `skills/pawang/references/advisor.md`: aturan memasang/membuat/menyerap skill.
- `skills/pawang/references/companions.md`: daftar companion, kapan perlu, cara pasang (termasuk surface plugin).
- `scripts/sync-plugin.mjs` / `check-plugin.mjs` / `pack-plugin.mjs`: generate/validasi/zip bundle plugin dan lite.
- `skills/README.md`: sumber empat companion + peringatan `--skill`/`--all`.
- `skills/pawang/references/ci.md`: pasang/rawat pipeline CI, hook, ruleset, preview/deploy (local-first).
- `skills/pawang/references/ci-audit.md`: audit CI/CD read-only (drift, isolasi preview, findings).
- `docs/agents/issue-tracker.md`: tracker GitHub + operasi wayfinder (map, tiket, blocking).
- `docs/agents/domain.md`: aturan konsumsi `GLOSSARY.md`/`docs/adr/` (single-context).
- `skills/pawang/references/figr-docs.md`: alur 4 dokumen Figr + aturan diagram.
- `skills/pawang/references/figr-prompt.md`: template prompt Figr Design (<1000 karakter).
- `.pawang/context/coding-standards.html`: konvensi repo (baca sebelum mengubah kode/dokumen).
- `.pawang/context/build-plan.html`: roadmap aktif; baca lewat `node .pawang/kit.js extract`.
- `evals/evals.json`: definisi prompt uji; hasil run ada di `pawang-workspace/`.
- `zip/e2e.zip` / `zip/my-app.zip`: rujukan bentuk skill / alur fase saat menambah konten baru.
