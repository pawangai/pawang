# DS di prototype adalah master

`prototype/packages/shared/ui` adalah source of truth. Semua yang dipakai `prototype/src` harus ada di
sana. Dua arah kerja, keduanya dibahas di sini:

1. **Prototype memakai sesuatu yang belum ada di DS** → tambahkan ke DS (bagian 2–3).
2. **Figr menghasilkan versi baru** (DS atau screen) → gabungkan tanpa menimpa master (bagian 4).

## Daftar isi
1. Pakai yang ada, atau tambah?
2. Menambah ke DS: file mana yang ikut berubah
3. Setelah menambah: verifikasi dan catatan
4. Menggabungkan hasil Figr baru
5. Hal yang sengaja tidak dilakukan

## 1. Pakai yang ada, atau tambah?

Instruksi DS sendiri (`instructions.md`, bagian 1) berkata "tanya dulu sebelum mengarang token atau komponen"
dan "jangan menambah warna/role baru kecuali diminta". Di repo ini kamu **sudah diminta**: DS adalah master dan
harus mengikuti prototype. Tetapi tetap hemat, karena DS yang membengkak sama buruknya dengan DS yang kurang:

1. **Ada padanan setara di DS?** Ganti pemakaian di prototype. Jangan menambah.
   (mis. `bg-skeleton` → `Skeleton` DS; `rounded-full` → `rounded-pill`; `text-2xl` → role terdekat.)
2. **Tidak ada, dan itu sebuah konsep** yang dipakai (atau jelas akan dipakai) di lebih dari satu tempat:
   tambahkan ke DS. (token `danger-soft`, komponen `NavTabs`, ikon `inbox`, pola `ListPanel`.)
3. **Nilai sekali pakai** (`aspect-[210/297]` untuk pratinjau A4, `w-[400px]` pada satu panel): biarkan di
   prototype. Bukan tugas DS.

Bila dua nilai sama masuk akal (mis. dua kandidat warna), pilih yang mengikuti pola DS yang sudah ada, lalu catat
pilihan itu sebagai **asumsi** di `CHANGELOG.md` dan laporan akhir. Jangan berhenti untuk bertanya: skill ini tidak
meminta persetujuan. User menyetujui atau menolak di hilir (`prototype-kit`), yang menampilkan perubahan DS ini di
gerbang rencananya.

## 2. Menambah ke DS: file mana yang ikut berubah

DS punya urutan otoritas: `index.css` > `design.md` dan `guides/` > `src/components/*`. Kode dan dokumen harus
berubah bersama; kalau tidak, DS menyimpang dari dirinya sendiri. Cara menemukan semua tempat untuk sebuah
tambahan: `grep -rl "<saudara-terdekat>" packages/shared/ui` (mis. `warning-soft` untuk token baru), lalu perbarui
setiap file yang menyebutnya selain kode pemakainya. Hasil pemeriksaan pada DS Medilana:

### Token warna
| File | Perubahan |
|---|---|
| `index.css` (`@theme static`) | tambah `--color-<nama>: #hex;` di kelompok yang sama dengan saudaranya |
| `guides/colors.md` | tambah baris, lengkap dengan **rasio kontras** (DS mencatatnya, mis. "5.02:1 on white and 4.84:1 on `warning-soft`") |
| `design.md` baris 2 | hitung ulang "N color tokens"; tambah di "Core Token Decisions" hanya bila ini keputusan inti |
| `guides/components.md` | bila token dipakai komponen baru, sebut di resepnya |

Turunkan nilainya dari pola yang ada, jangan memilih warna baru dari nol: token `*-soft` adalah tint sangat
terang dari hue token dasarnya (`primary-soft #f0fdf4`, `warning-soft #fffbeb`, `training-soft #fff5f5`).
Hitung kontras dengan `scripts/contrast.py`; teks dasar di atas tint harus ≥ 4.5:1.

Contoh nyata dari hasil Figr awal: `bg-danger-soft` dipakai tiga kali tetapi tidak ada. `danger` = `#c2410c`,
tint terang dari hue yang sama = `#fff7ed`, dan `python scripts/contrast.py danger danger-soft --css <index.css>`
memberi 4.88:1 (lulus).

### Role tipografi
`@utility text-*` di `index.css`, `guides/typography.md`, hitungan di `design.md`. Tambah hanya bila tidak ada
role terdekat. Baca `guides/typography.md` lebih dulu; kebanyakan `text-sm`/`text-2xl` cukup dipetakan ke role yang ada.

### Ikon
| File | Perubahan |
|---|---|
| `src/components/Icon/Icon.tsx` | tambah nama ke union `IconName` **dan** entri `PATHS` dengan nama yang sama |

Ikon DS adalah SVG inline (viewBox 24, `strokeWidth` 2, ujung bulat), persis gaya lucide, jadi path ikon
lucide bisa dipindahkan apa adanya. Datanya ada di
`node_modules/lucide-react/dist/esm/icons/<nama-kebab>.mjs`, pada array `node` (`["path", { d: "…" }]`,
`["polyline", { points: "…" }]`, …; abaikan `key`). Tulis ulang sebagai elemen JSX di `PATHS`, sama seperti entri
lain di berkas itu. Dengan begitu tampilannya sama dengan yang sudah dipakai screen. Setelah semua pemakaian diganti ke `<Icon name=…/>`, hapus
`lucide-react` dari `package.json` bila sudah tidak ada importnya. `audit.py` melaporkan ketidaksinkronan
`IconName` ↔ `PATHS` sebagai error (`ds-docs-drift`).

### Komponen
| File | Perubahan |
|---|---|
| `src/components/<Nama>/<Nama>.tsx` | komponen; hanya token DS, props bertipe, a11y (role/label), tanpa library pihak ketiga, ikon hanya lewat `Icon` |
| `src/components/<Nama>/index.ts` | `export * from "./<Nama>";` |
| `components.md` | tambah ke pohon file dan perbarui hitungan "N components" |
| `guides/components.md` | tambah baris resep: peran, token yang dipakai, aturan a11y |
| `design.md` | hanya bila mengubah ringkasan atau aturan |

Sebelum menulis komponen, baca komponen saudara di DS (mis. `Tabs`, `Callout`) dan tiru cara mereka menyusun
props, varian, dan a11y. Komponen admin yang kini hidup di `src/ui` (`Field`, `Select`, `Table`, `ListPanel`, …)
dipindahkan **utuh**, dengan perbaikan token/ikon seperlunya, lalu `src/ui` mengimpornya dari `@shared/ui`.
Jangan menulis ulang dari nol; tampilan prototype harus tetap sama.

## 3. Setelah menambah: verifikasi dan catatan

1. `python scripts/audit.py --root prototype`: `ds-docs-drift`, `ds-missing-import`, `undefined-token` harus 0 untuk
   yang baru kamu tambahkan.
2. `npx vp check` lalu `npx vp build`.
3. Tulis satu entri di `packages/shared/ui/CHANGELOG.md` (buat bila belum ada): tanggal, apa yang ditambah,
   nilainya, alasannya, asumsi bila ada pilihan, file yang disentuh. Ini bukan formalitas: kelak perubahan ini mungkin perlu dibawa kembali ke
   Figr, dan catatan itulah satu-satunya jejaknya. `scaffold.py` memperlakukan file ini sebagai tambahan lokal,
   jadi tidak akan pernah ditimpa.
4. Laporkan semua tambahan DS dalam satu daftar di akhir pekerjaan (nilai, alasan, kontras).

## 4. Menggabungkan hasil Figr baru

`python scripts/scaffold.py` memilih mode sendiri. Bila DS sudah ada di `prototype/`, mode **sync**:
baseline = `.figr-raw/<jenis>/` (Figr terakhir yang diterapkan), new = isi `figr/` sekarang, local = `prototype/`.

| Keadaan file | Tindakan |
|---|---|
| ada di Figr baru, belum ada di lokal | ditambahkan otomatis |
| berubah di Figr, lokal belum pernah menyentuh | diperbarui otomatis |
| tidak berubah di Figr, lokal berubah | dibiarkan (itu keputusan master) |
| berubah di Figr **dan** di lokal | **lokal dipertahankan**, dicatat `[manual]` |
| dihapus di Figr | tidak dihapus, dicatat `[manual]` |
| tidak ada baseline (`.figr-raw` hilang) dan isi berbeda | `[manual]` |

Perubahan yang `[manual]` tercatat di `.figr-raw/PENDING-MERGE.md`, karena baseline langsung diganti ke versi
Figr terbaru dan tanpa catatan itu konflik akan terlupakan pada sync berikutnya.

**Menyelesaikan satu konflik**: bandingkan versi Figr (`figr/…`) dengan versi lokal, lalu terapkan hanya bagian
Figr yang memang diinginkan ke versi lokal (mis. nilai token baru dari Figr, tetapi `danger-soft` buatan master
tetap ada). Jangan menyalin seluruh file Figr ke atas file lokal. Hapus barisnya dari `PENDING-MERGE.md` setelah
selesai, lalu `vp check`, `vp build`, dan audit ulang.

Setelah sync yang mengubah DS, jalankan audit: tambahan Figr bisa mengubah token atau API komponen yang dipakai
screen, dan `ds-docs-drift` akan memberi tahu bila tambahan itu belum tercatat di `components.md`.

## 5. Hal yang sengaja tidak dilakukan

- **`.figr/**` di DS tidak digabung.** Isinya metadata generate (mis. `contentHash` di `publish-manifest.json`).
  Hash itu tidak akan cocok lagi begitu master diedit; itu wajar. Jangan "memperbaikinya".
- **DS tidak diformat otomatis** (`vp fmt` mengabaikannya). Oxfmt menulis ulang hampir semua file, sehingga setiap
  file tampak "diubah lokal" dan seluruh sync berikutnya menjadi konflik. Tulis tambahan dengan gaya file di
  sekitarnya.
- **Tidak menambah `package.json` di DS.** DS dipakai lewat alias `@shared/ui`, bukan sebagai package.
- **Tidak ada dark mode, bayangan, atau radius baru** hanya karena prototype memakai class Tailwind bawaan
  (`shadow-md`, `rounded-xl`): petakan ke efek/radius DS yang ada.
