# Workflow - aturan inti alur pawang

Tujuan: satu tempat untuk aturan inti folder `.pawang/`, `kit.js`, skema data, gerbang persetujuan, dan aturan dua lapis. Semua reference lain merujuk ke file ini; jangan menduplikasi isinya, cukup tautkan.

## 1. Folder `.pawang/`

```
.pawang/
├── kit.js                    # satu-satunya penulis HTML (disalin dari skill, jangan diedit)
├── config.json               # kebijakan proyek
├── theme.json                # snapshot token tampilan (dikelola kit.js)
├── context/                  # state kerja aktif
│   ├── project-overview.html # ringkasan proyek (dibaca tiap sesi fitur)
│   ├── build-plan.html       # daftar fitur (checklist)
│   ├── current-feature.html  # SPEC AKTIF: satu item per checkout
│   ├── batch.html            # papan batch lintas fitur/tiket (sementara)
│   ├── findings.html         # ledger temuan audit
│   ├── review.html           # request/receipt review independen
│   ├── handoff.html          # ringkasan lanjut sesi (ditimpa, satu file)
│   └── coding-standards.html # konvensi kode proyek
├── prototype/                # HTML statis prototype-kit (di-commit; runtime kit.js sendiri)
│   ├── kit.js                # runtime browser prototype-kit (bukan .pawang/kit.js)
│   ├── .manifest.json        # manifest hasil generate
│   └── <layar>.html          # mockup + aset
├── figr/                     # dokumen sumber Figr (Markdown, di-commit)
│   ├── 01-PRD.md ... 04-edge-cases.md
│   ├── prompt.md             # prompt Figr Design yang sudah diisi
│   └── diagrams/             # opsional: viewer HTML generated kit.js
├── reference/                # rujukan dokumen/desain per jenis
│   └── <jenis>/              # mis. invoice/, kontrak/, sertifikat/
│       ├── <file mentah>     # docx/pdf/png/jpeg/html asli (gitignored)
│       ├── spesifikasi.html  # hasil olahan sintetis (di-commit)
│       ├── reference.anon.txt# bahan uji teranonimkan (di-commit)
│       └── _work/            # ekstraksi + map.json (gitignored)
└── history/                  # arsip pekerjaan selesai (imutabel)
    ├── features/             # NN-nama.html, rebuild: NN-nama--build-N.html
    ├── fixes/
    └── rollbacks/            # YYYY-MM-DD-<target-archive-stem>.html
```

Satu work item aktif per checkout/worktree. Tanpa batch, jangan mengerjakan dua spec sekaligus di folder yang sama. Dengan batch (`orchestrate.md`), orkestrator boleh mengelola beberapa worktree, tetapi satu worker hanya mengerjakan satu item dan tetap satu penulis state.

## 2. `kit.js` - satu-satunya penulis HTML

Semua file `.html` di `.pawang/` dibuat dan diperbarui **hanya** lewat `node .pawang/kit.js`. Agent mengirim JSON; kit.js menulis HTML yang rapi (data asli ikut tertanam untuk dibaca kembali). **Jangan menulis atau mengedit HTML mentah.**

| Perintah                                                    | Kegunaan                                                                                                                        |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `node .pawang/kit.js init`                                  | Scaffold `.pawang/` (folder, stub, config.json, theme.json). Hanya membuat yang belum ada.                                      |
| `node .pawang/kit.js render <tipe> [--out <file>]`          | Baca JSON dari stdin (atau `--in <file>`), tulis HTML.                                                                          |
| `node .pawang/kit.js extract <file.html>`                   | Baca kembali data JSON dari file HTML.                                                                                          |
| `node .pawang/kit.js status`                                | Ringkasan seluruh state: config, spec aktif + progres step, batch, findings (hitungan + P0/P1), review, handoff, history, tema. |
| `node .pawang/kit.js check`                                 | Validasi integritas semua file & config. Exit 1 bila rusak.                                                                     |
| `node .pawang/kit.js theme [--refresh\|--default\|--check]` | Lihat / deteksi ulang / reset / cek drift tema.                                                                                 |
| `node .pawang/kit.js selftest`                              | Uji mandiri kit.js.                                                                                                             |

Pengecualian: `context/` dan `history/` selalu ditulis lewat `.pawang/kit.js`. `.pawang/prototype/` adalah artefak generated prototype-kit (HTML statis + runtime `kit.js` sendiri) — jangan diedit atau ditimpa lewat Pawang; regenerasi lewat lane prototype di `prototype-figr.md`. `.pawang/figr/` adalah dokumen sumber Figr (Markdown) + prompt; ditulis agent, bukan state HTML. Viewer diagram di `.pawang/figr/diagrams/` adalah artefak generated `kit.js` — jangan diedit manual.

Pola pemakaian tipikal:

```bash
node .pawang/kit.js status                      # orientasi murah di awal tugas
node .pawang/kit.js extract .pawang/context/current-feature.html
node .pawang/kit.js render current-feature <<'JSON'
{ "type": "feature", "title": "Export laporan", "status": "ready", ... }
JSON
```

Tipe render dan path default:

| Tipe                                               | Path default                                                 |
| -------------------------------------------------- | ------------------------------------------------------------ |
| `current-feature`                                  | `.pawang/context/current-feature.html`                       |
| `findings`                                         | `.pawang/context/findings.html`                              |
| `review`                                           | `.pawang/context/review.html`                                |
| `handoff`                                          | `.pawang/context/handoff.html`                               |
| `build-plan`                                       | `.pawang/context/build-plan.html`                            |
| `project-overview`                                 | `.pawang/context/project-overview.html`                      |
| `batch`                                            | `.pawang/context/batch.html`                                 |
| `coding-standards`                                 | `.pawang/context/coding-standards.html`                      |
| `history-feature` `history-fix` `history-rollback` | wajib `--out` (`.pawang/history/...`)                        |
| `document-spec`                                    | wajib `--out` (`.pawang/reference/<jenis>/spesifikasi.html`) |
| `diagram`                                          | `--from <file.md>` → `.pawang/figr/diagrams/<nama>.html`     |

## 3. Skema data (JSON per tipe)

Field wajib ditandai. Field lain opsional; kit.js menampilkan yang ada, mengabaikan yang kosong.

**current-feature** (feature/fix/rollback dalam satu bentuk):

```json
{
  "type": "feature",
  "title": "Export laporan bulanan",
  "status": "ready",
  "branch": "feature/export-laporan-bulanan",
  "origin": { "buildPlanId": "3", "attempt": 1 },
  "goal": "Kenapa fitur ini ada, satu-dua kalimat.",
  "inScope": ["..."],
  "outOfScope": ["..."],
  "steps": [
    {
      "text": "Endpoint GET /reports/:id.csv",
      "doneWhen": "curl mengembalikan CSV 200",
      "done": false,
      "files": ["src/routes/reports.ts"]
    }
  ],
  "files": ["src/routes/reports.ts"],
  "contracts": ["Format CSV: kolom tanggal,total"],
  "testing": ["Uji baris kosong dan pemisah koma dalam nilai"],
  "references": {
    "documents": [
      {
        "jenis": "invoice",
        "spec": ".pawang/reference/invoice/spesifikasi.html",
        "verify": "node scripts/compare-text.mjs ..."
      }
    ],
    "design": ["prototypes/dashboard.html"]
  },
  "notes": ["Ikuti pola export yang sudah ada di src/routes/export.ts"],
  "openQuestions": []
}
```

`status`: `none` (stub, belum ada pekerjaan) | `not-started` | `in-progress` | `verified` | `verification-failed` | `ready` | `completed`.
`type` fix menambah `"fixes": "F-03"`; `type` rollback menambah `"rollback": { "targetArchive": "...", "targetCommit": "...", "targetParent": "...", "reason": "..." }`.
`steps[].files` opsional: area file step untuk guard paralel; jika kosong atau beririsan, step dijalankan sequential.

**batch**: `{ "id": "...", "status": "planning|running|verifying|done|failed", "integrationBranch": "...", "gate": { "specApproved": false, "commitApproved": false }, "items": [ { "id": "B1", "buildPlanId": "4", "title": "...", "blockedBy": [], "status": "pending|ready|running|done|merged|failed|blocked", "branch": "...", "worktree": "...", "spec": { ...skema current-feature... }, "result": { "commit": "", "archive": "", "notes": "", "findings": [] } } ] }`.
Batch ditulis hanya lewat `kit.js`; `items[].spec` mengikuti skema current-feature. Batch sementara: reset saat batch selesai; history per fitur tetap di `.pawang/history/`.

**findings**: `{ "items": [ { "id": "F-01", "severity": "P1", "status": "open", "title": "...", "file": "src/x.ts:12", "found": "2026-10-16 audit (lens: security)", "why": "...", "fix": "...", "resolution": "" } ] }`
Severity `P0`-`P3`. Status `unverified` | `open` | `fixed` | `closed` | `accepted` | `invalid`. `P0`/`P1` dengan status `open` atau `fixed` memblokir `complete`.

**review**: `{ "state": "none", "targetCommit": "", "specHash": "", "requestedExecution": "automatic", "verdict": "", "commands": [], "evidence": [], "findings": [], "remainingRisk": [] }`
`state`: `none` | `pending` | `passed` | `changes-requested`. Receipt basi (target bukan HEAD lagi) = tidak ada receipt.

**handoff**: `{ "updatedAt": "2026-10-16T21:00:00+07:00", "goal": "...", "done": ["..."], "state": "...", "next": ["..."], "decisions": ["..."], "openIssues": ["..."] }` - satu file, ditimpa setiap update.

**build-plan**: `{ "items": [ { "id": "1", "text": "Feature satu", "done": false } ] }` - ID stabil, jangan dinomori ulang setelah selesai.

**project-overview**: `{ "summary": "...", "problem": "...", "users": "...", "stack": ["..."], "data": ["..."], "ui": "...", "deployment": "...", "constraints": "..." }`

**coding-standards**: `{ "sections": [ { "title": "TypeScript", "rules": ["..."] } ] }`

**history-feature / history-fix / history-rollback**: skema sama dengan current-feature, ditambah `"completedAt"` dan `"findings"` (entri resolved yang ikut diarsipkan).

**document-spec**: `{ "jenis": "invoice", "status": "dikonfirmasi", "sumber": "invoice-1.pdf, invoice-2.pdf (file mentah tidak ada di repo)", "pemilik": "...", "sections": [ { "title": "1. Halaman", "lines": ["..."] } ] }`

## 4. Gerbang persetujuan

Hanya dua titik henti manusia:

1. **Review spec.** Setelah `feature`/`fix`/`rollback` menulis `current-feature.html`, berhenti dan tunjukkan spec ke user. Jangan implement sebelum disetujui. Spec harus bebas `openQuestions` sebelum diajukan. Untuk batch, satu approval untuk semua spec + DAG (user boleh menolak per item).
2. **Commit & merge.** Di `complete`, minta izin eksplisit untuk commit dan untuk landing (`config.git.landing`). Untuk batch, satu izin commit/merge batch; satu commit per fitur + satu merge batch.

Selebihnya otonom: implement → check → audit → perbaikan findings → re-audit → siap complete, mengikuti spec dan `AGENTS.md`. Cek/audit/eksplorasi read-only boleh paralel; implementasi paralel hanya dengan guard file disjoint; perbaikan findings selalu sequential.

**Satu penulis state.** Agent utama (orkestrator) adalah satu-satunya yang menulis `.pawang/`, history, build-plan, dan git. Subagent read-only tidak menulis apa pun; worker implementasi hanya menulis di worktree-nya. Aturan dispatch, cap, brief, dan agregasi ada di `parallel.md`; batch lintas fitur ada di `orchestrate.md`.

Henti darurat (bukan gerbang, tapi pengaman): hentikan dan lapor user bila (a) perbaikan gagal setelah `config.autonomous.maxRepairAttempts` percobaan (default 2), (b) ada keputusan produk yang tidak bisa dijawab dari spec/plan, (c) pekerjaan akan keluar dari scope spec, (d) konflik merge/apply batch tidak bisa diselesaikan dengan aman.

## 5. Aturan dua lapis

| Lokasi      | Isi                                                                                                                                    | Ditulis kapan            |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `AGENTS.md` | peta proyek, Commands/Verify, `## Jangan`, `## Keputusan penting`, tautan berpemicu                                                    | setup & maintenance saja |
| `.pawang/`  | state kerja + konvensi (`context/`), prototype generated, dokumen Figr (`figr/`), rujukan dokumen (`reference/`), riwayat (`history/`) | sepanjang siklus fitur   |

Anti-duplikasi: spec aktif, batch, findings, review, handoff, riwayat, dan spesifikasi dokumen **hanya** ada di `.pawang/`. Konvensi **hanya** di `.pawang/context/coding-standards.html` (render `coding-standards`, skema `sections`). Larangan **hanya** di `## Jangan` dan keputusan permanen **hanya** di `## Keputusan penting` pada `AGENTS.md`. Peta dan perintah **hanya** di `AGENTS.md`. Jangan menyalin isi satu lapis ke lapis lain; tautkan.

`docs/` tidak dibuat Pawang secara default. `docs/` yang sudah ada — termasuk `docs/agents/` hasil setup companion pilihan user — adalah brownfield: dideteksi, ditautkan dari `AGENTS.md`, isinya tidak dipindah/disalin ke `.pawang/`, dan tidak dijelajahi default. `docs/` baru hanya atas keputusan eksplisit user, bukan default alur; `docs/conventions/` dan `docs/adr/` adalah opt-in untuk konvensi/ADR panjang.

Companion (`grilling`, `wayfinder` + `domain-modeling`, `research`/`prototype`, `setup-matt-pocock-skills`, `figr-to-prototype`, `prototype-kit`, dan `triage` opsional) dipasang terpisah di `.agents/skills/`, bukan bagian `.pawang/` dan bukan isi npm Pawang. Daftar, izin, precheck, dan cara pasang ada di `companions.md`.

Wayfinder menyimpan peta/tiket keputusan di issue tracker (GitHub Issues; lihat `docs/agents/issue-tracker.md`), bukan di `.pawang/`. Peta itu artefak perencanaan; build-plan + project-overview tetap satu-satunya plan final di `.pawang/`. `docs/agents/` adalah opt-in user dan brownfield: jangan disalin ke `.pawang/`.

File agent ganda (`CLAUDE.md`, `GEMINI.md`, `.claude`) disatukan lewat `agent-files.md`: `AGENTS.md`/`.agents` kanonik, symlink setelah isi unik dimigrasikan, dan settings/hooks `.claude` tetap nyata.

## 6. Tema

- Saat `init`, kit.js mendeteksi sumber token tampilan project **sekali** dengan prioritas: pin `theme.json.source` → `prototype/packages/shared/ui/index.css` (DS Figr; bila ada, `prototypes/theme.css` **tidak dibaca**) → `prototypes/theme.css` (hanya tanpa Figr) → `packages/design-system/index.css` → CSS di folder `figr/` → `globals.css`/`app.css` ber-`@theme`/`:root` → `tailwind.config.*` → tema bawaan. Hasilnya disimpan ke `.pawang/theme.json`.
- **Font mengikuti project:** font-family dan font-size dasar diambil dari project (`--text-base` dan sejenisnya). Ukuran lain ditulis relatif (`em`) agar skala project tetap terjaga.
- `render` **hanya membaca** `theme.json`; tidak pernah memindai ulang CSS. Project scaffold baru memakai tema bawaan sampai punya token sendiri.
- Jika DS/prototype/token project berubah: jalankan `node .pawang/kit.js theme --refresh`. `doctor` yang memberi tahu kapan (lewat `theme --check`).
- `theme.json` hanya snapshot; boleh diedit manual dan `source` bisa di-pin untuk monorepo.

## 7. Siklus standar

```
(sekali)  adopt → agents-md → kit.js init → build-plan & project-overview
per fitur (brief) → (figr-docs → figr-prompt) → (prototype | prototype-figr) → feature ──GERBANG──► implement → check → audit
          → perbaikan findings → complete ──GERBANG──► history/
kapan saja  status · doctor · review kode · file agent · handoff · tests · rollback · release · document
```

Lane prototype opsional: tanpa Figr pakai `prototype.md` (lane A, `prototypes/`); bila proyek punya Figr/DS pakai `prototype-figr.md` (lane B, hasil di `.pawang/prototype/`).

Paralel dalam satu fitur: `parallel.md` (cek/audit/eksplorasi read-only; implementasi opt-in dengan guard). Batch lintas fitur/tiket: `orchestrate.md` (`context/batch.html`, worktree, merge sequential, satu commit per fitur).

Referensi per langkah: spec → `feature.md`/`fix-debug.md`/`rollback.md`; eksekusi → `implement.md`; bukti → `check.md`; kualitas → `audit.md`; review kode eksternal → `review-code.md`; file agent → `agent-files.md`; penutup → `complete.md`; orientasi → `status.md`.
