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
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(pkgRoot, "package.json"), "utf8"));
const SRC = path.join(pkgRoot, "skills", "pawang");
const COMPANIONS = path.join(SRC, "companions.json");

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
  pawang companion list          daftar companion + perintah pasang
  pawang companion info <nama>   detail satu companion
  pawang companion add <nama>    cetak perintah; --run untuk menjalankan
  Opsi add: --agent <agent> (default opencode), --global, --copy, --run
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
  console.log("Panduan: lihat README atau skills/pawang/references/workflow.md");
  console.log("Companion: jalankan `pawang companion list` untuk companion opsional.");
  if (path.dirname(target) === path.join(os.homedir(), ".config", "opencode", "skills")) {
    console.log("Catatan: untuk proyek tim, `pawang init --project` memasang skill di dalam repo.");
  }
}

function loadCompanions() {
  if (!fs.existsSync(COMPANIONS)) {
    console.error(`GAGAL: data companion tidak ditemukan di ${COMPANIONS}`);
    process.exit(1);
  }
  let data;
  try {
    data = JSON.parse(fs.readFileSync(COMPANIONS, "utf8"));
  } catch (error) {
    console.error(`GAGAL: companions.json tidak valid: ${error.message}`);
    process.exit(1);
  }
  if (!data.source || !Array.isArray(data.companions)) {
    console.error("GAGAL: companions.json harus punya source dan companions[]");
    process.exit(1);
  }
  return data;
}

function findCompanion(data, name) {
  const item = data.companions.find((c) => c.name === name);
  if (!item) {
    console.error(`Companion tidak dikenal: ${name}`);
    console.error(`Pilihan: ${data.companions.map((c) => c.name).join(", ")}`);
    process.exit(2);
  }
  return item;
}

function isInstalled(name) {
  const lockPath = path.join(process.cwd(), "skills-lock.json");
  if (fs.existsSync(lockPath)) {
    try {
      const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
      if (lock.skills && lock.skills[name]) return true;
    } catch {
      /* lock rusak: lanjut cek folder */
    }
  }
  return fs.existsSync(path.join(process.cwd(), ".agents", "skills", name, "SKILL.md"));
}

function installCommand(source, item, agent, global, copy) {
  const parts = ["npx", "skills", "add", source, "--skill", item.name, "-a", agent];
  if (global) parts.push("-g");
  if (copy) parts.push("--copy");
  return parts.join(" ");
}

function companion(args) {
  const sub = args.find((a) => !a.startsWith("-"));
  const name = sub ? args[args.indexOf(sub) + 1] : undefined;
  const valOf = (flag) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const agent = valOf("--agent") || "opencode";
  const global = args.includes("--global");
  const copy = args.includes("--copy");
  const run = args.includes("--run");
  const data = loadCompanions();

  if (sub === "list") {
    const rows = data.companions.map((item) => ({
      name: item.name,
      status: isInstalled(item.name) ? "terpasang" : "-",
      deps: (item.deps || []).join(", "),
      cmd: installCommand(data.source, item, "opencode", false, false),
    }));
    const wName = Math.max(9, ...rows.map((r) => r.name.length));
    const wStatus = Math.max(9, ...rows.map((r) => r.status.length));
    console.log(`${"Companion".padEnd(wName)}  ${"Terpasang".padEnd(wStatus)}  Dependensi`);
    for (const row of rows) {
      console.log(`${row.name.padEnd(wName)}  ${row.status.padEnd(wStatus)}  ${row.deps}`);
      console.log(`  ${row.cmd}`);
    }
    return;
  }

  if (sub === "info") {
    if (!name) {
      console.error("Pemakaian: pawang companion info <nama>");
      process.exit(2);
    }
    const item = findCompanion(data, name);
    console.log(`${item.name} - ${item.title || item.name}`);
    console.log(item.description);
    if (item.when) console.log(`Kapan   : ${item.when}`);
    console.log(`Deps    : ${(item.deps || []).join(", ")}`);
    for (const warning of item.warnings || []) console.log(`Peringatan: ${warning}`);
    console.log(`Sumber  : ${data.source}/skills/${item.name}`);
    console.log(`Pasang  : ${installCommand(data.source, item, agent, global, copy)}`);
    return;
  }

  if (sub === "add") {
    if (!name) {
      console.error("Pemakaian: pawang companion add <nama> [--agent <agent>] [--global] [--copy] [--run]");
      process.exit(2);
    }
    const item = findCompanion(data, name);
    console.log(`Companion: ${item.name} - ${item.title || item.name}`);
    for (const warning of item.warnings || []) console.log(`Peringatan: ${warning}`);
    console.log(`Perintah : ${installCommand(data.source, item, agent, global, copy)}`);
    if (!run) {
      console.log("Belum dijalankan. Tambahkan --run untuk memasang via npx skills.");
      return;
    }
    const argv = ["skills", "add", data.source, "--skill", item.name, "-a", agent, "-y"];
    if (global) argv.push("-g");
    if (copy) argv.push("--copy");
    console.log(`Menjalankan: npx ${argv.join(" ")}`);
    const npx = process.platform === "win32" ? "npx.cmd" : "npx";
    const result = spawnSync(npx, argv, { stdio: "inherit" });
    if (result.error) {
      console.error(`GAGAL: ${result.error.message}`);
      process.exit(1);
    }
    if (result.status !== 0) process.exit(result.status ?? 1);
    console.log("Selesai. Jalankan skill-precheck pada folder companion yang terpasang.");
    return;
  }

  console.error("Pemakaian: pawang companion list|info <nama>|add <nama> [opsi]");
  process.exit(2);
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
} else if (cmd === "companion") {
  companion(args.slice(args.indexOf("companion") + 1));
} else {
  console.error(`Perintah tidak dikenal: ${cmd}`);
  usage();
  process.exit(2);
}
