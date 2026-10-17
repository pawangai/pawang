/* Pembungkus tipis di atas useMockQuery buatan Figr (src/ui/states.tsx).
   - Status loading / error / empty tetap dikendalikan Figr (?sim=, state di screens.figr.json),
     jadi varian layar Figr tidak berubah.
   - Data yang tampil dibaca LANGSUNG dari db, sehingga perubahan dari screen mana pun langsung terlihat
     di semua screen tanpa memicu loading ulang.
   Ganti `useMockQuery(scope, key, () => KONSTANTA)` di screen dengan
   `useDbQuery(scope, key, (s, { empty }) => (empty ? [] : s.users))`. */
import { useMemo } from "react";
import { useMockQuery, type LoadStatus, type Scope } from "../ui/states";
import { db } from "./db";

type Snapshot = ReturnType<typeof db.snapshot>;

export function useDbQuery<T>(
  scope: Scope,
  key: string,
  select: (state: Snapshot, opts: { empty: boolean }) => T,
  isEmpty?: (data: T) => boolean,
) {
  const rev = db.useRevision();
  const q = useMockQuery(scope, key, ({ empty }) => select(db.snapshot(), { empty }), isEmpty);
  // `rev` sengaja jadi dependency: data dihitung ulang setiap db berubah.
  const live = useMemo(
    () => (q.status === "data" ? select(db.snapshot(), { empty: false }) : q.data),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q.status, q.data, rev],
  );
  const status: LoadStatus =
    q.status === "data" && live !== undefined && isEmpty?.(live) ? "empty" : q.status;
  return { status, data: live, retry: q.retry };
}
