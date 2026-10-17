#!/usr/bin/env node
// scan.mjs: pemindai proyek, HANYA BACA, tanpa dependensi (Node 18+).
// Pemakaian: node scan.mjs [path-proyek]
// Tidak pernah membaca isi .env / .dev.vars (hanya mencatat keberadaannya).
// Daftar penanda ada di ../references/markers.json.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(process.argv[2] || process.cwd());
const M = JSON.parse(fs.readFileSync(path.join(here, '..', 'references', 'markers.json'), 'utf8'));

if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
  console.error('Folder proyek tidak ditemukan: ' + root);
  process.exit(1);
}

// ---------- util ----------
const out = [];
const p = (s = '') => out.push(s);
const rel = (f) => path.relative(root, f) || '.';
const exists = (f) => { try { fs.accessSync(f); return true; } catch { return false; } };
const isDir = (f) => { try { return fs.statSync(f).isDirectory(); } catch { return false; } };
const readText = (f, max = 400000) => { try { return fs.readFileSync(f).subarray(0, max).toString('utf8'); } catch { return null; } };
const listDir = (d) => { try { return fs.readdirSync(d); } catch { return []; } };
const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const globToRe = (g) => new RegExp('^' + g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*') + '$');

function stripJsonc(s) {
  let o = '', i = 0, inStr = false;
  while (i < s.length) {
    const c = s[i], n = s[i + 1];
    if (inStr) {
      o += c;
      if (c === '\\') { o += s[i + 1] ?? ''; i += 2; continue; }
      if (c === '"') inStr = false;
      i++; continue;
    }
    if (c === '"') { inStr = true; o += c; i++; continue; }
    if (c === '/' && n === '/') { while (i < s.length && s[i] !== '\n') i++; continue; }
    if (c === '/' && n === '*') { i += 2; while (i < s.length && !(s[i] === '*' && s[i + 1] === '/')) i++; i += 2; continue; }
    o += c; i++;
  }
  return o.replace(/,\s*([}\]])/g, '$1');
}
function readJson(f) {
  const t = readText(f);
  if (t == null) return null;
  try { return JSON.parse(stripJsonc(t)); } catch { return null; }
}
function git(args) {
  try {
    return execFileSync('git', ['-C', root, ...args], { stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000 }).toString().trim();
  } catch { return null; }
}
function findPath(base, pattern) {
  if (!pattern.includes('*')) return exists(path.join(base, pattern)) ? [pattern] : [];
  const dir = path.dirname(pattern), re = globToRe(path.basename(pattern));
  return listDir(path.join(base, dir)).filter((n) => re.test(n)).map((n) => path.join(dir, n));
}

// ---------- telusur kode ----------
const SKIP = new Set(M.skip_dirs);
const CODE = new Set(M.code_extensions);
function walk(base) {
  const files = [], stack = [base];
  while (stack.length && files.length < 30000) {
    const d = stack.pop();
    let ents;
    try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { continue; }
    for (const e of ents) {
      if (e.isSymbolicLink()) continue;
      const f = path.join(d, e.name);
      if (e.isDirectory()) { if (!SKIP.has(e.name) && !e.name.startsWith('.')) stack.push(f); }
      else files.push(f);
    }
  }
  return files;
}

const files = walk(root);
const monoSet = new Set(M.workspace_dirs);
let loc = 0, codeFiles = 0, tests = 0, e2eSpecs = 0;
const buckets = new Map(), langs = new Map();
for (const f of files) {
  const ext = path.extname(f).slice(1).toLowerCase();
  if (!CODE.has(ext)) continue;
  const name = path.basename(f);
  if (name.endsWith('.d.ts')) continue;
  const segs = rel(f).split(path.sep);
  if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(name) || segs.includes('__tests__')) {
    tests++;
    if (segs.includes('e2e') || /e2e/.test(name)) e2eSpecs++;
  }
  if (/\.config\.[cm]?[jt]s$/.test(name)) continue;
  let n = 0;
  try {
    if (fs.statSync(f).size < 500000) n = (fs.readFileSync(f, 'utf8').match(/\n/g) || []).length + 1;
  } catch { /* abaikan */ }
  codeFiles++; loc += n;
  const key = segs.length === 1 ? '(root)'
    : monoSet.has(segs[0]) && segs.length > 2 ? segs.slice(0, 2).join('/')
    : segs[0] === 'src' && segs.length > 2 ? 'src/' + segs[1]
    : segs[0];
  const bk = buckets.get(key) || { files: 0, loc: 0 }; bk.files++; bk.loc += n; buckets.set(key, bk);
  const lang = M.languages[ext] || ext;
  const lg = langs.get(lang) || { files: 0, loc: 0 }; lg.files++; lg.loc += n; langs.set(lang, lg);
}

// ---------- unit: root + workspace ----------
function depsOf(dir) {
  const j = readJson(path.join(dir, 'package.json'));
  if (!j) return { pkg: null, deps: new Set() };
  return { pkg: j, deps: new Set([...Object.keys(j.dependencies || {}), ...Object.keys(j.devDependencies || {})]) };
}
function detect(dir, deps) {
  const found = [];
  for (const m of M.deps) {
    const re = globToRe(m.match);
    const hits = [...deps].filter((d) => re.test(d));
    if (hits.length) found.push({ cat: m.category, label: m.label, ev: 'package.json: ' + hits.slice(0, 4).join(', '), ok: m.confirmed !== false, note: m.note });
  }
  for (const m of M.paths) {
    const hits = findPath(dir, m.path);
    if (hits.length) found.push({ cat: m.category, label: m.label, ev: hits.slice(0, 3).join(', '), ok: m.confirmed !== false, note: m.note });
  }
  return found;
}
const fmt = (x) => `${x.label}${x.ok ? '' : ' [dugaan]'} (${x.ev})`;

const rootDeps = depsOf(root);
const units = [];
for (const wd of M.workspace_dirs) {
  for (const n of listDir(path.join(root, wd))) {
    const d = path.join(root, wd, n);
    if (isDir(d) && exists(path.join(d, 'package.json'))) units.push(d);
  }
}
const rootFound = detect(root, rootDeps.deps);

// ---------- status ----------
const commits = git(['rev-list', '--count', 'HEAD']);
const lastCommit = git(['log', '-1', '--format=%cs']);
const dirty = git(['status', '--porcelain']);
const dirtyN = dirty == null ? null : dirty.split('\n').filter(Boolean).length;
const wfDir = path.join(root, '.github', 'workflows');
const wfs = listDir(wfDir).filter((n) => /\.ya?ml$/.test(n));
const hasCi = wfs.length > 0 || rootFound.some((x) => x.cat === 'ci');
const hasDbSchema = rootFound.some((x) => x.cat === 'db' && x.ev.match(/migrations|drizzle|prisma|supabase/));

const boiler = [];
const readme = readText(path.join(root, 'README.md')) || '';
for (const ph of M.boilerplate.readme) if (readme.includes(ph)) boiler.push(`README memuat "${ph}"`);
for (const ef of M.boilerplate.entry_files) {
  const t = readText(path.join(root, ef));
  if (!t) continue;
  for (const ph of M.boilerplate.entry_phrases) if (t.includes(ph)) boiler.push(`${ef} memuat "${ph}"`);
}

let score = 0;
if (loc >= 1500) score += 2; else if (loc >= 400) score += 1;
if (tests > 0) score += 1;
if (hasCi) score += 1;
if (hasDbSchema) score += 1;
const nCommits = commits == null ? null : Number(commits);
if (nCommits != null) { if (nCommits >= 30) score += 2; else if (nCommits >= 8) score += 1; }
if (boiler.length) score -= 2;
let stage = score <= 0 ? 'scaffold' : score <= 2 ? 'awal' : score <= 5 ? 'berjalan' : 'matang';
if (loc < 150) stage = 'scaffold';

p(`# PROFIL PROYEK (otomatis, hanya baca): ${path.basename(root)}`);
p('');
p('## Status (dugaan skrip; putusan akhir setelah melihat isi kode)');
p(`Dugaan: ${stage}`);
p(`Bukti: commit=${nCommits ?? 'bukan repo git'}${lastCommit ? ` (terakhir ${lastCommit})` : ''}; file kode=${codeFiles}; LOC=${loc}; file test=${tests} (e2e=${e2eSpecs}); CI=${hasCi ? 'ada' : 'tidak ada'}; migrasi/skema DB=${hasDbSchema ? 'ada' : 'tidak ada'}${dirtyN != null ? `; perubahan belum commit=${dirtyN} file` : ''}`);
p(`Sisa boilerplate: ${boiler.length ? trunc(boiler.slice(0, 3).join('; '), 300) : 'tidak terdeteksi'}`);
const top = [...buckets.entries()].sort((a, b) => b[1].loc - a[1].loc).slice(0, 12);
p(`Isi kode (folder: file/LOC): ${top.length ? top.map(([k, v]) => `${k}: ${v.files}/${v.loc}`).join(' | ') : '(tidak ada file kode)'}`);
const langLine = [...langs.entries()].sort((a, b) => b[1].loc - a[1].loc).map(([k, v]) => `${k} ${v.files} file/${v.loc} LOC`).join(', ');
p(`Bahasa: ${langLine || '-'}`);
p('');

// ---------- runtime ----------
p('## Manajer paket & runtime');
const locks = [['pnpm-lock.yaml', 'pnpm'], ['yarn.lock', 'yarn'], ['package-lock.json', 'npm'], ['bun.lockb', 'bun'], ['bun.lock', 'bun'], ['deno.lock', 'deno']].filter(([f]) => exists(path.join(root, f)));
const pmField = rootDeps.pkg?.packageManager;
p(`Manajer paket: ${pmField || (locks.length ? locks.map(([f, n]) => `${n} (${f})`).join(', ') : 'tidak terdeteksi')}`);
const nodeV = ['.nvmrc', '.node-version', '.tool-versions'].filter((f) => exists(path.join(root, f)));
const engines = rootDeps.pkg?.engines?.node;
p(`Versi Node: ${[...nodeV, engines ? `engines.node=${engines}` : null].filter(Boolean).join(', ') || 'tidak dipatok'}`);
const scripts = rootDeps.pkg?.scripts || {};
const sNames = Object.keys(scripts);
p(`Script root (${sNames.length}): ${sNames.length ? sNames.slice(0, 20).map((k) => `${k}=\`${trunc(String(scripts[k]), 70)}\``).join(' | ') : '-'}`);
if (rootDeps.pkg?.workspaces) p('Workspaces di package.json: ' + trunc(JSON.stringify(rootDeps.pkg.workspaces), 120));
p('');

// ---------- terdeteksi ----------
p('## Terdeteksi di root (kategori: temuan (bukti))');
for (const [cat, label] of Object.entries(M.categories)) {
  const items = rootFound.filter((x) => x.cat === cat);
  if (items.length) p(`${label}: ${items.map(fmt).join('; ')}`);
}
const notes = rootFound.filter((x) => x.note).map((x) => `${x.label}: ${x.note}`);
if (notes.length) p('Catatan penanda: ' + [...new Set(notes)].join(' | '));
p('');

if (units.length) {
  p('## Workspace');
  for (const d of units) {
    const { deps } = depsOf(d);
    const f = detect(d, deps).filter((x) => ['deploy', 'framework', 'db', 'e2e', 'test'].includes(x.cat));
    p(`${rel(d)}: ${f.length ? f.map((x) => x.label).join(', ') : '(tidak ada penanda utama)'}${exists(path.join(d, 'AGENTS.md')) ? ' [punya AGENTS.md]' : ''}`);
  }
  p('');
}

// ---------- cloudflare ----------
function wranglerOf(dir) {
  for (const n of ['wrangler.jsonc', 'wrangler.json']) {
    const j = readJson(path.join(dir, n));
    if (j) return { file: n, j };
  }
  const t = readText(path.join(dir, 'wrangler.toml'));
  return t != null ? { file: 'wrangler.toml', t } : null;
}
const wr = wranglerOf(root);
if (wr) {
  p('## Cloudflare Workers (nama binding & var saja, tanpa nilai)');
  p(`Konfigurasi: ${wr.file}`);
  if (wr.j) {
    const j = wr.j, b = [];
    for (const k of ['d1_databases', 'kv_namespaces', 'r2_buckets', 'services', 'hyperdrive', 'vectorize', 'analytics_engine_datasets', 'workflows']) {
      for (const x of j[k] || []) b.push(`${x.binding || x.name} [${k}]`);
    }
    for (const x of j.durable_objects?.bindings || []) b.push(`${x.name} [durable_object]`);
    for (const x of j.queues?.producers || []) b.push(`${x.binding} [queue producer]`);
    if (j.ai) b.push(`${j.ai.binding} [ai]`);
    if (j.browser) b.push(`${j.browser.binding} [browser]`);
    p(`name=${j.name ?? '-'}; main=${j.main ?? '-'}; compatibility_date=${j.compatibility_date ?? '-'}; flags=${(j.compatibility_flags || []).join(',') || '-'}`);
    p(`Assets: ${j.assets ? trunc(JSON.stringify({ directory: j.assets.directory, binding: j.assets.binding, not_found_handling: j.assets.not_found_handling }), 160) : 'tidak ada'}`);
    p(`Binding: ${b.length ? b.join(', ') : 'tidak ada'}`);
    p(`Var (nama): ${Object.keys(j.vars || {}).join(', ') || '-'}; environment: ${Object.keys(j.env || {}).join(', ') || '-'}; cron: ${(j.triggers?.crons || []).join(', ') || '-'}`);
  } else {
    const t = wr.t;
    const get = (k) => (t.match(new RegExp('^' + k + '\\s*=\\s*"?([^"\\n]+)"?', 'm')) || [])[1] || '-';
    const heads = [...t.matchAll(/^\s*\[\[?([A-Za-z0-9_.-]+)\]\]?/gm)].map((m) => m[1]);
    p(`name=${get('name')}; main=${get('main')}; compatibility_date=${get('compatibility_date')}`);
    p(`Tabel TOML: ${[...new Set(heads)].join(', ') || '-'}`);
  }
  p('');
}

// ---------- env ----------
p('## Env var (hanya nama; isi file rahasia TIDAK dibaca)');
const rootNames = listDir(root);
const envLike = rootNames.filter((n) => /^(\.env(\..+)?|\.dev\.vars(\..+)?)$/.test(n));
const examples = envLike.filter((n) => /(example|sample|template)$/.test(n));
const real = envLike.filter((n) => !examples.includes(n));
p(`File rahasia ada (tidak dibaca): ${real.join(', ') || 'tidak ada'}`);
for (const n of examples) {
  const keys = [...(readText(path.join(root, n)) || '').matchAll(/^\s*(?:export\s+)?([A-Za-z0-9_]+)\s*=/gm)].map((m) => m[1]);
  p(`${n}: ${keys.join(', ') || '(kosong)'}`);
}
if (!examples.length) p('Tidak ada file contoh env (.env.example / .dev.vars.example).');
p('');

// ---------- alat agent ----------
p('## Alat agent (hanya di tingkat proyek; skill/konfigurasi global tidak dipindai)');
let sawConfig = false;
for (const c of ['opencode.json', 'opencode.jsonc', '.opencode/opencode.json', '.opencode/opencode.jsonc']) {
  const j = readJson(path.join(root, c));
  if (!j) continue;
  sawConfig = true;
  p(`OpenCode (${c})`);
  const mcp = Object.entries(j.mcp || {}).map(([k, v]) => `${k}(${v?.type || '?'}${v?.enabled === false ? ', nonaktif' : ''})`);
  p(`  MCP: ${mcp.join(', ') || '-'}`);
  p(`  Plugin: ${(j.plugin || []).join(', ') || '-'}`);
  p(`  Agent kustom: ${Object.keys(j.agent || {}).join(', ') || '-'}`);
  p(`  Instructions: ${(j.instructions || []).join(', ') || '-'}`);
  p(`  Izin (permission): ${j.permission ? trunc(JSON.stringify(j.permission), 600) : 'tidak diatur'}`);
}
if (!sawConfig) p('Konfigurasi OpenCode tidak ditemukan di tingkat proyek.');
for (const [f, key] of [['.mcp.json', 'mcpServers'], ['.cursor/mcp.json', 'mcpServers'], ['.vscode/mcp.json', 'servers']]) {
  const j = readJson(path.join(root, f));
  if (j) p(`MCP di ${f}: ${Object.keys(j[key] || {}).join(', ') || '-'}`);
}
for (const sub of ['agents', 'agent', 'commands', 'command', 'plugins', 'plugin', 'tools', 'tool']) {
  const d = path.join(root, '.opencode', sub);
  if (isDir(d)) p(`.opencode/${sub}: ${listDir(d).slice(0, 15).join(', ')}`);
}
const allSkills = [];
for (const sd of M.skill_dirs) {
  const d = path.join(root, sd);
  if (!isDir(d)) continue;
  const names = listDir(d).filter((n) => isDir(path.join(d, n)));
  allSkills.push(...names);
  p(`Skill di ${sd} (${names.length}): ${names.slice(0, 40).join(', ')}${names.length > 40 ? ', …' : ''}`);
}
if (!allSkills.length) p('Skill tingkat proyek: tidak ada.');
const known = M.known_skills.map((k) => {
  const hit = allSkills.filter((n) => n.toLowerCase().includes(k.match));
  return hit.length ? `${k.label} (${hit.slice(0, 3).join(', ')})` : null;
}).filter(Boolean);
if (known.length) p('Skill dikenali: ' + known.join('; '));
p('');

// ---------- CI/CD ----------
p('## CI/CD & hook');
if (wfs.length) {
  for (const n of wfs) {
    const t = readText(path.join(wfDir, n)) || '';
    const name = ((t.match(/^name:\s*(.+)$/m) || [])[1] || '-').replace(/['"]/g, '').trim();
    const head = t.split(/^jobs:/m)[0];
    const trig = ['push', 'pull_request', 'schedule', 'workflow_dispatch', 'release'].filter((k) => new RegExp('\\b' + k + '\\b').test(head));
    const low = t.toLowerCase();
    const tags = Object.entries(M.ci_keywords).filter(([, w]) => w.some((x) => low.includes(x))).map(([k]) => k);
    p(`.github/workflows/${n}: "${name}"; pemicu: ${trig.join(',') || '-'}; mengandung: ${tags.join(',') || '-'}`);
  }
} else {
  p('Tidak ada GitHub Actions workflow.');
}
const otherCi = rootFound.filter((x) => x.cat === 'ci').map((x) => x.label);
if (otherCi.length) p('CI lain: ' + otherCi.join(', '));
p('');

// ---------- dokumen ----------
p('## Dokumen yang sudah ada');
for (const f of ['AGENTS.md', 'CLAUDE.md', 'README.md']) {
  const t = readText(path.join(root, f));
  if (t != null) p(`${f}: ${t.split('\n').length} baris`);
}
const docsDir = path.join(root, 'docs');
if (isDir(docsDir)) p(`docs/: ${listDir(docsDir).slice(0, 20).join(', ')}`);
p('');

// ---------- peringatan & belum terdeteksi ----------
const labels = rootFound.map((x) => x.label.toLowerCase()).join(' | ');
const hasWorkers = Boolean(wr) || rootDeps.deps.has('wrangler') || labels.includes('cloudflare');
const warn = [];
const jsFiles = [...langs.entries()].filter(([k]) => M.js_languages.includes(k)).reduce((s, [, v]) => s + v.files, 0);
const nonJs = [...langs.entries()].filter(([k]) => !M.js_languages.includes(k));
if (hasWorkers && nonJs.length && nonJs.reduce((s, [, v]) => s + v.files, 0) > jsFiles) {
  warn.push(`Target deploy Cloudflare Workers, tetapi kode didominasi ${nonJs.map(([k, v]) => `${k} (${v.files} file)`).join(', ')}. Workers menjalankan JS/TS (atau Wasm). Konfirmasi ke user sebelum lanjut.`);
}
if (hasWorkers && (rootDeps.deps.has('better-sqlite3') || rootDeps.deps.has('sqlite3'))) {
  warn.push('Target Workers tetapi memakai modul native SQLite (better-sqlite3/sqlite3), yang tidak jalan di Workers. Pertimbangkan D1 atau libSQL.');
}
if (locks.length > 1) warn.push('Lebih dari satu lockfile: ' + locks.map(([f]) => f).join(', ') + '. Tanyakan manajer paket yang dipakai.');
if (scripts.test && tests === 0) warn.push('Script "test" ada tetapi tidak ada file test.');
if (rootFound.some((x) => !x.ok)) warn.push('Ada penanda berstatus [dugaan]; konfirmasi ke user sebelum dijadikan fakta.');
p('## Peringatan');
p(warn.length ? warn.map((w) => '- ' + w).join('\n') : 'Tidak ada.');
p('');

const has = (cat) => rootFound.some((x) => x.cat === cat);
const missing = [];
if (!has('deploy')) missing.push('target deploy');
if (!locks.length && !pmField) missing.push('manajer paket');
if (!has('db')) missing.push('database');
if (!has('test') && tests === 0) missing.push('strategi test');
if (!has('e2e')) missing.push('E2E');
if (!hasCi) missing.push('CI/CD');
if (hasWorkers && !wfs.some((n) => /wrangler|deploy/i.test(readText(path.join(wfDir, n)) || ''))) missing.push('cara deploy Workers (manual `wrangler deploy` atau Workers Builds di dashboard; tidak terlihat dari repo)');
p('## Belum terdeteksi (kandidat pertanyaan untuk user)');
p(missing.length ? missing.join(', ') : 'Semua kategori utama terdeteksi.');
p('Selalu tanyakan: mode (prototype/produksi) dan garis besar data model.');
p('');
p('Batas pindai: konfigurasi di dashboard Cloudflare/hosting, secret, skill & MCP global, dan folder yang di-ignore tidak terlihat dari repo.');

console.log(out.join('\n'));
