# Prototype Figr - Figr/DS menjadi HTML statis

Tujuan: mengunci tampilan proyek yang sudah punya Figr/design system (DS), lalu menghasilkan HTML statis yang bisa dibuka user tanpa build step. Ini lane B; lane A di `prototype.md` tidak dipakai bila `figr/` ada.

## Kapan dipakai

- Proyek punya `figr/` (hasil Figr) dan/atau DS di `prototype/packages/shared/ui`.
- Tampilan belum dikunci dan fitur UI berikutnya butuh mockup.
- Bukan untuk proyek tanpa Figr; itu lane A (`prototype.md`).

## Dua `kit.js`

| File                       | Peran                                             | Aturan                                      |
| -------------------------- | ------------------------------------------------- | ------------------------------------------- |
| `.pawang/kit.js`           | CLI state Pawang (render, extract, status, theme) | Jangan ditimpa atau diedit                  |
| `.pawang/prototype/kit.js` | Runtime browser prototype-kit                     | Menang di lane prototype; artefak generated |

Beri tahu user bahwa runtime prototype ada di `.pawang/prototype/kit.js`, bukan `.pawang/kit.js`.

## Alur

1. **Plan-first.** Baca `figr/` dan DS di `prototype/packages/shared/ui`. Susun plan: daftar layar, komponen DS yang dipakai, dan **tabel gap DS** (komponen/token yang belum ada beserta rencana isinya). Tulis nol file sampai user menyetujui plan dan tabel gap.
2. **Hulu - `figr-to-prototype`.** Pasang companion skill lewat `.agents/skills/` (minta izin user). Jalankan `figr-to-prototype` untuk mengubah `figr/` menjadi `prototype/`: aplikasi React yang memakai DS di `prototype/packages/shared/ui`.
3. **Hilir - `prototype-kit`.** Jalankan companion `prototype-kit` untuk merender `prototype/` menjadi HTML statis di `.pawang/prototype/` (termasuk `.manifest.json` dan runtime `kit.js`). Jangan biarkan output default jatuh ke `prototype/`; arahkan eksplisit ke `.pawang/prototype/`.
4. **State.** Setelah DS/prototype berubah:
   - jalankan `node .pawang/kit.js theme --refresh`;
   - perbarui `project-overview` (bagian UI) lewat kit.js;
   - tautkan HTML hasil di `references.design` spec fitur;
   - commit `.pawang/prototype/` beserta `.manifest.json`.

`context/` dan `history/` tetap ditulis lewat `.pawang/kit.js`; `.pawang/prototype/` adalah artefak generated, bukan state yang diedit manual.

## Output

- `prototype/` - workbench React dari `figr-to-prototype`; bahan hilir, bukan hasil akhir.
- `.pawang/prototype/` - HTML statis + aset + `.manifest.json` + runtime `kit.js`; ini yang dibuka user dan di-commit.

## Aturan

- **Plan-first** dan tabel gap DS wajib disetujui sebelum menulis file.
- **DS menang.** Bila `prototype/packages/shared/ui/index.css` ada, `prototypes/theme.css` tidak dibaca; jangan menimpa token DS dengan tema lane A.
- **Lane A tidak dipakai** bila proyek punya Figr/DS; `prototypes/` hanya untuk proyek tanpa Figr.
- **Artefak skill yang dikenal** (PRODUCT.md, DESIGN.md, blueprint/, figr/, CODING_STANDARDS.md, GLOSSARY.md, dll.) dirutekan atau ditautkan di peta dokumen AGENTS.md. Yang tidak dikenal: tanya user, jangan dipindah atau disalin.
- **Companion skill** dipasang di `.agents/skills/` dengan izin user; pawang hanya menyimpan kontrak. Nama skill hulu `figr-to-prototype` (bukan `figr-prototype-tidy`).
- **Berhenti setelah HTML jadi.** Prototype mengunci tampilan, bukan membangun aplikasi.

## Kesalahan umum

- Menulis `prototype/` atau `.pawang/prototype/` sebelum plan dan tabel gap disetujui.
- Membiarkan `prototype-kit` menulis ke `prototype/` (default) alih-alih `.pawang/prototype/`.
- Menimpa `.pawang/kit.js` dengan runtime prototype, atau mengedit HTML `.pawang/prototype/` manual.
- Memakai lane A (`prototypes/` + `theme.css`) padahal proyek punya `figr/`.
