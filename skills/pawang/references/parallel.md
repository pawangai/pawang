# Paralel - orkestrator dispatch

Tujuan: mempercepat pekerjaan independen dengan beberapa subagent tanpa rebutan state, tanpa konteks ganda, dan tanpa merge kacau. File ini mengatur **satu fitur**. Untuk lintas fitur/tiket, baca `orchestrate.md`.

## Orkestrator

Agent utama adalah orkestrator. Ia:

1. membaca `node .pawang/kit.js status` dan meng-`extract` spec **sekali**;
2. menyusun grup tugas: klaim cek, lensa audit, area eksplorasi, atau step implementasi;
3. menetapkan cap dan menulis brief tiap worker;
4. men-dispatch, memantau, lalu **mengagregasi** hasil;
5. satu-satunya yang menulis `.pawang/`, history, dan git;
6. memperbaiki temuan secara sequential;
7. berhenti dan lapor bila konflik, dependency hilang, atau budget habis.

Worker/subagent tidak pernah menjadi orkestrator. Worker read-only tidak menulis apa pun; worker implementasi hanya menulis di worktree-nya.

## Kapan paralel

Paralel hanya bila pekerjaan **independen**:

- beberapa klaim `doneWhen` yang bisa diperiksa terpisah (UI, API, CLI, build);
- beberapa lensa audit (`quality`, `security`, `performance`, `tests`);
- beberapa area eksplorasi yang tidak saling bergantung (schema, route/API, UI, test);
- beberapa step implementasi dengan `steps[].files` terisi dan **tidak beririsan**, tanpa migrasi/skema bersama.

Jangan paralel bila:

- perbaikan findings (selalu sequential);
- step saling bergantung atau menyentuh file yang sama;
- tugas kecil yang lebih murah dikerjakan langsung;
- brief tidak bisa dipotong menjadi pointer kecil;
- tidak ada tool subagent (fallback sequential, jangan simulasi).

## Cap

Default untuk mesin 8GB:

| Jenis worker                     | Cap |
| -------------------------------- | --- |
| read-only (cek/audit/eksplorasi) | 3   |
| browser                          | 2   |
| write/implementasi (worktree)    | 2   |

Cap = jumlah worker yang **berjalan bersamaan**, bukan total. Turunkan bila RAM atau token menipis. Jangan pernah melebihi 4.

## Brief hemat

Brief adalah pointer, bukan transkrip. Jangan menempel percakapan, spec penuh, atau diff penuh. Template:

```text
Tugas: <satu klaim/area, bukan seluruh fitur>
Konteks: <step id/path spec/diff ref>; baca hanya yang disebut.
File: <path yang relevan>
Di luar scope: <yang tidak boleh disentuh>
Perintah: <perintah persis, bila ada>
Keluaran: <pass|fail|skip> + bukti (command/path) + <150 kata.
Jangan: menulis .pawang, mengubah kode, commit, scan seluruh repo.
```

Aturan token:

- jalankan perintah deterministik (typecheck/test/build) dulu; subagent hanya untuk yang butuh observasi;
- parent meng-`extract` spec sekali, lalu mengirim potongan klaim;
- untuk audit, kirim perintah `git diff <ref>...HEAD`, bukan diff-nya;
- satu hasil dipakai ulang; jangan dispatch ulang klaim yang sama;
- minta output pendek dan terstruktur; tanpa dump kode/screenshot di dalam teks.

## Cek paralel

1. Susun daftar klaim dari `steps[].doneWhen` dan `testing`; kelompokkan per surface.
2. Jalankan perintah deterministik yang ada lebih dulu.
3. Untuk klaim yang butuh observasi, dispatch satu worker per grup.
4. Satu dev server untuk semua worker browser; jangan start server per worker. Beri URL dan akun/state terpisah atau read-only.
5. Simpan bukti di folder temp (mis. `/tmp/pawang-verify-<id>/`), bukan di repo.
6. Parent menggabungkan hasil menjadi satu tabel, lalu menulis status spec **sekali** (`verified` atau `verification-failed`).
7. Klaim gagal diserahkan ke `implement.md`; perbaikan sequential, lalu cek ulang hanya klaim itu.

## Audit paralel

1. Pilih lensa yang relevan (`quality`, `security`, `performance`, `tests`).
2. Dispatch satu worker per lensa dengan diff ref dan cakupan; worker read-only.
3. Worker tidak menulis `findings.html` dan tidak memberi ID final.
4. Parent menggabungkan, menghapus duplikat, memberi ID `F-xx`, lalu menulis `findings.html` sekali.
5. Jangan kutip secret; laporkan kategori teredaksi + file:line.
6. Review independen tetap menjaga pemisahan builder/reviewer; lensa paralel tidak menghapus aturan di `audit.md`.

## Eksplorasi paralel

Untuk repo besar, pecah eksplorasi per area yang tidak tumpang tindih: schema/data, route/API, UI/komponen, test/command. Setiap worker hanya membaca area itu dan mengembalikan ringkasan + path. Parent menyusun spec; jangan menyalin seluruh temuan ke konteks.

## Implementasi paralel (guard)

Paralel implementasi hanya jika **semua** syarat ini benar:

- ada minimal dua step yang bisa berdiri sendiri;
- setiap step punya `steps[].files`;
- tidak ada irisan file antar-step;
- tidak ada migrasi, schema, atau generated file bersama;
- dependency proyek bisa dipakai bersama (monorepo hoisted) atau install murah;
- user tidak meminta sequential.

Alur:

1. Parent membuat integration branch dari branch spec (atau memakai branch spec yang sudah ada).
2. Satu worker per step di `git worktree` terpisah dengan branch sendiri. Worker hanya menyentuh file di step-nya.
3. Worker menjalankan test terfokus di worktree, lalu commit **lokal** di branch step (tidak push, tidak merge). Commit ini scaffolding, bukan commit work item.
4. Parent menerapkan hasil secara **sequential** ke integration branch (`git apply --3way --index` atau `git cherry-pick --no-commit`), satu step demi satu. Jangan merge beberapa worker sekaligus.
5. Setelah tiap step masuk, parent menjalankan cek, menandai `steps[].done`, lalu lanjut step berikutnya. Konflik? Stop dan lapor; jangan auto-resolve.
6. Commit final work item tetap di Gerbang 2 `complete.md`. Worker tidak pernah commit ke branch spec/default dan tidak menulis `.pawang`.
7. Bersihkan worktree dan branch step setelah selesai. Jangan meninggalkan worktree di dalam repo.

Jika syarat tidak terpenuhi, sequential. Jika worktree/dependency berat (8GB, `node_modules` besar), sequential adalah default yang benar.

## Agregasi dan kegagalan

- Parent memiliki semua tulisan state; worker hanya mengembalikan hasil.
- Satu laporan agregat, bukan empat laporan terpisah.
- Worker gagal/timeout? Parent memeriksa sendiri atau mengulang **satu** worker; jangan mencascade ke semua worker.
- Temuan duplikat digabung; konflik bukti ditandai, bukan dipilih diam-diam.
- Bila budget token/RAM habis, hentikan batch dan laporkan progres.

## Batas

- Jangan paralel untuk perbaikan findings.
- Jangan paralel lintas fitur di sini; gunakan `orchestrate.md`.
- Jangan biarkan worker menulis `.pawang/`, `AGENTS.md`, history, atau git bersama.
- Jangan memakai worktree sebagai default; itu opt-in dengan guard.
- Jangan menyalin aturan ini ke `AGENTS.md` proyek; cukup tautkan `parallel.md` saat dibutuhkan.
