# Pawang

> Generated oleh `scripts/sync-plugin.mjs`; jangan edit manual. Jalankan `npm run plugin:sync`.

Pawang adalah plugin alur kerja agent otonom berbasis spec. Plugin ini membawa skill inti `pawang`: peta alur, references per topik, script deterministik, dan `kit.js` untuk menulis state proyek di `.pawang/`. Setelah spec disetujui, agent bekerja otonom dan manusia hanya hadir di dua gerbang: review spec serta izin commit/merge.

## Isi

- `skills/pawang/` - skill inti, references, script, dan `assets/kit.js`.
- `skills/pawang/companions.json` - metadata companion opsional; companion tidak dibundel.

## Pasang

- Claude Code: `/plugin marketplace add pawangai/pawang` lalu `/plugin install pawang@pawang`.
- ChatGPT/Codex: `codex plugin marketplace add pawangai/pawang`; workspace ChatGPT bisa mengimpor marketplace ini. Publik setelah submit.
- Perplexity: impor folder `plugins/pawang` dari repo GitHub.
- Gemini CLI: `gemini skills install https://github.com/pawangai/pawang.git --path skills/pawang --scope workspace --consent`.
- Antigravity: salin atau tautkan `skills/pawang` ke `.agents/skills/pawang`.

## Batas

Alur penuh membutuhkan shell, Node, git, dan repo proyek yang bisa ditulis. Di chat web tanpa runtime tersebut, skill otomatis memakai mode lite: plan, spec, review, dan audit sebagai artifact tanpa menulis `.pawang/`. Companion Figr/CICD dipasang sebagai plugin terpisah dan tidak dibundel.

## Lisensi

MIT
