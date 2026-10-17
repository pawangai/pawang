#!/usr/bin/env node
// cli.mjs: pemasang skill pawang. Tanpa dependensi (Node 18+).
//
// Pemakaian:
//   npx pawang init                    pasang ke ~/.config/opencode/skills/pawang
//   npx pawang init --project          pasang ke ./.agents/skills/pawang
//   npx pawang init --target <dir>     pasang ke folder lain (mis. ~/.claude/skills)
//   npx pawang init --force            timpa/update bila sudah terpasang
//   pawang --help | --version

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(pkgRoot, "package.json"), "utf8"));
const SRC = path.join(pkgRoot, "skill");

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : undefined;
};

function usage() {
  console.log(`pawang v${pkg.version} - alur kerja agent otonom berbasis spec

Pemakaian:
  pawang init                    pasang ke ~/.config/opencode/skills/pawang
  pawang init --project          pasang ke ./.agents/skills/pawang (ikut repo)
  pawang init --target <dir>     pasang ke folder lain (mis. ~/.claude/skills)
  pawang init --force            timpa/update bila sudah terpasang
  pawang --version               cetak versi`);
}

function expand(p) {
  if (p === "~") return os.homedir();
  if (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
  return path.resolve(p);
}

function init() {
  if (!fs.existsSync(SRC)) {
    console.error(`GAGAL: paket tidak lengkap (folder skill tidak ditemukan di ${SRC})`);
    process.exit(1);
  }
  const target = val("--target")
    ? expand(val("--target"))
    : has("--project")
      ? path.resolve(process.cwd(), ".agents", "skills", "pawang")
      : path.join(os.homedir(), ".config", "opencode", "skills", "pawang");

  if (fs.existsSync(target) && !has("--force")) {
    console.error(`Sudah ada: ${target}`);
    console.error("Perbarui dengan:  npx pawang init --force" + (has("--project") ? " --project" : ""));
    process.exit(1);
  }
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(SRC, target, { recursive: true });

  console.log(`pawang v${pkg.version} terpasang`);
  console.log(`Lokasi : ${target}`);
  console.log("Dibaca oleh: opencode (~/.config/opencode/skills, .opencode/skills), Claude Code (~/.claude/skills), agent mana pun (./.agents/skills)");
  console.log('Lanjut : buka sesi agent di proyek, lalu minta: "pawang, adopsi proyek ini"');
  console.log("Panduan: lihat README atau skill/references/workflow.md");
  if (path.dirname(target) === path.join(os.homedir(), ".config", "opencode", "skills")) {
    console.log("Catatan: untuk proyek tim, `pawang init --project` memasang skill di dalam repo.");
  }
}

if (has("--version") || has("-v")) {
  console.log(pkg.version);
  process.exit(0);
}
if (has("--help") || has("-h") || args.length === 0) {
  usage();
  process.exit(args.length === 0 ? 1 : 0);
}
const cmd = args.find((a) => !a.startsWith("-"));
if (cmd === "init") {
  init();
} else {
  console.error(`Perintah tidak dikenal: ${cmd}`);
  usage();
  process.exit(2);
}
