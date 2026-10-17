import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite-plus";

// Design system di packages/shared/ui adalah MASTER (boleh diedit, lewat references/ds-sync.md), tetapi
// TIDAK diformat/di-lint otomatis: Oxfmt akan menulis ulang hampir semua filenya sehingga setiap
// file tampak "diubah lokal" dan sinkronisasi dengan DS Figr (scripts/scaffold.py) jadi konflik semua.
// Tambahan baru ke DS ditulis dengan gaya file di sekitarnya.
const READ_ONLY = ["packages/shared/ui/**", "**/.figr/**", ".figr-raw/**", "dist/**"];

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@shared/ui": fileURLToPath(new URL("./packages/shared/ui/src", import.meta.url)),
    },
  },
  lint: {
    ignorePatterns: READ_ONLY,
    // Aktifkan type-check supaya `vp check` juga menangkap error tipe (bukan hanya lint + format).
    options: { typeAware: true, typeCheck: true },
  },
  fmt: { ignorePatterns: READ_ONLY },
});
