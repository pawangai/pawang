# CI/CD Worker Audit

> Generated oleh `scripts/sync-plugin.mjs`; jangan edit manual. Jalankan `npm run plugin:sync`.

Audit read-only CI/CD Cloudflare Workers: preview, binding, secret, ruleset, cleanup, migrasi, dan rollback.

## Isi

- `skills/cicd-worker-audit/` - skill CI/CD Worker Audit, references, dan script pendukung.

## Pasang

- Claude Code: `/plugin install cicd-worker-audit@pawang`.
- ChatGPT/Codex: Codex `codex plugin marketplace add pawangai/pawang`, atau workspace admin impor marketplace. Publik setelah submit.
- Perplexity: impor folder `plugins/cicd-worker-audit` dari repo GitHub.
- Gemini CLI: `gemini skills install https://github.com/pawangai/pawang.git --path skills/cicd-worker-audit --scope workspace --consent`.

## Dependensi

- Python 3
- gh
- wrangler

## Peringatan

- Read-only; perbaikan tetap lewat cicd-worker setelah persetujuan user.
- Mode --remote butuh gh/wrangler login; UNKNOWN berarti belum bisa dicek, bukan aman.

## Lisensi

MIT
