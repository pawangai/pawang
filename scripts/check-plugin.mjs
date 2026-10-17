#!/usr/bin/env node
// check-plugin.mjs: memvalidasi bundle plugin, katalog marketplace, dan sinkronisasi dengan sumber.
// Tanpa dependensi (Node 18+). Jalankan: npm run plugin:check

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const coreSource = path.join(root, "skills", "pawang");
const pluginsDir = path.join(root, "plugins");
const lite = path.join(root, "dist", "pawang-lite");
const errors = [];
const fail = (message) => errors.push(message);

const companionsData = JSON.parse(
  fs.readFileSync(path.join(coreSource, "companions.json"), "utf8"),
);
const entries = [
  { name: "pawang", source: coreSource },
  ...companionsData.companions.map((item) => ({
    name: item.name,
    source: path.join(root, "skills", item.name),
  })),
];

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    fail(`${path.relative(root, file)}: JSON tidak valid (${error.message})`);
    return null;
  }
}

function walk(dir) {
  const files = [];
  let total = 0;
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const abs = path.join(current, entry.name);
      const rel = path.relative(dir, abs).split(path.sep).join("/");
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      if (entry.isSymbolicLink()) {
        fail(`${path.relative(root, abs)}: symlink tidak diizinkan di bundle`);
        continue;
      }
      if (entry.isDirectory()) {
        visit(abs);
      } else if (entry.isFile()) {
        const size = fs.statSync(abs).size;
        total += size;
        files.push({ rel, abs, size });
      }
    }
  };
  visit(dir);
  return { files, total };
}

function treeHash(dir) {
  const { files } = walk(dir);
  files.sort((a, b) => a.rel.localeCompare(b.rel));
  const hash = crypto.createHash("sha256");
  for (const item of files) {
    hash.update(item.rel);
    hash.update("\0");
    hash.update(fs.readFileSync(item.abs));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function wordCount(file) {
  return fs
    .readFileSync(file, "utf8")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

if (!fs.existsSync(coreSource)) fail("skills/pawang tidak ditemukan");
if (!fs.existsSync(pluginsDir)) fail("plugins/ tidak ditemukan; jalankan npm run plugin:sync");

for (const entry of entries) {
  if (!fs.existsSync(path.join(entry.source, "SKILL.md"))) {
    fail(`skills/${entry.name}/SKILL.md hilang`);
  }
}

if (fs.existsSync(pluginsDir)) {
  const present = fs
    .readdirSync(pluginsDir, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .map((item) => item.name)
    .sort();
  const desired = entries.map((entry) => entry.name).sort();
  const missing = desired.filter((name) => !present.includes(name));
  const extra = present.filter((name) => !desired.includes(name));
  if (missing.length) fail(`plugins/ kehilangan bundle: ${missing.join(", ")}`);
  if (extra.length) fail(`plugins/ punya bundle tak dikenal: ${extra.join(", ")}; jalankan npm run plugin:sync`);
}

for (const entry of entries) {
  const plugin = path.join(pluginsDir, entry.name);
  if (!fs.existsSync(plugin)) continue;

  const claudeManifestPath = path.join(plugin, ".claude-plugin", "plugin.json");
  const agentManifestPath = path.join(plugin, "plugin.json");
  const claudeManifest = fs.existsSync(claudeManifestPath) ? readJson(claudeManifestPath) : null;
  const agentManifest = fs.existsSync(agentManifestPath) ? readJson(agentManifestPath) : null;

  if (!claudeManifest) fail(`plugins/${entry.name}/.claude-plugin/plugin.json hilang`);
  if (!agentManifest) fail(`plugins/${entry.name}/plugin.json hilang`);

  for (const [label, manifest] of [
    ["Claude", claudeManifest],
    ["Agent Plugins", agentManifest],
  ]) {
    if (!manifest) continue;
    if (manifest.name !== entry.name) fail(`${label} ${entry.name}: name harus "${entry.name}"`);
    if (manifest.version !== pkg.version) {
      fail(`${label} ${entry.name}: version ${manifest.version} != package.json ${pkg.version}`);
    }
    if (!manifest.description || manifest.description.length < 20) {
      fail(`${label} ${entry.name}: description terlalu pendek`);
    }
  }

  if (fs.existsSync(path.join(plugin, "bin"))) fail(`plugins/${entry.name}/bin tidak boleh ada`);
  if (fs.existsSync(path.join(plugin, "node_modules"))) {
    fail(`plugins/${entry.name}/node_modules tidak boleh ada`);
  }

  const skillsDir = path.join(plugin, "skills");
  if (!fs.existsSync(path.join(skillsDir, entry.name, "SKILL.md"))) {
    fail(`plugins/${entry.name}/skills/${entry.name}/SKILL.md hilang`);
  }
  if (fs.existsSync(skillsDir)) {
    const names = fs.readdirSync(skillsDir, { withFileTypes: true }).map((item) => item.name);
    const extra = names.filter((name) => name !== entry.name);
    if (extra.length) {
      fail(`plugins/${entry.name}/skills hanya boleh berisi ${entry.name}; ada: ${extra.join(", ")}`);
    }
  }

  const readmePath = path.join(plugin, "README.md");
  if (!fs.existsSync(readmePath)) fail(`plugins/${entry.name}/README.md hilang`);
  else if (wordCount(readmePath) < 40) fail(`plugins/${entry.name}/README.md kurang dari 40 kata`);
  if (!fs.existsSync(path.join(plugin, "LICENSE"))) fail(`plugins/${entry.name}/LICENSE hilang`);

  const { files, total } = walk(plugin);
  if (files.length > 1000) fail(`plugins/${entry.name}: ${files.length} file (batas 1000)`);
  if (total > 20 * 1024 * 1024) fail(`plugins/${entry.name}: ${total} byte (batas 20 MB)`);
  for (const item of files) {
    const name = path.basename(item.rel);
    if (
      name === ".env" ||
      name.startsWith(".env.") ||
      name === ".dev.vars" ||
      name.endsWith(".pem") ||
      name.endsWith(".key")
    ) {
      fail(`plugins/${entry.name}/${item.rel}: file sensitif tidak boleh dibundel`);
    }
  }

  if (
    fs.existsSync(entry.source) &&
    fs.existsSync(path.join(skillsDir, entry.name)) &&
    treeHash(entry.source) !== treeHash(path.join(skillsDir, entry.name))
  ) {
    fail(`salinan skills/${entry.name} tidak sinkron; jalankan npm run plugin:sync`);
  }
}

for (const file of [
  path.join(root, ".claude-plugin", "marketplace.json"),
  path.join(root, ".agents", "plugins", "marketplace.json"),
]) {
  if (!fs.existsSync(file)) {
    fail(`${path.relative(root, file)} hilang`);
    continue;
  }
  const marketplace = readJson(file);
  if (!marketplace) continue;
  if (marketplace.name !== "pawang") fail(`${path.relative(root, file)}: name harus "pawang"`);
  if (!Array.isArray(marketplace.plugins)) {
    fail(`${path.relative(root, file)}: plugins harus array`);
    continue;
  }
  const relFile = path.relative(root, file).split(path.sep).join("/");
  const names = marketplace.plugins.map((item) => item.name);
  for (const entry of entries) {
    const matches = marketplace.plugins.filter((item) => item.name === entry.name);
    if (matches.length !== 1) {
      fail(`${relFile}: entri ${entry.name} harus tepat satu`);
      continue;
    }
    const item = matches[0];
    const entryPath =
      typeof item.source === "string" ? item.source : item.source && item.source.path;
    if (!entryPath) {
      fail(`${relFile}: source ${entry.name} tidak valid`);
      continue;
    }
    const resolved = path.resolve(root, entryPath);
    const expected = `./plugins/${entry.name}`;
    if (!resolved.startsWith(root + path.sep) || !fs.existsSync(resolved)) {
      fail(`${relFile}: source ${entryPath} tidak ditemukan`);
    }
    if (entryPath !== expected) fail(`${relFile}: source ${entry.name} harus ${expected}`);
    if (relFile === ".claude-plugin/marketplace.json" && item.version !== pkg.version) {
      fail(`${relFile}: version ${entry.name} harus ${pkg.version}`);
    }
  }
  const extra = names.filter((name) => !entries.some((entry) => entry.name === name));
  if (extra.length) fail(`${relFile}: entri tak dikenal: ${extra.join(", ")}`);
}

if (fs.existsSync(lite)) {
  if (!fs.existsSync(path.join(lite, "SKILL.md"))) fail("dist/pawang-lite/SKILL.md hilang");
  if (!fs.existsSync(path.join(lite, "references", "lite.md"))) {
    fail("dist/pawang-lite/references/lite.md hilang");
  }
  if (fs.existsSync(path.join(lite, "assets"))) fail("dist/pawang-lite/assets tidak boleh ada");
  if (fs.existsSync(path.join(lite, "companions.json"))) {
    fail("dist/pawang-lite/companions.json tidak boleh ada");
  }
  if (fs.existsSync(path.join(lite, "node_modules"))) {
    fail("dist/pawang-lite/node_modules tidak boleh ada");
  }
  const { files, total } = walk(lite);
  if (files.some((item) => item.rel.endsWith(".mjs"))) fail("dist/pawang-lite tidak boleh berisi .mjs");
  if (files.length > 1000) fail(`dist/pawang-lite: ${files.length} file (batas 1000)`);
  if (total > 20 * 1024 * 1024) fail(`dist/pawang-lite: ${total} byte (batas 20 MB)`);
}

if (errors.length) {
  console.error("plugin:check GAGAL");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`plugin:check OK (${entries.length} plugin, pawang v${pkg.version})`);
