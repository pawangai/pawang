/* Store data terpusat untuk prototype: satu sumber data untuk semua screen.
   - Tanpa dependency; memakai useSyncExternalStore.
   - Satu kunci per entitas (users, branches, bookings, ...), tiap baris punya `id: string`.
   - Seed harus JSON murni (tanpa fungsi/JSX/Date) supaya bisa disalin dan (opsional) disimpan.
   - Relasi disimpan sebagai id, bukan objek tertanam; turunkan nama/hitungan lewat selector. */
import { useSyncExternalStore } from "react";

export type Entity = { id: string };
type Seed = Record<string, readonly Entity[]>;
export type DbState<S extends Seed> = { [K in keyof S]: S[K][number][] };
export type Row<S extends Seed, K extends keyof S> = S[K][number];

export function createDb<S extends Seed>(
  seed: S,
  opts: { storageKey?: string; version?: number; persist?: boolean } = {},
) {
  // persist=false (default): data kembali ke seed saat halaman dimuat ulang, jadi varian
  // ?figr_screen= selalu mulai dari kondisi yang sama. Naikkan `version` bila bentuk seed berubah.
  const { storageKey = "prototype-db", version = 1, persist = false } = opts;
  const fresh = () => structuredClone(seed) as unknown as DbState<S>;

  function load(): DbState<S> | null {
    if (!persist) return null;
    try {
      const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
      return parsed && parsed.version === version ? (parsed.state as DbState<S>) : null;
    } catch {
      return null;
    }
  }

  let state: DbState<S> = load() ?? fresh();
  let rev = 0;
  let depth = 0;
  let dirty = false;
  const listeners = new Set<() => void>();

  function commit(next: DbState<S>) {
    state = next;
    rev += 1;
    if (depth > 0) {
      dirty = true;
      return;
    }
    flush();
  }
  function flush() {
    dirty = false;
    if (persist) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify({ version, state }));
      } catch {
        /* penyimpanan penuh/dinonaktifkan: abaikan, prototype tetap jalan */
      }
    }
    listeners.forEach((l) => l());
  }
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };

  return {
    snapshot: () => state,
    get: <K extends keyof S>(name: K) => state[name],
    find: <K extends keyof S>(name: K, id: string) =>
      state[name].find((r) => r.id === id) as Row<S, K> | undefined,
    insert: <K extends keyof S>(name: K, row: Row<S, K>) =>
      commit({ ...state, [name]: [...state[name], row] }),
    update: <K extends keyof S>(name: K, id: string, patch: Partial<Row<S, K>>) =>
      commit({ ...state, [name]: state[name].map((r) => (r.id === id ? { ...r, ...patch } : r)) }),
    remove: <K extends keyof S>(name: K, id: string) =>
      commit({ ...state, [name]: state[name].filter((r) => r.id !== id) }),
    /** Id berikutnya berurutan, mis. nextId("users", "u-") -> "u-013". */
    nextId: <K extends keyof S>(name: K, prefix: string) => {
      const max = state[name].reduce((m, r) => Math.max(m, Number(r.id.replace(prefix, "")) || 0), 0);
      return `${prefix}${String(max + 1).padStart(3, "0")}`;
    },
    /** Beberapa perubahan sekaligus (mis. booking baru + catatan audit) dengan satu notifikasi. */
    batch: (fn: () => void) => {
      depth += 1;
      try {
        fn();
      } finally {
        depth -= 1;
        if (depth === 0 && dirty) flush();
      }
    },
    reset: () => commit(fresh()),
    subscribe,
    useCollection: <K extends keyof S>(name: K) =>
      useSyncExternalStore(subscribe, () => state[name], () => state[name]),
    useRevision: () => useSyncExternalStore(subscribe, () => rev, () => rev),
  };
}
