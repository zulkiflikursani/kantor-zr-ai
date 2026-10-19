/*
 * ZR ENGINE — GERBANG KUALITAS (engine/qa.cjs)
 * Deterministik, tanpa LLM. Tujuannya menolak output yang tidak layak dijual:
 * placeholder, bagian kosong, keputusan tidak ada, atau hasil salin-tempel.
 */
const crypto = require("crypto");

const REQUIRED_SECTIONS = [
  "Ringkasan Eksekutif",
  "Analisis",
  "Keputusan",
  "Rencana Eksekusi",
  "Risiko & Mitigasi",
  "Metrik Keberhasilan",
  "Pertanyaan Terbuka",
  "Asumsi & Sumber",
];

const PLACEHOLDER = /\b(TODO|TBD|FIXME|XXX|lorem ipsum|isi di sini|placeholder|contoh saja)\b/i;
const META_EXCUSE = /\b(sebagai (sebuah )?(ai|model bahasa)|saya tidak bisa|maaf, saya)\b/i;

function hasSection(body, name) {
  const re = new RegExp("^#{2,3}\\s*" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "im");
  return re.test(body);
}

function evaluateArtifact({ task, persona, artifact }) {
  const issues = [];
  const body = String((artifact && artifact.body) || "");
  const add = (code, message, severity = "blocking") => issues.push({ code, message, severity });

  if (body.length < 500) add("body-too-short", `isi ${body.length} karakter; minimum 500`);
  if (PLACEHOLDER.test(body)) add("placeholder", "mengandung TODO/TBD/placeholder");
  if (META_EXCUSE.test(body)) add("meta-excuse", "menjawab sebagai AI, bukan sebagai ahli");

  const missing = REQUIRED_SECTIONS.filter((s) => !hasSection(body, s));
  if (missing.length > 2) add("sections-missing", `bagian wajib hilang: ${missing.join(", ")}`);

  if (!Array.isArray(artifact.decisions) || artifact.decisions.length < 2) add("no-decisions", "kurang dari 2 keputusan eksplisit");
  if (!Array.isArray(artifact.risks) || artifact.risks.length < 1) add("no-risks", "tidak ada risiko yang disebut");
  if (!Array.isArray(artifact.openQuestions) || artifact.openQuestions.length < 1) add("no-questions", "tidak ada pertanyaan terbuka");
  if (String(artifact.summary || "").length < 40) add("weak-summary", "ringkasan terlalu pendek");

  // Keahlian persona harus terlihat dipakai (warning, bukan blokir).
  const skills = (persona && persona.skills) || [];
  if (skills.length) {
    const lower = body.toLowerCase();
    const used = skills.filter((s) => {
      const key = String(s).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 4).slice(0, 2).join(" ");
      return key && lower.includes(key);
    });
    if (!used.length) add("skills-unused", `tidak menyebut satu pun kompetensi: ${skills.slice(0, 4).join(", ")}`, "warning");
  }

  // Tugas harus punya bukti penerimaan.
  const acceptance = (task && task.acceptance) || [];
  if (acceptance.length) {
    const lower = body.toLowerCase();
    const hit = acceptance.filter((a) => {
      const words = String(a).toLowerCase().split(/\W+/).filter((w) => w.length > 5).slice(0, 3);
      return words.some((w) => lower.includes(w));
    });
    if (!hit.length) add("acceptance-unaddressed", "kriteria penerimaan tugas tidak tercermin di isi", "warning");
  }

  return { pass: !issues.some((i) => i.severity === "blocking"), issues };
}

function evaluateRun({ artifacts, reviews, plan, mocked }) {
  const issues = [];
  const blocking = [];
  const warnings = [];

  for (const a of artifacts) {
    const qa = a.qa || { pass: true, issues: [] };
    for (const i of qa.issues) (i.severity === "blocking" ? blocking : warnings).push({ taskId: a.taskId, ...i });
  }

  const tasks = (plan && plan.tasks) || [];
  if (tasks.length < 2) blocking.push({ code: "plan-thin", message: "rencana kurang dari 2 tugas" });
  const covered = new Set(artifacts.map((a) => a.taskId));
  for (const t of tasks) if (!covered.has(t.id)) blocking.push({ code: "task-missing", message: `tugas ${t.id} tidak menghasilkan artefak` });

  const hashes = new Map();
  for (const a of artifacts) {
    const h = crypto.createHash("sha1").update(String((a.artifact && a.artifact.body) || "").trim()).digest("hex");
    if (hashes.has(h)) blocking.push({ code: "duplicate-output", message: `artefak ${a.taskId} identik dengan ${hashes.get(h)}` });
    else hashes.set(h, a.taskId);
  }

  for (const r of reviews || []) {
    if (Number(r.score) < 3) blocking.push({ code: "review-low", message: `${r.taskId} skor review ${r.score}/5` });
    for (const b of r.blocking || []) blocking.push({ code: "review-blocking", message: `${r.taskId}: ${b}` });
  }

  if (mocked) warnings.push({ code: "mock-provider", message: "dijalankan dengan provider mock — bukan hasil model, tidak layak produksi" });

  return {
    pass: blocking.length === 0,
    degraded: Boolean(mocked),
    blocking,
    warnings,
    issues: [...blocking, ...warnings],
  };
}

module.exports = { evaluateArtifact, evaluateRun, REQUIRED_SECTIONS };
