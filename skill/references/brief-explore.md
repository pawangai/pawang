# Brief & Explore - dua mode baca-saja

Tujuan: dua cara memahami pekerjaan tanpa mengubah apa pun. **Brief** mengintip fitur berikutnya dari build-plan sebelum di-spec. **Explore** mendiskusikan ide melawan codebase. Keduanya read-only total: tidak menulis file, tidak mengubah `.pawang/`, tidak branch, commit, install, atau build.

## Aturan wajib kedua mode

- **Tidak menulis file apa pun**, termasuk spec, catatan, output, diagram, atau arsip. Tidak ada `kit.js render` di sini.
- `.pawang/` hanya dibaca: `status` dan `extract` boleh, tidak ada perintah yang mengubah state.
- Tidak mengubah build-plan atau current-feature.
- Tidak install dependency, menjalankan kode/tes/build/server, browser, atau perintah yang mengubah state.
- Tidak membuat branch, commit, merge, push, atau deploy.
- **Permintaan diskusi bukan izin untuk merencanakan atau implementasi.** Kalau user ingin bertindak, tunjukkan command yang tepat, tetap tanpa menjalankannya otomatis.

## Mode brief - preview fitur

Menjawab satu pertanyaan: apa sebenarnya isi fitur ini sebelum spec ditulis? Brief adalah prekursor read-only dari penulisan spec fitur.

### Input

Satu item build-plan by nomor atau nama. **Tanpa argumen: brief item berikutnya**, leaf unchecked pertama di build-plan, target yang sama dengan yang akan dipilih langkah spec fitur.

Kalau build-plan masih stub placeholder atau project-overview belum ada, bilang apa adanya dan arahkan ke langkah setup, jangan mengarang briefing.

### Yang dibaca

1. Baris target di build-plan lewat `node .pawang/kit.js extract .pawang/context/build-plan.html`, termasuk apakah parent sudah dipecah (4a, 4b).
2. project-overview: model data, route, stack, UI/UX, dan open questions yang menyentuh fitur ini.
3. Yang sudah ada: item build-plan checked sebelumnya dan, bila perlu, git history, untuk membaca dependency.
4. Design reference: bila `prototypes/` ada (lane A) atau `.pawang/prototype/` ada (lane B), sebut mockup yang berlaku.

Sintesis, jangan dump isi file.

### Format keluaran

```
Feature 5 - Submission draft flow
What: maintainer mengirim skill lewat GitHub URL (utama) atau zip (fallback); draft disimpan sebelum validasi jalan.
Depends on: apps/api harus berdiri dulu; melanjutkan shape Skill/SkillVersion dari fitur 3.
Unblocks: validasi berbasis antrean (6) dan alur publish (7).
Touches: tabel baru (Drizzle); OAuth GitHub; POST /submissions; upload snapshot; island upload.
Size: besar - kemungkinan pecah 5a / 5b / 5c.
Reference: upload.html mencakup panel validasi, bukan form ini.
Open questions: apps/api belum di-scaffold - selesaikan sebelum spec.

Next: tulis spec fitur 5 untuk 5a, atau bereskan blocker apps/api dulu.
```

Buang baris yang tidak berlaku. **Selalu akhiri dengan satu baris `Next:`**: spec fitur, prototype bila ber-UI dan tampilan belum dikunci, atau "bereskan X dulu" bila ada blocker. Tugas brief menjelaskan ukuran, dependency, dan kemungkinan split, bukan menulis step list.

## Mode explore - diskusi ide

Percakapan read-only yang berpijak pada proyek nyata. Cocok untuk pertanyaan seperti "apakah caching membantu halaman laporan ini" atau "pendekatan upload mana yang cocok dengan kode yang ada". Tidak butuh rencana atau spec aktif, dan ide tanpa rencana bukan blocker.

- **Mulai dari pertanyaan.** Pakai topik yang diberi atau konteks percakapan. Ide kabur: sebut tafsiran sementara, tanya satu hal yang benar-benar mengubah arah investigasi.
- **Ikuti kode asli.** Baca instruksi proyek, kode, test sebagai teks, manifest, dan rencana bila membantu. Tunjuk file atau simbol konkret. Jangan memindai bagian repo yang tak terkait.
- **Bahas opsi proporsional.** Bandingkan opsi masuk akal, termasuk "tidak melakukan apa-apa" bila perilaku sekarang mungkin sudah cukup. Jangan mengarang skala, kebutuhan keamanan, atau abstraksi baru.
- **Pisahkan fakta, asumsi, dan pertanyaan.** Jelaskan kasus terkuat yang menentang rekomendasimu dan tingkat keyakinanmu. Sebut bukti apa yang bisa mengubah rekomendasi, tanpa mengumpulkannya lewat eksekusi.
- **Batas.** Tidak ada template output wajib. Diagram kecil boleh di teks, bukan file. Jangan menyimpan percakapan ke proyek.

Saat user siap bertindak, tutup dengan satu next action: spec fitur, fix, atau rollback. Jangan paksa handoff di tiap balasan, lanjutkan diskusi selama masih berguna.

## Beda dengan tetangga

- `brief` menjelaskan item build-plan yang sudah ada. `explore` membahas ide yang belum direncanakan atau mempertanyakan pendekatan yang ada.
- `status` melaporkan seluruh proyek. `brief` menyorot satu fitur.
- Langkah spec fitur yang menulis spec. `brief` dan `explore` tidak mengubah apa pun.
