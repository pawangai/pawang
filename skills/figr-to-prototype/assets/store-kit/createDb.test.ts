import { describe, expect, it } from "vitest";
import { createDb } from "./createDb";

const seed = {
  users: [{ id: "u-001", name: "A", status: "aktif" }],
  logs: [] as { id: string; msg: string }[],
};

describe("createDb", () => {
  it("insert/update/remove/find + nextId", () => {
    const db = createDb(seed);
    expect(db.nextId("users", "u-")).toBe("u-002");
    db.insert("users", { id: "u-002", name: "B", status: "diundang" });
    db.update("users", "u-001", { status: "suspended" });
    expect(db.find("users", "u-001")?.status).toBe("suspended");
    db.remove("users", "u-002");
    expect(db.get("users")).toHaveLength(1);
  });
  it("tidak memutasi seed asli dan reset kembali ke seed", () => {
    const db = createDb(seed);
    db.update("users", "u-001", { name: "X" });
    expect(seed.users[0].name).toBe("A");
    db.reset();
    expect(db.find("users", "u-001")?.name).toBe("A");
  });
  it("batch memberi satu notifikasi untuk beberapa perubahan", () => {
    const db = createDb(seed);
    let calls = 0;
    db.subscribe(() => calls++);
    db.batch(() => {
      db.insert("users", { id: "u-009", name: "Z", status: "aktif" });
      db.insert("logs", { id: "l-001", msg: "dibuat" });
    });
    expect(calls).toBe(1);
    expect(db.get("logs")).toHaveLength(1);
  });
  it("snapshot stabil bila tidak ada perubahan (aman untuk useSyncExternalStore)", () => {
    const db = createDb(seed);
    expect(db.snapshot()).toBe(db.snapshot());
    expect(db.get("users")).toBe(db.get("users"));
  });
});
