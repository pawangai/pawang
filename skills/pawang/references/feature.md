# Feature - spec fitur dari build-plan

Tujuan: ubah satu item build-plan jadi spec siap bangun di `.pawang/context/current-feature.html`, lalu berhenti di gerbang review manusia. Setelah disetujui, alur berjalan otonom (lihat workflow.md bagian 4).

## Sebelum mulai

1. Jalankan `node .pawang/kit.js status` untuk orientasi murah: spec aktif, findings, review, build-plan.
2. Pastikan `current-feature.html` masih stub kosong. **Kalau ada spec aktif, jangan ditimpa** - selesaikan atau lanjutkan dulu. Satu work item per checkout.
3. Pilih target dari build-plan: by id atau nama kalau user menyebutkannya; tanpa argumen, ambil item unchecked pertama. Sebutkan fitur terpilih dalam satu kalimat.
4. Baca `config.json` hanya untuk setelan yang memengaruhi spec. Config rusak? Berhenti dan arahkan ke doctor.md.

## Baca konteks secukupnya

- `project-overview.html`: baca **hanya bagian relevan** - cari nomor fitur, judul, dan kata benda khas dari baris build-plan. Jangan memuat semuanya.
- Periksa repo sekali, mulai dari path yang disebut bagian itu. Ikuti hanya import, caller, test, skema, dan config yang relevan.
- Commands dari `AGENTS.md` (kalau sudah dimuat di sesi ini, pakai itu). `coding-standards.html` hanya bagian yang berlaku.
- Jalankan perintah Verify sekali bila sudah ada; catat hasil apa adanya.

Plan menentukan maksud produk; repo menentukan kenyataan saat ini. **Jangan mengarang** default, limit, izin, aturan uang, format, atau kontrak API.

## Design reference (bila ada mockup)

- `prototypes/` ada (lane A): bila fitur ini UI-facing dan mockup relevan, pilih HTML yang relevan dan tautkan di `references.design`. Step pertama wajib mem-port `prototypes/theme.css` ke stylesheet aplikasi; jangan menyalin HTML mockup mentah.
- `.pawang/prototype/` ada (lane B): bila fitur ini UI-facing, tautkan `index.html` atau screen HTML yang relevan di `references.design`; jangan menyalin HTML generated ke `src/`.
- Tidak ada mockup, atau fitur non-UI: `references.design` boleh kosong; jangan mengarang path.
- Path design relatif ke root proyek dan harus ada saat spec ditulis.

## Kritik dulu, jangan langsung menulis

Periksa kelas kegagalan ini sebelum draft final:

| Kelas          | Pertanyaan                                                                                                                                     |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Jalur perilaku | Happy, loading, empty, invalid, denied, dan error tak terduga sudah tercakup sejauh berlaku?                                                   |
| Kontrak        | Ada kontrak yang dikarang? Ambil dari kode/plan, bukan tebakan. Label familiar belum tentu kontrak lengkap.                                    |
| Scope          | Ada abstraksi, dependency, service, atau config surface yang tidak diminta kebutuhan sekarang? Buang.                                          |
| Done-when      | Tiap step diakhiri kriteria yang **bisa diamati**, bukan "berfungsi".                                                                          |
| Prasyarat      | Ada prasyarat yang belum ada? Jangan menyembunyikan perbaikan di dalam fitur ini - berhenti dan sebut fix atau keputusan user yang dibutuhkan. |

Fitur terasa terlalu besar untuk satu branch yang bisa direview? **Usul pecah** jadi sub-item build-plan dan minta persetujuan user dulu; baru spec-kan yang pertama. Jangan sendiri mengedit build-plan.

## Aturan build history (ringkas)

- **ID build-plan stabil**; jangan renumber setelah item selesai. `origin.buildPlanId` mengikuti ID itu.
- Attempt dimulai 1. **Rebuild setelah rollback = attempt berikutnya**, bukan mulai dari nol. Item build-plan yang di-rollback kembali `done: false`; pilih item itu lagi untuk rebuild.
- Sebelum menulis spec baru, cek path arsip persis yang akan ditulis: `NN-nama.html` untuk attempt 1, `NN-nama--build-N.html` untuk attempt > 1. Kalau sudah ada dan jelas bentrok, berhenti dan tanya user - jangan menimpa.
- Slug judul kebab-case (huruf kecil, angka, tanda hubung).
- Rebuild memakai sufiks `--build-N`, mis. `03-export-laporan--build-2.html` dengan `"attempt": 2` di JSON.
- **Attempt dibekukan dari riwayat.** Sebelum menulis spec, hitung kandidat dari (a) arsip persis di `.pawang/history/features/` (`NN-nama.html` = 1, `NN-nama--build-N.html` = N) dan (b) commit yang menyentuh path arsip itu (`git log -- <path>`). `attempt = maksimum kandidat + 1`; jika hanya satu sumber tersedia, pakai sumber itu. Arsip/commit bentrok, duplikat, atau ambigu → berhenti dan tanya user; jangan menebak atau menimpa. Rebuild setelah rollback minimal memakai `attempt target + 1`.

## Spec durable - kontrak untuk agent

Spec adalah kontrak. `implement.md` mengikutinya persis; agent tidak boleh menebak dari percakapan. Tulis agar tetap berguna meski file berubah:

- Jelaskan **perilaku sekarang** dan **perilaku yang diinginkan** di `goal`/`notes`; jangan jadikan path atau nomor baris sebagai kontrak.
- `files` hanya petunjuk area. Kontrak yang tahan lama adalah nama tipe, signature fungsi, bentuk config, dan perilaku yang bisa diamati.
- Acceptance criteria = `steps[].doneWhen`, satu per step, bisa diuji sendiri.
- Keputusan implementasi, kontrak data/API, dan keputusan testing masuk `contracts`/`testing`/`notes`.
- Batas tegas di `inScope`/`outOfScope`; jangan mengandalkan agent menebak.
- `openQuestions` wajib kosong sebelum Gerbang 1.

**Irisan vertikal.** Setiap step adalah potongan tipis yang menembus semua lapisan yang relevan (schema → API → UI → test), bukan satu lapisan saja. Step harus bisa didemokan/diverifikasi sendiri dan muat dalam satu siklus implement. Urutan step = dependensi; jangan menaruh step dependen sebelum prasyaratnya.

**Paralel.** `steps[].files` opsional. Isi bila step mungkin dikerjakan paralel. Orkestrator hanya menjalankan paralel bila semua step punya `files`, tidak ada irisan, dan tidak ada migrasi/skema bersama; jika tidak, sequential. Perbaikan findings selalu sequential.

**Batch.** Bila fitur ini bagian dari batch lintas fitur, tulis spec ke `items[].spec` di `.pawang/context/batch.html` lewat `kit.js render batch`; jangan menulis `current-feature.html` per item. Alur batch ada di `orchestrate.md`.

## Tulis spec sekali

Draft dan kritik di konteks, lalu tulis **sekali** lewat kit.js:

```bash
node .pawang/kit.js render current-feature <<'JSON'
{
  "type": "feature",
  "title": "Export laporan bulanan",
  "status": "ready",
  "branch": "feature/export-laporan-bulanan",
  "origin": { "buildPlanId": "3", "attempt": 1 },
  "goal": "Satu-dua kalimat kenapa fitur ini ada.",
  "inScope": ["Endpoint GET /reports/:id.csv"],
  "outOfScope": ["Format PDF"],
  "steps": [
    {
      "text": "Endpoint CSV",
      "doneWhen": "curl mengembalikan CSV 200",
      "done": false,
      "files": ["src/routes/reports.ts"]
    }
  ],
  "files": ["src/routes/reports.ts"],
  "contracts": ["Kolom: tanggal,total"],
  "testing": ["Uji nilai yang berisi koma"],
  "references": { "documents": [], "design": [] },
  "notes": ["Ikuti pola export yang sudah ada"],
  "openQuestions": []
}
JSON
```

Peta field:

| Field                    | Isi                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------- |
| `title` / `goal`         | Nama fitur dan alasan singkatnya.                                                      |
| `branch`                 | Prefix konfigurasi + slug judul, mis. `feature/export-laporan-bulanan`.                |
| `origin`                 | `buildPlanId` + `attempt`.                                                             |
| `inScope` / `outOfScope` | Batas tegas. Yang out-of-scope tidak dikerjakan.                                       |
| `steps`                  | Unit kecil dan bisa direview; tiap step punya `doneWhen` yang teramati.                |
| `steps[].files`          | Opsional. Area file step; dipakai orkestrator untuk guard paralel (harus disjoint).    |
| `files` / `contracts`    | Path nyata + kontrak material (tipe, format, error shape).                             |
| `testing`                | Cara memverifikasi.                                                                    |
| `references.design`      | Path HTML mockup yang relevan; wajib bila `prototypes/` atau `.pawang/prototype/` ada. |
| `openQuestions`          | **Wajib kosong** sebelum spec diajukan ke user.                                        |

Skema lengkap ada di workflow.md bagian 3.

## Setelah menulis

1. Baca ulang dengan `node .pawang/kit.js extract .pawang/context/current-feature.html` untuk memastikan JSON tertanam benar.
2. Status akhir `ready`. Semua step kecil, terurut, dan tiap `doneWhen` bisa diamati.
3. **Berhenti. Tunjukkan spec ke user dan tunggu review.** Jangan implement sebelum disetujui - ini gerbang manusia pertama (workflow.md bagian 4).

## Aturan

- Jangan menulis atau mengedit HTML `.pawang/` langsung; semua lewat `kit.js`.
- Jangan commit dan jangan mulai implement.
- Jangan menambah scope dari tebakan atau menarik fitur lain ke depan.
- Spec adalah kontrak: implement.md mengikutinya persis. Spec salah? Revisi spec dulu, jangan improvisasi di implement.
