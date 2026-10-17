# Menerjemahkan design system ke kit HTML

Daftar isi: 1. Peta sumber · 2. Tailwind → CSS · 3. Resep komponen · 4. Kesenjangan · 5. Aturan yang paling sering dilanggar

## 1. Peta sumber DS (paket yang berbentuk Tailwind v4)
| Berkas | Dipakai untuk | Di kit |
|---|---|---|
| `index.css` (`@theme`, `@utility`) | Nilai token. Otoritas tertinggi | `tokens.css` lewat `ds_to_tokens.py` |
| `design.md` | Keputusan token inti, aturan | dibaca sebelum menulis `kit.css` |
| `guides/components.md` | Resep per komponen (kelas utilitas yang dipakai) | `kit.css` + `kit.js` |
| `guides/buttons.md`, `colors.md`, `typography.md`, `layout.md` | Aturan normatif | `kit.css` |
| `guides/patterns.md` | Urutan halaman, section | susunan screen |
| `src/components/*` | Implementasi acuan (bisa menyimpang dari guide) | rujukan, bukan otoritas |
| `Icon.tsx` (`PATHS`) | Set ikon resmi | `icons.js` lewat `build_icons.py --ds` |

Jika paket lain tidak persis begini, cari padanannya: berkas token CSS/JSON, dokumen aturan, dan daftar komponen. Prinsip urutan otoritas tetap: nilai token > aturan tertulis > komponen > contoh halaman.

## 2. Tailwind → CSS (nama token tetap)
| Utilitas | CSS di kit |
|---|---|
| `bg-primary`, `text-muted`, `border-border` | `var(--color-primary)`, `var(--color-muted)`, `var(--color-border)` |
| `rounded-sm/md/lg/pill` | `var(--radius-sm/md/lg/pill)` |
| `p-4`, `gap-3`, `h-12` (irama `--spacing`) | `calc(var(--spacing)*4)`, dst. (alias `--sp-N` di `kit.css`) |
| `text-body`, `text-label`, `text-h4` (satu peran per teks) | `font:var(--type-body)` (+ `letter-spacing:var(--type-h4-ls)` bila ada) atau kelas `.text-body` |
| `shadow-card/float/header` | `var(--shadow-card)` dst. |
| `max-w-page` / `max-w-prose` | `var(--container-page)` / `var(--container-prose)` |
| `hover:`, `active:`, `focus-visible:` | `:hover`, `:active`, `:focus-visible` |
| `md:` (satu-satunya breakpoint DS) | `@media (min-width:48rem)` |
| warna dengan opasitas, mis. `navy-900/60` | `color-mix(in srgb, var(--color-navy-900) 60%, transparent)` |

Satu peran tipografi per node teks. Jangan menambah `font-weight`/`letter-spacing` untuk mengulang peran.

## 3. Resep komponen
Baca baris komponen di `guides/components.md` dan terjemahkan **semua** yang tertulis: ukuran, status (hover, disabled, selected, error), `role`/ARIA, perilaku (Dialog native, Esc menutup, scrim menutup). Contoh yang sudah ada di starter: Button (48/36/56px + area sentuh 44px), StatusPill (nada success/warning/danger/training/neutral), Callout, EmptyState/ErrorState, Dialog, Input, Avatar (warna `avatar-1…6`), Tabs/Chip bila dipakai.

Komponen lokal di repo (mis. `ui/kit.tsx`) sering "dibangun ulang dari resep DS", jadi telusuri komentar `Resep:` atau nama DS di kodenya untuk mencari resep yang dirujuk.

## 4. Kesenjangan (tambahkan ke DS, jangan ditambal di kit)
Jenis: token yang dipakai repo tapi tidak ada di `index.css`; ikon di luar `Icon` DS; komponen repo tanpa resep; guide yang menyebut utilitas yang tidak didefinisikan (cek `grep -n` di `index.css`). Tindakan: kumpulkan jadi satu tabel usulan, minta persetujuan sekali, lalu tambahkan ke DS (Langkah 3 di SKILL.md) sebelum kit dibangun. Hanya penambahan; nilai diambil dari figr dan diberi peran, bukan dikarang. Fallback hanya untuk item yang ditolak user: peran DS terdekat untuk token, lucide untuk ikon, rakitan token untuk komponen, semuanya ditandai "belum di DS". Contoh yang pernah muncul: `bg-danger-soft` dan `bg-skeleton` dipakai screen tetapi tidak ada di DS.

## 5. Aturan DS yang paling sering dilanggar (cek ulang sebelum selesai)
- CTA selalu `primary` (hijau), identitas Training memakai `training`, tidak pernah untuk aksi.
- Latar navy memakai `white`/`on-dark`/`on-dark-muted`, bukan `muted`.
- Aksi WhatsApp: `bg-whatsapp` dengan teks `navy-900`.
- Kartu statis datar; `shadow-card` hanya untuk kartu terangkat/hover.
- Tidak ada hex, nilai arbitrer, atau dark mode di kit. Token, shade, dan ikon baru hanya masuk lewat DS (Langkah 3), tidak langsung di kit.
- `text-placeholder` hanya untuk placeholder.
- Kontras AA 4,5:1 (teks biasa) dan 3:1 (teks besar, batas UI); fokus keyboard terlihat; ikon dekoratif `aria-hidden`, ikon-saja punya nama.
