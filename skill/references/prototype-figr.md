# Prototype Figr - hulu React, hilir HTML statis

Tujuan: mengubah hasil Figr + design system (DS) menjadi `prototype/` React yang rapi, lalu mengunci tampilannya sebagai HTML statis di `.pawang/prototype/` yang bisa dibuka tanpa build step. Ini lane B; lane A di `prototype.md` tidak dipakai bila `figr/` ada.

Rantai lengkap: `.pawang/figr/` (4 dokumen dari `figr-docs.md`) → `figr-prompt.md` (prompt Figr Design) → Figr Design → `figr/` (output mentah) → `figr-to-prototype` → `prototype/` → `prototype-kit` → `.pawang/prototype/`.

## Kapan dipakai

- Empat dokumen Figr sudah siap di `.pawang/figr/` dan user mau mulai dari Figr Design; buat prompt lewat `figr-prompt.md`.
- Proyek punya `figr/` (zip atau folder) dan/atau DS di `prototype/packages/shared/ui`.
- Tampilan belum dikunci dan fitur UI berikutnya butuh mockup.
- Figr atau DS berubah dan prototype perlu disinkronkan.
- Bukan untuk proyek tanpa Figr; itu lane A (`prototype.md`).

## Dua `kit.js`

| File                       | Peran                                             | Aturan                                      |
| -------------------------- | ------------------------------------------------- | ------------------------------------------- |
| `.pawang/kit.js`           | CLI state Pawang (render, extract, status, theme) | Jangan ditimpa atau diedit                  |
| `.pawang/prototype/kit.js` | Runtime browser prototype-kit                     | Menang di lane prototype; artefak generated |

Beri tahu user bahwa runtime prototype ada di `.pawang/prototype/kit.js`, bukan `.pawang/kit.js`.

## Hulu dokumen

Empat dokumen Figr bukan companion script; buat lewat `figr-docs.md` (grill dulu) dan prompt lewat `figr-prompt.md`. Simpan di `.pawang/figr/`: `01-PRD.md`, `02-user-flows.md`, `03-interface-designs.md`, `04-edge-cases.md`, `prompt.md`. Diagram tetap Mermaid di Markdown; viewer HTML opsional lewat `node .pawang/kit.js render diagram --from ...` ke `.pawang/figr/diagrams/`.

## Dua companion script (kontrak sudah diserap)

Kontrak dan urutan kerja sudah diserap ke reference ini; yang tetap companion adalah **script Python + asetnya**. Pawang core tidak membundel atau menulis ulang keduanya. Jadi "diserap" di sini berarti kontraknya, bukan script-nya; karena itu keduanya masih perlu dipasang saat lane Figr dipakai.

- **Hulu - `figr-to-prototype`**: scaffold, audit, mapping DS, dan data store.
- **Hilir - `prototype-kit`**: HTML statis dari `prototype/src` ke `.pawang/prototype/`.

Pasang companion di `.agents/skills/` dengan izin user. Bila belum terpasang, hentikan dan tawarkan pemasangan; jangan meniru script dengan tulisan tangan. Cara pasang, nama folder, dan precheck ada di `companions.md`.

## Plan-first

Sebelum menulis file, susun rencana: layar yang dibuat, komponen/token DS yang dipakai, estimasi putaran dari scan, dan tabel gap DS (item, jenis, nilai atau usulan, asal, file DS yang disentuh). Berhenti sampai user menyetujui rencana dan tabel gap. Upstream tidak meminta izin untuk perubahan DS; ia mencatatnya di `packages/shared/ui/CHANGELOG.md`. Tampilkan ringkasan "Perubahan DS dari hulu" di gerbang hilir agar user tetap menyetujui.

## Hulu - `figr-to-prototype`

1. **Input dan mode.** `scaffold.py` membaca `figr/` (zip atau folder, nama bebas, pilih kandidat terbaru) dan memilih mode otomatis: `init` bila `prototype/packages/shared/ui` belum ada, `sync` bila sudah ada. `figr/` tidak pernah diedit.
2. **Output.** `prototype/` React: Vite+ (`vp`), TypeScript, Tailwind v4; `src/` untuk screen; `packages/shared/ui` = DS master; `src/store` = data terpusat; `.figr-raw/` + `PENDING-MERGE.md` = salinan Figr terakhir dan konflik.
3. **Baca aturan DS.** Urutan otoritas: `AGENTS.md`/`instructions.md` → `design.md` → `guides/*.md` → grep `index.css` → `src/components/*`. Di mode sync, baca juga `PENDING-MERGE.md` dan `CHANGELOG.md`.
4. **Baseline.** `cd prototype && npx vp install` (atau package manager proyek), lalu `npx vp build` dan `npx vp check`. Catat hasil sebelum mengubah apa pun.
5. **Format terpisah.** `npx vp check --fix`. Format dulu supaya diff refactor hanya berisi perubahan makna. DS tidak diformat otomatis.
6. **Audit.** `python scripts/audit.py --root prototype`. Baca temuan: `undefined-token`, `ds-missing-import`, `duplicate-ds-component`, `promote-candidate`, `icon-gap`, data belum terpusat, `ds-docs-drift`, `figr-contract`.
7. **Refactor berurutan.** (1) token `undefined-token`; (2) warning lint nyata; (3) komponen lokal duplikat DS (drop-in lalu adapt); (4) add-to-DS untuk yang tidak ada padanan; (5) pusatkan data ke `src/store`; (6) tipografi (`font-mono`, role, ukuran). Setelah tiap kelompok: `vp check` + `vp build`; buka `?figr_screen=<id>` dan `?sim=loading|error|empty`.
8. **Tambah DS.** Hanya penambahan, nilai dari Figr, peran jelas, kontras AA. Ikuti `ds-sync.md`: token di `index.css` + `guides/colors.md`; ikon di `Icon.tsx` (`IconName` + `PATHS`); komponen di `src/components/<Nama>/` + `components.md` + resep; perbarui hitungan dokumen. Catat di `CHANGELOG.md`. Perubahan DS harus bisa dipisah agar bisa disetujui atau ditolak di hilir.
9. **Sync Figr baru.** Jalankan `scaffold.py` mode sync. Aturan tiga arah: tambahan Figr masuk bila lokal belum menyentuh; perubahan di kedua sisi → lokal menang, dicatat `[manual]` di `PENDING-MERGE.md`; file yang dihapus Figr tidak dihapus. Selesaikan konflik manual satu per satu, jangan menimpa seluruh file.
10. **Verifikasi dan laporan.** `vp check`, `vp test run` bila ada, `vp build`, audit ulang. Laporkan angka sebelum → sesudah, yang diubah per kelompok, tambahan DS (nilai, alasan, kontras, file), yang sengaja tidak diubah, dan yang belum terverifikasi (paritas visual tanpa browser).

## Hilir - `prototype-kit`

1. **Scan.** `scan_repo.py prototype/src --ds prototype/packages/shared/ui --manifest .pawang/prototype/.manifest.json`. Hasil: modul, rute, komponen, ikon lucide, estimasi, dan KESENJANGAN token/DS.
2. **Rencana dan gerbang.** Sajikan arah tampilan, daftar screen (sedikit tapi bermakna), estimasi dari scan (kit ±3 putaran + 1 putaran per 6 file), dan tabel gap DS. Berhenti menunggu persetujuan; tulis nol file.
3. **Update DS lebih dulu.** Hanya penambahan yang disetujui, ambil nilai dari Figr, cek kontras AA. `git diff --stat` DS harus hanya penambahan. Jika DS tidak bisa ditulis, catat usulan di `design-system-additions.md` dan pakai fallback bertanda "belum di DS".
4. **Bangun kit.** `tokens.css` dari `ds_to_tokens.py` (jangan diedit tangan); `icons.js` dari `build_icons.py --ds` (target 0 ikon lucide); `kit.css`/`kit.js` disalin dari `assets/kit-starter/` lalu diisi resep DS; `catalog.html` memuat semua komponen dan varian. Jalankan `check_prototype.py` sampai bersih.
5. **Data.** `data/<modul>.js` per modul, 5-15 baris per entitas, bentuk field dari Figr, teks realistis, tanpa data di file screen.
6. **Screen.** `screens/<modul>.js` per modul, urut dari terkecil. Screen hanya memakai `K.*` dan `DATA.*`; tanpa hex liar, tanpa `style=""` (kecuali dimensi/variabel), tanpa token karangan. Tampilkan keadaan berisi, kosong, error, dan loading yang bermakna.
7. **Verifikasi.** `check_prototype.py` bersih: ikon ada, rute terdaftar, setiap `var(--...)` ada di `tokens.css`, tanpa warna mentah, `:focus-visible`, tanpa dark mode bila DS light-only. Cek manual kontras AA, nama aksesibel, satu CTA utama. `build_icons.py --ds` = 0 lucide; `git diff` DS hanya penambahan.
8. **Serah-terima.** Commit `.pawang/prototype/` termasuk `.manifest.json` (jangan di-`.gitignore`); perubahan DS di commit terpisah. Tunjuk `feature` untuk fitur UI pertama, lalu berhenti: prototype mengunci tampilan, bukan membangun aplikasi.
9. **Sinkronisasi.** `scan_repo.py ... --diff .manifest.json --manifest .manifest.json`. DS berubah → token/ikon/kit/katalog; Figr berubah → data/screen terdampak. Bangun ulang hanya modul yang berubah.

## Output

- `.pawang/figr/` - empat dokumen Markdown + `prompt.md` + `diagrams/` opsional; sumber, bukan output Figr.
- `prototype/` - workbench React dari `figr-to-prototype`; bahan hilir, bukan hasil akhir.
- `.pawang/prototype/` - HTML statis + aset + `.manifest.json` + runtime `kit.js`; ini yang dibuka user dan di-commit.
- HTML statis bersifat visual; alur yang bisa dijalankan penuh tetap hidup di `prototype/` React.

## State setelah prototype berubah

- Jalankan `node .pawang/kit.js theme --refresh`.
- Perbarui `project-overview` (bagian UI) lewat kit.js.
- Tautkan HTML hasil di `references.design` spec fitur.
- `context/` dan `history/` tetap ditulis lewat `.pawang/kit.js`; `.pawang/prototype/` adalah artefak generated, bukan state yang diedit manual.

## Aturan

- **Plan-first** dan tabel gap DS wajib disetujui sebelum menulis file.
- **DS menang.** Bila `prototype/packages/shared/ui/index.css` ada, `prototypes/theme.css` tidak dibaca; jangan menimpa token DS dengan tema lane A.
- **Lane A tidak dipakai** bila proyek punya Figr/DS; `prototypes/` hanya untuk proyek tanpa Figr.
- **`.pawang/figr/` = dokumen sumber Markdown; `figr/` = output mentah Figr.** Jangan mencampur atau memindahkan empat dokumen ke `figr/`.
- **Diagram**: Mermaid di Markdown adalah sumber; HTML di `.pawang/figr/diagrams/` hanya generated lewat kit.js, jangan diedit manual.
- Jangan biarkan `prototype-kit` menulis ke `prototype/` di akar repo; arahkan eksplisit ke `.pawang/prototype/`.
- **Dua kit.js**: `.pawang/kit.js` = state CLI (jangan ditimpa); `.pawang/prototype/kit.js` = runtime browser.
- **Artefak skill yang dikenal** (PRODUCT.md, DESIGN.md, blueprint/, figr/, CODING_STANDARDS.md, GLOSSARY.md, dll.) dirutekan atau ditautkan di peta dokumen AGENTS.md. Yang tidak dikenal: tanya user, jangan dipindah atau disalin.
- **Companion** dipasang di `.agents/skills/` dengan izin user; pawang hanya menyimpan kontrak. Nama skill hulu `figr-to-prototype`.
- **Script/aset Python tetap di companion**; jangan membundel atau menulis ulang di pawang.
- **Berhenti setelah HTML jadi.** Prototype mengunci tampilan, bukan membangun aplikasi.

## Kesalahan umum

- Menulis `prototype/` atau `.pawang/prototype/` sebelum plan dan tabel gap disetujui.
- Membiarkan `prototype-kit` menulis ke `prototype/` (default) alih-alih `.pawang/prototype/`.
- Menimpa `.pawang/kit.js` dengan runtime prototype, atau mengedit HTML `.pawang/prototype/` manual.
- Memakai lane A (`prototypes/` + `theme.css`) padahal proyek punya `figr/`.
- Menaruh empat dokumen Figr di `figr/` atau mencampurnya dengan output mentah.
- Menjadikan HTML diagram sebagai sumber; sumber tetap blok Mermaid di `.pawang/figr/*.md`.
- Menambah atau mengubah DS di kit tanpa memperbarui DS master lebih dulu.
