# CI/CD Cloudflare Workers

> Generated oleh `scripts/sync-plugin.mjs`; jangan edit manual. Jalankan `npm run plugin:sync`.

Menyiapkan pipeline Cloudflare Workers: GitHub Actions, Worker Previews, E2E, ruleset, cleanup, deploy, dan rollback.

## Isi

- `skills/cicd-worker/` - skill CI/CD Cloudflare Workers, references, dan script pendukung.

## Pasang

- Claude Code: `/plugin install cicd-worker@pawang`.
- ChatGPT/Codex: Codex `codex plugin marketplace add pawangai/pawang`, atau workspace admin impor marketplace. Publik setelah submit.
- Perplexity: impor folder `plugins/cicd-worker` dari repo GitHub.
- Gemini CLI: `gemini skills install https://github.com/pawangai/pawang.git --path skills/cicd-worker --scope workspace --consent`.

## Dependensi

- Python 3
- Node.js 22
- wrangler >= 4.135
- gh
- kredensial Cloudflare

## Peringatan

- Khusus Cloudflare Workers; Pawang core tetap memakai ci.md untuk pipeline generik.
- Preview hanya terisolasi bila setiap binding menunjuk resource terpisah; jangan anggap aman otomatis.
- render.py menerima placeholder mentah dan punya --force; periksa output sebelum menjalankan.
- Aksi remote (resource, ruleset, secret, deploy) butuh izin eksplisit.

## Lisensi

MIT
