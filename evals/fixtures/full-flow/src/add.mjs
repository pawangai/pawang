export function add(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new TypeError("add hanya menerima angka finite");
  }
  return a + b;
}
