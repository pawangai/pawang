# Prompt Figr - template siap tempel

Tujuan: menyusun prompt untuk Figr Design dari empat dokumen di `.pawang/figr/` dan menyimpannya sebagai `.pawang/figr/prompt.md`. Prompt ini yang membuat agent Figr paham sumber kebenaran, design system, output, dan kapan harus bertanya.

## Kapan dipakai

- Empat dokumen Figr sudah ada (lihat `figr-docs.md`) dan user mau generate prototype di Figr Design.
- User minta "prompt Figr", "prompt prototype", atau prompt untuk melanjutkan prototype yang sudah ada.
- Jangan pakai sebelum empat dokumen ada; prompt ini mengasumsikan file itu dilampirkan.

## Template

Salin apa adanya, isi placeholder, lalu hapus baris yang tidak relevan. Target **<1000 karakter** setelah diisi.

```text
Tugas: buat prototype screen untuk [PROJECT].

Sumber kebenaran:
- 01-PRD.md → daftar modul/submodul/screen (acuan utama; jangan tambah/kurangi).
- 02-user-flows.md, 03-interface-designs.md, 04-edge-cases.md → alur, layout, state.
- [PROTOTIPE_LAMA] → prototype lama; lanjutkan, jangan duplikasi.
- [DOCGEN] → template dokumen, bila ada.

Design system:
- Gunakan [DS_NAME] di [DS_PATH]: token, tipografi, index.css; jangan hardcode.
- Jangan buat aturan desain baru. Pola/komponen baru → [DS_NAME], bukan design.md root; simpan di [UI_KIT].

Output:
- Prototype [HTML/React] per screen di [OUTPUT_PATH], data mock.
- Tiap screen memuat state dari 04-edge-cases.md.
- Tampilkan daftar screen (ada/perbaiki/baru) dan tunggu persetujuan.
- Mulai modul [MODULE]; jangan ubah file di luar lingkupnya.
- Jika ambigu/bertentangan, tanya dulu.
```

## Cara mengisi

| Placeholder        | Isi                                                         | Contoh                                     |
| ------------------ | ----------------------------------------------------------- | ------------------------------------------ |
| `[PROJECT]`        | Nama proyek/aplikasi                                        | `fe-erp`, `company-profile`, `toko-online` |
| `[PROTOTIPE_LAMA]` | File prototype yang dilampirkan; hapus baris bila tidak ada | `file .txt terlampir`                      |
| `[DOCGEN]`         | Template dokumen; hapus baris bila tidak ada                | `docgen.html terlampir`                    |
| `[DS_NAME]`        | Nama design system                                          | `medilana-ds`                              |
| `[DS_PATH]`        | Folder DS yang memuat `index.css`                           | `/sources/medilana-ds`                     |
| `[UI_KIT]`         | Folder pola/komponen app                                    | `ui/kit`                                   |
| `[HTML/React]`     | Target output                                               | `React`, `HTML`                            |
| `[OUTPUT_PATH]`    | Folder prototype                                            | `fe-erp/modules`                           |
| `[MODULE]`         | Modul/halaman pertama                                       | `fe-crm`, `home`, `checkout`               |

Aturan:

- Isi semua placeholder; jangan meninggalkan `[...]`.
- Hapus baris `PROTOTIPE_LAMA`/`DOCGEN` bila tidak ada, dan hapus "lanjutkan" bila prototype dibuat dari nol.
- Untuk proyek non-modul (landing page, company profile), ganti "modul" dengan "halaman/section" dan isi `[MODULE]` dengan halaman pertama.
- `01-PRD.md` adalah acuan daftar screen. Jika `03-interface-designs.md` berbeda, minta Figr bertanya; jangan memilih sendiri.
- DS wajib punya `index.css`; jika tidak ada, jangan mengarang path — tanyakan user.
- Prompt yang sudah diisi disimpan di `.pawang/figr/prompt.md`; file itu yang ditempel ke Figr, bukan template ini.

## Contoh terisi

**ERP multi-modul**

```text
Tugas: buat prototype screen untuk fe-erp.

Sumber kebenaran:
- 01-PRD.md → daftar modul/submodul/screen (acuan utama; jangan tambah/kurangi).
- 02-user-flows.md, 03-interface-designs.md, 04-edge-cases.md → alur, layout, state.
- File .txt terlampir → prototype lama; lanjutkan, jangan duplikasi.
- docgen.html terlampir → template dokumen, bila ada.

Design system:
- Gunakan medilana-ds di /sources/medilana-ds: token, tipografi, index.css; jangan hardcode.
- Jangan buat aturan desain baru. Pola/komponen baru → medilana-ds, bukan design.md root; simpan di ui/kit.

Output:
- Prototype React per screen di fe-erp/modules, data mock.
- Tiap screen memuat state dari 04-edge-cases.md.
- Tampilkan daftar screen (ada/perbaiki/baru) dan tunggu persetujuan.
- Mulai modul fe-crm; jangan ubah file di luar lingkupnya.
- Jika ambigu/bertentangan, tanya dulu.
```

**Landing page / company profile**

```text
Tugas: buat prototype screen untuk company-profile.

Sumber kebenaran:
- 01-PRD.md → daftar halaman/section (acuan utama; jangan tambah/kurangi).
- 02-user-flows.md, 03-interface-designs.md, 04-edge-cases.md → alur, layout, state.

Design system:
- Gunakan acme-ds di /sources/acme-ds: token, tipografi, index.css; jangan hardcode.
- Jangan buat aturan desain baru. Pola/komponen baru → acme-ds, bukan design.md root; simpan di src/ui.

Output:
- Prototype HTML per halaman di src/pages, data mock.
- Tiap halaman memuat state dari 04-edge-cases.md.
- Tampilkan daftar halaman (ada/perbaiki/baru) dan tunggu persetujuan.
- Mulai halaman home; jangan ubah file di luar lingkupnya.
- Jika ambigu/bertentangan, tanya dulu.
```

## Pemeriksaan

- Hitung panjang prompt setelah diisi: target <1000 karakter (`wc -m`).
- Tidak ada placeholder tersisa.
- Empat dokumen disebut; `01-PRD.md` ditandai acuan daftar screen.
- Aturan DS: token, tanpa hardcode, pola baru ke DS, bukan `design.md` root.
- Output: per screen, path, data mock, state dari `04-edge-cases.md`.
- Ada instruksi berhenti untuk persetujuan daftar screen.
- Ada instruksi bertanya saat ambigu/bertentangan.

## Larangan

- Menempel template mentah dengan placeholder ke Figr.
- Menulis prompt sebelum empat dokumen ada.
- Mengarang path DS/output atau menambah screen di luar `01-PRD.md`.
- Memasukkan HTML diagram sebagai pengganti Markdown; Figr membaca dokumen Markdown.
- Menyimpan prompt proyek di luar `.pawang/figr/prompt.md`.
