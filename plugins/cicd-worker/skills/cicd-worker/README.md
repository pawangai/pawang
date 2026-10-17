# cicd-worker

Menyiapkan pipeline CI/CD Cloudflare Workers: GitHub Actions, Worker Previews, E2E pada preview URL, ruleset, cleanup, deploy, dan rollback.

## Pasang

```bash
npx skills add pawangai/pawang --skill cicd-worker -a opencode
```

## Dependensi

- Python 3
- Node.js 22
- `wrangler >= 4.135`
- `gh`
- Kredensial Cloudflare untuk aksi remote

## Peringatan

- Khusus Cloudflare Workers. Untuk pipeline generik, gunakan `ci.md` di Pawang core.
- Preview hanya terisolasi bila setiap binding menunjuk resource terpisah. Jangan anggap preview aman otomatis.
- `scripts/render.py` menerima placeholder mentah dan punya `--force`; periksa output sebelum menjalankan.
- Aksi remote (membuat resource, ruleset, secret, deploy) butuh izin eksplisit user.

Lisensi: MIT (lihat `LICENSE` di root repo). Detail API Worker Previews dapat berubah; periksa dokumentasi Cloudflare terbaru.
