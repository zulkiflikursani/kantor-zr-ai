/*
 * Generator folder tim & proyek ZR Corp AI.
 * Sumber data: blok JSON <script type="application/json" id="zr-data"> di
 * kantor-lama/index.html (kantor lama yang kini diarsipkan; satu sumber kebenaran
 * untuk halaman arsip dan folder tim).
 * Output: teams/README.md, teams/<tim>/README.md, teams/<tim>/projects/<proyek>/project.md
 * Jalankan: node tools/gen-folders.cjs
 */
const fs = require("fs");
const path = require("path");
const LEGACY_HTML = path.join(__dirname, "..", "kantor-lama", "index.html");
const html = fs.readFileSync(LEGACY_HTML, "utf8");
const m = html.match(/<script type="application\/json" id="zr-data">([\s\S]*?)<\/script>/);
if (!m) { console.error("ERROR: blok data zr-data tidak ditemukan di kantor-lama/index.html"); process.exit(1); }
const DATA = JSON.parse(m[1]);

const ROOT = path.join(__dirname, "..", "teams");
const BLOCK_ICON = {
  resepsionis: "📍", keuangan: "💰", it: "💻", riset: "🔬", designer: "🎨",
  marketing: "📈", manager: "👔", direktur: "👑", ut: "🎓", pnup: "🏛️",
};

function statusOf(pct) {
  if (pct >= 100) return "Selesai";
  if (pct >= 70) return "Review";
  if (pct > 0) return "Berjalan";
  return "Perencanaan";
}

const pct = (p) => Math.round((p.tasks.filter((t) => t[1]).length / p.tasks.length) * 100);
const done = (p) => p.tasks.filter((t) => t[1]).length;

let created = 0;
fs.mkdirSync(ROOT, { recursive: true });

/* teams/README.md */
const totalTasks = DATA.projects.reduce((s, p) => s + p.tasks.length, 0);
const doneTasks = DATA.projects.reduce((s, p) => s + done(p), 0);
const overview = `# 🏢 ZR Corp AI — Folder Tim & Proyek

Struktur folder kerja kantor AI. Setiap tim punya folder sendiri di \`teams/<tim>/\`
dengan subfolder proyek \`projects/<proyek>/\` berisi \`project.md\` (deskripsi + checklist task).

- Tim: ${Object.keys(DATA.teams).length}
- Proyek: ${DATA.projects.length}
- Task: ${doneTasks}/${totalTasks} selesai (${Math.round((doneTasks / totalTasks) * 100)}%)
- Sumber data: blok JSON \`zr-data\` di \`kantor-lama/index.html\` (arsip kantor lama)
- Regenerasi: \`node tools/gen-folders.cjs\`

## Daftar Tim

| Tim | Folder | Proyek | Progres |
| --- | ------ | ------ | ------- |
${Object.keys(DATA.teams)
  .map((tid) => {
    const ps = DATA.projects.filter((p) => p.team === tid);
    const avg = ps.length ? Math.round(ps.reduce((s, p) => s + pct(p), 0) / ps.length) : 0;
    return `| ${DATA.teams[tid].name} | \`teams/${tid}/\` | ${ps.length} | ${avg}% |`;
  })
  .join("\n")}
`;
fs.writeFileSync(path.join(ROOT, "README.md"), overview);
created++;

/* per tim */
for (const tid of Object.keys(DATA.teams)) {
  const teamDir = path.join(ROOT, tid);
  const projRoot = path.join(teamDir, "projects");
  fs.mkdirSync(projRoot, { recursive: true });

  const team = DATA.teams[tid];
  const projs = DATA.projects.filter((p) => p.team === tid);
  const avg = projs.length ? Math.round(projs.reduce((s, p) => s + pct(p), 0) / projs.length) : 0;
  const icon = BLOCK_ICON[tid] || "📁";

  const readme = `# ${icon} ${team.name}

Folder tim **${team.name}** — ZR Corp AI.

- Folder: \`teams/${tid}/\`
- Jumlah proyek: ${projs.length}
- Progres rata-rata: ${avg}%
- Terhubung dengan blok **${team.name}** di denah kantor arsip (\`kantor-lama/index.html\`)

## Folder Proyek

${projs.map((p) => `- 📁 \`projects/${p.slug}/\` — ${p.name} (${statusOf(pct(p))}, ${pct(p)}%)`).join("\n")}
`;
  fs.writeFileSync(path.join(teamDir, "README.md"), readme);
  created++;

  /* per proyek */
  for (const p of projs) {
    const projDir = path.join(projRoot, p.slug);
    fs.mkdirSync(projDir, { recursive: true });
    const pPct = pct(p);
    const md = `# 📁 ${p.name}

- **Tim:** ${team.name} (\`${tid}\`)
- **Lead:** ${p.lead}
- **Deadline:** ${p.deadline}
- **Status:** ${statusOf(pPct)} — ${done(p)}/${p.tasks.length} task (${pPct}%)

## Deskripsi

${p.desc}

## Checklist Task

${p.tasks.map((t) => `- [${t[1] ? "x" : " "}] ${t[0]}`).join("\n")}

---
Dibuat otomatis oleh \`tools/gen-folders.cjs\` dari blok \`zr-data\` di \`kantor-lama/index.html\`.
Status & checklist di web (tab Folder & Progres) disinkronkan lewat sumber data yang sama.
`;
    fs.writeFileSync(path.join(projDir, "project.md"), md);
    created++;
  }
}

console.log(`OK: ${created} file dibuat di teams/ (${Object.keys(DATA.teams).length} tim, ${DATA.projects.length} proyek).`);
