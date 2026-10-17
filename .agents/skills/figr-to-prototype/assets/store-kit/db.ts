/* Satu-satunya instance data prototype. Isi seed dari data mock Figr (BRANCHES, ROLES, USERS, ...):
   satu kunci per entitas, JSON murni, id unik, relasi lewat id. Tampilan awal harus identik dengan
   sebelum data dipusatkan. Panduan lengkap: references/data-layer.md */
import { createDb } from "./createDb";

export const db = createDb(
  {
    // users: [...],
    // branches: [...],
  },
  { storageKey: "prototype-db", version: 1, persist: false },
);
