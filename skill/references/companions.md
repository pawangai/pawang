# Companion - skill pendamping Pawang

Tujuan: membedakan **Pawang core** dari **companion** yang dipasang terpisah, supaya user tidak bingung saat skill wayfinder/Figr/grill tidak ditemukan. Pawang core = `skill/` yang dipasang `npx pawang init` (SKILL.md, references, scripts `.mjs`, `assets/kit.js`). Companion = skill lain di `.agents/skills/`, tidak ikut npm Pawang.

## Aturan

- **Jangan pasang diam-diam.** Tawarkan, jelaskan biaya konteks, lalu tunggu izin user.
- **Tingkat proyek** (`.agents/skills/`), bukan global, kecuali user minta global.
- **Periksa dulu**: baca `SKILL.md`, jalankan `node scripts/skill-precheck.mjs <folder>`, cek sumber/izin. Hasil precheck bersih bukan jaminan; baca skrip yang akan berjalan.
- **Commit hasil instal** (`.agents/skills/` + `skills-lock.json` bila dibuat) agar terlihat di diff.
- **Jika companion tidak ada**: hentikan langkah yang membutuhkannya dan tawarkan pemasangan. Jangan meniru script atau gayanya dengan tulisan tangan.
- **Core tetap bisa plans jalur A/B/C tanpa companion.** Companion hanya dibutuhkan untuk A2 (`grilling`), A3 (`wayfinder`), dokumen Figr (`grilling`), dan lane Figr. Jika tidak ada, tawarkan pemasangan atau fallback yang dicatat `(belum diputuskan)`.
- **`npx skills add` tidak bisa membaca file `.skill` langsung.** Ekstrak dulu, baru pasang folder hasilnya (lihat bawah).
- **Jangan pasang ulang `grill-me`.** Skill itu sudah dihapus; isi wawancaranya ada di `grilling`, dan wayfinder memanggil `grilling` langsung.

## Companion alur Pawang

| Companion                       | Peran                                             | Kapan perlu                                                                       | Sumber/pasang                                                                    |
| ------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `grilling`                      | Wawancara design tree/frontier                    | `figr-docs.md` (4 dokumen Figr) dan `plans.md` A2 (keputusan bercabang satu sesi) | `npx skills add mattpocock/skills --skill grilling -a opencode`                  |
| `wayfinder` + `domain-modeling` | Peta keputusan lintas sesi + domain model         | `plans.md` A3 untuk inisiatif >1 sesi/berkabut                                    | `npx skills add mattpocock/skills --skill wayfinder domain-modeling -a opencode` |
| `research` + `prototype`        | Tiket wayfinder tipe research/prototype           | Hanya bila wayfinder membuat tiket tipe itu                                       | `npx skills add mattpocock/skills --skill research prototype -a opencode`        |
| `setup-matt-pocock-skills`      | Setup GitHub Issues + `docs/agents/`              | Sekali per repo sebelum wayfinder dipakai                                         | `npx skills add mattpocock/skills --skill setup-matt-pocock-skills -a opencode`  |
| `figr-to-prototype`             | Hulu lane B: scaffold, audit DS, data store       | Proyek punya `figr/` dan akan dirapikan                                           | File `.skill`/repo companion; nama folder & frontmatter: `figr-to-prototype`     |
| `prototype-kit`                 | Hilir lane B: HTML statis ke `.pawang/prototype/` | Setelah `prototype/` React siap dikunci                                           | File `.skill`/repo companion; nama folder: `prototype-kit`                       |
| `triage`                        | Intake issue/PR + agent brief + `.out-of-scope/`  | Proyek memakai tracker issue/PR dan butuh penyaringan masuk                       | `npx skills add mattpocock/skills --skill triage -a opencode` (butuh setup)      |

Catatan:

- `wayfinder`, `setup-matt-pocock-skills`, dan `triage` bersifat **user-invoked** (`disable-model-invocation`): Pawang tidak bisa memanggilnya otomatis. Minta user memicu `/wayfinder`, `/setup-matt-pocock-skills`, atau `/triage`.
- `triage` adalah companion di luar alur core: ia menulis ke issue tracker dan `.out-of-scope/`, bukan `.pawang/`. `.out-of-scope/` adalah brownfield; deteksi dan tautkan, jangan salin ke `.pawang/`.
- Jangan pasang `to-spec`, `to-tickets`, `implement`, atau `implement-spec` sebagai companion: konsepnya sudah ada di `feature.md`, `plans.md`, `implement.md`, dan `orchestrate.md`; memasangnya membuat dua sumber instruksi yang bertabrakan.
- `wayfinder` memanggil `grilling` + `domain-modeling`. Karena itu `grilling` wajib terpasang; `wayfinder` tidak menggantikan `grilling` untuk Figr docs atau plan kecil.
- `domain-modeling` dapat membuat `GLOSSARY.md` dan `docs/adr/` secara lazy. Itu artefak companion/brownfield; jangan menyalinnya ke `.pawang/`.
- Setup wayfinder menulis `docs/agents/issue-tracker.md`, `docs/agents/domain.md`, dan blok `## Agent skills` di `AGENTS.md`/`CLAUDE.md`. `docs/agents/` adalah opt-in user; jangan membuatnya tanpa izin dan jangan menyalin isinya ke `.pawang/`.
- Tracker default untuk repo ini adalah **GitHub Issues**; `gh auth status` harus lulus. Peta memakai label `wayfinder:map`; tiket child memakai label `wayfinder:<type>`. Satu tiket per sesi (kecuali research).
- Peta/tiket wayfinder adalah artefak perencanaan, bukan build-plan. Build-plan + project-overview tetap ditulis ke `.pawang/` setelah peta selesai.
- `figr-to-prototype` dan `prototype-kit` **bukan skill hasil serapan penuh**: kontraknya sudah ada di `prototype-figr.md`, tetapi script Python/asetnya tetap di companion. Itu sebabnya keduanya masih perlu dipasang, dan tidak ada script yang ditulis ulang di Pawang.
- `figr-to-prototype` dan `prototype-kit` menjalankan script Python; pastikan Python 3 tersedia di proyek user. Pawang tidak membundel script itu.
- Folder dan `name` di frontmatter companion adalah `figr-to-prototype`; jangan memakai nama lain.
- Lane A (`prototypes/`) tidak membutuhkan companion Figr.
- Bila lane B aktif (`figr/`, `prototype/packages/shared/ui`, atau `.pawang/prototype/`), `doctor` memberi **WARN** bila `figr-to-prototype`/`prototype-kit` belum terpasang. Warning saja, bukan blocker; lane B tetap berhenti sampai companion dipasang dengan izin user.

## Pasang dari skills.sh / GitHub

```bash
npx skills add <owner/repo> --skill <nama> -a opencode
```

Contoh wayfinder + dependensi:

```bash
npx skills add mattpocock/skills --skill wayfinder grilling domain-modeling research prototype setup-matt-pocock-skills -a opencode
```

Contoh Figr docs:

```bash
npx skills add mattpocock/skills --skill grilling -a opencode
```

## Pasang dari file `.skill` lokal

File `.skill` adalah arsip zip. Ekstrak ke `.agents/skills/` (paling sederhana, tanpa lock sementara):

```bash
unzip -q <nama>.skill -d .agents/skills
```

Atau lewat `npx skills add` dari folder hasil ekstrak:

```bash
tmp=$(mktemp -d)
unzip -q <nama>.skill -d "$tmp"
npx skills add "$tmp/<folder-skill>" -a opencode --copy -y
```

Periksa nama folder hasil ekstrak: harus `figr-to-prototype`. Jika arsip sumber masih memakai `figr-prototype-tidy`, rename folder dan ubah `name` di frontmatter sebelum dipakai. Jika memakai folder sementara, jangan hapus folder sebelum `skills-lock.json` diputuskan; lebih aman ekstrak langsung ke `.agents/skills/`.

## Setelah pasang

1. Verifikasi folder: `ls .agents/skills/<nama>`.
2. Jalankan precheck dari folder skill Pawang:
   ```bash
   node scripts/skill-precheck.mjs .agents/skills/<nama>
   ```
3. Baca `SKILL.md` dan skrip yang akan berjalan.
4. Catat satu baris di `AGENTS.md` proyek (lihat `agents-md.md`):
   ```markdown
   ## Companion (bila terpasang)

   - `wayfinder`/`grilling`: peta keputusan inisiatif besar dan wawancara Figr/plan.
   - `figr-to-prototype` + `prototype-kit`: lane Figr.
   ```
5. Lanjutkan langkah yang tertunda; jangan mengulang instalasi.

## Companion advisor (opsional)

Bukan syarat alur Pawang core/Figr. Gunakan saat perlu mencari, membuat, atau mengaudit skill. **Cek dulu apakah sudah terpasang** (global atau proyek); jangan menduplikasi skill yang sama.

| Companion         | Peran                                      | Pasang                                                                                      |
| ----------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `find-skills`     | Cari skill dari skills.sh                  | `npx skills add https://github.com/vercel-labs/skills --skill find-skills -a opencode`      |
| `skill-creator`   | Buat/uji/iterasi skill                     | `npx skills add https://github.com/anthropics/skills --skill skill-creator -a opencode`     |
| `skill-inspector` | Audit statis + semantik skill pihak ketiga | `npx skills add https://github.com/nvidia/skillspector --skill skill-inspector -a opencode` |

Status di repo Pawang ini: `find-skills` dan `skill-creator` sudah terpasang **global**; `skill-inspector` belum. Di proyek lain, cek dulu sebelum memasang. Cara menilai kandidat ada di `advisor.md`; baca `SKILL.md` dan precheck sebelum dipakai.
