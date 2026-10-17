# Berkontribusi ke Pawang

Terima kasih sudah tertarik berkontribusi. Pawang adalah satu skill besar (`skills/pawang/`) plus CLI pemasang (`bin/cli.mjs`). Sebelum mengubah perilaku skill, baca `skills/pawang/SKILL.md` dan satu reference yang relevan — jangan membaca semuanya sekaligus.

Dengan berkontribusi, Anda menyetujui [Kode Etik](CODE_OF_CONDUCT.md) dan lisensi [MIT](LICENSE).

## Sebelum mulai

- Untuk perubahan besar, perilaku skill baru, atau companion baru: buka **issue** dulu agar arahnya disepakati. Tracker proyek ada di GitHub Issues.
- Untuk pertanyaan terbuka atau ide awal, gunakan [GitHub Discussions](https://github.com/pawangai/pawang/discussions) sebelum membuka issue.
- Untuk perbaikan kecil (typo, bug jelas, dokumentasi): pull request langsung boleh.
- Jangan gunakan pull request sebagai permintaan fitur baru; gunakan issue.

## Setup

Prasyarat: Node.js >= 18 dan git. Repo ini **zero dependency**, jadi tidak perlu `npm install`.

```bash
git clone https://github.com/pawangai/pawang.git
cd pawang
git switch -c <nama-perubahan>
```

Verifikasi wajib sebelum membuka PR:

```bash
npm test        # selftest kit.js, link-agent-files, versi CLI, companion list
npm run pack:dry # pastikan isi paket npm sesuai
```

Repo ini tidak memakai build, lint, atau typecheck framework. Jika menambah logika non-trivial (cabang, loop, parser, validasi), tambahkan selftest atau assert di tempat yang sudah ada (`skills/pawang/assets/kit.js selftest` untuk kit).

## Peta kontribusi

| Area                 | Lokasi                          | Catatan                                                            |
| -------------------- | ------------------------------- | ------------------------------------------------------------------ |
| Skill core           | `skills/pawang/`                | Ikut npm; `SKILL.md` hanya peta, detail per topik di `references/` |
| CLI pemasang         | `bin/cli.mjs`                   | `init`, `--project`, `--target`, `--force`, `companion`            |
| State kit            | `skills/pawang/assets/kit.js`   | Disalin ke `.pawang/kit.js` di proyek user                         |
| Script deterministik | `skills/pawang/scripts/*.mjs`   | Zero-dep, tanpa LLM                                                |
| Companion            | `skills/<nama>/`                | Tidak ikut npm; dipasang via `npx skills add`                      |
| Metadata companion   | `skills/pawang/companions.json` | Sumber `pawang companion list/info/add`                            |
| Test skill           | `evals/`                        | Definisi prompt uji; hasil di `pawang-workspace/` (gitignored)     |

### Aturan skill

- Tetap **satu skill**: kemampuan baru = file di `skills/pawang/references/` + satu baris di tabel peta `SKILL.md`. Jangan memecah Pawang menjadi banyak skill.
- Membuat atau menyerap skill wajib lewat alur `skill-creator` (draf → uji dengan/tanpa → evaluasi → iterasi) dan lolos `node skills/pawang/scripts/skill-precheck.mjs <folder>`.
- Bahan serapan dibaca dari `zip/`; jangan membaca salinan di luar repo. Arsip mentah `zip/` tidak boleh dipublikasikan.
- Companion dipasang terpisah dan tidak dibundel ke core. Pasang hanya dengan izin user; jangan menyalin script/gaya companion ke core.
- Jangan menambahkan `to-spec`, `to-tickets`, `implement`, atau `implement-spec` sebagai companion — konsepnya sudah ada di core.
- Audit provenance dan lisensi sebelum mengusulkan companion baru.

### Aturan state dan dokumentasi

- HTML state di `.pawang/` **hanya** ditulis lewat `node .pawang/kit.js`; jangan mengedit HTML state secara manual. Pengecualian: `.pawang/prototype/` dan `.pawang/figr/diagrams/` adalah artefak generated.
- Konvensi proyek masuk ke `.pawang/context/coding-standards.html`; larangan dan keputusan permanen ke `AGENTS.md`.
- Jangan membuat `docs/` baru tanpa keputusan eksplisit user. `docs/` lama adalah brownfield: dideteksi dan ditautkan, tidak dipindah atau disalin.
- File agent: `AGENTS.md` + `.agents/` adalah kanonik. `CLAUDE.md`, `GEMINI.md`, dan subfolder `.claude` yang tumpang tindih di-symlink hanya setelah isinya dimigrasikan; settings/hooks `.claude` tetap nyata.

### Gaya kode

- ESM (`.mjs`), tanpa dependency baru kecuali disepakati di issue.
- Ikuti gaya file di sekitarnya; jangan menambahkan framework, wrapper, atau abstraksi yang tidak diminta.
- Pertahankan error handling dan validasi saat memindahkan atau menggabungkan kode.
- Jangan pernah meng-commit secret, token, `.env`, atau data pribadi.

## Commit dan pull request

- Branch dari `main`; satu topik per PR.
- Pesan commit ringkas dan menjelaskan **mengapa**, bukan hanya apa. Bahasa Indonesia atau Inggris keduanya diterima; konsisten dalam satu PR.
- Isi body PR: ringkasan, issue terkait (`Closes #...`), dan hasil verifikasi (`npm test`, `npm run pack:dry`).
- Jangan menaikkan versi, membuat tag, atau mem-publish npm; itu dilakukan maintainer.
- Jangan force-push branch yang sudah dibagikan atau me-rewrite history `main`.
- Maintainer meninjau PR; perubahan bisa diminta sebelum merge. Dengan mengirim PR, Anda menyetujui kontribusi dilisensikan sebagai MIT.

## Keamanan

Jangan melaporkan kerentanan keamanan di issue publik. Ikuti [SECURITY.md](SECURITY.md).
