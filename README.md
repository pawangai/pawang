![Pawang](https://raw.githubusercontent.com/pawangai/pawang/main/assets/pawang-banner.png)

# 🧙‍♂️ Pawang

> **"Sekali perintah, maka terjadilah."**
> _Lightning-fast Autonomous Agent Workflow Engine._

---

[![Status](https://img.shields.io/badge/Status-Active-success.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/pawang.svg)](https://www.npmjs.com/package/pawang)

**Pawang** adalah _skill & workflow engine_ untuk AI Agent yang dirancang khusus untuk mengendalikan, mengarahkan, dan menyelesaikan rangkaian tugas secara terautomasi dengan kecepatan penuh dan presisi tinggi.

### ✨ Fitur Utama

- ⚡ **Eksekusi Instan:** Memproses setiap instruksi alur kerja seketika begitu perintah diberikan.
- 🧙 **Pengendali Alur Cerdas:** Mengatur koordinasi tugas agent dari awal hingga tuntas dalam satu genggaman.
- ⚙️ **Arsitektur Tangguh:** Desain sistem yang fleksibel, cepat, dan siap diandalkan untuk berbagai skala kebutuhan.
- 🛡️ **Otonom dengan dua gerbang:** Setelah spec disetujui, agent berjalan sendiri (implement → check → audit → perbaikan). Manusia hanya hadir saat review spec dan saat izin commit/merge.
- 🎨 **Menyatu dengan tema project:** Laporan HTML pawang mengikuti token desain repo (font, warna, radius, ukuran dasar) dari DS Figr `prototype/packages/shared/ui`, `prototypes/`, `packages/design-system/`, folder `figr/`, CSS `@theme`, atau tailwind config. Scaffold baru memakai tema bawaan sampai token project tersedia.
- 📐 **Dokumen Figr + diagram:** grill → 4 dokumen (PRD, flow, desain, edge case) di `.pawang/figr/` → prompt Figr Design <1000 karakter. Diagram tetap Mermaid; viewer HTML dirender lewat `kit.js`.
- 🔍 **Review kode 12 lensa (pilih 3-6):** pahami/nilai kode AI, diff, atau PR dengan tiga sumbu (Standards, Spec, Comprehension); companion `code-review` opsional.
- 🔗 **File agent rapi:** `AGENTS.md` + `.agents/` jadi sumber kanonik; `CLAUDE.md`, `GEMINI.md`, dan subfolder `.claude` di-symlink setelah isi unik dimigrasikan. Settings/hooks `.claude` tetap nyata.

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

### 🧩 Companion (opsional, dipasang terpisah)

Pawang core tidak membundel companion. Pasang di `.agents/skills/` dengan izin user; detail, nama folder, dan precheck ada di `skill/references/companions.md`.

| Companion               | Kapan perlu                            | Pasang                                                                   |
| ----------------------- | -------------------------------------- | ------------------------------------------------------------------------ |
| `grill-me` + `grilling` | Dokumen Figr / wawancara plan mendalam | `npx skills add mattpocock/skills --skill grill-me grilling -a opencode` |
| `figr-to-prototype`     | Lane B hulu (proyek punya `figr/`)     | File `.skill`/repo companion; folder `figr-to-prototype`                 |
| `prototype-kit`         | Lane B hilir (HTML statis)             | File `.skill`/repo companion                                             |

`figr-to-prototype` dan `prototype-kit` bukan hasil serapan penuh: kontraknya sudah ada di `skill/references/prototype-figr.md`, tetapi script Python/asetnya tetap companion.

**Alat advisor (opsional, bukan syarat alur):**

| Alat              | Peran                     | Status          |
| ----------------- | ------------------------- | --------------- |
| `find-skills`     | Cari skill dari skills.sh | sudah global    |
| `skill-creator`   | Buat/uji/iterasi skill    | sudah global    |
| `skill-inspector` | Audit skill pihak ketiga  | belum terpasang |

Cara pasang dan aturan precheck ada di `skill/references/companions.md`; jangan menduplikasi skill yang sudah global.

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

**Kapan saja:** `status` (arah kerja), `doctor` (diagnosa), `review kode` (baca/nilai kode AI, diff, PR), `file agent` (satukan AGENTS.md/.agents dengan symlink), `prototype` (mockup dulu), `rollback` (batalkan fitur), `release` (persiapan rilis), `document` (spesifikasi dari dokumen contoh), `handoff` (catatan lanjut sesi).

### 🛡️ Gerbang Persetujuan

Hanya dua titik henti manusia:

1. **Review spec** — setelah `feature`/`fix`/`rollback` menulis `current-feature.html`, agent berhenti menunggu persetujuan.
2. **Commit & merge** — di `complete`, agent minta izin sebelum commit dan landing.

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

**1. Skill (repo ini, dipasang sebagai `pawang/`):**

```
pawang/
├── SKILL.md                  # peta topik + prinsip + kontrak .pawang/kit.js
├── references/
│   ├── workflow.md           # dasar: loop, config, skema JSON, aturan dua lapis
│   ├── feature.md implement.md check.md audit.md complete.md   # siklus inti
│   ├── status.md fix-debug.md prototype.md prototype-figr.md tests.md rollback.md
│   ├── plans.md figr-docs.md figr-prompt.md brief-explore.md release.md doctor.md
│   ├── adopt.md agents-md.md layout.md advisor.md companions.md handoff.md document.md review-code.md agent-files.md
│   └── markers.json layout-rules.json gap-signals.md spec-template.md theme-variables.css
├── scripts/                  # deterministik & zero-dependency
│   ├── scan.mjs check-layout.mjs probe.mjs compare-text.mjs link-agent-files.mjs
│   └── harden-permissions.mjs skill-precheck.mjs docs-health.mjs
└── assets/
    └── kit.js                # disalin ke .pawang/kit.js tiap proyek
```

**2. State proyek (`.pawang/`, dibuat `kit.js init`):**

```
.pawang/
├── kit.js                    # generator & pembaca HTML (JSON embedded)
├── config.json               # prefix branch, landing, review, batas perbaikan
├── theme.json                # snapshot token tampilan project (dikelola kit.js)
├── context/                  # state kerja aktif
│   ├── project-overview.html  build-plan.html  current-feature.html
│   ├── findings.html  review.html  handoff.html  coding-standards.html
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
| `status`                                | Ringkasan seluruh state (spec aktif, findings, review, tema)            |
| `check`                                 | Validasi integritas; exit 1 bila rusak                                  |
| `theme [--refresh\|--default\|--check]` | Kelola snapshot tema (render tidak pernah memindai CSS)                 |
| `selftest`                              | Uji mandiri                                                             |

---

## 📄 Lisensi

[MIT](LICENSE) © 2026 Pawang AI
