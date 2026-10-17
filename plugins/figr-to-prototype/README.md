# Figr to Prototype

> Generated oleh `scripts/sync-plugin.mjs`; jangan edit manual. Jalankan `npm run plugin:sync`.

Menyusun hasil Figr di folder figr/ menjadi scaffold prototype/ (React + design system) yang bisa dijalankan dan dirawat.

## Isi

- `skills/figr-to-prototype/` - skill Figr to Prototype, references, dan script pendukung.

## Pasang

- Claude Code: `/plugin install figr-to-prototype@pawang`.
- ChatGPT/Codex: Codex `codex plugin marketplace add pawangai/pawang`, atau workspace admin impor marketplace. Publik setelah submit.
- Perplexity: impor folder `plugins/figr-to-prototype` dari repo GitHub.
- Gemini CLI: `gemini skills install https://github.com/pawangai/pawang.git --path skills/figr-to-prototype --scope workspace --consent`.

## Dependensi

- Python 3
- Node.js/npm
- jaringan untuk npm/Vite+

## Peringatan

- Mengubah folder prototype/; baca SKILL.md sebelum menjalankan.
- Sync Figr bisa menggabungkan perubahan; periksa diff sebelum commit.

## Lisensi

MIT
