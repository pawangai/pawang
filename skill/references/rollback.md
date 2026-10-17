# Rollback - rencanakan pembalikan fitur selesai

Tujuan: membalik satu fitur yang sudah selesai dengan aman. Identifikasi fitur dan commit persisnya, nilai risiko pekerjaan setelahnya, tulis spec rollback yang dijaga, lalu berhenti di Gerbang 1 (review spec). Kode produk tidak disentuh sampai spec disetujui.

## Aturan inti

- **Plan-only.** Reference ini hanya menulis spec, lewat `node .pawang/kit.js render current-feature` dengan type `rollback`. Jangan ubah kode, bikin branch, commit, merge, atau push.
- **Satu fitur per rollback.** Jangan cascade ke fitur lain tanpa keputusan user.
- **Jaga history.** Jangan hapus atau tulis ulang arsip fitur asli.
- **Dilarang**: `git reset --hard`, force-push, rewrite history, restore file masal.
- Rollback tetap melewati `implement` → `check` → `complete` seperti spec lain.

## Input

Fitur selesai (nomor build-plan, nama, atau path arsip) plus alasan. Contoh: rollback item 4 karena alur export baru merusak file.

- Tanpa target: daftar arsip fitur terakhir di `.pawang/history/features/` dan minta user memilih. **Jangan pernah memilih otomatis.**
- Tanpa alasan: tanya dulu. Arsip rollback harus menjelaskan kenapa fitur dihapus.

## Preflight

Baca `AGENTS.md`, build-plan dan current-feature lewat `node .pawang/kit.js extract`, arsip fitur, dan state git. Berhenti sebelum menulis bila:

- bukan git repository;
- `current-feature.html` masih berisi spec aktif lain (satu work item per checkout);
- working tree kotor, termasuk file untracked tak terkait;
- target bukan item build-plan checked dengan arsip yang cocok;
- arsip atau commit pengenalnya tidak bisa diidentifikasi dengan jelas;
- commit target adalah merge commit: jelaskan parent aman tidak bisa disimpulkan, minta user memilih strategi dulu.

Jangan stash, reset, checkout branch, atau bersihkan tree dari sini.

## Langkah 1 - resolve fitur dan commit

Petakan nomor/nama ke satu ID build-plan yang checked, lalu cocokkan dengan arsip di `.pawang/history/features/`. Butuh tepat satu commit pengenal unik yang menambahkan arsip itu, dan arsip belum pernah di-rollback. Ambigu, arsip ganda, atau bukti kurang: berhenti dan sebutkan path persisnya. Jangan memilih berdasarkan commit terbaru atau urutan nama file.

## Langkah 2 - pisahkan path produk dari history

Susun himpunan path produk dari diff commit target, lalu kecualikan path terlindungi:

- `.pawang/**`
- `AGENTS.md`
- `prototypes/**`

Rollback wajib mempertahankan arsip fitur asli, rencana lanjutan, spec rollback aktif, dan riwayat prototype. `README.md` dan docs aplikasi biasa tetap dihitung file produk. **Kalau tidak ada path produk tersisa, berhenti**: rollback kosong yang hanya menulis ulang catatan workflow tidak boleh dibuat.

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
  "rollback": {
    "targetArchive": ".pawang/history/features/NN-nama.html",
    "targetCommit": "<sha 40 karakter>",
    "reason": "alasan user"
  },
  "goal": "Kembalikan perilaku produk sebelum fitur target, history tetap utuh.",
  "inScope": ["Path produk dari commit target"],
  "outOfScope": ["Cascade ke fitur lain", "Migrasi data destruktif", "Cleanup tak terkait"],
  "steps": [],
  "files": [],
  "contracts": [],
  "testing": []
}
JSON
```

Isi spec:

- arsip target dan commit penuh 40 karakter, keduanya resolve di repo saat ini; catat juga commit parent di `notes`;
- alasan user;
- path produk yang dibawa target dan daftar path terlindungi;
- commit lanjutan yang ditinjau dan klasifikasi risikonya;
- pekerjaan kompatibilitas yang diizinkan, bila ada;
- perintah verifikasi dan kriteria penghapusan yang observabel (bukan "fitur hilang").

Step pertama spec: terapkan diff produk commit target secara terbalik. Step lanjutan hanya boleh memperbaiki isu kompatibilitas yang disebut di spec. Jangan pakai rollback sebagai izin cleanup tak terkait.

## Red-team sebelum presentasi

- Apakah history `.pawang/` dan rencana lanjutan tetap utuh?
- Bisakah rollback menghapus data atau memaksa migrasi destruktif?
- Adakah kode setelahnya yang mengimpor sesuatu yang diperkenalkan target?
- Apakah kriteria penghapusan observabel dan bisa direview terpisah?

Rapikan, lalu tampilkan spec ke user dan berhenti (Gerbang 1). Ringkas: commit target, path produk, risiko, dan apa yang berubah dari kritik.

## Setelah disetujui

`implement` membuat branch rollback dan menerapkan pembalikan, `check` membuktikan, lalu `complete` mengarsipkan hasil ke `.pawang/history/rollbacks/YYYY-MM-DD-<target>.html` lewat `node .pawang/kit.js render history-rollback --out ...` dan menunggu izin commit/merge (Gerbang 2).
