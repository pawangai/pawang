#!/usr/bin/env node
// link-agent-files.mjs: satukan file/folder agent ganda ke sumber kanonik.
// Kanonik: AGENTS.md + .agents/<sub>/; CLAUDE.md/GEMINI.md dan .claude/<sub> jadi symlink.
// .claude/settings.json, hooks, dan isi non-skill tetap nyata.
// Pemakaian: node link-agent-files.mjs [path-proyek] [--apply] [--check] [--create] [--selftest]
// Default hanya audit (read-only). --apply setelah konten unik dimigrasikan.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';

const raw = process.argv.slice(2);
const flags = new Set(raw.filter((x) => x.startsWith('-')));
const args = raw.filter((x) => !x.startsWith('-'));
const KNOWN = new Set([
  '--apply',
  '--check',
  '--create',
  '--selftest',
  '--help',
]);
const unknown = [...flags].filter((f) => f !== '--' && !KNOWN.has(f));
if (unknown.length) {
  console.error(`Flag tidak dikenal: ${unknown.join(', ')}`);
  process.exit(2);
}
if (flags.has('--help')) {
  console.log(
    'Pemakaian: node link-agent-files.mjs [path-proyek] [--apply] [--check] [--create] [--selftest]',
  );
  process.exit(0);
}
const root = path.resolve(args[0] || process.cwd());
const APPLY = flags.has('--apply');
const CHECK = flags.has('--check');
const SELFTEST = flags.has('--selftest');
const CREATE = flags.has('--create');
const SHARED = ['skills', 'agents', 'commands'];
const POINTER = 'pawang-pointer: AGENTS.md';

const rel = (p) => path.relative(root, p) || '.';
const exists = (p) => {
  try {
    fs.lstatSync(p);
    return true;
  } catch {
    return false;
  }
};
const isDir = (p) => {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
};
const isLink = (p) => {
  try {
    return fs.lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
};
const list = (p) => {
  try {
    return fs.readdirSync(p);
  } catch {
    return [];
  }
};
const read = (p) => {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
};
const norm = (s) =>
  s
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .trim();
const lineSet = (s) =>
  new Set(
    s
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean),
  );
const linkTarget = (p) => {
  try {
    return path.resolve(path.dirname(p), fs.readlinkSync(p));
  } catch {
    return null;
  }
};
const real = (p) => {
  try {
    return fs.realpathSync.native(p);
  } catch {
    return null;
  }
};
const same = (a, b) => {
  const ra = real(a);
  const rb = real(b);
  return Boolean(ra && rb && ra === rb);
};
const pointer = (name) =>
  `# ${name}\n\nFile ini pointer ke AGENTS.md (${POINTER}).\nBaca AGENTS.md; jangan menulis aturan terpisah di sini.\n`;
const isPointer = (text, name) =>
  Boolean(text && norm(text) === norm(pointer(name)));

function diff(targetText, agentsText) {
  const a = lineSet(agentsText || '');
  const b = lineSet(targetText || '');
  return [...b].filter((line) => !a.has(line));
}

function plan(projectRoot, create = false) {
  const actions = [],
    blocks = [],
    notes = [];
  const agentsPath = path.join(projectRoot, 'AGENTS.md');
  const agentsText = read(agentsPath);
  if (isLink(agentsPath))
    blocks.push(
      'AGENTS.md adalah symlink; jadikan file nyata kanonik sebelum apply.',
    );
  const agentsDir = path.join(projectRoot, '.agents');
  const claudeDir = path.join(projectRoot, '.claude');

  if (!isLink(agentsPath) && !exists(agentsPath)) {
    blocks.push(
      'AGENTS.md belum ada. Buat dulu lewat agents-md.md; symlink butuh sumber kanonik.',
    );
  } else if (agentsText == null) {
    blocks.push('AGENTS.md tidak bisa dibaca; perbaiki izin/symlink dulu.');
  } else if (!agentsText.trim()) {
    blocks.push('AGENTS.md kosong; isi dulu sebelum symlink.');
  }

  for (const name of ['CLAUDE.md', 'GEMINI.md']) {
    const p = path.join(projectRoot, name);
    if (!exists(p)) {
      if (create)
        actions.push({
          type: 'link-file',
          path: p,
          target: 'AGENTS.md',
          label: `${name} → AGENTS.md`,
        });
      else
        notes.push(
          `${name}: tidak ada; tidak dibuat (pakai --create bila ingin symlink)`,
        );
      continue;
    }
    if (isLink(p)) {
      const t = linkTarget(p);
      if (same(t, agentsPath))
        notes.push(`${name}: sudah symlink ke AGENTS.md`);
      else
        blocks.push(
          `${name}: symlink ke ${rel(t || p)}; seharusnya AGENTS.md. Perbaiki manual.`,
        );
      continue;
    }
    if (isDir(p)) {
      blocks.push(`${name}: berupa folder, bukan file. Perbaiki manual.`);
      continue;
    }
    const text = read(p);
    if (isPointer(text, name)) {
      notes.push(`${name}: pointer fallback (symlink tidak didukung)`);
      continue;
    }
    if (agentsText && text != null && norm(text) === norm(agentsText)) {
      actions.push({
        type: 'replace-file',
        path: p,
        target: 'AGENTS.md',
        label: `${name} duplikat → symlink`,
      });
      continue;
    }
    const unique = diff(text, agentsText);
    blocks.push(
      `${name}: isi berbeda; ${unique.length} baris unik. Migrasikan dulu ` +
        `(konvensi → docs/conventions atau coding-standards; ADR/keputusan → docs/adr atau ## Keputusan penting; aturan khusus → AGENTS.md). ` +
        `Contoh: ${unique.slice(0, 4).join(' | ') || '(perbedaan whitespace)'}`,
    );
  }

  if (isLink(claudeDir)) {
    blocks.push(
      '.claude adalah symlink. Settings/hooks bisa tercampur; ubah menjadi folder nyata lalu symlink subdir (mis. .claude/skills → ../.agents/skills).',
    );
  } else if (isDir(claudeDir)) {
    for (const sub of SHARED) {
      const c = path.join(claudeDir, sub);
      const a = path.join(agentsDir, sub);
      if (exists(c) && !isDir(c) && !isLink(c)) {
        blocks.push(
          `.claude/${sub}: ada tetapi bukan folder/symlink. Perbaiki manual.`,
        );
        continue;
      }
      if (exists(a) && !isDir(a)) {
        blocks.push(
          `.agents/${sub}: ada tetapi bukan folder. Perbaiki manual.`,
        );
        continue;
      }
      if (isLink(c)) {
        const t = linkTarget(c);
        if (same(t, a))
          notes.push(`.claude/${sub}: sudah symlink ke .agents/${sub}`);
        else
          blocks.push(
            `.claude/${sub}: symlink ke ${rel(t || c)}; seharusnya ../.agents/${sub}. Perbaiki manual.`,
          );
        continue;
      }
      if (!isDir(c) && !isDir(a)) continue;
      if (isDir(c) && isDir(a)) {
        const entries = list(c);
        const conflicts = entries.filter((n) => exists(path.join(a, n)));
        if (conflicts.length) {
          blocks.push(
            `.claude/${sub}: konflik nama dengan .agents/${sub}: ${conflicts.join(', ')}. Selesaikan manual.`,
          );
          continue;
        }
        if (entries.length)
          actions.push({
            type: 'merge-dir',
            from: c,
            to: a,
            entries,
            label: `.claude/${sub} → .agents/${sub} (gabung ${entries.length} item)`,
          });
        actions.push({
          type: 'link-dir',
          path: c,
          target: `../.agents/${sub}`,
          label: `.claude/${sub} → .agents/${sub}`,
        });
      } else if (isDir(c)) {
        actions.push({
          type: 'move-dir',
          from: c,
          to: a,
          label: `.claude/${sub} → .agents/${sub} (pindah)`,
        });
        actions.push({
          type: 'link-dir',
          path: c,
          target: `../.agents/${sub}`,
          label: `.claude/${sub} → .agents/${sub}`,
        });
      } else if (isDir(a)) {
        if (create)
          actions.push({
            type: 'link-dir',
            path: c,
            target: `../.agents/${sub}`,
            label: `.claude/${sub} → .agents/${sub}`,
          });
        else
          notes.push(
            `.claude/${sub} belum ada; tidak dibuat (pakai --create bila ingin symlink)`,
          );
      }
    }
    const preserved = list(claudeDir).filter((n) => !SHARED.includes(n));
    if (preserved.length)
      notes.push(`.claude tetap nyata; dipertahankan: ${preserved.join(', ')}`);
  } else if (exists(claudeDir)) {
    blocks.push('.claude ada tetapi bukan folder/symlink. Perbaiki manual.');
  } else {
    for (const sub of SHARED) {
      if (!isDir(path.join(agentsDir, sub))) continue;
      if (create)
        actions.push({
          type: 'link-dir',
          path: path.join(claudeDir, sub),
          target: `../.agents/${sub}`,
          label: `.claude/${sub} → .agents/${sub}`,
        });
      else
        notes.push(
          `.claude/${sub} belum ada; tidak dibuat (pakai --create bila ingin symlink)`,
        );
    }
  }

  for (const d of ['docs/conventions', 'docs/adr']) {
    const p = path.join(projectRoot, d);
    const n = isDir(p) ? list(p).length : 0;
    if (n) notes.push(`${d}: ${n} file (opt-in; tautkan dari AGENTS.md)`);
  }

  return { actions, blocks, notes };
}

function ensureParent(p) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
}

function makeFileLink(link, target) {
  ensureParent(link);
  try {
    fs.symlinkSync(target, link, 'file');
    return 'symlink';
  } catch {
    fs.writeFileSync(link, pointer(path.basename(link)), { flag: 'wx' });
    return 'pointer';
  }
}

function makeDirLink(link, target) {
  ensureParent(link);
  const tmp = `${link}.pawang-link-${process.pid}-${Date.now()}`;
  try {
    fs.symlinkSync(target, tmp, 'dir');
    if (exists(link)) fs.rmdirSync(link);
    fs.renameSync(tmp, link);
  } catch (e) {
    try {
      fs.rmSync(tmp, { force: true });
    } catch {
      /* abaikan */
    }
    throw e;
  }
}

function apply(projectRoot, actions, quiet = false) {
  try {
    for (const a of actions) {
      if (a.type === 'link-file' || a.type === 'replace-file') {
        if (a.type === 'replace-file') fs.rmSync(a.path, { force: true });
        const how = makeFileLink(a.path, a.target);
        if (!quiet) console.log(`[${how}] ${rel(a.path)} → ${a.target}`);
      } else if (a.type === 'merge-dir') {
        fs.mkdirSync(a.to, { recursive: true });
        for (const n of a.entries)
          fs.renameSync(path.join(a.from, n), path.join(a.to, n));
        if (!quiet) console.log(`[move] ${rel(a.from)}/* → ${rel(a.to)}/`);
      } else if (a.type === 'move-dir') {
        fs.mkdirSync(path.dirname(a.to), { recursive: true });
        fs.renameSync(a.from, a.to);
        if (!quiet) console.log(`[move] ${rel(a.from)} → ${rel(a.to)}`);
      } else if (a.type === 'link-dir') {
        makeDirLink(a.path, a.target);
        if (!quiet) console.log(`[symlink] ${rel(a.path)} → ${a.target}`);
      }
    }
  } catch (e) {
    console.error(`apply gagal: ${e.message}`);
    return false;
  }
  return true;
}

function canSymlinkDir() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pawang-link-check-'));
  try {
    const target = path.join(tmp, 'target');
    fs.mkdirSync(target);
    fs.symlinkSync(target, path.join(tmp, 'link'), 'dir');
    return true;
  } catch {
    return false;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function report(projectRoot, p) {
  console.log(`# Audit file agent: ${projectRoot}`);
  console.log('');
  const agentsPath = path.join(projectRoot, 'AGENTS.md');
  console.log(
    `AGENTS.md: ${isLink(agentsPath) || exists(agentsPath) ? 'ada' : 'TIDAK ADA'}`,
  );
  console.log(
    `.agents/: ${exists(path.join(projectRoot, '.agents')) ? 'ada' : 'belum ada'}`,
  );
  console.log(
    `.claude/: ${isLink(path.join(projectRoot, '.claude')) ? 'symlink' : exists(path.join(projectRoot, '.claude')) ? 'folder nyata' : 'belum ada'}`,
  );
  console.log('');
  if (p.actions.length) {
    console.log('## Rencana (--apply; ditolak bila ada blokir)');
    for (const a of p.actions) console.log(`- ${a.label}`);
  } else {
    console.log('## Rencana');
    console.log('- Tidak ada perubahan.');
  }
  if (p.blocks.length) {
    console.log('');
    console.log('## Perlu keputusan/migrasi manual');
    for (const b of p.blocks) console.log(`- ${b}`);
  }
  if (p.notes.length) {
    console.log('');
    console.log('## Catatan');
    for (const n of p.notes) console.log(`- ${n}`);
  }
  console.log('');
  console.log(
    'Sumber kanonik: AGENTS.md + .agents/. CLAUDE.md/GEMINI.md dan subdir .claude yang tumpang tindih di-symlink; settings/hooks .claude tetap nyata.',
  );
}

function run(projectRoot, opts = {}) {
  const {
    applyChanges = false,
    checkMode = false,
    quiet = false,
    create = false,
  } = opts;
  const p = plan(projectRoot, create);
  if (!quiet) report(projectRoot, p);
  if (checkMode && (p.blocks.length || p.actions.length)) return 1;
  if (p.blocks.length) return applyChanges ? 1 : 0;
  const dirAction = p.actions.some((a) =>
    ['link-dir', 'merge-dir', 'move-dir'].includes(a.type),
  );
  if (applyChanges && dirAction && !canSymlinkDir()) {
    console.error(
      'apply: OS tidak mengizinkan symlink folder. Aktifkan Developer Mode/izin create-symlink; tidak ada file yang diubah.',
    );
    return 1;
  }
  if (applyChanges) {
    if (!apply(projectRoot, p.actions, quiet)) return 1;
    const after = plan(projectRoot, create);
    if (after.blocks.length || after.actions.length) {
      console.error(
        'apply: masih ada tindakan/blokir setelah apply; periksa manual.',
      );
      return 1;
    }
  }
  return 0;
}

function selftest() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'pawang-agent-files-'));
  try {
    const a = path.join(base, 'a');
    fs.mkdirSync(path.join(a, '.agents', 'skills', 'x'), { recursive: true });
    fs.mkdirSync(path.join(a, '.claude', 'skills', 'y'), { recursive: true });
    fs.mkdirSync(path.join(a, '.claude', 'hooks'), { recursive: true });
    fs.writeFileSync(
      path.join(a, 'AGENTS.md'),
      '# AGENTS.md\n\n## Ringkasan\n\nUji.\n',
    );
    fs.writeFileSync(
      path.join(a, 'CLAUDE.md'),
      '# AGENTS.md\n\n## Ringkasan\n\nUji.\n',
    );
    fs.writeFileSync(
      path.join(a, 'GEMINI.md'),
      '# AGENTS.md\n\n## Ringkasan\n\nUji.\n',
    );
    fs.writeFileSync(path.join(a, '.agents', 'skills', 'x', 'SKILL.md'), 'x');
    fs.writeFileSync(path.join(a, '.claude', 'skills', 'y', 'SKILL.md'), 'y');
    fs.writeFileSync(path.join(a, '.claude', 'settings.json'), '{}');
    fs.writeFileSync(path.join(a, '.claude', 'hooks', 'h.sh'), 'echo h');
    assert.equal(run(a, { applyChanges: true, quiet: true }), 0);
    const linked = (p) => isLink(p) || isPointer(read(p), path.basename(p));
    assert.ok(linked(path.join(a, 'CLAUDE.md')));
    assert.ok(linked(path.join(a, 'GEMINI.md')));
    assert.ok(isLink(path.join(a, '.claude', 'skills')));
    assert.ok(exists(path.join(a, '.agents', 'skills', 'y', 'SKILL.md')));
    assert.ok(exists(path.join(a, '.claude', 'settings.json')));
    assert.ok(exists(path.join(a, '.claude', 'hooks', 'h.sh')));
    assert.deepEqual(plan(a).actions, []);
    assert.deepEqual(plan(a).blocks, []);

    const b = path.join(base, 'b');
    fs.mkdirSync(b, { recursive: true });
    fs.writeFileSync(
      path.join(b, 'AGENTS.md'),
      '# AGENTS.md\n\n## Ringkasan\n\nUji.\n',
    );
    fs.writeFileSync(
      path.join(b, 'CLAUDE.md'),
      '# CLAUDE.md\n\n## Aturan Claude khusus\n\nJangan symlink sebelum migrasi.\n',
    );
    assert.ok(plan(b).blocks.length > 0);
    assert.equal(run(b, { applyChanges: true, quiet: true }), 1);
    assert.ok(!isLink(path.join(b, 'CLAUDE.md')));
    console.log('selftest: OK (audit, apply, konflik)');
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
}

if (SELFTEST) {
  selftest();
} else {
  if (!exists(root) || !isDir(root)) {
    console.error(`Folder proyek tidak ditemukan: ${root}`);
    process.exit(2);
  }
  process.exit(
    run(root, { applyChanges: APPLY, checkMode: CHECK, create: CREATE }),
  );
}
