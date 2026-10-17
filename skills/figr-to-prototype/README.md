# figr-to-prototype

Menyusun hasil Figr di `figr/` menjadi scaffold `prototype/` (React + design system) yang bisa dijalankan dan dirawat, termasuk sinkronisasi saat Figr digenerate ulang.

## Pasang

```bash
npx skills add pawangai/pawang --skill figr-to-prototype -a opencode
```

## Dependensi

- Python 3
- Node.js/npm untuk toolchain Vite+
- Jaringan untuk mengambil dependency npm

## Peringatan

- Skill ini mengubah folder `prototype/`; baca `SKILL.md` sebelum menjalankan.
- Sync Figr bisa menggabungkan perubahan; periksa diff sebelum commit.
- Script scaffold ada di `scripts/` dan berjalan dengan hak akses agent.

Lisensi: MIT (lihat `LICENSE` di root repo).
