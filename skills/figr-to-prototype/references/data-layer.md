# Data terpusat dan dinamis

Tujuan: prototype berperilaku seperti aplikasi sungguhan walau tanpa backend. Ubah role di satu screen, dan
screen lain langsung ikut berubah; buat pengguna atau booking baru, dan ia muncul di daftar. Semua lewat satu
model data, bukan puluhan konstanta dan `useState` yang tidak saling tahu.

## Daftar isi
1. Kondisi hasil Figr
2. Rancangan: `src/store/`
3. Langkah migrasi
4. Alur booking
5. Hal yang tidak boleh disentuh
6. Generate ulang dari Figr
7. Pengujian

## 1. Kondisi hasil Figr

Pada hasil Figr yang diuji: data tersebar di `data/mock.ts`, `data/integrations.ts`, `data/data.ts` dan konstanta
huruf besar di dalam file screen. Hampir tiap screen menyalin data ke `useState` lokal (Integrasi 25 `useState`,
Cabang dan Pengguna 17). Akibatnya:

- Menangguhkan pengguna di `Pengguna` tidak mengubah hitungan di `Role`, `Dashboard`, atau `Audit`.
- Form "Tambah pengguna" tidak membuat apa pun; ia hanya menavigasi ke id yang ditulis mati
  (`nav(user ? … : "/pengguna/u-005")`).
- Mutasi berupa `submit.run(() => setState(...))`: berlaku di satu komponen, hilang saat berpindah halaman.

Figr juga sudah punya **lapisan simulasi** di `src/ui/states.tsx`: `useMockQuery`, `useMockSubmit`,
`useInitialDialog`. Lapisan ini yang membuat varian layar loading/error/empty di `screens.figr.json` bekerja
(`sim`, `simScope`, `submit`, `dialog`, bisa juga lewat URL `?sim=error`). Itu kontrak Figr dan harus tetap utuh.

## 2. Rancangan: `src/store/`

`scaffold.py` menyalin kit ini saat mode init (`assets/store-kit/`):

| File | Fungsi |
|---|---|
| `createDb.ts` | store generik: `get`, `find`, `insert`, `update`, `remove`, `nextId`, `batch`, `reset`, `useCollection`, `useRevision`. Tanpa dependency (`useSyncExternalStore`) |
| `db.ts` | satu-satunya instance; di sinilah seed didefinisikan |
| `useDbQuery.ts` | pembungkus `useMockQuery`: status loading/error/empty tetap dari Figr, data dibaca langsung dari db |
| `createDb.test.ts` | tes perilaku store |

**Kenapa membungkus, bukan mengedit `states.tsx`**: berkas itu dibuat Figr dan akan datang lagi di setiap generate
ulang. Mengeditnya berarti konflik merge setiap kali. Pembungkus hidup di folder yang tidak pernah disentuh Figr.

**Aturan model data**
- Satu kunci per entitas (`users`, `branches`, `roles`, `bookings`, …); tiap baris punya `id: string` unik.
- Relasi disimpan sebagai **id**, bukan objek tertanam (`user.branch = "c-01"`, bukan `{…cabang…}`).
- **Jangan simpan nilai turunan**: jumlah anggota role, nama cabang, total booking per hari dihitung lewat selector
  dari db. Nilai turunan yang disimpan pasti suatu hari tidak sinkron.
- Seed **JSON murni**: tanpa JSX, fungsi, `Date`. Ikon atau komponen per jenis tetap di kode UI (peta `jenis → ikon`).
- Teks tanggal seperti `"12 Jan 2025"` dipertahankan apa adanya pada langkah awal; mengubahnya ke ISO adalah
  perubahan perilaku, lakukan terpisah dan hanya bila diminta.

## 3. Langkah migrasi

Kerjakan berurutan; setiap langkah diakhiri `npx vp check` dan `npx vp build`. Paritas tampilan adalah syarat:
seed harus menghasilkan layar yang sama dengan sebelum data dipusatkan.

**0. Baseline.** `vp check` hijau, audit dicatat. Bila alat browser tersedia (mis. skill Playwright), ambil screenshot
tiap route `?figr_screen=<id>` sebelum mulai agar bisa dibandingkan. Bila tidak, minta user membuka beberapa layar
kunci setelah selesai, dan katakan terus terang bahwa paritas visual belum diverifikasi.

**1. Inventaris entitas.** Dari `data/*.ts` dan konstanta huruf besar di screen: entitas apa, id apa, relasi ke mana.
Pada hasil Figr yang diuji: `users.branch → branches.id`, `users.roles[] → roles.key`; jumlah anggota role dan
nama cabang adalah turunan.

**2. Seed.** Isi `db.ts` dengan mengimpor konstanta yang sudah ada, supaya isinya identik:

```ts
import { BRANCHES, ROLES, USERS } from "../data/mock";
export const db = createDb({ users: USERS, branches: BRANCHES, roles: ROLES }, { persist: false });
```

**3. Baca lewat db.** Ganti `useMockQuery` yang membaca konstanta:

```tsx
// sebelum
const query = useMockQuery("list", "users", ({ empty }) => (empty ? [] : USERS), (d) => d.length === 0);
// sesudah
const query = useDbQuery("list", "users", (s, { empty }) => (empty ? [] : s.users), (d) => d.length === 0);
```
Argumen dan bentuk hasil (`status`, `data`, `retry`) sama persis, jadi sisa screen tidak berubah. Query detail:
`useDbQuery("detail", `user:${id}`, (s, { empty }) => ({ user: s.users.find(...) , ... }), (d) => !d.user)`.

**4. Tulis lewat db.** Ganti salinan state lokal dan setter-nya:

```tsx
// sebelum
const [user, setUser] = useState(initialUser);
const updateUser = (patch: Partial<User>) => setUser((c) => ({ ...c, ...patch }));
// sesudah
const user = db.useCollection("users").find((u) => u.id === initialUser.id) ?? initialUser;
const updateUser = (patch: Partial<User>) => db.update("users", initialUser.id, patch);
```
Form tambah: `db.insert` dengan `db.nextId("users", "u-")`, lalu navigasi ke id yang baru dibuat (bukan id mati).
`submit.run(...)` tetap dipakai untuk jeda dan simulasi error; hanya isi callback-nya yang menulis ke db.

**5. Selector.** Fungsi seperti `branchName(id)` yang membaca konstanta harus membaca db, kalau tidak cabang baru
tidak punya nama. Taruh di `src/store/selectors.ts` dengan menerima snapshot: `branchName(s, id)`.

**6. Hapus sisa jalur lama.** Pindahkan konstanta dari file screen ke `src/data/seed/` atau langsung ke seed, hapus
import langsung. Audit harus memberi 0 untuk `direct-data-import`, `local-copy-of-data`, `legacy-mock-query`,
`inline-data` (kecuali konstanta UI kecil yang memang bukan data).

**7. Efek samping lintas screen.** Mutasi yang seharusnya meninggalkan jejak (suspend pengguna → catatan audit)
ditulis dalam satu `db.batch(() => { db.update(...); db.insert("auditLogs", {...}); })`. Satu notifikasi, dua perubahan.

## 4. Alur booking

Hasil Figr yang diuji belum punya screen booking (hanya layar admin). Skill **tidak membuat screen booking
sendiri**. Bila Figr menghasilkannya, ia diperlakukan seperti screen lain dan alurnya dibuat berjalan penuh:

- Entitas dari screen yang ada (mis. `bookings` + yang dirujuknya: layanan, pelanggan/pasien, tenaga, cabang).
  Ambil nama dan field dari Figr; jangan mengarang domain.
- **Mesin status ditulis sekali** di `src/store/bookingFlow.ts` (fungsi transisi seperti `confirm`, `cancel`,
  `complete` yang memeriksa status asal, menulis perubahan, dan menambah catatan audit dalam satu `db.batch`).
  Screen hanya memanggil fungsi itu; ia tidak menulis `status` sendiri. Dengan begitu aturan alur ada di satu tempat.
- Ketersediaan/bentrok jadwal adalah **selector** yang menghitung dari db, bukan data tambahan.
- Wizard multi-langkah: draft tetap di state lokal komponen sampai submit; baru saat submit ia `insert` ke db.
- Setiap rute booking yang tampil di daftar harus bisa dibuka lagi setelah dibuat (id nyata dari `nextId`).

## 5. Hal yang tidak boleh disentuh

- `src/ui/states.tsx`, `src/useScreenInit.ts`, `src/screens.figr.json`: kontrak Figr. Bungkus, jangan edit.
- Parameter `sim`, `simScope`, `submit`, `dialog` tetap harus bekerja untuk semua screen yang dimigrasi. Setelah
  memigrasi sebuah screen, buka `?sim=loading`, `?sim=error`, `?sim=empty` pada route itu.
- Jangan menyalin data dari db ke `useState` (itu mengembalikan masalah awal).
- `persist` default `false`: data kembali ke seed saat halaman dimuat ulang, sehingga varian `?figr_screen=` selalu
  mulai dari kondisi yang sama. Aktifkan `persist: true` hanya untuk demo yang butuh data bertahan, dan naikkan
  `version` setiap bentuk seed berubah.

## 6. Generate ulang dari Figr

Screen baru dari Figr datang dengan data inline dan state lokal lagi. Saat `scaffold.py` menandai sebuah screen
`[manual]`, jangan menimpa versi yang sudah dimigrasi: ambil perubahan Figr yang diinginkan, lalu terapkan ulang
langkah 3–6 pada file itu. Bila Figr menambah data (entitas atau baris baru), tambahkan ke seed; jangan menimpa seed
yang sudah kamu ubah dengan konstanta Figr.

## 7. Pengujian

Sudah diuji pada hasil Figr sungguhan (Pengguna: daftar, detail, ubah status) dengan Vitest bawaan Vite+:

- `createDb.test.ts` (ikut di kit): insert/update/remove, `nextId`, seed tidak termutasi, `reset`, `batch` satu
  notifikasi, snapshot stabil.
- Tes render React (`jsdom`; `npm i -D jsdom`) untuk memastikan: loading dulu lalu data dari db; **perubahan db
  langsung terlihat tanpa loading ulang**; `?sim=error` dan `?sim=empty` tetap bekerja; menghapus semua baris
  mengubah status jadi `empty`. Kerangkanya: pasang `// @vitest-environment jsdom`, set
  `IS_REACT_ACT_ENVIRONMENT = true`, `vi.useFakeTimers()`, render komponen yang memakai `useDbQuery`,
  `await vi.advanceTimersByTimeAsync(700)` melewati `LOAD_MS`, lalu ubah db di dalam `act()` dan periksa teks.
  Tes ini bergantung pada seed proyek, jadi tulis ulang per proyek, bukan salin dari kit.

Tes ini membuktikan perilaku data, **bukan** tampilan. Paritas visual tetap harus dicek di browser.
