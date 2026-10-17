# Check - verifikasi perilaku

Tujuan: buktikan perilaku nyata terhadap `doneWhen` spec (mode default), atau tulis walkthrough manual read-only untuk user (mode `guide`). Tentukan mode **sebelum** tool call pertama.

## Dua mode

| Mode                 | Kapan dipakai                                                              | Menulis state?         |
| -------------------- | -------------------------------------------------------------------------- | ---------------------- |
| Verifikasi (default) | Saat butuh bukti bahwa done-when benar-benar terjadi di app yang berjalan. | Hanya status spec.     |
| `guide`              | Saat user minta panduan mencoba manual: ke mana klik, apa hasilnya.        | **Tidak sama sekali.** |

Panduan guide **tidak pernah** dihitung sebagai bukti verifikasi.

## Mode verifikasi

### 1. Susun checklist

- Baca `config.json`; ada tapi rusak? Berhenti dan arahkan ke doctor.md.
- `node .pawang/kit.js extract .pawang/context/current-feature.html`, ambil semua `doneWhen` dan catatan testing. Ubah jadi daftar klaim konkret - bukan "berfungsi".
- Tanpa spec aktif? Tanya apa yang mau diverifikasi, jangan mengarang.

### 2. Jalankan app

Pakai perintah asli dari `AGENTS.md`, sesuai jenis proyek:

- **Web app**: jalankan (atau pakai ulang) dev/preview server, lalu kendalikan browser sungguhan.
- **CLI**: jalankan perintah nyata dengan input representatif.
- **API/server**: hit endpoint aslinya.
- **Library**: panggil API publik lewat contoh atau perintah test.

### 3. Latih tiap klaim

- Klik, ketik, submit, unduh secara nyata - **jangan menyimpulkan dari kode** apa yang "akan" terjadi.
- Screenshot untuk klaim UI; output untuk klaim CLI/API.
- Perhatikan **console error dan request gagal**; layar rapi dengan console kotor bukan pass.

### 4. Lapor dan set status

Satu baris per item, apa adanya:

```
[pass]  Unduhan menyimpan sertifikat-<slug>.pdf - file terunduh dan terbuka benar
[pass]  Tombol menampilkan loading - screenshot: loading.png
[fail]  Border PDF hilang - printBackground tidak diset - screenshot: no-border.png
[skip]  Render produksi - tidak bisa diverifikasi lokal (fitur 9)
```

- Semua terbukti -> set status spec **`verified`** lewat `kit.js render current-feature` (extract JSON, ubah hanya field `status`).
- Ada gagal -> set **`verification-failed`**, serahkan ke implement.md, sebutkan apa yang gagal. Jangan perbaiki di sini.
- Ada yang tak bisa diverifikasi -> jelaskan alasannya; **jangan pernah dilaporkan sebagai pass.**

**Bukti atau tidak terjadi.** Jujur dan "belum bisa diverifikasi" adalah hasil yang berguna; pass palsu merusak seluruh gerbang. Check tidak mengedit produk, step, findings, atau commit - hanya status spec.

## Mode guide

**Read-only mutlak**: jangan menjalankan app, jangan menulis state apa pun, jangan mengubah status spec, jangan commit.

1. **Scope**: tanpa argumen = spec aktif; `latest` = arsip terbaru di `.pawang/history/`; nama step/route/perintah = fokus ke situ.
2. **Kumpulkan**: dari spec dan `AGENTS.md` saja - rute, perintah, UI, endpoint, dan data state yang perlu dicoba manusia. Jangan dump isi spec.
3. **Tulis panduan ringkas**:
   - **Mulai** - perintah yang dijalankan user, dan di mana.
   - **Buka** - URL/route/endpoint.
   - **Lakukan** - klik/input/langkahnya.
   - **Harapkan** - hasil yang terlihat, persis.
   - **Waspadai** - error console/network, empty state jelek, data basi, masalah layout.
4. Sertakan section pendek `## Try it now`: satu jalur terpendek, hasil yang diharapkan, dan satu kalimat "ini membuktikan apa" (jangan lebih lebar dari yang diamati).
5. Tidak ada jalur aman dan bermakna? Katakan terus terang dan lewati - jangan mengarang instruksi atau menggantinya dengan perintah build.

## Aturan umum

- Jangan install apa pun, jangan commit atau merge.
- Jangan menjalankan dev server di mode guide; kalau user perlu server, tulis perintahnya supaya dijalankan user.
- Jangan refactor atau "sekalian perbaiki" apa pun; itu tugas implement.md dan audit.md.
- Perintah dan hasil di laporan harus persis yang diamati, bukan yang diharapkan.
