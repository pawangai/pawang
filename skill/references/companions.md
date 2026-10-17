# Companion - skill pendamping Pawang

Tujuan: membedakan **Pawang core** dari **companion** yang dipasang terpisah, supaya user tidak bingung saat skill Figr/grill tidak ditemukan. Pawang core = `skill/` yang dipasang `npx pawang init` (SKILL.md, references, scripts `.mjs`, `assets/kit.js`). Companion = skill lain di `.agents/skills/`, tidak ikut npm Pawang.

## Aturan

- **Jangan pasang diam-diam.** Tawarkan, jelaskan biaya konteks, lalu tunggu izin user.
- **Tingkat proyek** (`.agents/skills/`), bukan global, kecuali user minta global.
- **Periksa dulu**: baca `SKILL.md`, jalankan `node scripts/skill-precheck.mjs <folder>`, cek sumber/izin. Hasil precheck bersih bukan jaminan; baca skrip yang akan berjalan.
- **Commit hasil instal** (`.agents/skills/` + `skills-lock.json` bila dibuat) agar terlihat di diff.
- **Jika companion tidak ada**: hentikan langkah yang membutuhkannya dan tawarkan pemasangan. Jangan meniru script atau gayanya dengan tulisan tangan.
- **Core tidak butuh companion** untuk adopt, plans, feature, implement, check, audit, complete, fix, rollback, document, status, doctor, handoff, release.
- **`npx skills add` tidak bisa membaca file `.skill` langsung.** Ekstrak dulu, baru pasang folder hasilnya (lihat bawah).

## Companion alur Pawang

| Companion               | Peran                                             | Kapan perlu                                                          | Sumber/pasang                                                                |
| ----------------------- | ------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `grill-me` + `grilling` | Wawancara design tree/frontier                    | `figr-docs.md` (4 dokumen Figr) dan `plans.md` (keputusan bercabang) | `npx skills add mattpocock/skills --skill grill-me grilling -a opencode`     |
| `figr-to-prototype`     | Hulu lane B: scaffold, audit DS, data store       | Proyek punya `figr/` dan akan dirapikan                              | File `.skill`/repo companion; nama folder & frontmatter: `figr-to-prototype` |
| `prototype-kit`         | Hilir lane B: HTML statis ke `.pawang/prototype/` | Setelah `prototype/` React siap dikunci                              | File `.skill`/repo companion; nama folder: `prototype-kit`                   |

Catatan:

- `figr-to-prototype` dan `prototype-kit` **bukan skill hasil serapan penuh**: kontraknya sudah ada di `prototype-figr.md`, tetapi script Python/asetnya tetap di companion. Itu sebabnya keduanya masih perlu dipasang, dan tidak ada script yang ditulis ulang di Pawang.
- `grill-me` hanya forwarder 7 baris; isi wawancara ada di `grilling`. Jika `grill-me` tidak bisa dipanggil model, panggil `grilling` langsung.
- `figr-to-prototype` dan `prototype-kit` menjalankan script Python; pastikan Python 3 tersedia di proyek user. Pawang tidak membundel script itu.
- Folder dan `name` di frontmatter companion adalah `figr-to-prototype`; jangan memakai nama lain.
- Lane A (`prototypes/`) tidak membutuhkan companion Figr.

## Pasang dari skills.sh / GitHub

```bash
npx skills add <owner/repo> --skill <nama> -a opencode
```

Contoh grill:

```bash
npx skills add mattpocock/skills --skill grill-me grilling -a opencode
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

   - `grill-me`/`grilling`: wawancara dokumen Figr/plan mendalam.
   - `figr-to-prototype` + `prototype-kit`: lane Figr.
   ```
5. Lanjutkan langkah yang tertunda; jangan mengulang instalasi.

## Bukan companion inti

`find-skills`, `skill-creator`, dan `skill-inspector` adalah alat advisor opsional, bukan syarat alur Pawang. Cara menilai dan memasangnya ada di `advisor.md`; jangan mencampurnya dengan companion Figr/grill.
