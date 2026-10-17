# Rollback - rencanakan pembalikan fitur selesai

Tujuan: membalik satu fitur yang sudah selesai dengan aman. Identifikasi fitur dan commit persisnya, nilai risiko pekerjaan setelahnya, tulis spec rollback yang dijaga, lalu berhenti di Gerbang 1 (review spec). Kode produk tidak disentuh sampai spec disetujui.

## Aturan inti

- **Plan-only.** Reference ini hanya menulis spec, lewat `node .pawang/kit.js render current-feature` dengan type `rollback`. Jangan ubah kode, bikin branch, commit, merge, atau push.
- **Satu fitur per rollback.** Jangan cascade ke fitur lain tanpa keputusan user.
- **Jaga history.** Jangan hapus atau tulis ulang arsip fitur asli.
- **Dilarang**: `git reset --hard`, force-push, rewrite history, restore file masal, dan `git revert` seluruh commit. Balik hanya diff produk.
- **Catatan keputusan bukan produk.** ADR/docs keputusan tidak dikembalikan otomatis; tampilkan dan minta keputusan user.
- Rollback tetap melewati `implement` → `check` → `audit` → `complete` seperti spec lain.

## Input

Fitur selesai (nomor build-plan, nama, atau path arsip) plus alasan. Contoh: rollback item 4 karena alur export baru merusak file.

- Tanpa target: daftar arsip fitur terakhir di `.pawang/history/features/` dan minta user memilih. **Jangan pernah memilih otomatis.**
- Tanpa alasan: tanya dulu. Arsip rollback harus menjelaskan kenapa fitur dihapus.

## Preflight

Baca `AGENTS.md`, build-plan dan current-feature lewat `node .pawang/kit.js extract`, arsip fitur, dan state git. Berhenti sebelum menulis bila:

- bukan git repository;
- branch saat ini bukan branch default lokal. Resolve `git symbolic-ref --quiet --short refs/remotes/origin/HEAD`, buang prefix `origin/`; fallback `git config --get init.defaultBranch` hanya jika branch itu ada; jika tetap tidak jelas, tanya user (jangan hardcode `main`);
- `current-feature.html` masih berisi spec aktif lain (satu work item per checkout);
- working tree kotor, termasuk file untracked tak terkait;
- target bukan item build-plan checked dengan arsip yang cocok;
- arsip atau commit pengenalnya tidak bisa diidentifikasi dengan jelas;
- arsip target berubah blob/mode sejak introducing commit, atau sudah pernah di-rollback;
- commit target atau parent bukan SHA penuh (40/64 sesuai object format), parent bukan tunggal, atau target bukan ancestor `HEAD`;
- diff target tidak konsisten dengan fitur yang diminta;
- commit target adalah merge commit: parent tunggal tidak bisa disimpulkan; stop dan minta user memilih remediasi/rollback manual, jangan tulis spec.

Jangan stash, reset, checkout branch, atau bersihkan tree dari sini.

## Langkah 1 - resolve fitur dan commit

Petakan nomor/nama ke satu ID build-plan yang checked, lalu cocokkan dengan arsip di `.pawang/history/features/`. Butuh tepat satu commit pengenal unik yang menambahkan arsip itu. Verifikasi:

- blob dan mode arsip tidak berubah sejak commit pengenal;
- belum ada arsip rollback selesai yang menyebut arsip/commit target;
- target dan parent adalah SHA penuh (40/64 sesuai object format) dan resolve di repo;
- target punya tepat satu parent dan target adalah ancestor `HEAD`;
- diff target konsisten dengan fitur yang diminta.

Ambigu, arsip ganda, atau bukti kurang: berhenti dan sebutkan path persisnya. Jangan memilih berdasarkan commit terbaru atau urutan nama file.

## Langkah 2 - pisahkan path produk dari history

Susun himpunan path produk dari diff commit target, lalu kecualikan path terlindungi:

- `.pawang/**`
- `AGENTS.md`
- `prototypes/**`
- `.agents/**`
- `.claude/**`
- `CLAUDE.md`
- `skills-lock.json`
- `opencode.json`

Rollback wajib mempertahankan arsip fitur asli, rencana lanjutan, spec rollback aktif, riwayat prototype, dan konfigurasi agent. `README.md` dan docs aplikasi biasa tetap dihitung file produk. **Kalau tidak ada path produk tersisa, berhenti**: rollback kosong yang hanya menulis ulang catatan workflow tidak boleh dibuat.

**Catatan keputusan.** `docs/adr/**` dan `docs/agents/**` bukan path produk otomatis. Jika commit target menyentuhnya, tampilkan path + isinya ke user, jelaskan bahwa rollback membalik perilaku produk, lalu minta keputusan. Jangan mengembalikan ADR/docs keputusan lama secara otomatis; jika user ingin mengubahnya, lakukan sebagai langkah terpisah dengan tanggal/alasan baru.

## Langkah 3 - nilai risiko perubahan lanjutan

Periksa commit setelah target sampai HEAD yang menyentuh path produk, dan baca spec fitur lanjutan yang menyebut target beserta kontraknya. Klasifikasi:

| Klasifikasi                    | Arti                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| **No overlap**                 | Tidak ada commit setelahnya yang menyentuh path produk target.                              |
| **Overlap, likely compatible** | Path sama tersentuh, tapi perubahan target bisa dibalik tanpa mencabut perilaku baru.       |
| **Dependency risk**            | Pekerjaan setelahnya tampak membutuhkan API, skema, route, komponen, atau data dari target. |
| **Blocked**                    | Perilaku aman setelah pembalikan tidak jelas, migrasi data destruktif, atau butuh cascade.  |

Overlap path adalah sinyal peringatan, bukan bukti dependency. Sebutkan commit dan kontrak konkretnya. Kasus blocked: berhenti, minta user memilih remediasi yang lebih sempit.

## Langkah 4 - tulis spec rollback

Render spec ke `.pawang/context/current-feature.html`:

```bash
node .pawang/kit.js render current-feature <<'JSON'
{
  "type": "rollback",
  "title": "Rollback fitur NN",
  "status": "ready",
  "branch": "rollback/<nama>",
  "origin": { "buildPlanId": "NN" },
  "rollback": {
    "targetArchive": ".pawang/history/features/NN-nama.html",
    "targetCommit": "<sha penuh>",
    "targetParent": "<sha penuh>",
    "reason": "alasan user"
  },
  "goal": "Kembalikan perilaku produk sebelum fitur target, history tetap utuh.",
  "inScope": ["Path produk dari commit target"],
  "outOfScope": ["Cascade ke fitur lain", "Migrasi data destruktif", "Cleanup tak terkait"],
  "steps": [
    {
      "text": "Terapkan diff produk commit target secara terbalik memakai guard di implement.md.",
      "doneWhen": "Patch produk terbalik, path terlindungi/decision docs tidak berubah, dan staged diff sesuai spec.",
      "done": false
    }
  ],
  "files": [],
  "contracts": [],
  "testing": [],
  "notes": []
}
JSON
```

Isi spec:

- path arsip target; `rollback.targetCommit` dan `rollback.targetParent` berisi SHA penuh (40/64 sesuai object format), keduanya resolve di repo saat ini;
- `origin.buildPlanId` item build-plan target; jika target rebuild, catat `origin.attempt` = attempt target. Rebuild berikutnya memakai attempt target + 1 (lihat `feature.md`); `complete` hanya memakai `origin.buildPlanId` untuk uncheck;
- alasan user;
- path produk yang dibawa target dan daftar path terlindungi;
- path keputusan `docs/adr/**`/`docs/agents/**` yang tersentuh, beserta keputusan user;
- commit lanjutan yang ditinjau dan klasifikasi risikonya;
- pekerjaan kompatibilitas yang diizinkan, bila ada;
- perintah verifikasi dan kriteria penghapusan yang observabel (bukan "fitur hilang").

Step pertama spec: terapkan diff produk commit target secara terbalik memakai guard di `implement.md` (exclude path terlindungi, stop saat konflik). Step lanjutan hanya boleh memperbaiki isu kompatibilitas yang disebut di spec. Jangan pakai rollback sebagai izin cleanup tak terkait.

## Red-team sebelum presentasi

- Apakah history `.pawang/` dan rencana lanjutan tetap utuh?
- Bisakah rollback menghapus data atau memaksa migrasi destruktif?
- Adakah kode setelahnya yang mengimpor sesuatu yang diperkenalkan target?
- Apakah kriteria penghapusan observabel dan bisa direview terpisah?
- Apakah ada path terlindungi atau `docs/adr/**`/`docs/agents/**` yang tersentuh? Sudah ditunjukkan ke user?
- Apakah spec menyimpan `targetParent` dan `origin.buildPlanId` untuk guard dan uncheck?

Rapikan, lalu tampilkan spec ke user dan berhenti (Gerbang 1). Ringkas: commit target, path produk, risiko, dan apa yang berubah dari kritik.

## Setelah disetujui

`implement` membuat branch rollback dari branch default (berhenti bila branch sudah ada), menerapkan pembalikan; `check` membuktikan; `audit` menutup temuan; `complete` mengarsipkan hasil ke `.pawang/history/rollbacks/YYYY-MM-DD-<target-archive-stem>.html` lewat `node .pawang/kit.js render history-rollback --out ...` dan menunggu izin commit/merge (Gerbang 2).
