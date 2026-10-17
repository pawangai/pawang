#!/usr/bin/env node
// pack-plugin.mjs: membuat ZIP tiap plugin dan ZIP lite untuk upload manual.
// Membutuhkan perintah `zip` di sistem. Jalankan: npm run plugin:pack

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const companions = JSON.parse(
  fs.readFileSync(path.join(root, "skills", "pawang", "companions.json"), "utf8"),
).companions;
const skills = [{ name: "pawang" }, ...companions];
const jobs = [
  ...skills.map((item) => [
    path.join(root, "plugins", item.name),
    path.join(dist, `${item.name}-plugin.zip`),
  ]),
  [path.join(dist, "pawang-lite"), path.join(dist, "pawang-lite.zip")],
];
const skillJobs = skills.map((item) => ({
  folder: item.name,
  output: path.join(dist, `${item.name}.skill`),
}));

fs.mkdirSync(dist, { recursive: true });

for (const [source, output] of jobs) {
  if (!fs.existsSync(source)) {
    console.error(`GAGAL: ${path.relative(root, source)} tidak ditemukan; jalankan npm run plugin:sync`);
    process.exit(1);
  }
  fs.rmSync(output, { force: true });
  const result = spawnSync("zip", ["-qr", output, "."], { cwd: source, stdio: "inherit" });
  if (result.error) {
    console.error(`GAGAL: perintah zip tidak tersedia (${result.error.message})`);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
  const size = fs.statSync(output).size;
  console.log(`${path.relative(root, output)} (${size} byte)`);
}

for (const job of skillJobs) {
  fs.rmSync(job.output, { force: true });
  const result = spawnSync("zip", ["-qr", job.output, job.folder], {
    cwd: path.join(root, "skills"),
    stdio: "inherit",
  });
  if (result.error) {
    console.error(`GAGAL: perintah zip tidak tersedia (${result.error.message})`);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
  const size = fs.statSync(job.output).size;
  console.log(`${path.relative(root, job.output)} (${size} byte)`);
}
