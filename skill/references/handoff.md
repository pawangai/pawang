# Handoff - catatan lanjut sesi

Tujuan: sesi baru bisa melanjutkan pekerjaan dengan konteks sekecil mungkin — riwayat percakapan panjang tidak perlu dibawa. Handoff itu sementara; aturan permanen tempatnya `## Keputusan penting` atau `## Jangan` di AGENTS.md (lihat `agents-md.md`). Proyek yang memakai alur `.pawang` tetap butuh handoff saat berhenti di tengah pekerjaan.

Output: satu file `.pawang/context/handoff.html`, ditulis lewat kit.js, **ditimpa setiap update** — tidak ada file per topik dan tidak ada arsip handoff.

## A. Di akhir sesi: membuat handoff

1. Kumpulkan fakta dari repo, bukan dari ingatan: jalankan `git status`, `git diff --stat`, `git log -3 --oneline`, dan hasil test terakhir kalau ada.
2. Tulis JSON dengan skema handoff (lengkap di `workflow.md` bagian 3), lalu render:

```
node .pawang/kit.js render handoff <<'JSON'
{
  "updatedAt": "2026-10-16T21:00:00+07:00",
  "goal": "<tujuan pekerjaan, 1-2 kalimat>",
  "done": ["<hal + file utama>"],
  "state": "<apa yang jalan, apa yang rusak, hasil test. Tandai mana yang SUDAH diverifikasi dan mana yang BELUM>",
  "next": ["<langkah konkret dengan file target>"],
  "decisions": ["<keputusan baru + alasan>"],
  "openIssues": ["<hal yang belum jelas>"]
}
JSON
```

`updatedAt` wajib ISO-8601. Path default `.pawang/context/handoff.html`. Jangan menulis atau mengedit HTML-nya langsung — hanya lewat kit.js.

3. Isinya padat, maksimal sekitar 300-500 kata, tanpa dump kode. Ini ringkasan kerja, bukan changelog.
4. **Promosikan keputusan permanen.** Untuk setiap item di `decisions` yang berlaku seterusnya, tambahkan satu baris ke `## Keputusan penting` di AGENTS.md; larangan keras ke `## Jangan`. Jangan biarkan keputusan permanen hanya ada di handoff, karena file ini akan ditimpa.
5. Pastikan AGENTS.md punya baris peta dokumen yang memicu pembacaan handoff (contoh baris ada di `agents-md.md`). Kalau belum, tambahkan.
6. Di pesan penutup ke user, berikan prompt hemat dalam blok kode yang bisa langsung disalin:

```
Baca AGENTS.md, lalu jalankan `node .pawang/kit.js status`.
Baca handoff: `node .pawang/kit.js extract .pawang/context/handoff.html`.
Verifikasi kondisi repo dengan `git status` dan `git diff --stat`.
Lanjutkan langkah: <deskripsi>.
Hanya sentuh file: <daftar>.
Jangan memindai seluruh repo.
```

7. Tulis juga satu kalimat: "Cek bagian state dan next sebelum menutup sesi." Ringkasan buatan AI bisa keliru, jadi user perlu skim.

## B. Di awal sesi lanjutan: membaca handoff

1. Baca AGENTS.md, jalankan `node .pawang/kit.js status`, lalu `extract` handoff.
2. Bandingkan dengan kondisi sebenarnya (`git status`, `git diff --stat`, `git log`). Kalau commit/branch berbeda dari catatan atau ada perubahan yang tidak tercatat, katakan ke user sebelum bekerja. Jangan mempercayai catatan yang bertentangan dengan repo.
3. Kerjakan hanya bagian `next` yang diminta user. Baca file lain hanya kalau diperlukan.

## C. Setelah pekerjaan selesai total

Pastikan keputusan permanen sudah dipromosikan (A.4). Tidak ada file arsip handoff: `handoff.html` akan ditimpa handoff berikutnya. Riwayat pekerjaan yang selesai tempatnya `.pawang/history/` (lewat kit.js), bukan handoff.

## Kesalahan umum

- Ringkasan menjadi panjang dan berisi potongan kode.
- Menulis status dari ingatan tanpa memeriksa repo.
- Keputusan permanen hilang karena handoff ditimpa.
- Menulis atau mengedit `.pawang/context/handoff.html` langsung, bukan lewat kit.js.
- Menaruh handoff di `docs/` atau di luar `.pawang/` (handoff hidup di `.pawang/context/handoff.html`).
- Handoff usang dipercaya tanpa verifikasi.
