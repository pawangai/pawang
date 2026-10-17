# Vite+ di prototype ini

Toolchain: Vite+ (`vp`), satu paket `vite-plus` yang membungkus Vite, Rolldown, Vitest, Oxlint, Oxfmt.
Dokumentasi resmi: https://viteplus.dev/guide/ — baca kalau ada perintah atau opsi yang tidak tercantum di sini.

Semua catatan di bawah **sudah diuji** pada hasil Figr sungguhan (vite-plus 1.3.0, TypeScript 7, npm),
bukan hanya dibaca dari dokumentasi. Versi bisa berubah; bila sesuatu gagal, cek `vp help` dan dokumentasinya.

## Pakai CLI lokal, bukan global

`vite-plus` ada di devDependencies, jadi perintahnya jalan lewat package manager tanpa instalasi global:
`npx vp check`, `pnpm exec vp check`, `yarn vp check`, atau `bunx vp check`.

Alasannya: instalasi global (`curl -fsSL https://vite.plus | bash`) juga mengatur Node dan package manager
di mesin pemakai (bisa dimatikan dengan `vp env off`), dan di sandbox/CI domain `vite.plus` sering tidak
bisa diakses sementara npm registry bisa. Bila user sudah memasang `vp` global, perintahnya sama persis
dan otomatis memakai salinan lokal.

## Perintah yang dipakai skill

| Perintah | Fungsi |
|---|---|
| `vp install` | install dependency sesuai field `packageManager` / lockfile |
| `vp check` | format + lint + type-check sekaligus (gagal bila ada error) |
| `vp check --fix` | sama, plus menulis hasil format dan perbaikan otomatis |
| `vp build` | build produksi → `dist/` |
| `vp dev` | dev server |
| `vp test run` | Vitest bawaan (v5): tes store di `src/store`. Tes render React butuh `jsdom` (`npm i -D jsdom`) |
| `vp run <nama>` | menjalankan script `package.json`. `vp dev` dan `vp build` adalah perintah bawaan, bukan script |

## Konfigurasi: satu file `vite.config.ts`

Tidak ada `.eslintrc`, `.prettierrc`, `.oxlintrc`, ataupun `vitest.config.ts` terpisah. Semuanya di blok
`lint`, `fmt`, `test` pada `defineConfig` dari `vite-plus`. **Jangan membuat file config terpisah**:
itu akan berbenturan dengan konfigurasi dari `vite.config.ts`.

Template di `assets/vite.config.ts` memuat tiga hal yang masing-masing ada alasannya:

1. **`ignorePatterns` untuk `lint` dan `fmt`** (`packages/shared/ui/**`, `**/.figr/**`, `.figr-raw/**`, `dist/**`).
   DS adalah master dan boleh diedit, tetapi **tidak diformat otomatis**: Oxfmt menulis ulang hampir semua
   file DS, sehingga setiap file tampak "diubah lokal" dan sinkronisasi dengan DS Figr (`scaffold.py`) menjadi
   konflik semua. Diuji: dengan ignore ini, hash semua file DS tidak berubah setelah `vp check --fix`. Tambahan
   baru ke DS ditulis dengan gaya file di sekitarnya. `.figr-raw` juga diabaikan karena itu salinan referensi.
2. **`lint.options: { typeAware: true, typeCheck: true }`**. Tanpa ini `vp check` tidak menangkap error tipe
   (hanya format dan lint). Diuji: dengan opsi ini, `const x: number = "salah"` terdeteksi sebagai TS2322.
3. **Alias `@shared/ui`** → `packages/shared/ui/src`, dipasangkan dengan `paths` di `tsconfig.json`.
   DS sengaja tanpa `package.json` (aturan DS), jadi ia dipakai sebagai folder sumber lewat alias, bukan
   sebagai workspace package.

## Jebakan yang sudah ditemui

- **CSS tidak ter-load.** `main.tsx` buatan Figr tidak meng-import `index.css` (Figr menyuntikkannya).
  Tanpa `<link rel="stylesheet" href="/src/index.css">` di `index.html`, build lolos tetapi tidak ada file CSS
  di `dist/` dan halaman tampil tanpa style. Template `index.html` sudah memuatnya; jangan mengedit `main.tsx`.
- **Tailwind v4 hanya men-scan folder yang didaftarkan.** `src/index.css` perlu
  `@source "../packages/shared/ui/src";` di samping `@source "./";`, kalau tidak class dari komponen DS
  tidak ter-generate. `scaffold.py` menambahkannya.
- **Import DS bawaan Figr rusak.** `index.css` hasil Figr mengimpor `figr-ds-<hash>/index.css`, nama paket
  yang tidak ada di struktur ini (dan hash-nya bisa berbeda dari manifest DS). `scaffold.py` menggantinya
  dengan path relatif.
- **TypeScript 7 menghapus `baseUrl`.** `tsconfig.json` memakai `paths` saja; `baseUrl` membuat type-check
  gagal dengan "Invalid tsconfig".
- **`@types/node` wajib** karena `vite.config.ts` memakai `node:url`.
- **Override `vite`.** `vite-plus` sudah membawa core Vite dan Vitest sendiri, jadi tidak perlu override
  Vitest. Satu override `vite → npm:@voidzero-dev/vite-plus-core@<versi vite-plus>` ditambahkan supaya plugin
  pihak ketiga (`@tailwindcss/vite` yang peer-depend pada `vite`) tidak menarik salinan Vite kedua. Letaknya
  `overrides` (npm/bun), `pnpm.overrides` (pnpm), atau `resolutions` (yarn); flag `--pm` pada `scaffold.py`
  memilih yang benar. Versi paket pendamping tidak selalu sama dengan `vite-plus`
  (mis. `@voidzero-dev/vite-plus-test` punya penomoran sendiri), jadi jangan menyamakan versinya tanpa
  mengecek `npm view`.

## Baseline yang wajar pada hasil Figr

Pada hasil Figr pertama: `vp build` lolos; `vp check` awalnya gagal **hanya karena format** (hampir semua file
`src/` belum diformat, `Audit.tsx` 76 baris menjadi 638 baris setelah diformat dan baris >200 karakter
turun dari 211 ke 1). Setelah `vp check --fix`: 0 error dan 7 warning (6 `no-unused-vars`, 1 `no-floating-promises`). Warning itu nyata (variabel tak terpakai di `Role.tsx`, `Pengguna.tsx`, `Integrasi.tsx`);
perbaiki dengan menghapus, atau awali `_` bila parameter memang harus ada, dan jangan mengubah perilaku.

Urutan yang disarankan: **format dulu, di langkah tersendiri**, baru refactor. Dengan begitu diff refactor
hanya berisi perubahan makna, tidak tercampur ratusan baris yang cuma berpindah baris.
