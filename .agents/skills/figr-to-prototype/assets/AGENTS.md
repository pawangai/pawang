# AGENTS.md — Prototype (Figr → scaffold)

Prototype screen hasil generate Figr, dirapikan ke struktur scaffold. Bahasa UI: Indonesia.

## Peta folder

- `src/` — prototype screen. Boleh dirapikan dan dipusatkan datanya.
- `src/store/` — data terpusat (`db.ts` = satu-satunya sumber data). Dibuat skill, bukan dari Figr.
- `packages/shared/ui/` — design system. **MASTER / source of truth.** Semua yang dipakai `src/` harus ada di sini.
- `.figr-raw/` — salinan Figr terakhir yang sudah diterapkan (dasar diff). Jangan edit.
  `.figr-raw/PENDING-MERGE.md` = perubahan Figr yang belum digabung.
- `../figr/` — hasil generate Figr mentah (masukan). Jangan edit.
- `../.pawang/prototype/` — HTML statis buatan `prototype-kit` (hilir). Dihasilkan; jangan edit `tokens.css` dengan tangan.

## Urutan baca sebelum tugas UI apa pun

1. `packages/shared/ui/instructions.md` (AGENTS DS) → `design.md` → `guides/*.md` yang relevan
2. grep `packages/shared/ui/index.css` untuk nilai token yang tepat
3. cek `packages/shared/ui/src/components/` sebelum menulis komponen baru

## Aturan DS (master)

- Bila `src/` butuh token, ikon, atau komponen yang belum ada: **tambahkan ke DS**, jangan menaruhnya di `src/ui`.
  Cara menambah (file mana saja yang ikut berubah) ada di skill `figr-to-prototype` → `references/ds-sync.md`.
- Perubahan Figr pada DS hanya menambah; konflik dengan versi di sini selalu dimenangkan versi di sini.
- DS tidak diformat otomatis (lihat komentar di `vite.config.ts`). Jangan tambah `package.json` di dalam DS.

## Kontrak Figr — jangan diubah

- `src/screens.figr.json` dan `src/useScreenInit.ts` (parameter `?figr_screen=`)
- `src/ui/states.tsx` (`useMockQuery`, `useMockSubmit`, `useInitialDialog`): simulasi loading/error/empty. Jangan diedit;
  bungkus lewat `src/store/useDbQuery.ts`.
- route di `src/routes.tsx` harus tetap cocok dengan manifest

## Data

- Screen membaca/menulis lewat `db` (`src/store/db.ts`); tidak ada data mock atau salinan state per screen.
- Seed harus menghasilkan tampilan awal yang sama dengan sebelum dipusatkan.

## Perintah (Vite+, CLI lokal)

`vp install` · `vp dev` · `vp check` (format + lint + type) · `vp build`. Script `package.json` dijalankan dengan `vp run <nama>`.
