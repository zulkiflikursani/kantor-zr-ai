/*
 * ZR ENGINE — PERSONA AHLI (engine/personas.cjs)
 *
 * Sumber kebenaran: struktur_organisasi_dan_tata_letak_kantor_ai.md.
 * Setiap blok di dokumen itu punya daftar jabatan + "Skills:" — daftar itulah
 * yang dahulu hanya jadi pajangan UI. Sekarang skill tersebut diparse dan
 * disuntikkan langsung ke system prompt agen, jadi "ahli" benar-benar bekerja
 * dengan kompetensinya, bukan template.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DOC_FILE = path.join(ROOT, "struktur_organisasi_dan_tata_letak_kantor_ai.md");

const SLUG_RULES = [
  ["resepsionis", /resepsionis/i],
  ["keuangan", /keuangan/i],
  ["it", /it[- ]?developer|tech/i],
  ["riset", /riset/i],
  ["designer", /designer/i],
  ["marketing", /marketing/i],
  ["manager", /manager/i],
  ["direktur", /direktur/i],
];

const FLOORS = {
  resepsionis: 1, keuangan: 1, it: 2, riset: 2, designer: 2,
  marketing: 3, manager: 3, direktur: 3,
};

/* Misi kerja (bukan deskripsi ruangan) — dipakai sebagai konteks agen. */
const MISSIONS = {
  resepsionis: "layanan tamu, reservasi, protokol kantor, dan pengalaman pelanggan",
  keuangan: "anggaran, cash flow, pajak, payroll, dan pelaporan finansial",
  it: "arsitektur sistem, pengembangan produk & AI, infrastruktur cloud, keamanan",
  riset: "riset pasar & AI, benchmark model, validasi data, tata kelola etis",
  designer: "brand identity, UI/UX, design system, aset visual & motion",
  marketing: "go-to-market, kampanye, akuisisi berbayar, funnel & komunikasi brand",
  manager: "koordinasi lintas tim, KPI/OKR, perencanaan sprint, manajemen risiko",
  direktur: "visi strategis, keputusan investasi, kemitraan, tata kelola perusahaan",
};

/* Tim tambahan yang tidak ada di dokumen org (dipakai proyek nyata). */
const EXTRA = {
  ut: {
    name: "Blok Dosen UT",
    kind: "Academic / Tuton",
    mission: "tutorial online Universitas Terbuka: jadwal, materi, bimbingan, penilaian; otomasi Moodle via TutorBot",
    roles: [
      { title: "Koordinator Tuton & Dosen Pengampu", lead: true, skills: ["Online Tutorial Facilitation", "Assessment & Feedback", "Academic Scheduling", "Moodle Automation (TutorBot)"] },
      { title: "Dosen Pembimbing Tugas Akhir", lead: false, skills: ["Thesis Guidance", "Research Supervision", "Academic Writing Review"] },
      { title: "Asisten Penilaian & Rubrik", lead: false, skills: ["Rubric Scoring", "Feedback Writing", "Learning Analytics"] },
    ],
  },
  pnup: {
    name: "Blok Tim PNUP",
    kind: "Academic Support / PNUP",
    mission: "mendukung pekerjaan CEO sebagai dosen PNUP: jadwal kuliah, materi, absensi, koordinasi PKL",
    roles: [
      { title: "Koordinator Beban Mengajar", lead: true, skills: ["Lecturer Workload Coordination", "Curriculum Mapping", "Academic Administration"] },
      { title: "Pengembang Materi Kuliah", lead: false, skills: ["Lecture Material Development", "Instructional Design", "Handout Production"] },
      { title: "Koordinator PKL & Mitra Industri", lead: false, skills: ["PKL Coordination", "Industry Partnership", "Internship Evaluation"] },
    ],
  },
};

function splitSkills(s) {
  return String(s || "")
    .split(",")
    .map((x) => x.trim().replace(/\.$/, ""))
    .filter((x) => x.length > 1);
}

function cleanTitle(t) {
  return String(t || "")
    .replace(/^[\d.●•\-*]\s*/, "")
    .replace(/\s*:\s*Anda Sendiri\s*$/i, "")
    .replace(/\s*\((Ketua Tim|Lead Team)\)\s*$/i, "")
    .trim();
}

function slugFor(name) {
  const hit = SLUG_RULES.find(([, re]) => re.test(name));
  return hit ? hit[0] : null;
}

function parseOrgDoc(md) {
  const lines = String(md).split(/\r?\n/);
  const blocks = [];
  let cur = null;
  let mode = null;      // "desc" | "roles"
  let role = null;
  let skillBlock = false;

  for (const raw of lines) {
    const line = raw.trim();
    const heading = line.match(/^\d+\.\s+(.*Blok .+)$/);
    if (heading) {
      const title = heading[1].replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, "").trim();
      const nameMatch = title.match(/Blok\s+(.+?)(?:\s*\((.+)\))?$/);
      cur = {
        slug: slugFor(title),
        name: nameMatch ? "Blok " + nameMatch[1].trim() : title,
        kind: nameMatch && nameMatch[2] ? nameMatch[2] : "Operations",
        description: "",
        roles: [],
      };
      blocks.push(cur);
      mode = "desc";
      role = null;
      skillBlock = false;
      continue;
    }
    if (!cur) continue;
    if (/^\*{3,}$/.test(line)) { cur = null; role = null; mode = null; continue; }

    if (/^(Deskripsi Ruangan|Description)\s*:/i.test(line)) {
      cur.description = line.replace(/^[^:]+:\s*/, "").trim();
      mode = "desc";
      continue;
    }
    if (/(Tim & Matrix Skills|Posisi & Matrix Skills|Tim Pendukung Eksekutif)\s*:/i.test(line)) {
      mode = "roles";
      role = null;
      skillBlock = false;
      continue;
    }
    if (mode !== "roles") continue;
    if (!line) { skillBlock = false; continue; }

    const sk = line.match(/^Skills?\s*:\s*(.*)$/i);
    if (sk) {
      if (!role) { role = { title: "Anggota Tim", lead: false, skills: [] }; cur.roles.push(role); }
      const inline = splitSkills(sk[1]);
      if (inline.length) { role.skills.push(...inline); skillBlock = false; }
      else skillBlock = true;
      continue;
    }
    if (skillBlock) { role.skills.push(line); continue; }

    role = { title: cleanTitle(line), lead: /\(Ketua Tim\)/i.test(line), skills: [] };
    cur.roles.push(role);
    skillBlock = false;
  }

  const out = {};
  for (const b of blocks) {
    if (!b.slug || !b.roles.length) continue;
    for (const r of b.roles) r.skills = [...new Set(r.skills.map((s) => s.trim()).filter(Boolean))];
    out[b.slug] = b;
  }
  return out;
}

function buildPersonas() {
  let parsed = {};
  if (fs.existsSync(DOC_FILE)) parsed = parseOrgDoc(fs.readFileSync(DOC_FILE, "utf8"));

  const personas = { ...parsed };
  for (const [slug, x] of Object.entries(EXTRA)) {
    personas[slug] = { slug, name: x.name, kind: x.kind, description: x.mission, roles: x.roles };
  }

  for (const [slug, p] of Object.entries(personas)) {
    p.slug = slug;
    p.floor = FLOORS[slug] || 2;
    p.roles = (p.roles || []).filter((r) => r.title);
    if (!p.roles.length) p.roles = [{ title: "Spesialis " + slug, lead: true, skills: [] }];
    if (!p.roles.some((r) => r.lead)) p.roles[0].lead = true;
    p.leadRole = p.roles.find((r) => r.lead) || p.roles[0];
    p.mission = MISSIONS[slug] || p.description || "operasional tim " + slug;
    p.room = p.description || "";
    p.allSkills = [...new Set(p.roles.flatMap((r) => r.skills || []))];
  }
  return personas;
}

/* Ringkasan dokumen tim yang sudah ada — konteks nyata, bukan karangan. */
function projectDigest(root, slug, budget = 3500) {
  const base = path.join(root, "teams", slug, "projects");
  if (!fs.existsSync(base)) return "";
  const files = [];
  for (const proj of fs.readdirSync(base)) {
    const dir = path.join(base, proj);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!/\.(md|txt|csv)$/i.test(f)) continue;
      const full = path.join(dir, f);
      const st = fs.statSync(full);
      if (!st.isFile()) continue;
      files.push({ rel: `teams/${slug}/projects/${proj}/${f}`, mtime: st.mtimeMs, size: st.size });
    }
  }
  files.sort((a, b) => b.mtime - a.mtime);
  let out = "";
  for (const f of files.slice(0, 3)) {
    if (out.length > budget) break;
    const text = fs.readFileSync(path.join(root, f.rel), "utf8").replace(/\s+/g, " ").slice(0, 900);
    out += `\n### ${f.rel}\n${text}\n`;
  }
  return out.trim();
}

function personaPrompt(persona, role, opts = {}) {
  const r = role || persona.leadRole;
  const skills = (r.skills && r.skills.length ? r.skills : persona.allSkills).join(", ");
  return [
    `Anda adalah ${r.title} di ${persona.name} — ZR Corp AI (lantai ${persona.floor}).`,
    `Misi tim: ${persona.mission}.`,
    `Matriks kompetensi Anda (wajib dipakai, bukan sekadar label): ${skills || "operasional umum"}.`,
    `Cara kerja: ambil posisi sebagai ahli — sebut trade-off, angka/asumsi yang dipakai, dan keputusan yang Anda ambil.`,
    `Dilarang: basa-basi, placeholder, atau mengarang data tanpa menandainya sebagai asumsi.`,
    opts.extra || "",
  ].filter(Boolean).join("\n");
}

module.exports = { buildPersonas, parseOrgDoc, personaPrompt, projectDigest, cleanTitle, DOC_FILE };
