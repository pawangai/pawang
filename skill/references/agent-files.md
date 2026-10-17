# File agent - satukan AGENTS.md/.agents dan salinan agent lain

Tujuan: membuat satu sumber kebenaran untuk aturan proyek dan skill agent. `AGENTS.md` + `.agents/` adalah kanonik; `CLAUDE.md`, `GEMINI.md`, dan subfolder `.claude/` yang tumpang tindih diarahkan lewat symlink setelah isinya dimigrasikan. `.claude/settings.json`, hooks, dan isi khusus Claude tetap nyata.

Jangan langsung symlink. File agent sering berisi aturan yang tidak sama; symlink tanpa migrasi akan menghilangkan aturan atau mencampur settings antar-agent.

## Audit dulu

Dari folder skill Pawang:

```bash
node scripts/link-agent-files.mjs "<path-proyek>"
```

Default hanya membaca. Skrip melaporkan:

- `CLAUDE.md`/`GEMINI.md`: sudah symlink, duplikat, atau punya baris unik;
- `.claude` vs `.agents`: subfolder yang tumpang tindih (`skills`, `agents`, `commands`), konflik nama, dan isi yang dipertahankan;
- rencana tindakan yang aman dan blokir yang butuh keputusan user.

Audit biasa selalu keluar 0 (laporan saja). `--check` keluar 1 bila masih ada tindakan/blokir, cocok untuk CI. `--apply` baru dijalankan setelah migrasi selesai dan user setuju. `--create` hanya dipakai bila user memang ingin membuat `CLAUDE.md`/`GEMINI.md`/`.claude/<sub>` yang belum ada; default tidak membuat file agent baru.

## Migrasi sebelum symlink

Klasifikasikan isi `CLAUDE.md`/`GEMINI.md` dan subfolder `.claude`:

| Isi                                              | Tujuan                                                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Konvensi panjang (arsitektur, gaya, aturan area) | `docs/conventions/` (opt-in), lalu tautkan dari `AGENTS.md` dengan pemicu.                              |
| ADR/keputusan panjang                            | `docs/adr/` (opt-in), lalu tautkan dari `AGENTS.md`.                                                    |
| Keputusan pendek                                 | `## Keputusan penting` di `AGENTS.md`.                                                                  |
| Konvensi pendek                                  | `.pawang/context/coding-standards.html` lewat `kit.js`.                                                 |
| Peta proyek, perintah, larangan                  | `AGENTS.md` (`## Commands`, `## Jangan`, peta dokumen).                                                 |
| Aturan khusus Claude/Gemini yang tetap relevan   | Gabungkan ke `AGENTS.md`; aturan tooling khusus tetap di `.claude/` (settings/hooks), bukan di symlink. |
| Duplikat                                         | Hapus dari file lama.                                                                                   |

`docs/conventions/` dan `docs/adr/` hanya dipakai bila user memilihnya atau isinya sudah banyak; jangan membuat `docs/` baru secara default. Setelah migrasi, `AGENTS.md` harus memuat tautan berpemicu ke dokumen itu, misalnya:

```markdown
## Peta dokumen (baca hanya yang relevan dengan tugasmu)

- `docs/conventions/api.md`: baca sebelum mengubah kontrak endpoint.
- `docs/adr/0007-harga-sen.md`: baca sebelum mengubah perhitungan uang.
```

## Symlink yang aman

- `CLAUDE.md → AGENTS.md` dan `GEMINI.md → AGENTS.md`.
- `.claude/` tetap folder nyata bila berisi `settings.json`, hooks, atau konfigurasi khusus.
- Hanya subfolder yang tumpang tindih yang di-symlink:
  - `.claude/skills → ../.agents/skills`
  - `.claude/agents → ../.agents/agents` (bila ada)
  - `.claude/commands → ../.agents/commands` (bila ada)
- Jangan symlink seluruh `.claude` ke `.agents` bila `.claude` punya settings/hooks: konfigurasi Claude akan tercampur ke agent lain.

Urutan yang dilakukan `--apply`:

1. Ganti `CLAUDE.md`/`GEMINI.md` duplikat dengan symlink; file yang belum ada hanya dibuat dengan `--create`.
2. Pindahkan isi unik `.claude/<sub>` ke `.agents/<sub>`; berhenti bila ada nama yang bentrok.
3. Ganti `.claude/<sub>` dengan symlink; subfolder yang belum ada hanya dibuat dengan `--create`.
4. Pertahankan `settings.json`, hooks, dan isi `.claude` lain.

`--apply` tidak menimpa file yang masih punya isi unik; ia berhenti dan menampilkan baris yang perlu dimigrasikan. Sebelum mengubah apa pun, `--apply` memeriksa apakah OS mengizinkan symlink folder; jika tidak, proses berhenti tanpa perubahan.

## Windows dan git

Symlink butuh izin OS saat dibuat. Di Windows, aktifkan Developer Mode atau jalankan dengan izin create-symlink; `git config core.symlinks true` hanya memengaruhi checkout, bukan izin membuat link. Skrip tidak memakai junction (Git for Windows memperlakukannya sebagai folder biasa). Bila symlink file gagal, skrip membuat pointer untuk `CLAUDE.md`/`GEMINI.md`:

```markdown
# CLAUDE.md

File ini pointer ke AGENTS.md (pawang-pointer: AGENTS.md).
Baca AGENTS.md; jangan menulis aturan terpisah di sini.
```

Symlink folder tetap membutuhkan dukungan OS; jika gagal, hentikan dan minta user memilih. Jangan mengganti symlink folder dengan salinan yang bisa drift.

## Verifikasi

```bash
node scripts/link-agent-files.mjs . --check
node scripts/docs-health.mjs .
node scripts/check-layout.mjs .
```

`docs-health` men-dedupe skill lewat realpath; `scan`/`check-layout` mengabaikan symlink. Pastikan:

- `AGENTS.md` tetap satu-satunya file aturan tingkat root yang diedit;
- `CLAUDE.md`/`GEMINI.md` adalah symlink (atau pointer fallback);
- `.claude/skills` symlink ke `.agents/skills`;
- settings/hooks `.claude` tidak berubah;
- tidak ada isi unik yang hilang dari migrasi.

## Batas

- Simpan perubahan user dulu; jangan hapus file sebelum isinya dimigrasikan.
- Jangan symlink seluruh `.claude` bila ada settings/hooks.
- Jangan membuat `docs/conventions/` atau `docs/adr/` tanpa keputusan user.
- Jangan campur aturan khusus agent ke `AGENTS.md` bila user memilih menyimpannya terpisah; tanyakan.
- Symlink bukan pengganti review isi: audit tetap wajib.
