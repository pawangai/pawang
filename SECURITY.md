# Kebijakan Keamanan

## Versi yang didukung

| Versi                   | Didukung |
| ----------------------- | -------- |
| `0.1.x` (rilis terbaru) | Ya       |
| Lebih lama              | Tidak    |

Perbarui ke rilis terbaru sebelum melaporkan masalah.

## Melaporkan kerentanan

Laporkan secara **privat** melalui GitHub:

1. Buka <https://github.com/pawangai/pawang/security/advisories/new> (Security → Report a vulnerability), atau
2. Kirim surel ke **pawanginit@gmail.com** dengan subjek `Security` jika kanal GitHub tidak tersedia.

**Jangan** membuka issue, pull request, atau diskusi publik untuk kerentanan yang belum diperbaiki.

Sertakan sebanyak mungkin:

- Versi Pawang atau commit yang terdampak
- Versi Node.js dan sistem operasi
- Langkah reproduksi dan dampak yang mungkin terjadi
- Proof of concept minimal, bila ada

Jangan mengirim data pribadi, token, atau secret. Jika perlu membuktikan dampak, gunakan data contoh.

## Cakupan

Yang termasuk cakupan:

- `bin/cli.mjs`: path traversal, penulisan/timpa file di luar target, penanganan symlink dan `--target`.
- `skills/pawang/assets/kit.js`: injeksi atau XSS pada HTML yang dihasilkan dari JSON, escaping, dan penulisan output.
- `skills/pawang/scripts/*.mjs`: penanganan symlink, validasi input, dan penulisan file.
- `pawang companion add`: instalasi atau perubahan file tanpa persetujuan.
- Supply chain: rilis npm, tag, dan isi paket (core tidak membundel dependency runtime).
- Kelemahan yang memungkinkan agent melewati gerbang persetujuan atau menulis di luar scope proyek.

Di luar cakupan:

- Bug fungsional dan perilaku agent yang bukan masalah keamanan — gunakan issue biasa.
- Kualitas output, prompt, atau model.
- Serangan yang membutuhkan akses fisik, akun yang sudah diambil alih, atau hak istimewa lokal.
- Social engineering dan spam.
- Laporan tanpa bukti atau langkah reproduksi.

## Proses

- Kami berusaha mengonfirmasi laporan dalam **3 hari kerja** dan melakukan triase dalam **7 hari kerja**.
- Perbaikan dijadwalkan sesuai tingkat keparahan; kami akan berkoordinasi dengan pelapor.
- Pengungkapan publik secara default setelah **90 hari** sejak laporan atau sesuai kesepakatan, mana yang lebih dulu.
- Kredit diberikan atas permintaan pelapor.
- Tidak ada program bug bounty.

## Safe harbor

Kami tidak akan menempuh tindakan hukum terhadap riset keamanan yang dilakukan dengan iktikad baik dan mengikuti kebijakan ini. Riset harus menghindari akses ke data orang lain, gangguan layanan, dan pengungkapan publik sebelum perbaikan tersedia.
