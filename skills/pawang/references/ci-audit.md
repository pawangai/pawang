# CI Audit - audit pipeline read-only

Tujuan: menilai kesehatan CI/CD tanpa mengubah apa pun. Fokus pada drift, guard generik, dan isolasi preview. Detail provider/Cloudflare memakai companion `cicd-worker-audit`; jangan menyalin script Python ke Pawang.

## Batas

- **Read-only terhadap proyek**: tidak mengubah kode/workflow, commit, push, install, deploy, rollback, atau mengubah ruleset/secret/resource.
- Pemeriksaan remote hanya baca (mis. daftar ruleset/secret by name) dan hanya dengan izin bila tool memerlukan kredensial.
- Satu-satunya tulisan: `findings.html` lewat `kit.js render findings` (bila `.pawang/` ada). Tidak memperbaiki kode.
- Jangan pernah menampilkan nilai secret; tulis kategori + file:line.

## Sumber

`AGENTS.md` (Commands/`Verify`), script manifest, workflow CI, hook, dokumentasi ruleset, runtime pin, lockfile, config preview/deploy, `.env.example` (nama saja), dan state git.

## Check

| Area            | Yang diperiksa                                                                                                                  | Risiko                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Drift `Verify`  | Perintah di `AGENTS.md`, script, workflow, dan hook harus sama; urutan typecheck → test → build                                 | P0/P1 bila CI menjalankan hal berbeda |
| Trigger         | `pull_request` + push branch default; fork guard; hindari `pull_request_target` dengan checkout/secret                          | P1                                    |
| Permission      | `contents: read` atau minimal; tidak ada `write-all`; secret hanya di job yang perlu                                            | P1                                    |
| Supply chain    | Action dipin (SHA/versi stabil), install lockfile-safe, runtime dipin, tanpa `curl \| sh`                                       | P1                                    |
| Secret          | Hanya nama; tidak di-echo/log; environment terpisah; fork tidak dapat secret                                                    | P0/P1                                 |
| Isolasi preview | Tiap binding menunjuk resource terpisah; resource bersama produksi = tidak aman; cleanup saat PR ditutup dan kegagalan terlihat | P0 bila produksi tersentuh            |
| Migrasi         | Expand/contract, bukan saat build; rollback kode tidak membalik skema; fix-forward disiapkan                                    | P1                                    |
| Required check  | Nama check ada dan cocok dengan job; ruleset tidak mewajibkan check yang tak pernah jalan                                       | P1 (deadlock)                         |
| Rollback        | Jalur rollback kode + fix-forward terdokumentasi; tidak ada deploy otomatis tanpa izin                                          | P2/P1                                 |
| Klaim           | Tidak ada klaim "CI hijau"/"production safe" tanpa run atau bukti isolasi                                                       | P1                                    |

Severity/status mengikuti `audit.md`: P0-P3; `open`/`fixed` memblokir `complete`, `closed` hanya setelah re-review, `accepted` atas keputusan user, `invalid` dengan bukti. Tulis temuan ke ledger, lalu ringkas temuan dulu.

## Verdict

Gunakan label ringkas:

- `READY`: tidak ada P0/P1 dan tidak ada `UNKNOWN` yang material;
- `NEEDS WORK`: ada P1/P2 yang perlu diperbaiki;
- `UNSAFE`: preview menyentuh produksi, secret bocor, atau supply-chain berbahaya.

`UNKNOWN` bukan lulus dan bukan tebakan: sebutkan apa yang tidak bisa diperiksa (akses remote, dashboard, secret). Jangan menaikkan severity tanpa jalur/bukti nyata.

## Output

Ringkas: verdict, tabel temuan (ID, severity, file:line, bukti, saran), cakupan yang tidak diperiksa, dan satu langkah berikutnya:

- perbaikan pipeline → `ci.md`;
- temuan kode/konfigurasi → `fix-debug.md` atau spec fix;
- detail Cloudflare → companion `cicd-worker-audit` setelah izin.

## Larangan

- Menjalankan deploy, rollback, migrasi remote, atau perintah yang menulis.
- Mengubah workflow/ruleset/secret "sekalian".
- Mengutip nilai secret atau menganggap `UNKNOWN` sebagai aman.
- Mengklaim CI hijau tanpa run yang teramati.
