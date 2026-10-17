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
- Rebuild memakai sufiks `--build-N`, mis. `03-export-laporan--build-2.html` dengan `"attempt": 2` di JSON. Jika rebuild setelah rollback, `nextAttempt = (attempt target ?? 1) + 1`; jangan memakai attempt target dan jangan hardcode `1`.

Catatan: versi lengkap aturan git-proof (membuktikan attempt dari riwayat commit) sengaja disederhanakan di pawang dan bisa diperkuat nanti.

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
    { "text": "Endpoint CSV", "doneWhen": "curl mengembalikan CSV 200", "done": false }
  ],
  "files": ["src/routes/reports.ts"],
  "contracts": ["Kolom: tanggal,total"],
  "testing": ["Uji nilai yang berisi koma"],
  "notes": ["Ikuti pola export yang sudah ada"],
  "openQuestions": []
}
JSON
```

Peta field:

| Field                    | Isi                                                                     |
| ------------------------ | ----------------------------------------------------------------------- |
| `title` / `goal`         | Nama fitur dan alasan singkatnya.                                       |
| `branch`                 | Prefix konfigurasi + slug judul, mis. `feature/export-laporan-bulanan`. |
| `origin`                 | `buildPlanId` + `attempt`.                                              |
| `inScope` / `outOfScope` | Batas tegas. Yang out-of-scope tidak dikerjakan.                        |
| `steps`                  | Unit kecil dan bisa direview; tiap step punya `doneWhen` yang teramati. |
| `files` / `contracts`    | Path nyata + kontrak material (tipe, format, error shape).              |
| `testing`                | Cara memverifikasi.                                                     |
| `openQuestions`          | **Wajib kosong** sebelum spec diajukan ke user.                         |

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
