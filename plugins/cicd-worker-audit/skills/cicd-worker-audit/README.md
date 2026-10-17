# cicd-worker-audit

Audit read-only CI/CD Cloudflare Workers: preview, binding, secret, ruleset, cleanup, migrasi, dan rollback. Verdict `READY`, `NEEDS WORK`, atau `UNSAFE`.

## Pasang

```bash
npx skills add pawangai/pawang --skill cicd-worker-audit -a opencode
```

## Dependensi

- Python 3
- `gh` dan `wrangler` untuk mode `--remote`

## Peringatan

- Read-only; perbaikan tetap lewat `cicd-worker` setelah persetujuan user.
- Mode `--remote` hanya menjalankan pembacaan, tetapi membutuhkan login `gh`/`wrangler`.
- `UNKNOWN` berarti belum bisa dicek, bukan aman.
- Script `scripts/audit.py` tidak menulis file atau menampilkan nilai secret.

Lisensi: MIT (lihat `LICENSE` di root repo).
