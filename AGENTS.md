# AGENTS.md

## Ringkasan

Pawang = SATU skill besar + CLI pemasang (`npx pawang init`). Struktur mengikuti pola `zip/e2e.zip`: `skill/SKILL.md` hanya peta routing; detail per topik di `skill/references/` (satu file per topik, mandiri, dibaca SATU per tugas). Visi: memperluas pawang meniru alur `zip/my-app.zip` (Blueprints) agar menjadi alur kerja agent lengkap: onboarding → rencana → loop feature → implement → check → audit → complete → otomasi.

## Cara kerja

- Dispatch subagent untuk pekerjaan independen paralel (pencarian luas, riset, review). Brief lengkap: tujuan, file, yang dikesampingkan, format hasil.
- Jangan dispatch untuk tugas kecil, langkah bergantung, atau file yang sama dengan agent lain.
- Verifikasi hasil subagent sebelum dipakai.

## Stack

- Node.js >= 18, ESM (`.mjs`), zero dependency — tanpa build, lint, typecheck.
- Test = selftest bawaan kit.js; tanpa framework.

## Repository layout

- `bin/cli.mjs` — CLI pemasang (`init`, `--project`, `--target`, `--force`).
- `skill/SKILL.md` — peta routing; hanya prinsip, tabel topik→reference, alur, kesalahan umum.
- `skill/references/<topik>.md` — detail, satu topik per file, mandiri (+ data: markers.json, layout-rules.json, gap-signals.md, spec-template.md, theme-variables.css).
- `skill/scripts/*.mjs` — deterministik, zero-dep, tanpa LLM.
- `skill/assets/kit.js` — generator/pembaca state `.pawang` (HTML); disalin ke `.pawang/kit.js` di proyek user.
- `assets/`, `README.md`, `LICENSE` — materi npm (lihat `files` package.json).
- `evals/` — definisi tes skill (tidak ikut npm).
- `pawang-workspace/` — snapshot/fixture/hasil eval (gitignored).
- `zip/` — KOTAK MASUK bahan skill, lokal (gitignored): skill/paket skill mentah ditaruh di sini sebelum diolah. Bahan dibaca DARI `zip/` (bukan salinan luar repo). Sekarang: `e2e.zip` (model struktur), `my-app.zip` (model alur Blueprints), `skills-package.zip` (sudah diserap), `writing-your-plans.skill`, `figr-to-prototype.skill`, `prototype-kit.skill` (menunggu).

## Commands

- Test: `npm test` (kit.js selftest + `bin/cli.mjs --version`)
- Cek terbit: `npm run pack:dry`
- Verify: `npm test && npm run pack:dry` (repo ini tanpa typecheck/build)

## Jangan (aturan keras)

- Tetap SATU skill: kemampuan baru = file di `skill/references/` + satu baris di tabel peta `SKILL.md`. Jangan pecah pawang jadi banyak skill.
- Membuat/menyerap/mengubah skill: WAJIB lewat alur `skill-creator` (draf → prompt uji dengan/tanpa → evaluasi → iterasi) + `node skill/scripts/skill-precheck.mjs <folder>`; hasil serapan = reference + baris peta, bukan skill baru.
- Bahan serapan dibaca dari `zip/`; jangan membaca salinan di luar repo.
- Dua lapis, bukan tiga: `AGENTS.md` + `.pawang/`. Jangan membuat/mengajarkan folder docs; folder docs lama hanya dideteksi & ditautkan (brownfield).
- Konvensi → `.pawang/context/coding-standards.html`; larangan → `## Jangan`; keputusan → `## Keputusan penting`.
- Jangan menulis/mengedit HTML state `.pawang/context|history` manual — selalu lewat `kit.js`. Pengecualian: `.pawang/prototype/` = artefak generated prototype-kit.
- Prototype lane: ada Figr → DS Figr menang (`.pawang/prototype/kit.js` = runtime; `.pawang/kit.js` = state CLI, jangan ditimpa). Tanpa Figr → lane A (mockup HTML di folder prototypes).
- File di luar daftar `files` package.json tidak ikut terbit ke npm.

## Keputusan penting

- Dua kit.js dengan peran berbeda (A): `.pawang/kit.js` state CLI dan `.pawang/prototype/kit.js` runtime prototype-kit; jangan disatukan — 2026-10-17.
- Font-family dan font-size dasar mengikuti project; ukuran lain relatif (em) — 2026-10-17.
- Dua lapis: konvensi ke coding-standards.html, larangan/keputusan di AGENTS.md; docs/ hanya brownfield — 2026-10-17.
- Bahan skill dibaca dari `zip/`, bukan salinan luar repo; artefak tak dikenal → tanya user — 2026-10-17.

## Arah (roadmap, model: `zip/my-app.zip`)

- Sudah setara: adopt, feature, implement, check, audit (+review), complete, fix-debug, rollback, brief-explore, status, doctor, tests, prototype, release, handoff, document.
- Kandidat reference baru: plans (`writing-your-plans`), prototype Figr (`figr-to-prototype` + `prototype-kit`), `ci`, otomasi opt-in bounded.
- Gerbang tetap DUA (review spec, izin commit/merge); otomasi tidak boleh melonggarkan gerbang tanpa keputusan tertulis.

## Peta dokumen (baca hanya yang relevan dengan tugasmu)

- `skill/SKILL.md`: mulai di sini saat mengubah perilaku skill.
- `skill/references/workflow.md`: baca sebelum mengubah `kit.js`, skema JSON, tema, atau gerbang.
- `skill/references/agents-md.md`: konten produk (panduan AGENTS.md proyek user) — bukan panduan menyusun AGENTS.md repo ini.
- `skill/references/advisor.md`: aturan memasang/membuat/menyerap skill.
- `.pawang/context/coding-standards.html`: konvensi repo (baca sebelum mengubah kode/dokumen).
- `.pawang/context/build-plan.html`: roadmap aktif; baca lewat `node .pawang/kit.js extract`.
- `evals/evals.json`: definisi prompt uji; hasil run ada di `pawang-workspace/`.
- `zip/e2e.zip` / `zip/my-app.zip`: rujukan bentuk skill / alur fase saat menambah konten baru.
