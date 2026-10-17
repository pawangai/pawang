# Orkestrasi batch - lintas fitur/tiket

Tujuan: menjalankan beberapa fitur/tiket dalam satu batch dengan beberapa worker paralel, sambil menjaga satu penulis state, dua gerbang manusia, dan riwayat per fitur. File ini melengkapi `parallel.md` (satu fitur) dan `implement.md` (eksekusi satu spec).

## Kapan dipakai

Gunakan `orchestrate.md` bila:

- ada beberapa item build-plan/tiket yang bisa dikerjakan dalam satu batch;
- sebagian item independen dan sebagian punya `blockedBy`;
- user ingin mempercepat proyek besar tanpa menunggu satu fitur selesai;
- map wayfinder sudah selesai (bila dipakai) dan build-plan sudah ada.

Jangan pakai untuk satu fitur, bug kecil, atau saat dependency antar-item belum jelas. Untuk satu fitur, gunakan `parallel.md`.

## State batch

Satu file sementara `.pawang/context/batch.html`, ditulis **hanya** lewat `kit.js render batch` / `extract batch`. Batch bukan build-plan dan bukan history.

```json
{
  "id": "batch-2026-10-17",
  "status": "planning",
  "integrationBranch": "batch/2026-10-17",
  "gate": { "specApproved": false, "commitApproved": false },
  "items": [
    {
      "id": "B1",
      "buildPlanId": "4",
      "title": "Export laporan",
      "blockedBy": [],
      "status": "pending",
      "branch": "feature/export-laporan",
      "worktree": "",
      "spec": {
        "type": "feature",
        "title": "Export laporan",
        "goal": "...",
        "inScope": ["..."],
        "outOfScope": ["..."],
        "steps": [
          {
            "text": "...",
            "doneWhen": "...",
            "done": false,
            "files": ["src/..."]
          }
        ],
        "files": ["src/..."],
        "contracts": ["..."],
        "testing": ["..."],
        "openQuestions": []
      },
      "result": { "commit": "", "archive": "", "notes": "", "findings": [] }
    }
  ]
}
```

`items[].spec` memakai skema `current-feature` (lihat `workflow.md`), tetapi **jangan** menulis `current-feature.html` per item selama batch. Spec hidup di batch sampai diarsipkan.

Status item:

| Status    | Arti                                           |
| --------- | ---------------------------------------------- |
| `pending` | belum siap (blocked atau spec belum disetujui) |
| `ready`   | spec disetujui, siap didispatch                |
| `running` | worker sedang bekerja                          |
| `done`    | worker selesai dan lolos verifikasi cabang     |
| `merged`  | sudah masuk integration branch                 |
| `failed`  | gagal setelah repair sequential                |
| `blocked` | dependency gagal/tidak selesai                 |

## Alur batch

### 1. Susun plan batch

1. Baca build-plan dan pilih item yang akan masuk batch (user menyebutkannya atau item unchecked pertama yang independen).
2. Susun `blockedBy` dari dependensi nyata; jangan mengarang.
3. Tulis spec tiap item lewat panduan `feature.md` (goal, scope, steps, doneWhen, files, contracts, testing, openQuestions kosong).
4. Isi `steps[].files` untuk item yang mungkin diparalelkan. Bila kosong/beririsan, item itu sequential.
5. Render batch dengan `gate.specApproved: false`, status `planning`. Tulis nol file sebelum draft ditampilkan.

### 2. Gerbang 1 - review spec batch

Tampilkan satu tabel: item, ringkasan spec, `blockedBy`, file utama, dan urutan frontier. Tunjukkan draft spec lengkap yang relevan, bukan ringkasan yang menyembunyikan detail.

- Satu approval untuk semua spec + DAG; user boleh menolak/menunda item tertentu.
- Item yang disetujui menjadi `ready`; yang ditolak tetap `pending` atau dikeluarkan dari batch.
- Setelah disetujui, set `gate.specApproved: true`. Ini gerbang manusia pertama; jangan mulai worker sebelum ini.

### 3. Jalankan frontier

1. Buat integration branch dari branch default (atau branch yang user setujui) bila belum ada; catat di `integrationBranch`.
2. Frontier = item `ready` yang semua `blockedBy`-nya `done`/`merged`.
3. Dispatch maksimal **2 worker write** (lihat `parallel.md`) ke worktree masing-masing. Satu worker = satu item.
4. Brief worker: spec item (bukan seluruh batch), branch/worktree, file scope, `doneWhen`, perintah test, format hasil. Worker tidak menulis `.pawang`, `AGENTS.md`, atau git bersama.
5. Worker mengimplementasikan spec (ikuti `implement.md`, termasuk test-first), menjalankan test terfokus, lalu commit lokal di branch item. Worker tidak merge/push.
6. Setelah worker selesai, parent menandai `running` → `done` hanya setelah verifikasi cabang; jika gagal, repair sequential dulu.

### 4. Verifikasi per cabang

- Jalankan check/audit pada branch worker sebelum merge. Untuk beberapa worker, cek read-only boleh paralel karena commit range tiap cabang tetap.
- Gunakan `check.md` dan `audit.md`; findings ditulis parent sekali, bukan worker.
- Perbaikan findings **sequential** di branch item; setelah lulus, item siap masuk integration branch (merge dilakukan setelah Gerbang 2).
- Jangan merge item yang masih `failed`; tandai dependents `blocked`.

### 5. Siapkan integrasi (sebelum Gerbang 2)

1. Jangan merge atau commit dulu. Pastikan integration branch sudah dibuat dari base yang disetujui.
2. Tampilkan ringkasan hasil per cabang: item `done`, `failed`, `blocked`, dan diff singkat yang akan masuk.
3. Item `failed`/`blocked` dilaporkan, bukan dipaksa. Jangan mencentang build-plan sebelum arsip.

### 6. Gerbang 2 - commit/merge batch

1. Minta izin eksplisit untuk commit dan merge/push. Ini gerbang manusia kedua; jangan commit/merge sebelum izin.
2. Setelah izin: merge item `done` ke integration branch **satu per satu** (urutan frontier), satu commit per fitur, lalu set status `merged`. Jalankan cek integrasi setelah tiap merge; konflik? Stop, laporkan path, jangan auto-resolve.
3. Arsipkan tiap fitur ke `.pawang/history/features/` (satu arsip per fitur) memakai `items[].spec` + `completedAt` + findings yang sudah selesai, lalu centang item build-plan terkait.
4. Gabungkan integration branch ke branch default sesuai `config.git.landing` (izin merge terpisah bila perlu).
5. Bersihkan worktree/branch item. Reset `batch` ke stub kosong; history per fitur tetap.

## Aturan

- **Satu penulis state**: parent menulis batch, findings, review, history, build-plan, dan git. Worker read-only atau worktree-only.
- **Satu work item per worktree**: revisi aturan lama; satu checkout utama tetap satu work item, tetapi batch boleh punya beberapa worktree.
- **Dua gerbang tetap**: review spec batch dan izin commit/merge batch. Tidak ada gerbang tambahan.
- **Repair sequential**: satu temuan, satu perbaikan. Jangan memperbaiki beberapa item sekaligus dengan worker.
- **Commit**: satu commit per fitur + satu merge batch; jangan squash seluruh batch kecuali user memintanya.
- **Build-plan**: tetap sumber fitur; batch hanya state sementara. Jangan menyalin isi batch ke build-plan sebelum Gerbang 2.
- **Token**: kirim spec per item ke worker, bukan seluruh batch; jalankan perintah deterministik lebih dulu; cap 2 worker write dan 3 read-only.
- **Hardware**: worktree + dependency besar bisa lebih mahal daripada sequential. Jika install/dependency tidak bisa dipakai bersama, turunkan cap ke 1 (sequential).
- **Fallback**: tanpa subagent/worktree, jalankan item satu per satu memakai `implement.md`; batch tetap boleh ada sebagai papan status.

## Hubungan dengan file lain

- `plans.md`: memilih dan mengurutkan item build-plan.
- `feature.md`: menulis spec tiap item.
- `parallel.md`: aturan dispatch, brief, cap, dan agregasi.
- `implement.md`: eksekusi satu spec di worker.
- `check.md` / `audit.md`: verifikasi cabang sebelum merge.
- `complete.md`: arsip dan commit; batch mengikuti aturan yang sama per fitur.
