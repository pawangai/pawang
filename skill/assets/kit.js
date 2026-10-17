#!/usr/bin/env node
// kit.js: generator & pembaca file .pawang (HTML untuk manusia, JSON tertanam untuk agent).
// Tanpa dependensi npm (Node 18+). JANGAN edit file ini di project; perbarui lewat `npx pawang init --force`.
//
// Pemakaian:
//   node .pawang/kit.js init                          scaffold .pawang/ (folder, stub, config.json, theme.json)
//   node .pawang/kit.js render <tipe> [--out file] [--in file]   JSON dari stdin bila tanpa --in
//   node .pawang/kit.js extract <file.html>           cetak data JSON dari file HTML
//   node .pawang/kit.js status                        ringkasan seluruh state
//   node .pawang/kit.js check                         validasi integritas; exit 1 bila rusak
//   node .pawang/kit.js theme [--refresh|--default|--check]      lihat / deteksi ulang / reset / cek drift tema
//   node .pawang/kit.js selftest                      uji mandiri kit.js
//
// Tipe render: current-feature, findings, review, handoff, build-plan, project-overview,
//              coding-standards, history-feature, history-fix, history-rollback, document-spec,
//              diagram.

"use strict";
(async () => {
  const fs = (await import("node:fs")).default;
  const os = (await import("node:os")).default;
  const path = (await import("node:path")).default;
  const crypto = (await import("node:crypto")).default;

  const BASE = path.dirname(path.resolve(process.argv[1])); // folder .pawang
  const ROOT = path.dirname(BASE); // root proyek

  const TYPES = {
    "current-feature": "context/current-feature.html",
    findings: "context/findings.html",
    review: "context/review.html",
    handoff: "context/handoff.html",
    "build-plan": "context/build-plan.html",
    "project-overview": "context/project-overview.html",
    "coding-standards": "context/coding-standards.html",
    "history-feature": null,
    "history-fix": null,
    "history-rollback": null,
    "document-spec": null,
    diagram: null,
  };

  const TITLE_OF = {
    "current-feature": "Pekerjaan aktif",
    findings: "Findings",
    review: "Review independen",
    handoff: "Handoff",
    "build-plan": "Build plan",
    "project-overview": "Project overview",
    "coding-standards": "Coding standards",
    "history-feature": "Arsip fitur",
    "history-fix": "Arsip fix",
    "history-rollback": "Arsip rollback",
    "document-spec": "Spesifikasi dokumen",
    diagram: "Diagram",
  };

  const FEATURE_STATUSES = [
    "none",
    "not-started",
    "in-progress",
    "verified",
    "verification-failed",
    "ready",
    "completed",
  ];
  const FINDING_SEVERITIES = ["P0", "P1", "P2", "P3"];
  const FINDING_STATUSES = [
    "unverified",
    "open",
    "fixed",
    "closed",
    "accepted",
    "invalid",
  ];
  const REVIEW_STATES = ["none", "pending", "passed", "changes-requested"];

  const SKIP_DIRS = new Set([
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    "out",
    "coverage",
    "vendor",
    ".cache",
    "tmp",
    ".turbo",
    ".vercel",
    ".svelte-kit",
  ]);

  // ---------------------------------------------------------------------------
  // Util
  // ---------------------------------------------------------------------------

  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );

  const norm = (x) => JSON.parse(JSON.stringify(x));
  const nowIso = () => new Date().toISOString();
  const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
  const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
  const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");

  function die(msg, code = 1) {
    console.error("GAGAL: " + msg);
    process.exit(code);
  }

  function writeFileMk(file, content) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }

  // ---------------------------------------------------------------------------
  // Tema
  // ---------------------------------------------------------------------------

  const DEFAULT_THEME = {
    slots: {
      bg: "#f8fafc",
      surface: "#ffffff",
      border: "#e2e8f0",
      text: "#0f172a",
      muted: "#64748b",
      accent: "#2563eb",
      accentInk: "#ffffff",
      radius: "12px",
      fontSans: "Inter, system-ui, -apple-system, sans-serif",
      fontMono: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: "15px",
    },
    passthrough: {},
  };

  const SLOT_KEYS = {
    bg: [
      "--color-background",
      "--background",
      "--color-bg",
      "--bg",
      "--color-base",
    ],
    surface: [
      "--color-surface",
      "--surface",
      "--color-card",
      "--card",
      "--color-panel",
    ],
    border: ["--color-border", "--border", "--color-outline", "--border-color"],
    text: [
      "--color-foreground",
      "--foreground",
      "--color-text",
      "--text",
      "--color-ink",
    ],
    muted: [
      "--color-muted-foreground",
      "--color-muted",
      "--muted",
      "--color-subtle",
    ],
    accent: ["--color-primary", "--primary", "--color-accent", "--accent"],
    accentInk: [
      "--color-primary-foreground",
      "--primary-foreground",
      "--accent-ink",
      "--color-accent-foreground",
    ],
    radius: ["--radius-md", "--radius", "--radius-lg", "--radius-sm"],
    fontSans: ["--font-sans"],
    fontMono: ["--font-mono"],
    fontSize: ["--text-base", "--font-size-base", "--fs-base", "--font-size"],
  };

  function extractCssProps(text) {
    const props = {};
    const re = /(--[A-Za-z0-9_-]+)\s*:\s*([^;{}]+);/g;
    let m;
    while ((m = re.exec(text))) {
      const v = m[2].trim();
      if (v) props[m[1]] = v;
    }
    return props;
  }

  function extractTailwindProps(text) {
    const props = {};
    const font = text.match(/fontFamily\s*:\s*{([\s\S]*?)\n\s{2,}[},\]]/);
    if (font) {
      for (const m of font[1].matchAll(
        /['"]?([\w-]+)['"]?\s*:\s*\[([^\]]*)\]/g,
      )) {
        const first = m[2].split(",")[0].replace(/["']/g, "").trim();
        if (!first) continue;
        if (m[1] === "sans") props["--font-sans"] = first;
        if (m[1] === "mono") props["--font-mono"] = first;
      }
    }
    const flat = {
      primary: "--color-primary",
      background: "--color-background",
      surface: "--color-surface",
      border: "--color-border",
      foreground: "--color-foreground",
      muted: "--color-muted",
    };
    for (const [key, cssVar] of Object.entries(flat)) {
      const m = text.match(
        new RegExp(`${key}\\s*:\\s*['"](#[0-9a-fA-F]{3,8})['"]`),
      );
      if (m) props[cssVar] = m[1];
    }
    return props;
  }

  function findThemeCandidates() {
    const out = [];
    const add = (p) => {
      if (
        p &&
        !out.includes(p) &&
        fs.existsSync(path.join(ROOT, p)) &&
        fs.statSync(path.join(ROOT, p)).isFile()
      )
        out.push(p);
    };

    const dsPath = "prototype/packages/shared/ui/index.css";
    const hasDs = fs.existsSync(path.join(ROOT, dsPath));
    const tp = path.join(BASE, "theme.json");
    if (fs.existsSync(tp)) {
      try {
        const t = readJson(tp);
        for (const s of t.sources || []) {
          if (hasDs && s.path === "prototypes/theme.css") continue;
          add(s.path);
        }
      } catch {}
    }
    if (hasDs) add(dsPath);
    else add("prototypes/theme.css");
    add("packages/design-system/index.css");

    const walk = (dir, depth) => {
      if (depth > 5) return;
      let ents;
      try {
        ents = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const e of ents) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
          if (SKIP_DIRS.has(e.name) || e.name.startsWith(".")) continue;
          walk(full, depth + 1);
        } else if (e.isFile() && e.name.endsWith(".css")) {
          const parts = path.relative(ROOT, full).split(path.sep);
          if (parts.includes("figr")) add(rel(full));
          else if (e.name === "globals.css" || e.name === "app.css") {
            try {
              const t = fs.readFileSync(full, "utf8");
              if (/@theme|:root/.test(t)) add(rel(full));
            } catch {}
          }
        }
      }
    };
    walk(ROOT, 0);

    for (const n of [
      "tailwind.config.js",
      "tailwind.config.ts",
      "tailwind.config.mjs",
      "tailwind.config.cjs",
    ])
      add(n);
    return out;
  }

  function detectTheme() {
    const slots = { ...DEFAULT_THEME.slots };
    const filled = new Set();
    const passthrough = {};
    const sources = [];

    for (const p of findThemeCandidates()) {
      let props = {};
      try {
        const text = fs.readFileSync(path.join(ROOT, p), "utf8");
        props = p.endsWith(".css")
          ? extractCssProps(text)
          : { ...extractCssProps(text), ...extractTailwindProps(text) };
      } catch {
        continue;
      }
      const keys = Object.keys(props);
      if (!keys.length) continue;
      for (const [slot, candidates] of Object.entries(SLOT_KEYS)) {
        if (filled.has(slot)) continue;
        for (const c of candidates) {
          if (props[c]) {
            slots[slot] = props[c];
            filled.add(slot);
            break;
          }
        }
      }
      for (const [k, v] of Object.entries(props)) {
        if (!(k in passthrough) && !Object.values(SLOT_KEYS).flat().includes(k))
          passthrough[k] = v;
      }
      sources.push({
        path: p,
        sha256: sha256(fs.readFileSync(path.join(ROOT, p))),
      });
    }

    return {
      schemaVersion: 1,
      detectedAt: nowIso(),
      origin: sources.length ? "detected" : "default",
      sources,
      slots,
      passthrough,
    };
  }

  function loadTheme() {
    const tp = path.join(BASE, "theme.json");
    try {
      const t = readJson(tp);
      return {
        slots: { ...DEFAULT_THEME.slots, ...(t.slots || {}) },
        passthrough: t.passthrough || {},
        meta: t,
      };
    } catch {
      return { slots: { ...DEFAULT_THEME.slots }, passthrough: {}, meta: null };
    }
  }

  function cssThemeBlock(theme) {
    const s = theme.slots;
    const lines = [
      `--p-bg:${s.bg};`,
      `--p-surface:${s.surface};`,
      `--p-border:${s.border};`,
      `--p-text:${s.text};`,
      `--p-muted:${s.muted};`,
      `--p-accent:${s.accent};`,
      `--p-accent-ink:${s.accentInk};`,
      `--p-radius:${s.radius};`,
      `--p-font-sans:${s.fontSans};`,
      `--p-font-mono:${s.fontMono};`,
      `--p-font-size:${s.fontSize};`,
    ];
    for (const [k, v] of Object.entries(theme.passthrough || {}))
      if (/^--[A-Za-z0-9_-]+$/.test(k)) lines.push(`${k}:${v};`);
    return `:root{${lines.join("")}}`;
  }

  // ---------------------------------------------------------------------------
  // Render HTML
  // ---------------------------------------------------------------------------

  const CSS = `
*{box-sizing:border-box}
body{margin:0;background:var(--p-bg);color:var(--p-text);font-family:var(--p-font-sans);font-size:var(--p-font-size);line-height:1.55}
.wrap{max-width:880px;margin:0 auto;padding:28px 20px 64px}
header.site{border:1px solid var(--p-border);background:var(--p-surface);border-radius:var(--p-radius);padding:18px 20px;margin-bottom:20px}
.kind{font-size:.8em;letter-spacing:.08em;text-transform:uppercase;color:var(--p-muted);font-weight:600}
h1{font-size:1.47em;margin:6px 0 8px}
h2{font-size:1em;margin:22px 0 8px;text-transform:uppercase;letter-spacing:.04em;color:var(--p-muted)}
p{margin:6px 0}
.badge{display:inline-block;font-size:.8em;font-weight:600;padding:2px 10px;border-radius:999px;border:1px solid var(--p-border);background:var(--p-bg);color:var(--p-text);margin-right:6px}
.badge.ok{background:var(--p-accent);border-color:var(--p-accent);color:var(--p-accent-ink)}
.badge.warn{border-color:#d97706;color:#b45309}
.badge.bad{border-color:#dc2626;color:#dc2626}
.badge.muted{color:var(--p-muted)}
.meta{color:var(--p-muted);font-size:.87em;margin-top:6px}
.meta code,code{font-family:var(--p-font-mono);font-size:.92em;background:var(--p-bg);border:1px solid var(--p-border);border-radius:6px;padding:1px 6px}
section{border:1px solid var(--p-border);background:var(--p-surface);border-radius:var(--p-radius);padding:14px 18px;margin:12px 0}
section h2{margin-top:0}
ul{margin:6px 0;padding-left:22px}
li{margin:3px 0}
ul.steps{list-style:none;padding-left:0}
ul.steps li{border:1px solid var(--p-border);border-radius:8px;padding:8px 12px;margin:6px 0}
ul.steps li.done{opacity:.65}
ul.steps .check{font-weight:700;margin-right:8px}
ul.steps em{color:var(--p-muted);font-style:normal;display:block;font-size:.87em}
table{border-collapse:collapse;width:100%;font-size:.93em}
th,td{border:1px solid var(--p-border);padding:6px 10px;text-align:left;vertical-align:top}
th{background:var(--p-bg);font-size:.8em;text-transform:uppercase;letter-spacing:.04em;color:var(--p-muted)}
.card{border:1px solid var(--p-border);border-radius:8px;padding:12px 14px;margin:10px 0}
.card h3{margin:0 0 6px;font-size:1em}
.warnbox{border-color:#d97706;background:#fffbeb;color:#7c2d12}
.warnbox h2{color:#b45309}
.empty{color:var(--p-muted);font-style:italic}
pre.mermaid{background:var(--p-bg);border:1px solid var(--p-border);border-radius:8px;padding:12px;overflow:auto;text-align:center}
details{margin-top:8px;color:var(--p-muted);font-size:.87em}
details pre{text-align:left;overflow:auto;background:var(--p-bg);border:1px solid var(--p-border);border-radius:8px;padding:10px}
footer{margin-top:28px;color:var(--p-muted);font-size:.8em;text-align:center}
.kv{display:grid;grid-template-columns:170px 1fr;gap:4px 12px;font-size:.93em}
.kv .k{color:var(--p-muted)}
`;

  function page(type, data, bodyHtml) {
    const theme = loadTheme();
    const title = data.title || TITLE_OF[type] || type;
    const embedded = JSON.stringify(data).replace(/</g, "\\u003c");
    const mermaid =
      type === "diagram"
        ? `<script type="module">
import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
mermaid.initialize({ startOnLoad: true, theme: "neutral" });
</script>`
        : "";
    return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} - pawang ${esc(type)}</title>
<style>${CSS}${cssThemeBlock(theme)}</style>
</head>
<body>
<div class="wrap">
${bodyHtml}
<footer>pawang kit.js - ${esc(nowIso())}</footer>
</div>
<script type="application/json" id="pawang-data">${embedded}</script>
${mermaid}
</body>
</html>
`;
  }

  const badge = (text, kind) =>
    `<span class="badge ${kind || ""}">${esc(text)}</span>`;
  const ul = (a) =>
    Array.isArray(a) && a.length
      ? `<ul>${a.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`
      : '<p class="empty">-</p>';
  const sect = (t, inner) =>
    inner ? `<section><h2>${esc(t)}</h2>${inner}</section>` : "";
  const kvRows = (rows) => {
    const items = rows.filter(
      ([, v]) => v != null && v !== "" && !(Array.isArray(v) && !v.length),
    );
    if (!items.length) return "";
    return `<div class="kv">${items.map(([k, v]) => `<div class="k">${esc(k)}</div><div>${typeof v === "string" ? esc(v) : v}</div>`).join("")}</div>`;
  };

  function statusKind(s) {
    if (
      s === "verified" ||
      s === "ready" ||
      s === "completed" ||
      s === "passed" ||
      s === "closed"
    )
      return "ok";
    if (
      s === "in-progress" ||
      s === "pending" ||
      s === "open" ||
      s === "fixed" ||
      s === "not-started" ||
      s === "changes-requested"
    )
      return "warn";
    if (s === "verification-failed") return "bad";
    return "muted";
  }

  function severityKind(s) {
    if (s === "P0" || s === "P1") return "bad";
    if (s === "P2") return "warn";
    return "muted";
  }

  function featureBody(d) {
    const out = [];
    out.push(
      kvRows([
        ["Branch", d.branch ? `<code>${esc(d.branch)}</code>` : ""],
        [
          "Dari build-plan",
          d.origin
            ? "#" +
              esc(d.origin.buildPlanId || "") +
              (d.origin.attempt > 1
                ? " (attempt " + esc(d.origin.attempt) + ")"
                : "")
            : "",
        ],
        ["Fixes", d.fixes ? esc(d.fixes) : ""],
        ["Selesai", d.completedAt ? esc(d.completedAt) : ""],
      ]),
    );
    out.push(sect("Goal", d.goal ? `<p>${esc(d.goal)}</p>` : ""));
    out.push(
      sect(
        "In scope",
        Array.isArray(d.inScope) && d.inScope.length ? ul(d.inScope) : "",
      ),
    );
    out.push(
      sect(
        "Out of scope",
        Array.isArray(d.outOfScope) && d.outOfScope.length
          ? ul(d.outOfScope)
          : "",
      ),
    );
    if (Array.isArray(d.steps) && d.steps.length) {
      const items = d.steps
        .map(
          (st) =>
            `<li class="${st.done ? "done" : ""}"><span class="check">${st.done ? "✓" : "○"}</span>${esc(st.text)}${st.doneWhen ? `<em>Done when: ${esc(st.doneWhen)}</em>` : ""}</li>`,
        )
        .join("");
      const done = d.steps.filter((s) => s.done).length;
      out.push(
        `<section><h2>Langkah (${done}/${d.steps.length})</h2><ul class="steps">${items}</ul></section>`,
      );
    }
    out.push(
      sect(
        "Files / areas",
        Array.isArray(d.files) && d.files.length ? ul(d.files) : "",
      ),
    );
    out.push(
      sect(
        "Data / kontrak",
        Array.isArray(d.contracts) && d.contracts.length ? ul(d.contracts) : "",
      ),
    );
    out.push(
      sect(
        "Testing",
        Array.isArray(d.testing) && d.testing.length ? ul(d.testing) : "",
      ),
    );
    const docs =
      d.references && Array.isArray(d.references.documents)
        ? d.references.documents
        : [];
    if (docs.length) {
      const rows = docs
        .map(
          (x) =>
            `<tr><td>${esc(x.jenis)}</td><td><code>${esc(x.spec)}</code></td><td><code>${esc(x.verify || "-")}</code></td></tr>`,
        )
        .join("");
      out.push(
        `<section><h2>Referensi dokumen</h2><table><tr><th>Jenis</th><th>Spesifikasi</th><th>Verifikasi</th></tr>${rows}</table></section>`,
      );
    }
    const design =
      d.references && Array.isArray(d.references.design)
        ? d.references.design
        : [];
    if (design.length) out.push(sect("Referensi desain", ul(design)));
    out.push(
      sect(
        "Catatan",
        Array.isArray(d.notes) && d.notes.length ? ul(d.notes) : "",
      ),
    );
    if (d.rollback && d.rollback.targetArchive) {
      out.push(
        sect(
          "Target rollback",
          kvRows([
            ["Arsip", d.rollback.targetArchive],
            ["Commit", d.rollback.targetCommit],
            ["Parent", d.rollback.targetParent],
            ["Alasan", d.rollback.reason],
          ]),
        ),
      );
    }
    if (Array.isArray(d.openQuestions) && d.openQuestions.length) {
      out.push(
        `<section class="warnbox"><h2>Pertanyaan terbuka</h2>${ul(d.openQuestions)}<p>Spec tidak boleh diajukan untuk review selama masih ada pertanyaan terbuka.</p></section>`,
      );
    }
    return out.join("");
  }

  function renderBody(type, d) {
    switch (type) {
      case "current-feature":
      case "history-feature":
      case "history-fix":
      case "history-rollback": {
        const typeLabel =
          d.type === "fix"
            ? "fix"
            : d.type === "rollback"
              ? "rollback"
              : "fitur";
        const head = `<header class="site"><div class="kind">${esc(typeLabel)}${type.startsWith("history") ? " - arsip" : ""}</div><h1>${esc(d.title || "(tanpa judul)")}</h1>${badge(d.status || "-", statusKind(d.status))}</header>`;
        return head + featureBody(d);
      }
      case "findings": {
        const items = Array.isArray(d.items) ? d.items : [];
        const blockers = items.filter(
          (f) =>
            (f.severity === "P0" || f.severity === "P1") &&
            (f.status === "open" || f.status === "fixed"),
        );
        let body = `<header class="site"><div class="kind">ledger temuan</div><h1>Findings</h1>${badge(items.length + " temuan", "muted")}${blockers.length ? badge(blockers.length + " memblokir", "bad") : badge("tidak ada blokir", "ok")}</header>`;
        if (!items.length)
          body += '<section><p class="empty">Belum ada temuan.</p></section>';
        for (const f of items) {
          body +=
            `<section class="card"><h3>${badge(f.id || "F-??", "muted")}${badge(f.severity || "?", severityKind(f.severity))}${badge(f.status || "?", statusKind(f.status))} ${esc(f.title || "")}</h3>` +
            kvRows([
              ["File", f.file],
              ["Ditemukan", f.found],
              ["Kenapa penting", f.why],
              ["Saran perbaikan", f.fix],
              ["Resolusi", f.resolution],
            ]) +
            "</section>";
        }
        return body;
      }
      case "review": {
        const st = d.state || "none";
        let body = `<header class="site"><div class="kind">review independen</div><h1>Review</h1>${badge(st, statusKind(st))}</header>`;
        if (st === "none")
          body +=
            '<section><p class="empty">Belum ada request review.</p></section>';
        body += sect(
          "Ringkasan",
          kvRows([
            ["Target commit", d.targetCommit],
            ["Base", d.baseRef],
            ["Spec hash", d.specHash],
            ["Disiapkan oleh", d.preparedBy],
            ["Model builder", d.builderModel],
            ["Reviewer diminta", d.requestedReviewer],
            ["Eksekusi", d.requestedExecution],
            ["Diminta pada", d.requestedAt],
            ["Reviewer", d.reviewerModel],
            ["Konteks reviewer", d.reviewerContext],
            ["Direview pada", d.reviewedAt],
            ["Scope", d.scope],
            ["Lensa", Array.isArray(d.lenses) ? d.lenses.join(", ") : ""],
            ["Verdict", d.verdict],
            ["Hasil check", d.checkResult],
          ]),
        );
        body += sect(
          "Commands",
          Array.isArray(d.commands) && d.commands.length ? ul(d.commands) : "",
        );
        body += sect(
          "Bukti",
          Array.isArray(d.evidence) && d.evidence.length ? ul(d.evidence) : "",
        );
        body += sect(
          "Findings",
          Array.isArray(d.findings) && d.findings.length ? ul(d.findings) : "",
        );
        body += sect(
          "Risiko tersisa",
          Array.isArray(d.remainingRisk) && d.remainingRisk.length
            ? ul(d.remainingRisk)
            : "",
        );
        return body;
      }
      case "handoff": {
        const body =
          `<header class="site"><div class="kind">lanjut sesi</div><h1>Handoff</h1><div class="meta">Diperbarui: ${esc(d.updatedAt || "-")}</div></header>` +
          sect("Tujuan", d.goal ? `<p>${esc(d.goal)}</p>` : "") +
          sect(
            "Sudah selesai",
            Array.isArray(d.done) && d.done.length ? ul(d.done) : "",
          ) +
          sect("Kondisi sekarang", d.state ? `<p>${esc(d.state)}</p>` : "") +
          sect(
            "Langkah berikutnya",
            Array.isArray(d.next) && d.next.length ? ul(d.next) : "",
          ) +
          sect(
            "Keputusan baru",
            Array.isArray(d.decisions) && d.decisions.length
              ? ul(d.decisions)
              : "",
          ) +
          sect(
            "Masalah terbuka",
            Array.isArray(d.openIssues) && d.openIssues.length
              ? ul(d.openIssues)
              : "",
          );
        return body;
      }
      case "build-plan": {
        const items = Array.isArray(d.items) ? d.items : [];
        const done = items.filter((i) => i.done).length;
        const rows = items
          .map(
            (i) =>
              `<tr><td>${i.done ? "✓" : "○"}</td><td>${esc(i.id || "")}</td><td>${esc(i.text || "")}</td></tr>`,
          )
          .join("");
        return (
          `<header class="site"><div class="kind">daftar fitur</div><h1>Build plan</h1>${badge(done + "/" + items.length + " selesai", done === items.length && items.length ? "ok" : "muted")}</header>` +
          `<section><table><tr><th></th><th>#</th><th>Fitur</th></tr>${rows}</table></section>`
        );
      }
      case "project-overview": {
        return (
          `<header class="site"><div class="kind">ringkasan proyek</div><h1>Project overview</h1></header>` +
          sect("Ringkasan", d.summary ? `<p>${esc(d.summary)}</p>` : "") +
          sect("Masalah", d.problem ? `<p>${esc(d.problem)}</p>` : "") +
          sect("Pengguna", d.users ? `<p>${esc(d.users)}</p>` : "") +
          sect(
            "Stack",
            Array.isArray(d.stack) && d.stack.length ? ul(d.stack) : "",
          ) +
          sect(
            "Data",
            Array.isArray(d.data) && d.data.length ? ul(d.data) : "",
          ) +
          sect("UI/UX", d.ui ? `<p>${esc(d.ui)}</p>` : "") +
          sect(
            "Deployment",
            d.deployment ? `<p>${esc(d.deployment)}</p>` : "",
          ) +
          sect("Batasan", d.constraints ? `<p>${esc(d.constraints)}</p>` : "")
        );
      }
      case "coding-standards": {
        const secs = Array.isArray(d.sections) ? d.sections : [];
        return (
          `<header class="site"><div class="kind">konvensi kode</div><h1>Coding standards</h1></header>` +
          secs.map((s) => sect(s.title || "", ul(s.rules || []))).join("")
        );
      }
      case "document-spec": {
        const secs = Array.isArray(d.sections) ? d.sections : [];
        return (
          `<header class="site"><div class="kind">spesifikasi dokumen</div><h1>${esc(d.jenis || "dokumen")}</h1>${badge(d.status || "-", statusKind(d.status))}</header>` +
          sect("Sumber referensi", d.sumber ? `<p>${esc(d.sumber)}</p>` : "") +
          sect("Pemilik", d.pemilik ? `<p>${esc(d.pemilik)}</p>` : "") +
          secs
            .map((s) =>
              sect(
                s.title || "",
                Array.isArray(s.lines)
                  ? ul(s.lines)
                  : s.lines
                    ? `<p>${esc(s.lines)}</p>`
                    : "",
              ),
            )
            .join("")
        );
      }
      case "diagram": {
        const diagrams = Array.isArray(d.diagrams)
          ? d.diagrams
          : d.source
            ? [{ title: d.title || "Diagram", source: d.source }]
            : [];
        let body =
          `<header class="site"><div class="kind">diagram</div><h1>${esc(d.title || "Diagram")}</h1>${badge(diagrams.length + " diagram", "muted")}</header>` +
          (d.from
            ? `<section><p class="empty">Sumber: <code>${esc(d.from)}</code>. HTML ini generated; jangan diedit manual.</p></section>`
            : "");
        if (!diagrams.length)
          body +=
            '<section><p class="empty">Belum ada diagram. Tambahkan blok mermaid ke Markdown sumber.</p></section>';
        for (const [i, dia] of diagrams.entries()) {
          const source = dia.source || "";
          body +=
            `<section><h2>${esc(dia.title || `Diagram ${i + 1}`)}</h2>` +
            `<pre class="mermaid">${esc(source)}</pre>` +
            `<details><summary>Sumber Mermaid</summary><pre>${esc(source)}</pre></details>` +
            `</section>`;
        }
        return body;
      }
      default:
        return `<header class="site"><h1>${esc(type)}</h1></header><section><pre>${esc(JSON.stringify(d, null, 2))}</pre></section>`;
    }
  }

  // ---------------------------------------------------------------------------
  // Perintah
  // ---------------------------------------------------------------------------

  function parseArgs(argv) {
    const args = argv.slice(2);
    const flag = (name) => {
      const i = args.indexOf(name);
      return i >= 0 ? args[i + 1] : undefined;
    };
    const pos = args.filter(
      (a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--")),
    );
    return { args, cmd: pos[0], pos, flag };
  }

  function cmdRender(pos, flag) {
    const type = pos[1];
    if (!type || !(type in TYPES))
      die(
        `tipe render tidak dikenal: ${type || "(kosong)"}\nTipe: ${Object.keys(TYPES).join(", ")}`,
        2,
      );
    const from = flag("--from");
    if (from && type !== "diagram") die("--from hanya untuk tipe diagram", 2);

    let out = flag("--out");
    let data;
    if (from) {
      const mdPath = path.resolve(from);
      let md;
      try {
        md = fs.readFileSync(mdPath, "utf8");
      } catch (e) {
        die(`tidak bisa membaca ${from}: ${e.message}`);
      }
      const diagrams = [...md.matchAll(/```mermaid\s*\n([\s\S]*?)```/g)].map(
        (m, i) => ({
          title: `Diagram ${i + 1}`,
          source: m[1].trim(),
        }),
      );
      if (!diagrams.length) die(`tidak ada blok mermaid di ${from}`, 2);
      const base = path.basename(mdPath, path.extname(mdPath));
      data = { title: base, from: rel(mdPath), diagrams };
      if (!out) out = path.join(BASE, "figr", "diagrams", base + ".html");
    } else {
      let raw;
      const inFile = flag("--in");
      try {
        raw = inFile
          ? fs.readFileSync(inFile, "utf8")
          : fs.readFileSync(0, "utf8");
      } catch (e) {
        die(`tidak bisa membaca JSON input: ${e.message}`);
      }
      if (!raw.trim())
        die(
          "input JSON kosong (kirim lewat stdin atau --in <file>, atau pakai --from untuk diagram)",
          2,
        );
      try {
        data = JSON.parse(raw);
      } catch (e) {
        die(`JSON tidak valid: ${e.message}`);
      }
    }
    if (!out && TYPES[type]) out = path.join(BASE, TYPES[type]);
    if (!out) die(`tipe "${type}" butuh --out <file>`, 2);
    const html = page(type, data, renderBody(type, data));
    writeFileMk(path.resolve(out), html);
    console.log(`render ${type} -> ${rel(path.resolve(out))}`);
  }

  function readEmbedded(file) {
    const html = fs.readFileSync(file, "utf8");
    const m = html.match(
      /<script[^>]*id="pawang-data"[^>]*>([\s\S]*?)<\/script>/,
    );
    if (!m) throw new Error("data pawang tidak ditemukan di file ini");
    return JSON.parse(m[1]);
  }

  function cmdExtract(pos) {
    const file = pos[1];
    if (!file) die("pemakaian: node .pawang/kit.js extract <file.html>", 2);
    try {
      console.log(JSON.stringify(readEmbedded(path.resolve(file)), null, 2));
    } catch (e) {
      die(e.message);
    }
  }

  function contextPath(name) {
    return path.join(BASE, "context", name + ".html");
  }

  function tryEmbedded(file) {
    try {
      if (!fs.existsSync(file)) return { missing: true };
      return { data: readEmbedded(file) };
    } catch (e) {
      return { broken: e.message };
    }
  }

  function cmdStatus() {
    const lines = [];
    let config = null;
    try {
      config = readJson(path.join(BASE, "config.json"));
    } catch {}
    if (config && config.git) {
      lines.push(
        `Config   : landing ${config.git.landing} · branch ${config.git.featureBranchPrefix}${config.git.fixBranchPrefix}${config.git.rollbackBranchPrefix} · review ${config.review && config.review.independentExecution} · maxRepairAttempts ${config.autonomous && config.autonomous.maxRepairAttempts}`,
      );
    } else {
      lines.push(
        "Config   : tidak ada / rusak - jalankan kit.js check lalu doctor",
      );
    }

    const th = loadTheme();
    const srcs =
      th.meta && Array.isArray(th.meta.sources) && th.meta.sources.length
        ? th.meta.sources.map((s) => s.path).join(", ")
        : "tema bawaan";
    lines.push(
      `Tema     : ${srcs}${th.meta && th.meta.detectedAt ? " (dideteksi " + th.meta.detectedAt.slice(0, 10) + ")" : ""}`,
    );

    const cf = tryEmbedded(contextPath("current-feature"));
    if (cf.missing || (cf.data && cf.data.status === "none")) {
      lines.push("Fokus    : (kosong) - belum ada pekerjaan aktif");
    } else if (cf.broken) {
      lines.push(`Fokus    : RUSAK (${cf.broken}) - jalankan kit.js check`);
    } else {
      const d = cf.data;
      const steps = Array.isArray(d.steps) ? d.steps : [];
      const done = steps.filter((s) => s.done).length;
      lines.push(
        `Fokus    : [${d.type || "feature"}] ${d.title || "(tanpa judul)"} · status ${d.status || "?"}${steps.length ? ` · step ${done}/${steps.length}` : ""}`,
      );
      if (d.branch) lines.push(`           branch ${d.branch}`);
      if (Array.isArray(d.openQuestions) && d.openQuestions.length)
        lines.push(
          `           ${d.openQuestions.length} pertanyaan terbuka - selesaikan sebelum review`,
        );
    }

    const fnd = tryEmbedded(contextPath("findings"));
    if (fnd.data) {
      const items = Array.isArray(fnd.data.items) ? fnd.data.items : [];
      const by = (st) => items.filter((f) => f.status === st).length;
      const blockers = items.filter(
        (f) =>
          (f.severity === "P0" || f.severity === "P1") &&
          (f.status === "open" || f.status === "fixed"),
      );
      lines.push(
        `Findings : ${items.length} total (open ${by("open")} · fixed ${by("fixed")} · closed ${by("closed")} · accepted ${by("accepted")} · unverified ${by("unverified")} · invalid ${by("invalid")})` +
          (blockers.length
            ? ` · BLOKIR: ${blockers.map((b) => b.id + " [" + b.severity + "] " + b.status).join(", ")}`
            : ""),
      );
    } else if (fnd.broken) {
      lines.push(`Findings : RUSAK (${fnd.broken})`);
    }

    const rev = tryEmbedded(contextPath("review"));
    if (rev.data)
      lines.push(
        `Review   : ${rev.data.state || "none"}${rev.data.verdict ? " · " + rev.data.verdict : ""}`,
      );
    else if (rev.broken) lines.push(`Review   : RUSAK (${rev.broken})`);

    const ho = tryEmbedded(contextPath("handoff"));
    lines.push(
      `Handoff  : ${ho.data ? "ada (diperbarui " + (ho.data.updatedAt || "?") + ")" : "belum ada"}`,
    );

    const bp = tryEmbedded(contextPath("build-plan"));
    if (bp.data) {
      const items = Array.isArray(bp.data.items) ? bp.data.items : [];
      const next = items.find((i) => !i.done);
      lines.push(
        `Build    : ${items.filter((i) => i.done).length}/${items.length} selesai${next ? ` · berikutnya #${next.id} ${next.text}` : ""}`,
      );
    } else if (bp.broken) {
      lines.push(`Build    : RUSAK (${bp.broken})`);
    }

    const counts = {};
    for (const k of ["features", "fixes", "rollbacks"]) {
      const dir = path.join(BASE, "history", k);
      counts[k] = fs.existsSync(dir)
        ? fs.readdirSync(dir).filter((f) => f.endsWith(".html")).length
        : 0;
    }
    lines.push(
      `History  : fitur ${counts.features} · fix ${counts.fixes} · rollback ${counts.rollbacks}`,
    );

    console.log("pawang status");
    console.log(lines.join("\n"));
  }

  function cmdCheck() {
    const errors = [];
    const warns = [];
    const E = (m) => errors.push(m);
    const W = (m) => warns.push(m);

    const cfgFile = path.join(BASE, "config.json");
    if (!fs.existsSync(cfgFile))
      E("config.json tidak ada - jalankan kit.js init");
    else {
      try {
        const c = readJson(cfgFile);
        if (c.schemaVersion !== 1)
          E(`config.json: schemaVersion harus 1 (ada ${c.schemaVersion})`);
        if (c.git && !["local-merge", "pull-request"].includes(c.git.landing))
          W(
            `config.json: git.landing "${c.git.landing}" tidak dikenal (local-merge|pull-request)`,
          );
      } catch (e) {
        E(`config.json: JSON tidak valid (${e.message})`);
      }
    }

    const thFile = path.join(BASE, "theme.json");
    if (!fs.existsSync(thFile))
      W(
        "theme.json belum ada - kit.js memakai tema bawaan; jalankan theme --refresh untuk mendeteksi",
      );
    else {
      try {
        const t = readJson(thFile);
        if (t.schemaVersion !== 1) E("theme.json: schemaVersion harus 1");
        for (const s of t.sources || [])
          if (!fs.existsSync(path.join(ROOT, s.path)))
            W(`theme.json: sumber tema hilang: ${s.path}`);
      } catch (e) {
        E(`theme.json: JSON tidak valid (${e.message})`);
      }
    }

    const checks = {
      "current-feature": (d) => {
        if (d.status === "none") return;
        if (!FEATURE_STATUSES.includes(d.status))
          E(
            `current-feature: status "${d.status}" tidak valid (${FEATURE_STATUSES.join("|")})`,
          );
        if (!["feature", "fix", "rollback"].includes(d.type))
          E(
            `current-feature: type "${d.type}" tidak valid (feature|fix|rollback)`,
          );
        if (d.type === "rollback") {
          const r = d.rollback || {};
          if (!r.targetArchive)
            E("current-feature rollback: rollback.targetArchive wajib");
          if (!r.targetCommit)
            E("current-feature rollback: rollback.targetCommit wajib");
          if (!r.targetParent)
            E("current-feature rollback: rollback.targetParent wajib");
          if (!r.reason) E("current-feature rollback: rollback.reason wajib");
          if (!d.origin || !d.origin.buildPlanId)
            E("current-feature rollback: origin.buildPlanId wajib");
        }
        if (!d.title) E("current-feature: title wajib");
        if (Array.isArray(d.steps))
          for (const [i, s] of d.steps.entries())
            if (!s.text) E(`current-feature: steps[${i}] tanpa text`);
      },
      findings: (d) => {
        if (!Array.isArray(d.items)) return E("findings: items harus array");
        const seen = new Set();
        for (const f of d.items) {
          if (seen.has(f.id)) E(`findings: ID ganda ${f.id}`);
          seen.add(f.id);
          if (!FINDING_SEVERITIES.includes(f.severity))
            E(`findings ${f.id}: severity "${f.severity}" tidak valid`);
          if (!FINDING_STATUSES.includes(f.status))
            E(`findings ${f.id}: status "${f.status}" tidak valid`);
          if (!f.title) W(`findings ${f.id}: tanpa judul`);
        }
      },
      review: (d) => {
        if (!REVIEW_STATES.includes(d.state))
          E(
            `review: state "${d.state}" tidak valid (${REVIEW_STATES.join("|")})`,
          );
      },
      "build-plan": (d) => {
        if (!Array.isArray(d.items)) E("build-plan: items harus array");
        else
          for (const [i, it] of d.items.entries()) {
            if (!it.id) E(`build-plan: items[${i}] tanpa id`);
            if (!it.text) E(`build-plan: items[${i}] tanpa text`);
          }
      },
      "coding-standards": (d) => {
        if (!Array.isArray(d.sections))
          E("coding-standards: sections harus array");
      },
      "project-overview": (d) => {
        if (!d.summary) W("project-overview: summary masih kosong");
      },
      handoff: (d) => {
        if (!d.updatedAt) W("handoff: updatedAt kosong");
      },
    };

    for (const [name, validate] of Object.entries(checks)) {
      const file = contextPath(name);
      const r = tryEmbedded(file);
      if (r.missing) {
        if (name !== "handoff")
          W(`${name}.html belum ada - jalankan kit.js init`);
        continue;
      }
      if (r.broken) {
        E(`${name}.html: data tidak terbaca (${r.broken})`);
        continue;
      }
      try {
        validate(r.data);
      } catch (e) {
        E(`${name}.html: validasi gagal (${e.message})`);
      }
    }

    const histDir = path.join(BASE, "history");
    for (const kind of ["features", "fixes", "rollbacks"]) {
      const dir = path.join(histDir, kind);
      if (!fs.existsSync(dir)) {
        W(`history/${kind}/ belum ada`);
        continue;
      }
      for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".html"))) {
        const r = tryEmbedded(path.join(dir, f));
        if (r.broken)
          E(`history/${kind}/${f}: data tidak terbaca (${r.broken})`);
        else if (!r.data.completedAt)
          W(`history/${kind}/${f}: completedAt kosong`);
      }
    }

    const refGitignore = path.join(BASE, "reference", ".gitignore");
    if (!fs.existsSync(refGitignore))
      W(
        "reference/.gitignore tidak ada - file rujukan mentah bisa ikut ter-commit",
      );
    else {
      const g = fs.readFileSync(refGitignore, "utf8");
      if (!g.includes("!spesifikasi.html"))
        W(
          "reference/.gitignore: hasil sintetis (spesifikasi.html) tidak di-allow",
        );
    }

    const fnd = tryEmbedded(contextPath("findings"));
    if (fnd.data && Array.isArray(fnd.data.items)) {
      const blockers = fnd.data.items.filter(
        (f) =>
          (f.severity === "P0" || f.severity === "P1") &&
          (f.status === "open" || f.status === "fixed"),
      );
      if (blockers.length)
        console.log(
          `info: ${blockers.length} findings P0/P1 memblokir complete (${blockers.map((b) => b.id).join(", ")})`,
        );
    }

    for (const w of warns) console.log("WARN  " + w);
    for (const e of errors) console.log("ERROR " + e);
    if (errors.length) {
      console.log(
        `check: ${errors.length} masalah, ${warns.length} peringatan`,
      );
      process.exit(1);
    }
    console.log(
      `check: OK${warns.length ? ` (${warns.length} peringatan)` : ""}`,
    );
  }

  function cmdTheme(argv) {
    const mode = ["--refresh", "--default", "--check"].find((f) =>
      argv.includes(f),
    );
    const thFile = path.join(BASE, "theme.json");
    if (mode === "--refresh" || mode === "--default") {
      const t =
        mode === "--refresh"
          ? detectTheme()
          : {
              schemaVersion: 1,
              detectedAt: nowIso(),
              origin: "default",
              sources: [],
              slots: { ...DEFAULT_THEME.slots },
              passthrough: {},
            };
      writeFileMk(thFile, JSON.stringify(t, null, 2) + "\n");
    } else if (mode === "--check") {
      let t;
      try {
        t = readJson(thFile);
      } catch {
        console.log(
          "theme --check: theme.json tidak ada/rusak - jalankan theme --refresh",
        );
        process.exit(1);
      }
      let drift = false;
      for (const s of t.sources || []) {
        const abs = path.join(ROOT, s.path);
        if (!fs.existsSync(abs)) {
          console.log(`DRIFT ${s.path}: hilang`);
          drift = true;
          continue;
        }
        const h = sha256(fs.readFileSync(abs));
        if (h !== s.sha256) {
          console.log(`DRIFT ${s.path}: isi berubah`);
          drift = true;
        }
      }
      if (drift) {
        console.log(
          "theme --check: token project berubah - jalankan theme --refresh",
        );
        process.exit(1);
      }
      console.log("theme --check: OK (tidak ada drift)");
      return;
    } else if (mode !== undefined) {
      die("pemakaian: theme [--refresh|--default|--check]", 2);
    }

    const t = fs.existsSync(thFile)
      ? readJson(thFile)
      : {
          origin: "default (belum ada theme.json)",
          detectedAt: "-",
          sources: [],
          slots: DEFAULT_THEME.slots,
          passthrough: {},
        };
    console.log(`theme: origin=${t.origin} dideteksi=${t.detectedAt}`);
    for (const s of t.sources || [])
      console.log(`  sumber: ${s.path} (${s.sha256.slice(0, 12)}...)`);
    console.log("  slot:");
    for (const [k, v] of Object.entries(t.slots || {}))
      console.log(`    ${k} = ${v}`);
    console.log(
      `  passthrough: ${Object.keys(t.passthrough || {}).length} token`,
    );
  }

  const STUBS = {
    "current-feature": {
      type: "feature",
      title: "(belum ada pekerjaan)",
      status: "none",
      goal: "Belum ada pekerjaan aktif. Mulai dengan alur feature (dari build-plan), fix, atau rollback.",
    },
    findings: { items: [] },
    review: { state: "none" },
    "build-plan": { items: [] },
    "project-overview": {
      summary:
        "(belum diisi) - susun lewat adopsi proyek atau kit.js render project-overview.",
    },
    "coding-standards": { sections: [] },
  };

  const REFERENCE_GITIGNORE = `# File rujukan mentah bisa memuat data pribadi: jangan di-commit.
# Yang ikut git hanya hasil sintetis: spesifikasi.html, reference.anon.*, logo.*
*
!*/
!.gitignore
!README.html
!spesifikasi.html
!reference.anon.*
!logo.*
`;

  function cmdInit() {
    const made = [];
    const skip = [];
    const mk = (p) => {
      if (fs.existsSync(p)) {
        skip.push(rel(p));
        return false;
      }
      fs.mkdirSync(p, { recursive: true });
      made.push(rel(p) + "/");
      return true;
    };

    mk(path.join(BASE, "context"));
    mk(path.join(BASE, "reference"));
    mk(path.join(BASE, "history", "features"));
    mk(path.join(BASE, "history", "fixes"));
    mk(path.join(BASE, "history", "rollbacks"));

    const cfgFile = path.join(BASE, "config.json");
    if (!fs.existsSync(cfgFile)) {
      writeFileMk(
        cfgFile,
        JSON.stringify(
          {
            schemaVersion: 1,
            git: {
              landing: "local-merge",
              featureBranchPrefix: "feature/",
              fixBranchPrefix: "fix/",
              rollbackBranchPrefix: "rollback/",
            },
            review: { independentExecution: "automatic" },
            autonomous: { maxRepairAttempts: 2 },
          },
          null,
          2,
        ) + "\n",
      );
      made.push("config.json");
    } else skip.push("config.json");

    const giFile = path.join(BASE, "reference", ".gitignore");
    if (!fs.existsSync(giFile)) {
      writeFileMk(giFile, REFERENCE_GITIGNORE);
      made.push("reference/.gitignore");
    } else skip.push("reference/.gitignore");

    const stubsMade = [];
    for (const [type, data] of Object.entries(STUBS)) {
      const file = contextPath(type);
      if (fs.existsSync(file)) {
        skip.push(rel(file));
        continue;
      }
      writeFileMk(file, page(type, data, renderBody(type, data)));
      stubsMade.push(type);
    }
    if (stubsMade.length) made.push(`stub: ${stubsMade.join(", ")}`);

    const thFile = path.join(BASE, "theme.json");
    if (!fs.existsSync(thFile)) {
      const t = detectTheme();
      writeFileMk(thFile, JSON.stringify(t, null, 2) + "\n");
      made.push("theme.json");
      const src = t.sources.length
        ? t.sources.map((s) => s.path).join(", ")
        : "tema bawaan (scaffold baru)";
      console.log(`Tema: ${src}`);
    } else {
      skip.push("theme.json");
    }

    console.log("pawang init");
    if (made.length) console.log("Dibuat  : " + made.join(" · "));
    if (skip.length) console.log("Dilewati: " + skip.join(" · "));
    console.log(
      "Lanjut  : isi build-plan & project-overview, lalu mulai fitur (lihat references/feature.md).",
    );
  }

  // ---------------------------------------------------------------------------
  // Selftest
  // ---------------------------------------------------------------------------

  const SELFTEST_SAMPLES = {
    "current-feature": {
      type: "feature",
      title: 'Export </script> laporan "khusus"',
      status: "in-progress",
      branch: "feature/export-laporan",
      origin: { buildPlanId: "3", attempt: 2 },
      goal: "Menambah export CSV.",
      inScope: ["Endpoint baru"],
      outOfScope: ["UI"],
      steps: [
        { text: "Endpoint GET /x.csv", doneWhen: "curl 200", done: true },
        { text: "Uji", doneWhen: "lulus", done: false },
      ],
      files: ["src/x.ts"],
      contracts: ["CSV kolom a,b"],
      testing: ["baris kosong"],
      references: {
        documents: [
          {
            jenis: "invoice",
            spec: ".pawang/reference/invoice/spesifikasi.html",
            verify: "compare-text",
          },
        ],
        design: ["prototypes/a.html"],
      },
      notes: ["ikuti pola lama"],
      openQuestions: [],
    },
    findings: {
      items: [
        {
          id: "F-01",
          severity: "P0",
          status: "open",
          title: "SQL injection",
          file: "x.ts:1",
          why: "input mentah",
          fix: "parameterisasi",
        },
      ],
    },
    review: {
      state: "passed",
      targetCommit: "abc",
      verdict: "lulus",
      commands: ["npm test"],
      evidence: ["log"],
      findings: [],
      remainingRisk: ["render besar"],
    },
    handoff: {
      updatedAt: "2026-10-16T20:00:00+07:00",
      goal: "Hasil akhir",
      done: ["a"],
      state: "step 2/4",
      next: ["b"],
      decisions: ["pakai CSV"],
      openIssues: [],
    },
    "build-plan": {
      items: [
        { id: "1", text: "Feature satu", done: true },
        { id: "2", text: "Feature dua", done: false },
      ],
    },
    "project-overview": {
      summary: "Aplikasi X",
      problem: "P",
      users: "U",
      stack: ["Next.js"],
      data: ["users"],
      ui: "sederhana",
      deployment: "Vercel",
      constraints: "-",
    },
    "coding-standards": {
      sections: [{ title: "TypeScript", rules: ["strict"] }],
    },
    "history-feature": {
      type: "feature",
      title: "Lama selesai",
      status: "completed",
      completedAt: "2026-10-01T00:00:00Z",
      findings: [],
      steps: [],
    },
    "history-fix": {
      type: "fix",
      title: "Fix lama",
      status: "completed",
      completedAt: "2026-10-01T00:00:00Z",
      steps: [],
    },
    "history-rollback": {
      type: "rollback",
      title: "Rollback lama",
      status: "completed",
      completedAt: "2026-10-01T00:00:00Z",
      rollback: {
        targetArchive: "01-x.html",
        targetCommit: "abc",
        targetParent: "def",
        reason: "rusak",
      },
      steps: [],
    },
    "document-spec": {
      jenis: "invoice",
      status: "dikonfirmasi",
      sumber: "2 sampel",
      pemilik: "PT X",
      sections: [{ title: "1. Halaman", lines: ["A4"] }],
    },
    diagram: {
      title: "Contoh diagram",
      from: ".pawang/figr/02-user-flows.md",
      diagrams: [
        { title: "Alur", source: "flowchart TD\n  A[Login] --> B[Dashboard]" },
      ],
    },
  };

  function cmdSelftest() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pawang-selftest-"));
    let fail = 0;
    for (const [type, data] of Object.entries(SELFTEST_SAMPLES)) {
      const file = path.join(dir, type + ".html");
      try {
        writeFileMk(file, page(type, data, renderBody(type, data)));
        const back = readEmbedded(file);
        if (JSON.stringify(norm(back)) !== JSON.stringify(norm(data))) {
          console.log(`GAGAL ${type}: round-trip tidak sama`);
          fail++;
        }
        const html = fs.readFileSync(file, "utf8");
        if (!html.includes("</html>") || !html.includes("--p-bg")) {
          console.log(`GAGAL ${type}: HTML tidak lengkap`);
          fail++;
        }
        if (
          type === "diagram" &&
          (!html.includes('class="mermaid"') || !html.includes("mermaid@11"))
        ) {
          console.log(`GAGAL ${type}: viewer Mermaid tidak lengkap`);
          fail++;
        }
      } catch (e) {
        console.log(`GAGAL ${type}: ${e.message}`);
        fail++;
      }
    }
    try {
      const defaultTheme = {
        slots: { ...DEFAULT_THEME.slots },
        passthrough: {},
      };
      const block = cssThemeBlock(defaultTheme);
      if (!block.includes("--p-accent:"))
        throw new Error("blok tema tidak lengkap");
    } catch (e) {
      console.log(`GAGAL tema: ${e.message}`);
      fail++;
    }
    fs.rmSync(dir, { recursive: true, force: true });
    if (fail) {
      console.log(`selftest: ${fail} gagal`);
      process.exit(1);
    }
    console.log(
      `selftest: OK (${Object.keys(SELFTEST_SAMPLES).length} tipe round-trip + tema)`,
    );
  }

  // ---------------------------------------------------------------------------
  // Main
  // ---------------------------------------------------------------------------

  const { args, cmd, pos, flag } = parseArgs(process.argv);

  switch (cmd) {
    case "init":
      cmdInit();
      break;
    case "render":
      cmdRender(pos, flag);
      break;
    case "extract":
      cmdExtract(pos);
      break;
    case "status":
      cmdStatus();
      break;
    case "check":
      cmdCheck();
      break;
    case "theme":
      cmdTheme(args);
      break;
    case "selftest":
      cmdSelftest();
      break;
    default:
      console.log(`pawang kit.js - generator & pembaca file .pawang

Pemakaian:
  node .pawang/kit.js init                            scaffold .pawang/
  node .pawang/kit.js render <tipe> [--out file] [--in file]
  node .pawang/kit.js extract <file.html>
  node .pawang/kit.js status
  node .pawang/kit.js check
  node .pawang/kit.js theme [--refresh|--default|--check]
  node .pawang/kit.js selftest

Tipe render: ${Object.keys(TYPES).join(", ")}`);
      if (cmd) process.exit(2);
  }
})().catch((e) => {
  console.error("GAGAL: " + (e && e.stack ? e.stack : e));
  process.exit(1);
});
