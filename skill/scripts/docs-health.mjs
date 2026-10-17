#!/usr/bin/env node
// docs-health.mjs: mengukur kesehatan AGENTS.md, konvensi/artefak, dan skill terpasang. docs/ = legacy/brownfield.
// HANYA BACA, tanpa dependensi (Node 18+). Tidak membaca .env/.dev.vars.
//
// Pemakaian: node docs-health.mjs [path-proyek] [--strict] [--all]
//   --strict exit code 1 bila ada ERROR
//   --all    tampilkan semua temuan (default dibatasi 25 per tingkat)
//
// Yang diukur:
//  1. AGENTS.md (root dan apps/*, packages/*): ukuran, tautan rusak, tautan tanpa pemicu "kapan dibaca"
//  2. docs/ (legacy/brownfield): file terlalu panjang, yatim, ADR tanpa Status, handoff usang
//  3. Skill di tingkat proyek: jumlah, biaya konteks (deskripsi dimuat di SETIAP sesi), frontmatter, tumpang tindih

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const root = path.resolve(args.find((a) => !a.startsWith('--')) || process.cwd());
const strict = args.includes('--strict');
const showAll = args.includes('--all');
if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) { console.error('Folder proyek tidak ditemukan: ' + root); process.exit(2); }

const read = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch { return null; } };
const exists = (f) => { try { fs.accessSync(f); return true; } catch { return false; } };
const isDir = (f) => { try { return fs.statSync(f).isDirectory(); } catch { return false; } };
const ls = (d) => { try { return fs.readdirSync(d); } catch { return []; } };
const lines = (t) => t.split('\n').length;
const tokens = (chars) => Math.ceil(chars / 4); // perkiraan kasar
const findings = [];
const add = (sev, area, msg, hint) => findings.push({ sev, area, msg, hint });
const rel = (f) => path.relative(root, f) || '.';

// ---------- 1. AGENTS.md ----------
const agentFiles = [];
if (exists(path.join(root, 'AGENTS.md'))) agentFiles.push(path.join(root, 'AGENTS.md'));
for (const base of ['apps', 'packages', 'services']) for (const n of ls(path.join(root, base))) {
  const f = path.join(root, base, n, 'AGENTS.md'); if (exists(f)) agentFiles.push(f);
}
const TRIGGER = /baca|saat|sebelum|ketika|bila|kalau|jika|read|when|before|if /i;
const agentInfo = [];
let agentsText = '';
for (const f of agentFiles) {
  const t = read(f) || '';
  agentsText += '\n' + t;
  const n = lines(t);
  agentInfo.push({ f: rel(f), lines: n, tok: tokens(t.length) });
  const where = rel(f);
  if (n > 150) add('ERROR', where, `${n} baris (target 40-100, batas 150)`, 'pindahkan detail ke .pawang/context/coding-standards.html atau tautan berpemicu di AGENTS.md (references/agents-md.md)');
  else if (n > 100) add('WARN', where, `${n} baris (target 40-100)`, 'mendekati batas; mulai pindahkan bagian spesifik area ke .pawang/context/coding-standards.html atau tautan berpemicu');
  const baseDir = path.dirname(f);
  t.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/`([^`\s]+)`/g)) {
      let p = m[1].replace(/[:,;.]+$/, '');
      if (!/\//.test(p) && !/\.(md|json|jsonc|mjs|ts|toml|yaml|yml)$/.test(p)) continue;
      if (/^(https?:|npm|npx|pnpm|git|\.\.\.)/.test(p) || /[*{}$|=]/.test(p) || p.startsWith('-') || /^[A-Z]:/.test(p) || /^\/(?!docs)/.test(p)) continue;
      const hasPlaceholder = p.includes('<');
      const check = hasPlaceholder ? p.slice(0, p.indexOf('<')).replace(/\/?[^/]*$/, '') || '.' : p;
      const ok = [root, baseDir].some((b) => exists(path.join(b, check)));
      if (!ok && /^(docs|apps|packages|src|scripts|e2e|tests|\.opencode|\.agents|\.claude|[\w-]+\/)/.test(p) && !/^(e\.g\.|mis\.)/.test(p)) {
        add('ERROR', `${where}:${i + 1}`, `tautan rusak: ${p}`, 'perbarui path atau hapus barisnya');
      } else if (ok && /^docs\//.test(p) && !TRIGGER.test(line)) {
        add('WARN', `${where}:${i + 1}`, `tautan tanpa pemicu "kapan dibaca": ${p}`, 'tambahkan: baca saat/sebelum ...');
      }
    }
  });
}
if (!agentFiles.length) add('WARN', 'AGENTS.md', 'tidak ada AGENTS.md', 'jalankan references/adopt.md lalu references/agents-md.md');

// ---------- 2. docs/ (legacy/brownfield) ----------
const docsDir = path.join(root, 'docs');
const docFiles = [];
(function walk(d) {
  for (const e of ls(d)) {
    if (e.startsWith('.')) continue;
    const f = path.join(d, e);
    if (isDir(f)) walk(f); else if (/\.(md|mdx)$/i.test(e)) docFiles.push(f);
  }
})(docsDir);
const docsReadme = read(path.join(docsDir, 'README.md')) || '';
const linkText = agentsText + '\n' + docsReadme;
let docLines = 0;
for (const f of docFiles) {
  const t = read(f) || '', n = lines(t), r = rel(f).split(path.sep).join('/');
  docLines += n;
  if (/\/_archive\//.test(r)) continue;
  if (n > 200) add('WARN', r, `${n} baris (ideal 50-150)`, 'pecah per area tugas');
  // dianggap tertaut: disebut persis, atau folder induknya disebut (docs/decisions/), atau ada pola (docs/handoff/<topik>.md)
  const covered = linkText.includes(r)
    || linkText.split(/\s|`/).some((w) => w.startsWith('docs/') && ((w.endsWith('/') && r.startsWith(w)) || (w.includes('<') && r.startsWith(w.slice(0, w.indexOf('<'))))));
  if (!covered && r !== 'docs/README.md') add('WARN', r, 'yatim: tidak ditautkan dari AGENTS.md atau docs/README.md', 'tambahkan ke peta dokumen dengan pemicu kapan dibaca, atau arsipkan');
  if (/^docs\/decisions\/(?!README)/.test(r)) {
    const st = (t.match(/^Status:\s*(.+)$/m) || [])[1];
    if (!st) add('ERROR', r, 'keputusan tanpa baris "Status:"', 'tambahkan Status: Accepted atau Superseded by NNNN; catat inti keputusan di ## Keputusan penting AGENTS.md');
    else if (!/^(Accepted|Superseded|Proposed|Deprecated|Rejected)/i.test(st.trim())) add('WARN', r, `Status tidak baku: "${st.trim()}"`, 'pakai Accepted / Superseded by NNNN / Proposed / Deprecated / Rejected');
    else if (/^Superseded/i.test(st.trim()) && !/\d{3,4}/.test(st)) add('WARN', r, 'Superseded tanpa nomor penggantinya', 'tulis Superseded by NNNN');
  }
  if (/^docs\/handoff\/(?!_archive)/.test(r)) {
    const d = (t.match(/Diperbarui:\s*(\d{4}-\d{2}-\d{2})/) || [])[1];
    const when = d ? new Date(d) : fs.statSync(f).mtime;
    const age = Math.floor((Date.now() - when.getTime()) / 86400000);
    if (age > 14) add('WARN', r, `handoff berumur ${age} hari${d ? '' : ' (dari waktu file; tidak ada baris Diperbarui)'}`, 'verifikasi ke git lalu perbarui, arsipkan, atau hapus; promosikan keputusan permanen ke ## Keputusan penting AGENTS.md');
  }
}

// handoff pawang: .pawang/context/handoff.html (ditimpa setiap update)
const hoFile = path.join(root, '.pawang', 'context', 'handoff.html');
if (exists(hoFile)) {
  const age = Math.floor((Date.now() - fs.statSync(hoFile).mtimeMs) / 86400000);
  if (age > 14) add('WARN', '.pawang/context/handoff.html', `handoff berumur ${age} hari`, 'verifikasi ke git lalu perbarui; promosikan keputusan permanen ke ## Keputusan penting AGENTS.md, jangan biarkan basi');
}

// ---------- 3. skill tingkat proyek ----------
const SKILL_DIRS = ['.agents/skills', '.opencode/skills', '.opencode/skill', '.claude/skills'];
const skills = [], seenReal = new Set();
function frontmatter(t) {
  const m = t.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const fm = {}, ls_ = m[1].split('\n');
  for (let i = 0; i < ls_.length; i++) {
    const kv = ls_[i].match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (/^[>|][-+]?$/.test(v)) { v = ''; while (i + 1 < ls_.length && /^\s+/.test(ls_[i + 1])) v += ' ' + ls_[++i].trim(); }
    fm[kv[1]] = v.replace(/^["']|["']$/g, '').trim();
  }
  return fm;
}
for (const sd of SKILL_DIRS) {
  const base = path.join(root, sd);
  for (const n of ls(base)) {
    const dir = path.join(base, n);
    if (!isDir(dir)) continue;
    let real; try { real = fs.realpathSync(dir); } catch { continue; }
    if (seenReal.has(real)) continue; // symlink ke salinan yang sama: jangan dihitung dua kali
    seenReal.add(real);
    const sk = read(path.join(dir, 'SKILL.md'));
    const where = `${sd}/${n}`;
    if (sk == null) { add('ERROR', where, 'folder skill tanpa SKILL.md', 'hapus atau lengkapi'); continue; }
    const fm = frontmatter(sk);
    if (!fm || !fm.name || !fm.description) { add('ERROR', where, 'frontmatter tidak lengkap (perlu name dan description)', 'perbaiki SKILL.md'); continue; }
    if (fm.name !== n) add('WARN', where, `name "${fm.name}" tidak sama dengan nama folder`, 'samakan agar mudah dilacak');
    if (fm.description.length > 1024) add('ERROR', where, `deskripsi ${fm.description.length} karakter (batas 1024)`, 'persingkat');
    else if (fm.description.length > 400) add('WARN', where, `deskripsi ${fm.description.length} karakter; dimuat di setiap sesi`, 'persingkat menjadi satu atau dua kalimat: apa dan kapan dipakai');
    const scripts = ls(path.join(dir, 'scripts')).length;
    skills.push({ where, name: fm.name, desc: fm.description, lines: lines(sk), scripts, chars: fm.name.length + fm.description.length });
  }
}
const kw = (s) => new Set(s.toLowerCase().replace(/[^a-z0-9À-ɏ ]/g, ' ').split(/\s+/).filter((w) => w.length > 4));
const stop = new Set(['dengan', 'untuk', 'skill', 'gunakan', 'ketika', 'saat', 'yang', 'dari', 'atau', 'agent', 'proyek', 'digunakan', 'dokumen', 'using', 'when', 'with', 'user', 'files']);
for (let i = 0; i < skills.length; i++) for (let j = i + 1; j < skills.length; j++) {
  const a = [...kw(skills[i].desc)].filter((w) => !stop.has(w)), b = new Set([...kw(skills[j].desc)].filter((w) => !stop.has(w)));
  const inter = a.filter((w) => b.has(w)).length, uni = new Set([...a, ...b]).size;
  if (uni && inter / uni >= 0.4 && inter >= 4) add('WARN', `${skills[i].name} <> ${skills[j].name}`, `deskripsi tumpang tindih (${Math.round((inter / uni) * 100)}% kata kunci sama)`, 'gabungkan, atau perjelas batas pemicunya agar agent tidak ragu memilih');
}
const skillTok = tokens(skills.reduce((s, k) => s + k.chars, 0));
if (skills.length > 10) add('WARN', 'skill', `${skills.length} skill di proyek (disarankan maksimal sekitar 10)`, 'hapus yang jarang dipakai; fakta statis proyek lebih baik jadi .pawang/context/coding-standards.html, bukan skill');

// ---------- laporan ----------
const errs = findings.filter((x) => x.sev === 'ERROR'), warns = findings.filter((x) => x.sev === 'WARN');
const out = [];
out.push(`# Kesehatan dokumen dan skill: ${path.basename(root)}`);
out.push('');
out.push('## Ringkasan');
for (const a of agentInfo) out.push(`- ${a.f}: ${a.lines} baris, ≈${a.tok} token (dibaca di SETIAP sesi)`);
if (!agentInfo.length) out.push('- AGENTS.md: tidak ada');
out.push(`- docs/ (legacy): ${docFiles.length} file, ${docLines} baris`);
out.push(`- Skill tingkat proyek: ${skills.length}, deskripsinya ≈${skillTok} token (dimuat di SETIAP sesi)`);
out.push(`- Temuan: ${errs.length} ERROR, ${warns.length} WARN`);
if (skills.length) {
  out.push('');
  out.push('## Skill terpasang (tingkat proyek)');
  for (const s of skills.sort((a, b) => b.chars - a.chars)) out.push(`- ${s.name}: deskripsi ${s.desc.length} karakter, SKILL.md ${s.lines} baris, ${s.scripts} skrip (${s.where})`);
  out.push('Catatan: skill global di folder home tidak dipindai; skill itu juga membebani konteks.');
}
const cap = showAll ? Infinity : 25;
for (const [label, list] of [['ERROR', errs], ['WARN', warns]]) {
  if (!list.length) continue;
  out.push('');
  out.push(`## ${label}`);
  for (const x of list.slice(0, cap)) out.push(`- ${x.area}: ${x.msg}${x.hint ? ` -> ${x.hint}` : ''}`);
  if (list.length > cap) out.push(`- ... +${list.length - cap} lagi (gunakan --all)`);
}
if (!findings.length) { out.push(''); out.push('Tidak ada temuan.'); }
out.push('');
out.push('Ini hanya audit. Perubahan dilakukan lewat references/agents-md.md (AGENTS.md), references/doctor.md, atau atas persetujuan user.');
console.log(out.join('\n'));
process.exit(strict && errs.length ? 1 : 0);
