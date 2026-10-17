![Pawang](https://raw.githubusercontent.com/pawangai/pawang/main/assets/pawang-banner.png)

# 🧙‍♂️ Pawang

> **"Sekali perintah, maka terjadilah."**
> _Lightning-fast Autonomous Agent Workflow Engine._

---

[![Status](https://img.shields.io/badge/Status-Active-success.svg)](#)
[![verify](https://github.com/pawangai/pawang/actions/workflows/verify.yml/badge.svg)](https://github.com/pawangai/pawang/actions/workflows/verify.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/pawang.svg)](https://www.npmjs.com/package/pawang)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)
[![Contributing](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Security](https://img.shields.io/badge/security-policy-blue.svg)](SECURITY.md)
[![Discussions](https://img.shields.io/github/discussions/pawangai/pawang)](https://github.com/pawangai/pawang/discussions)

**Pawang** adalah _skill & workflow engine_ untuk AI Agent yang dirancang khusus untuk mengendalikan, mengarahkan, dan menyelesaikan rangkaian tugas secara terautomasi dengan kecepatan penuh dan presisi tinggi.

### ✨ Fitur Utama

- ⚡ **Eksekusi Instan:** Memproses setiap instruksi alur kerja seketika begitu perintah diberikan.
- 🧙 **Pengendali Alur Cerdas:** Mengatur koordinasi tugas agent dari awal hingga tuntas dalam satu genggaman.
- ⚙️ **Arsitektur Tangguh:** Desain sistem yang fleksibel, cepat, dan siap diandalkan untuk berbagai skala kebutuhan.
- 🛡️ **Otonom dengan dua gerbang:** Setelah spec disetujui, agent berjalan sendiri (implement → check → audit → perbaikan). Manusia hanya hadir saat review spec dan saat izin commit/merge.
- ⚡ **Paralel dengan orkestrator:** Agent utama memegang state dan git; worker read-only mengecek UI/API/CLI/audit secara bersamaan. Cap 3 read-only / 2 browser / 2 write, brief hemat token, agregasi satu laporan. Perbaikan findings tetap sequential.
- 🧩 **Batch lintas fitur:** `batch.html` mengatur beberapa fitur/tiket dengan `blockedBy`, frontier, worktree, dan merge sequential. Gate 1 review spec batch; Gate 2 izin commit/merge batch; satu commit per fitur + satu merge batch.
- 🎨 **Menyatu dengan tema project:** Laporan HTML pawang mengikuti token desain repo (font, warna, radius, ukuran dasar) dari DS Figr `prototype/packages/shared/ui`, `prototypes/`, `packages/design-system/`, folder `figr/`, CSS `@theme`, atau tailwind config. Scaffold baru memakai tema bawaan sampai token project tersedia.
- 📐 **Dokumen Figr + diagram:** grill → 4 dokumen (PRD, flow, desain, edge case) di `.pawang/figr/` → prompt Figr Design <1000 karakter. Diagram tetap Mermaid; viewer HTML dirender lewat `kit.js`.
- 🧭 **Wayfinder untuk inisiatif besar:** peta tujuan + tiket keputusan lintas sesi di GitHub Issues, satu tiket per sesi; setelah peta selesai, hasilnya menjadi build-plan + project-overview di `.pawang/`.
- 🔍 **Review kode 12 lensa (pilih 3-6):** pahami/nilai kode AI, diff, atau PR dengan tiga sumbu (Standards, Spec, Comprehension); companion `code-review` opsional.
- 🔗 **File agent rapi:** `AGENTS.md` + `.agents/` jadi sumber kanonik; `CLAUDE.md`, `GEMINI.md`, dan subfolder `.claude` di-symlink setelah isi unik dimigrasikan. Settings/hooks `.claude` tetap nyata.
- 🚦 **CI/CD local-first:** satu `Verify`, workflow PR + branch default, hook pre-push opt-in, ruleset sebagai gerbang remote terpisah, dan audit CI read-only. Detail Cloudflare Workers tetap companion.

---

## 📦 Instalasi

```bash
npx pawang init              # opencode (default: ~/.config/opencode/skills/pawang)
bunx pawang init             # bun
pnpx pawang init             # pnpm (resmi: pnpm dlx pawang init)
yarn dlx pawang init         # yarn

npx pawang init --project    # per proyek: ./.agents/skills/pawang (ikut repo, cocok untuk tim)
npx pawang init --target ~/.claude/skills   # target bebas
npx pawang init --force      # perbarui ke versi terbaru
```

Setelah terpasang, buka sesi agent di proyek lalu minta: **"pawang, adopsi proyek ini"**.

### 🔌 Plugin marketplace

Repo ini juga menyediakan katalog plugin untuk Claude, ChatGPT/Codex, dan impor manual Perplexity. Core tetap satu skill; companion tidak dibundel. Plugin menjalankan instruksi dan script di mesin lokal: review isi plugin sebelum install, terutama companion yang memakai Python/Node/gh.

```bash
# Claude Code
/plugin marketplace add pawangai/pawang
/plugin install pawang@pawang

# ChatGPT / Codex
codex plugin marketplace add pawangai/pawang

# Gemini CLI
gemini skills install https://github.com/pawangai/pawang.git \
  --path skills/pawang --scope workspace --consent

# Antigravity: salin/tautkan skills/pawang ke .agents/skills/pawang
```

claude.ai/Cowork: Customize > Plugins > Upload plugin (`dist/pawang-plugin.zip`). ChatGPT: directory setelah review, atau workspace admin import marketplace. Perplexity: import folder `plugins/pawang` dari GitHub. Gemini app dan surface chat lain memakai `pawang-lite.zip` (lihat `npm run plugin:pack`).

| Surface                                                                    | Mode | Catatan                                                                         |
| -------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------- |
| Claude Code, Cowork, ChatGPT Work/Codex, Gemini CLI, Antigravity, opencode | Full | Butuh shell, Node, git, dan repo yang bisa ditulis                              |
| claude.ai Chat, ChatGPT Chat, Gemini app, Perplexity chat                  | Lite | Plan, spec, review, audit sebagai artifact; tanpa `.pawang/`, test, atau commit |

Bundle plugin dibuat dari `skills/pawang`:

```bash
npm run plugin:sync    # plugin + katalog + bundle lite
npm run plugin:check   # validasi sinkronisasi/versi/batas
npm run plugin:pack    # ZIP semua plugin + lite + arsip .skill
```

ZIP dan `.skill` rilis dilampirkan ke GitHub Releases saat tag `v*` dibuat.

### 🧩 Companion (opsional, dipasang terpisah)

Pawang core tidak membundel companion. Empat companion Figr/CICD tinggal di repo yang sama (`skills/`), tersedia sebagai plugin terpisah, dan juga bisa dipasang dari GitHub; sisanya dari sumber masing-masing. Pasang di `.agents/skills/` dengan izin user; detail, nama folder, dan precheck ada di `skills/pawang/references/companions.md`.

```bash
/plugin install figr-to-prototype@pawang
/plugin install prototype-kit@pawang
/plugin install cicd-worker@pawang
/plugin install cicd-worker-audit@pawang
```

Plugin companion hanya untuk surface full (butuh Python/Node/gh/wrangler). Di chat web/lite, companion tidak tersedia.

| Companion                                    | Invoke                          | Kapan perlu                             | Pasang                                                                                    |
| -------------------------------------------- | ------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------- |
| `grilling`                                   | model                           | Dokumen Figr / plan A2 (satu sesi)      | `npx skills add mattpocock/skills --skill grilling -a opencode`                           |
| `wayfinder` + `grilling` + `domain-modeling` | user (wayfinder); model lainnya | Plan A3: inisiatif besar lintas sesi    | `npx skills add mattpocock/skills --skill wayfinder grilling domain-modeling -a opencode` |
| `research` + `prototype`                     | model                           | Tiket wayfinder tipe research/prototype | `npx skills add mattpocock/skills --skill research prototype -a opencode`                 |
| `setup-matt-pocock-skills`                   | user                            | Setup GitHub Issues + `docs/agents/`    | `npx skills add mattpocock/skills --skill setup-matt-pocock-skills -a opencode`           |
| `triage`                                     | user                            | Intake issue/PR + agent brief           | `npx skills add mattpocock/skills --skill triage -a opencode` (butuh setup)               |
| `code-review`                                | model                           | Review diff/PR dua sumbu                | `npx skills add mattpocock/skills --skill code-review -a opencode`                        |
| `figr-to-prototype`                          | model                           | Lane B hulu (proyek punya `figr/`)      | `npx skills add pawangai/pawang --skill figr-to-prototype -a opencode`                    |
| `prototype-kit`                              | model                           | Lane B hilir (HTML statis)              | `npx skills add pawangai/pawang --skill prototype-kit -a opencode`                        |
| `cicd-worker`                                | model                           | CI/CD Cloudflare Workers                | `npx skills add pawangai/pawang --skill cicd-worker -a opencode`                          |
| `cicd-worker-audit`                          | model                           | Audit CI/CD Cloudflare Workers          | `npx skills add pawangai/pawang --skill cicd-worker-audit -a opencode`                    |

`wayfinder`, `setup-matt-pocock-skills`, dan `triage` **user-invoked** (`disable-model-invocation`): Pawang akan meminta kamu memicunya. Sisanya **model-invoked**: model boleh memilihnya saat konteks cocok. Peta/tiket wayfinder ada di GitHub Issues dan `docs/agents/` (opt-in), bukan di `.pawang/`; build-plan + project-overview tetap ditulis ke `.pawang/` setelah peta selesai. `grill-me` sudah dihapus.

CLI companion:

```bash
pawang companion list
pawang companion info <nama>
pawang companion add <nama> --run
```

Jangan memakai `npx skills add pawangai/pawang --all`: `--all` memasang semua skill yang terdeteksi, termasuk core `pawang` (dan pada source tertentu `.agents/skills/` pengembangan). Selalu pakai `--skill` eksplisit.

Jangan pasang `to-spec`, `to-tickets`, `implement`, atau `implement-spec` sebagai companion: konsepnya sudah ada di `feature.md`, `plans.md`, `implement.md`, `parallel.md`, dan `orchestrate.md`.

`figr-to-prototype` dan `prototype-kit` bukan hasil serapan penuh: kontraknya sudah ada di `skills/pawang/references/prototype-figr.md`, tetapi script Python/asetnya tetap companion.

**Alat advisor (opsional, bukan syarat alur):**

| Alat              | Peran                     | Status          |
| ----------------- | ------------------------- | --------------- |
| `find-skills`     | Cari skill dari skills.sh | sudah global    |
| `skill-creator`   | Buat/uji/iterasi skill    | sudah global    |
| `skill-inspector` | Audit skill pihak ketiga  | belum terpasang |

Cara pasang dan aturan precheck ada di `skills/pawang/references/companions.md`; jangan menduplikasi skill yang sudah global.

---

## 🚀 Alur Pemakaian

**Sekali per proyek (setup):**

1. Agent memindai proyek (`adopt`), menulis `AGENTS.md` ramping, dan menata struktur bila perlu.
2. Agent menyalin `kit.js` ke `.pawang/kit.js` lalu menjalankan:

```bash
node .pawang/kit.js init      # scaffold .pawang/ (context, reference, history, config, tema)
node .pawang/kit.js status    # orientasi kapan saja (murah, tanpa membaca banyak file)
```

3. Isi `build-plan.html` (daftar fitur) dan `project-overview.html` bersama user lewat `references/plans.md` (wawancara/Figr, persetujuan user, render via kit.js).

**Siklus per fitur:**

```
(brief) → (prototype | prototype-figr) → feature → implement → check → audit → complete
                            ↑                                │
                            └──────── perbaikan findings ────┘
```

| Tahap   | Pemicu alami                | Yang terjadi                                                                                 |
| ------- | --------------------------- | -------------------------------------------------------------------------------------------- |
| Rencana | "kerjakan fitur 3"          | Spec ditulis ke `current-feature.html` (langkah + done-when), lalu **berhenti untuk review** |
| Bangun  | (setelah spec disetujui)    | Branch dibuat, step dikerjakan, progress dicentang — berjalan otonom                         |
| Periksa | otonom                      | Perilaku dibuktikan vs done-when; walkthrough manual tersedia bila diminta                   |
| Audit   | otonom                      | Findings (F-01, P0-P3) ke `findings.html`, review independen ke `review.html`                |
| Selesai | otonom, lalu **minta izin** | Gate akhir, arsip ke `history/`, commit, landing lokal                                       |

**Paralel dan batch (tanpa perintah baru):**

- `pawang, cek fitur ini` — orkestrator memecah klaim independen dan men-dispatch worker read-only (cap 3 read-only / 2 browser). Satu laporan agregat; perbaikan findings sequential.
- `pawang, audit current` — lensa `quality`/`security`/`performance`/`tests` paralel; parent menulis findings sekali.
- `pawang, jalankan batch fitur 1-3` — `orchestrate.md` menyusun `batch.html` + DAG, berhenti di **Gate 1 batch**, lalu worker worktree + merge sequential. **Gate 2** meminta izin commit/merge batch; satu commit per fitur + satu merge batch.
- Implementasi paralel hanya jika `steps[].files` terisi, disjoint, dan tanpa migrasi/skema bersama. Selain itu sequential.

**Kapan saja:** `status` (arah kerja), `doctor` (diagnosa), `review kode` (baca/nilai kode AI, diff, PR), `file agent` (satukan AGENTS.md/.agents dengan symlink), `ci` (pasang/rawat pipeline), `audit ci` (audit CI/CD read-only), `prototype` (mockup dulu), `rollback` (batalkan fitur), `release` (persiapan rilis), `document` (spesifikasi dari dokumen contoh), `handoff` (catatan lanjut sesi).

### 🛡️ Gerbang Persetujuan

Hanya dua titik henti manusia:

1. **Review spec** — setelah `feature`/`fix`/`rollback` menulis `current-feature.html`, agent berhenti menunggu persetujuan. Untuk batch, satu approval untuk semua spec + DAG (bisa tolak per item).
2. **Commit & merge** — di `complete`, agent minta izin sebelum commit dan landing. Untuk batch, satu izin untuk commit/merge batch (satu commit per fitur + satu merge batch).

Selebihnya otonom: implement → check → audit → perbaikan findings → re-audit berjalan sendiri mengikuti `AGENTS.md`. Agent hanya berhenti di luar gerbang itu jika macet (batas `maxRepairAttempts`), butuh keputusan produk, atau keluar scope.

```bash
node .pawang/kit.js render current-feature <<'JSON'   # JSON → HTML (agent tidak menulis HTML mentah)
{ "type": "feature", "title": "Export laporan", "status": "ready", ... }
JSON
node .pawang/kit.js extract .pawang/context/findings.html   # HTML → JSON
```

Prinsip: **progressive disclosure** — `SKILL.md` hanya peta; agent membaca satu reference sesuai tugas, tidak pernah semuanya. State juga dibaca berlapis: `status` dulu, `extract` hanya yang perlu.

---

## 📂 Struktur Folder

**1. Skill core (sumber `skills/pawang/`, dipasang sebagai `pawang/`):**

```
pawang/
├── SKILL.md                  # peta topik + prinsip + kontrak .pawang/kit.js
├── companions.json           # metadata CLI `pawang companion`
├── references/
│   ├── workflow.md           # dasar: loop, config, skema JSON, aturan dua lapis
│   ├── feature.md implement.md check.md audit.md complete.md   # siklus inti
│   ├── status.md fix-debug.md prototype.md prototype-figr.md tests.md rollback.md
│   ├── plans.md figr-docs.md figr-prompt.md brief-explore.md ci.md ci-audit.md release.md doctor.md
│   ├── adopt.md agents-md.md layout.md advisor.md companions.md handoff.md document.md review-code.md agent-files.md
│   ├── parallel.md           # orkestrator dispatch dalam satu fitur
│   ├── orchestrate.md        # batch lintas fitur/tiket + batch.html
│   └── markers.json layout-rules.json gap-signals.md spec-template.md theme-variables.css
├── scripts/                  # deterministik & zero-dependency
│   ├── scan.mjs check-layout.mjs probe.mjs compare-text.mjs link-agent-files.mjs
│   └── harden-permissions.mjs skill-precheck.mjs docs-health.mjs
└── assets/
    └── kit.js                # disalin ke .pawang/kit.js tiap proyek
```

Repo sumber berisi `skills/pawang/` (core, ikut npm), `skills/<nama>/` (empat companion; tidak ikut npm), `skills/pawang/companions.json` (metadata CLI `pawang companion`), dan `plugins/<nama>/` (bundle plugin generated core + companion; tidak ikut npm). Pasang companion lewat `/plugin install <nama>@pawang`, `npx skills add`, atau `pawang companion add`.

**2. State proyek (`.pawang/`, dibuat `kit.js init`):**

```
.pawang/
├── kit.js                    # generator & pembaca HTML (JSON embedded)
├── config.json               # prefix branch, landing, review, batas perbaikan
├── theme.json                # snapshot token tampilan project (dikelola kit.js)
├── context/                  # state kerja aktif
│   ├── project-overview.html  build-plan.html  current-feature.html
│   ├── batch.html  findings.html  review.html  handoff.html  coding-standards.html
├── figr/                     # 4 dokumen Figr + prompt (Markdown, di-commit); diagrams/ generated
├── reference/                # rujukan dokumen per jenis (invoice/, kontrak/, ...)
│   └── <jenis>/              # file mentah (gitignored) + spesifikasi.html + _work/
├── prototype/                # HTML statis prototype-kit (lane B; di-commit, runtime kit.js sendiri)
└── history/
    ├── features/  fixes/  rollbacks/
```

**3. Aturan dua lapis:**

| Lokasi      | Isi                                                                                                         | Ditulis kapan     |
| ----------- | ----------------------------------------------------------------------------------------------------------- | ----------------- |
| `AGENTS.md` | peta + Commands/Verify + `## Jangan` + `## Keputusan penting` + pemicu tautan                               | setup/maintenance |
| `.pawang/`  | state kerja (`context/` + `coding-standards.html`), prototype, rujukan (`reference/`), riwayat (`history/`) | sepanjang siklus  |

Anti-duplikasi berlaku: spec aktif, findings, review, handoff, dan riwayat hanya ada di `.pawang/`; konvensi hanya di `.pawang/context/coding-standards.html`; larangan dan keputusan permanen hanya di `AGENTS.md`. `docs/` tidak dibuat secara default — proyek lama (brownfield) atau setup companion pilihan user dideteksi lalu ditautkan, tidak dipindah; `docs/` baru hanya atas keputusan eksplisit user.

### 🎨 Prototype

Ada dua lane; pilih satu sesuai kondisi proyek:

- **Lane A (tanpa Figr):** mockup statis di `prototypes/` + satu `prototypes/theme.css` (template token: `references/theme-variables.css`). Lihat `references/prototype.md`.
- **Lane B (ada Figr/DS):** `.pawang/figr/` (4 dokumen) → `references/figr-prompt.md` → Figr Design → `figr/` → companion `figr-to-prototype` → `prototype/` (React + DS di `prototype/packages/shared/ui`) → companion `prototype-kit` → `.pawang/prototype/` (HTML statis, di-commit). Lihat `references/prototype-figr.md`.

Bila `figr/` ada, lane A tidak dipakai. Ada dua `kit.js`: `.pawang/kit.js` mengelola state Pawang (jangan ditimpa), sedangkan `.pawang/prototype/kit.js` adalah runtime browser prototype-kit. Tema DS Figr menang atas `prototypes/theme.css`; font-family dan font-size dasar mengikuti project (`--text-base`), ukuran lain relatif (`em`).

---

## 🧰 Perintah `kit.js`

| Perintah                                | Kegunaan                                                                |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `init`                                  | Scaffold `.pawang/` + deteksi tema project sekali                       |
| `render <tipe>`                         | JSON (stdin/`--in`) → HTML standar — satu-satunya cara menulis state    |
| `render diagram --from <file.md>`       | Blok Mermaid → viewer HTML generated (default `.pawang/figr/diagrams/`) |
| `extract <file>`                        | Baca kembali JSON dari HTML                                             |
| `status`                                | Ringkasan state (spec, batch, findings, review, tema)                   |
| `check`                                 | Validasi integritas; exit 1 bila rusak                                  |
| `theme [--refresh\|--default\|--check]` | Kelola snapshot tema (render tidak pernah memindai CSS)                 |
| `selftest`                              | Uji mandiri                                                             |

---

## 🤝 Kontribusi

Kontribusi diterima lewat issue dan pull request. Gunakan template issue yang tersedia, lalu baca [CONTRIBUTING.md](CONTRIBUTING.md) untuk setup dan aturan repo. Untuk pertanyaan terbuka dan ide, gunakan [GitHub Discussions](https://github.com/pawangai/pawang/discussions).

Dengan berpartisipasi, Anda menyetujui [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Laporkan kerentanan keamanan secara privat sesuai [SECURITY.md](SECURITY.md) — jangan di issue publik.

---

## 📄 Lisensi

[MIT](LICENSE) © 2026 Pawang AI
