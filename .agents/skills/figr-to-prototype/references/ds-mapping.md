# Mapping prototype Figr → design system

Dipakai di langkah refactor. Tabel ini hasil membaca API kedua sisi pada hasil Figr yang diuji, jadi
**cek ulang `packages/shared/ui/src/components/<Nama>/<Nama>.tsx`** sebelum mengganti: DS adalah master dan
bisa sudah berubah. Sumber kebenarannya file itu, bukan tabel ini.

Cara menambah sesuatu ke DS (file mana yang ikut berubah, kontras, catatan) ada di `ds-sync.md`.

## Daftar isi
1. Tiga tingkat keputusan
2. Komponen lokal → komponen DS
3. Ikon
4. Class dan token bermasalah
5. Laporan tambahan DS

## 1. Tiga tingkat keputusan

| Tingkat | Arti | Tindakan |
|---|---|---|
| **drop-in** | padanan DS ada, API setara | ganti import, hapus versi lokal |
| **adapt** | padanan DS ada, API beda | ganti import **dan** sesuaikan pemanggil. Bila pemanggilnya banyak dan beda-beda, buat satu adapter tipis di `src/ui/` yang memakai komponen DS di dalamnya, bukan mengedit puluhan call site sekaligus |
| **add-to-ds** | tidak ada padanan | **tambahkan ke DS** (`ds-sync.md`), lalu pakai dari DS dan hapus versi lokal |

Adapter tipis lebih baik daripada edit massal: tiap call site yang disentuh adalah peluang perubahan perilaku
yang tidak disengaja, sedangkan tujuan perapihan ini adalah tampilan tetap sama.

## 2. Komponen lokal → DS

| Lokal (`src/ui`) | DS | Tingkat | Beda yang harus ditangani |
|---|---|---|---|
| `Skeleton` | `Skeleton` | drop-in | DS memakai `bg-border` + `animate-pulse`; lokal memakai `bg-skeleton` dan `animate-skeleton` yang **tidak ada** |
| `ListSkeleton` | `SkeletonList` | adapt | `rows`→`count`, `avatar` (px)→`leading` `"tile"｜"avatar"` |
| `DetailSkeleton` | `SkeletonDetail` | adapt | `cards`→`fields` |
| `ErrorState`, `DetailError` | `ErrorState` | adapt | `body`→`message`; `compact` tidak ada; `onRetry` wajib di lokal, opsional di DS |
| `EmptyState` | `EmptyState` | adapt | `body`→`message`; `action` (node)→`onAction` + `actionLabel` |
| `Chip` | `Chip` | adapt | prop `count` tidak ada |
| `CountBadge` | `CountBadge` | adapt | DS butuh `count` (number) dan `label`; tone `neutral` tidak ada |
| `StatusPill` | `StatusPill` | adapt | tone DS: success·warning·danger·neutral. Tone lokal `info` dan `training` tidak ada (training → `Badge kind="training"`; `info` → tambah tone ke DS bila memang dipakai) |
| `Avatar` | `Avatar` | adapt | `name` wajib; size `sm｜md｜lg`, bukan angka; `icon` tidak didukung; `tone` → `colorKey` |
| `TextInput` | `Input` | adapt | `mono` tidak didukung. Prop `error` kompatibel |
| `SearchField` | `SearchInput` | adapt | lokal `onChange(v: string)`, DS meneruskan event input native |
| `Toggle` | `Switch` | adapt | DS berlaku langsung dan punya teks Aktif/Nonaktif bawaan; cek apakah screen memang berniat begitu |
| `Dialog` | `Dialog` | adapt | `footer`→`actions`; `width` px→`size` `sm｜md`; `description` hanya string; `icon`, `tone`, `busy` tidak ada (tone danger = tombol `variant="danger"` di `actions`) |
| `Button` | `Button` | adapt, **sebagian** | Hanya yang `onClick`. Yang memakai `to` (react-router) jangan diganti `href`: `<a>` memicu reload penuh dan membuang `?figr_screen=`. Pertahankan wrapper tipis untuk `to` (atau tambahkan dukungan link router ke DS bila itu keputusanmu). Ukuran default lokal `sm`, DS `md` |
| `PanelTabs` | — | add-to-ds | Tab berbasis route (`to`). `Tabs` DS untuk ganti konten di tempat, bukan navigasi antar halaman → tambahkan sebagai komponen baru (mis. `NavTabs`) |
| `IconButton`, `Field`, `Select`, `TextArea`, `Checkbox` | — | add-to-ds | tidak ada di DS |
| `Table`, `Card`, `KeyValues`, `FormGrid`, `Notice` | — | add-to-ds | `DataGrid` DS adalah grid editable, bukan tabel baca; `Callout` hanya tone tip/urgent |
| `ListPanel`, `ListRow`, `MenuRow`, `DetailPane`, `DetailHeader`, `AdminLayout` | — | add-to-ds | pola admin; DS awal ini berorientasi situs marketing |

Kerjakan `add-to-ds` setelah `drop-in` dan `adapt`: ia adalah pekerjaan terbesar, dan paling aman bila dilakukan
satu komponen per langkah dengan `vp check` + `vp build` di antaranya. Pindahkan komponen **utuh**, jangan menulis
ulang dari nol.

Setelah mengganti satu komponen, jalankan `vp check` lalu buka layar yang memakainya (`vp dev`, lalu
`?figr_screen=<id>` dari `src/screens.figr.json`) untuk memastikan tampilannya sama.

## 3. Ikon

DS punya `Icon` inline-SVG (23 nama saat dokumen ini ditulis; baca union `IconName` di `Icon.tsx`). DS melarang
library ikon pihak ketiga, sedangkan admin memakai jauh lebih banyak ikon (39 pada hasil Figr yang diuji).

**Ganti langsung yang setara secara visual** (audit `third-party-icons`):

| lucide | DS `Icon name` |
|---|---|
| `Plus` · `X` · `Mail` · `Check` · `Minus` · `Search` · `Calendar` · `Clock` · `Phone` · `Upload` · `Star` · `Lightbulb` | `plus` · `x` · `mail` · `check` · `minus` · `search` · `calendar` · `clock` · `phone` · `upload` · `star` · `lightbulb` |
| `Loader2` | `loader` |
| `AlertTriangle` | `alert` |
| `ArrowRight` · `ChevronDown/Left/Right` | `arrow-right` · `chevron-down/left/right` |
| `MapPin` | `pin` |
| `Home` / `House` | `home` |

DS `Icon` memakai `size` dalam px (default 20) dan `label` untuk ikon bermakna; ikon dekoratif otomatis
`aria-hidden`. Lucide memakai `className="size-4"`; terjemahkan ke `size={16}`.

**Sisanya (audit `icon-gap`) ditambahkan ke `Icon` DS**, bukan dibiarkan sebagai `lucide-react` dan bukan digambar
ulang. Path-nya dipindahkan dari lucide (gayanya sama persis); caranya di `ds-sync.md`, bagian Ikon. Kerjakan
berkelompok (satu per layar), lalu hapus `lucide-react` dari `package.json` bila sudah tidak ada importnya.

## 4. Class dan token bermasalah

| Temuan audit | Perbaikan |
|---|---|
| `bg-skeleton`, `animate-skeleton` | Gunakan `Skeleton` DS (`bg-border` + `animate-pulse`) |
| `bg-danger-soft` | **Tambahkan token `danger-soft` ke DS** (`ds-sync.md`): tint dari `danger #c2410c` → `#fff7ed`, kontras 4.88:1 lulus. Jangan menggantinya dengan pola lain bila konteksnya memang latar lembut untuk status bahaya |
| `font-mono` | Hapus; pakai role tipografi biasa. DS menyediakan `--font-mono` hanya untuk contoh kode |
| role + `font-semibold`/`tracking-*`/`leading-*` | Satu role lengkap per node. Tebal: `text-small-strong` atau `text-caption-strong` |
| `text-2xl`, `text-sm`, dst. | Cari role terdekat di `guides/typography.md` (mis. `text-h2` = 32px, `text-title` = 40px). Jangan menebak dari ukuran piksel saja |
| `rounded-full` | `rounded-pill` |
| `shadow-sm/md/lg` | Efek DS hanya `shadow-card`, `shadow-float`, `shadow-header` |
| `max-w-[880px]`, `max-w-[1120px]` | `max-w-page` atau `max-w-prose` bila padanannya masuk akal; bila tidak, biarkan |
| `aspect-[210/297]` | Rasio kertas A4 pada pratinjau dokumen: nilai sekali pakai, biarkan |
| warna hex / `dark:` | Selalu error: ganti ke token semantik; DS light-only |

## 5. Laporan tambahan DS

Semua yang ditambahkan ke DS dilaporkan dalam **satu daftar di akhir**, tanpa menanyakan izin: apa, nilainya,
alasannya, kontras untuk warna, asumsi, dan file DS yang disentuh. Catat juga di
`packages/shared/ui/CHANGELOG.md`. Persetujuan bukan tugas skill ini; skill hilir yang memintanya.
