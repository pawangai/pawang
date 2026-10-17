import test from "node:test";
import assert from "node:assert/strict";
import { add } from "../src/add.mjs";

test("menjumlahkan dua bilangan bulat", () => {
  assert.equal(add(2, 3), 5);
});

test("menjumlahkan nol", () => {
  assert.equal(add(0, 0), 0);
});

test("menjumlahkan desimal dan negatif", () => {
  assert.equal(add(1.5, 2.25), 3.75);
  assert.equal(add(-2, 3), 1);
});

test("menolak input non-angka di kedua argumen", () => {
  assert.throws(() => add("2", 3), TypeError);
  assert.throws(() => add(2, "3"), TypeError);
});

test("menolak NaN di kedua argumen", () => {
  assert.throws(() => add(Number.NaN, 1), TypeError);
  assert.throws(() => add(1, Number.NaN), TypeError);
});

test("menolak Infinity dan -Infinity", () => {
  assert.throws(() => add(Infinity, 1), TypeError);
  assert.throws(() => add(1, -Infinity), TypeError);
});
