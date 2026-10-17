#!/usr/bin/env node
// sync-plugin.mjs: menghasilkan bundle plugin + katalog marketplace dari skills/.
// Core: skills/pawang. Companion repo: skills/<nama> sesuai companions.json.
// Tanpa dependensi (Node 18+). Jalankan: npm run plugin:sync

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const coreSource = path.join(root, "skills", "pawang");
const pluginsDir = path.join(root, "plugins");
const lite = path.join(root, "dist", "pawang-lite");
const repoUrl = pkg.repository.url.replace(/^git\+/, "").replace(/\.git$/, "");
const coreDescription =
  "Alur kerja agent otonom berbasis spec: rencana, implement, check, audit, dan complete dengan state .pawang. Termasuk adopsi proyek, AGENTS.md, paralel, batch, Figr, review kode, CI, dan prototype.";

const writeJson = (file, data) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
};

const companionsData = JSON.parse(
  fs.readFileSync(path.join(coreSource, "companions.json"), "utf8"),
);

const entries = [
  {
    name: "pawang",
    title: "Pawang",
    description: coreDescription,
    source: coreSource,
    keywords: pkg.keywords,
    warnings: [],
  },
  ...companionsData.companions.map((item) => ({
    name: item.name,
    title: item.title || item.name,
    description: item.description,
    source: path.join(root, "skills", item.name),
    keywords: ["agent", "skill", "pawang", item.name],
    deps: item.deps || [],
    warnings: item.warnings || [],
  })),
];

if (!fs.existsSync(coreSource)) {
  console.error(`GAGAL: sumber core tidak ditemukan: ${coreSource}`);
  process.exit(1);
}
for (const entry of entries) {
  if (!fs.existsSync(path.join(entry.source, "SKILL.md"))) {
    console.error(`GAGAL: ${entry.name} tidak punya SKILL.md di ${entry.source}`);
    process.exit(1);
  }
}

fs.mkdirSync(pluginsDir, { recursive: true });
for (const item of fs.readdirSync(pluginsDir, { withFileTypes: true })) {
  if (item.isDirectory() && !entries.some((entry) => entry.name === item.name)) {
    fs.rmSync(path.join(pluginsDir, item.name), { recursive: true, force: true });
  }
}

const coreReadme = `# Pawang

> Generated oleh \`scripts/sync-plugin.mjs\`; jangan edit manual. Jalankan \`npm run plugin:sync\`.

Pawang adalah plugin alur kerja agent otonom berbasis spec. Plugin ini membawa skill inti \`pawang\`: peta alur, references per topik, script deterministik, dan \`kit.js\` untuk menulis state proyek di \`.pawang/\`. Setelah spec disetujui, agent bekerja otonom dan manusia hanya hadir di dua gerbang: review spec serta izin commit/merge.

## Isi

- \`skills/pawang/\` - skill inti, references, script, dan \`assets/kit.js\`.
- \`skills/pawang/companions.json\` - metadata companion opsional; companion tidak dibundel.

## Pasang

- Claude Code: \`/plugin marketplace add pawangai/pawang\` lalu \`/plugin install pawang@pawang\`.
- ChatGPT/Codex: \`codex plugin marketplace add pawangai/pawang\`; workspace ChatGPT bisa mengimpor marketplace ini. Publik setelah submit.
- Perplexity: impor folder \`plugins/pawang\` dari repo GitHub.
- Gemini CLI: \`gemini skills install https://github.com/pawangai/pawang.git --path skills/pawang --scope workspace --consent\`.
- Antigravity: salin atau tautkan \`skills/pawang\` ke \`.agents/skills/pawang\`.

## Batas

Alur penuh membutuhkan shell, Node, git, dan repo proyek yang bisa ditulis. Di chat web tanpa runtime tersebut, skill otomatis memakai mode lite: plan, spec, review, dan audit sebagai artifact tanpa menulis \`.pawang/\`. Companion Figr/CICD dipasang sebagai plugin terpisah dan tidak dibundel.

## Lisensi

MIT
`;

const liteReadme = `# Pawang Lite

Bundel ini berisi \`SKILL.md\` dan references untuk surface yang tidak punya shell, Node, git, atau repo persisten. Mode lite hanya menghasilkan artifact Markdown: plan, spec, review, audit, dokumen Figr, dan handoff. Tidak ada \`kit.js\`, state \`.pawang/\`, test, commit, atau companion. Gunakan bundel penuh di Claude Code, Cowork, ChatGPT Work/Codex, Gemini CLI, Antigravity, atau opencode untuk alur otonom.
`;

const companionReadme = (entry) => `# ${entry.title}

> Generated oleh \`scripts/sync-plugin.mjs\`; jangan edit manual. Jalankan \`npm run plugin:sync\`.

${entry.description}

## Isi

- \`skills/${entry.name}/\` - skill ${entry.title}, references, dan script pendukung.

## Pasang

- Claude Code: \`/plugin install ${entry.name}@pawang\`.
- ChatGPT/Codex: Codex \`codex plugin marketplace add pawangai/pawang\`, atau workspace admin impor marketplace. Publik setelah submit.
- Perplexity: impor folder \`plugins/${entry.name}\` dari repo GitHub.
- Gemini CLI: \`gemini skills install https://github.com/pawangai/pawang.git --path skills/${entry.name} --scope workspace --consent\`.

## Dependensi

${entry.deps.length ? entry.deps.map((dep) => `- ${dep}`).join("\n") : "- Tidak ada."}

## Peringatan

${entry.warnings.length ? entry.warnings.map((warning) => `- ${warning}`).join("\n") : "- Tidak ada."}

## Lisensi

MIT
`;

for (const entry of entries) {
  const target = path.join(pluginsDir, entry.name);
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });
  fs.cpSync(entry.source, path.join(target, "skills", entry.name), { recursive: true });
  fs.copyFileSync(path.join(root, "LICENSE"), path.join(target, "LICENSE"));

  const claudeManifest = {
    name: entry.name,
    displayName: entry.title,
    version: pkg.version,
    description: entry.description,
    author: { name: "Pawang AI", url: repoUrl },
    homepage: pkg.homepage,
    repository: repoUrl,
    license: "MIT",
    keywords: entry.keywords,
  };
  const agentManifest = {
    $schema: "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
    ...claudeManifest,
    displayName: undefined,
  };
  delete agentManifest.displayName;

  writeJson(path.join(target, ".claude-plugin", "plugin.json"), claudeManifest);
  writeJson(path.join(target, "plugin.json"), agentManifest);
  fs.writeFileSync(
    path.join(target, "README.md"),
    entry.name === "pawang" ? coreReadme : companionReadme(entry),
  );
}

fs.rmSync(lite, { recursive: true, force: true });
fs.mkdirSync(lite, { recursive: true });
fs.cpSync(coreSource, lite, {
  recursive: true,
  filter: (src) => {
    const rel = path.relative(coreSource, src).split(path.sep).join("/");
    if (!rel) return true;
    if (rel === "companions.json") return false;
    if (rel === "scripts" || rel.startsWith("scripts/")) return false;
    if (rel === "assets" || rel.startsWith("assets/")) return false;
    if (path.basename(src) === ".DS_Store") return false;
    return true;
  },
});
fs.writeFileSync(path.join(lite, "README.md"), liteReadme);

writeJson(path.join(root, ".claude-plugin", "marketplace.json"), {
  name: "pawang",
  owner: { name: "Pawang AI", url: repoUrl },
  description: coreDescription,
  plugins: entries.map((entry) => ({
    name: entry.name,
    source: `./plugins/${entry.name}`,
    description: entry.description,
    version: pkg.version,
    category: "productivity",
    tags: entry.keywords.slice(0, 4),
  })),
});

writeJson(path.join(root, ".agents", "plugins", "marketplace.json"), {
  name: "pawang",
  interface: { displayName: "Pawang" },
  plugins: entries.map((entry) => ({
    name: entry.name,
    source: { source: "local", path: `./plugins/${entry.name}` },
    policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" },
    category: "Productivity",
  })),
});

console.log(`plugin:sync selesai (pawang v${pkg.version})`);
for (const entry of entries) console.log(`- plugins/${entry.name}`);
console.log(`- ${path.relative(root, lite)} (lite, tanpa script)`);
console.log("- .claude-plugin/marketplace.json");
console.log("- .agents/plugins/marketplace.json");
