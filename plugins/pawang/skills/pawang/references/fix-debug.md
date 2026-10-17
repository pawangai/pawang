# Fix & debug - spec perbaikan

Tujuan: satu alur dua tahap - (1) diagnosis kegagalan **tanpa mengubah source**, (2) tulis spec fix kecil ke `current-feature.html` lalu berhenti di gerbang review.

## Bagian 1 - Diagnosis

Diagnosis memisahkan "mencari sebab" dari "memperbaiki". Kumpulkan bukti, sempitkan area, jangan menyentuh kode.

### 1. Tetapkan batas

Kumpulkan: gejala, failing command, atau pesan error; `AGENTS.md` dan perintah aslinya; spec aktif bila ada; output error dan file terdampak; `git status`, `diff`, dan log terakhir bila regresi mungkin. Nyatakan gejala dan apa yang dianggap sebagai reproduksi. Tentukan apakah kegagalan milik spec aktif atau bug tak terencana. Working tree kotor bukan izin membuang atau menulis ulang apa pun - diff itu justru bukti.

### 2. Reproduksi aman

- Pakai perintah atau interaksi terkecil yang bisa mereproduksi: satu test terfokus, satu request, satu input.
- Tangkap exit code, error, stack trace, output, response, console error, atau request gagal.
- Server panjang yang belum jalan? **Minta user menjalankannya** dengan perintah terdokumentasi. Jangan install, jangan migrasi, jangan menyentuh data produksi, jangan pakai perintah destruktif untuk memaksa reproduksi.
- **Jangan edit kode untuk menambah log atau probe.** Pakai log yang ada, debugger, atau perintah read-only.
- Cek `git status` setelah perintah diagnosis. Ada file proyek berubah? Laporkan path-nya; jangan dibersihkan, di-restore, atau disembunyikan.

Tidak bisa direproduksi? Katakan apa yang dicoba dan bukti apa yang hilang. Lanjut hanya sebagai hipotesis berlabel, bukan klaim akar masalah.

### 3. Lokalisasi

Telusuri dari kegagalan ke area terkecil yang bertanggung jawab. Pakai bukti yang cocok: frame aplikasi pertama di stack trace, test gagal terkecil dan inputnya, data request/response di boundary, caller/import/aliran data, `git diff`/`log`/`blame` untuk regresi, atau perbandingan dengan jalur yang bekerja. Pisahkan fakta dari hipotesis, uji penjelasan termurah dulu, dan jangan menyalahkan dependency tanpa bukti.

### 4. Verdict

| Verdict       | Arti                                                                                    |
| ------------- | --------------------------------------------------------------------------------------- |
| **Confirmed** | Bukti menghubungkan input pemicu + kode/konfigurasi penyebab + kegagalan yang teramati. |
| **Likely**    | Bukti menyempitkan penyebab, tapi satu pembuktian spesifik belum ada.                   |
| **Blocked**   | Tidak bisa direproduksi atau bukti yang diperlukan tidak bisa diakses.                  |

### 5. Laporan dan handoff

Tulis ringkas: gejala dan reproduksi, verdict, akar masalah atau hipotesis utama, bukti (perintah + path), perilaku terdampak dan batas perbaikan, yang belum diverifikasi, dan langkah berikutnya.

Pilih langkah berikutnya tanpa menulis file:

- Kegagalan milik spec aktif -> serahkan diagnosis ke implement.md.
- Bug confirmed dan tidak ada spec aktif -> lanjut ke Bagian 2.
- Hanya Likely atau Blocked -> sarankan bukti diagnosis berikutnya, bukan perbaikan spekulatif.
- Ternyata pekerjaan produk baru, bukan cacat -> arahkan ke feature.md.

Aturan bagian ini: **diagnosa bukan perbaikan** - jangan edit source, test, config, atau lockfile. Jangan ganti branch, jangan commit, jangan update findings (ledger milik audit.md). Jangan meluaskan satu kegagalan jadi audit umum atau refactor.

## Bagian 2 - Spec fix

Fix = bug atau perubahan kecil yang bukan item build-plan. Alurnya sama dengan fitur (implement -> check -> audit -> complete), hanya diarsipkan ke `history/fixes/`.

**Prasyarat:** `current-feature.html` masih stub kosong dan diagnosis sudah selesai. Kalau ada spec aktif, jangan ditimpa - perbaikan finding masuk sebagai step tambahan di spec itu lewat implement.md.

Tulis **sekali** lewat kit.js dengan `type: "fix"`:

```bash
node .pawang/kit.js render current-feature <<'JSON'
{
  "type": "fix",
  "title": "Email reset password tidak terkirim",
  "status": "ready",
  "branch": "fix/email-reset-password",
  "fixes": "F-03",
  "goal": "Perbaiki penyebab email reset tidak terkirim.",
  "inScope": ["Perbaikan akar masalah di src/mail/send.ts"],
  "outOfScope": ["Refactor modul email"],
  "steps": [
    { "text": "Perbaiki penyebab", "doneWhen": "Test reset flow lulus dan email muncul di log dev", "done": false }
  ],
  "testing": ["Test unit untuk alamat kosong"],
  "notes": ["Jangan ubah template email"],
  "openQuestions": []
}
JSON
```

Panduan:

| Field    | Aturan                                                                                                                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fixes`  | Opsional. Isi ID finding (`F-xx`) hanya bila menargetkan temuan ledger; implement akan menandainya `fixed` saat step lulus.                                                              |
| `steps`  | Biasanya **satu step kecil**; pecah hanya bila diff terlalu besar untuk dibaca.                                                                                                          |
| `goal`   | Masalahnya, bukan gejalanya: perbaiki akar, bukan tambalan.                                                                                                                              |
| Scope    | Jangan tambah abstraksi, dependency, atau config kecuali memang di situ cacatnya. Menambah cek otorisasi, validasi, escape, atau redaksi yang hilang = perbaikan akar, bukan mesin baru. |
| `branch` | `fix/<slug-judul>` kebab-case, konsisten dengan prefix di config.                                                                                                                        |

Setelah spec ditulis dengan `status: "ready"`, **berhenti di gerbang review**: tunjukkan ke user, tunggu persetujuan, baru lanjut implement.md. Kalau ternyata ini sebenarnya fitur baru, jangan dipaksakan sebagai fix - arahkan ke feature.md.
