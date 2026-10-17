# Kontrak kit

## Aturan umum
- Komponen = fungsi `K.nama(props)` yang mengembalikan **string HTML**. Teks dari data selalu lewat `K.esc()`; argumen `body`/`children` dianggap HTML tepercaya.
- Variasi lewat atribut, bukan class baru: `data-tone`, `data-variant`, `data-size`, `data-state`, `data-open`.
- Satu event listener terdelegasi di `document`. Aksi deklaratif lewat `data-action`:
  - `dialog:open:<id>` / `dialog:close`
  - `toast:<tone>:<pesan>`
  - `go:<rute>` (atau pakai `href="#/rute"`)
- Rute: `K.route('/pasien/:id', (p) => html)`; `K.go('/rute')`. Router memakai hash supaya jalan dari `file://`.

## Atribut standar
| Atribut | Nilai |
|---|---|
| `data-tone` | `neutral` `primary` `success` `warning` `danger` `training` |
| `data-variant` | `primary` `secondary` `ghost` `danger` |
| `data-size` | `sm` `md` `lg` |
| `data-state` | `default` `active` `disabled` `loading` `selected` |

## Komponen starter (pemetaan dari `ui/kit.tsx` repo)
Button, Pill, Avatar, CountBadge, Banner, EmptyState, SectionCard, InfoRow, KpiStrip, Timeline, MeterBar, Table (list), Field (form), SearchInput, Toggle, Dialog, Toast, Shell (sidebar+topbar).

Tambah komponen baru: (1) fungsi di `kit.js`, (2) gaya di `kit.css` memakai variabel dari `tokens.css`, (3) contoh di `catalog.html`, (4) baru dipakai screen.

## Token
`tokens.css` dihasilkan `ds_to_tokens.py` dari `index.css` design system dan **tidak diedit tangan**. Nama token sama dengan DS: `--color-*`, `--radius-*`, `--container-*`, `--font-*`, `--spacing`, `--type-<peran>` (shorthand font), `--shadow-<nama>`. `kit.css` hanya boleh memakai token yang ada di sana (dicek `check_prototype.py`). Alias turunan (`--sp-N` dari `--spacing`, variabel lokal seperti `--s`, `--t-bg`) boleh didefinisikan di `kit.css`.

## Ikon
`icons.js` berisi `K_ICONS = { nama: '<path .../>' }` (grid 24, stroke 2). Dibuat `build_icons.py --ds`: ikon `Icon.tsx` DS lebih dulu, ikon yang belum ada ditambahkan ke `Icon.tsx` DS lebih dulu, jadi lucide tidak lagi dipakai langsung kecuali item yang ditolak user. Pakai `K.icon('nama', {size:16})`. Ikon dekoratif otomatis `aria-hidden`; tombol ikon-saja wajib `aria-label`.
