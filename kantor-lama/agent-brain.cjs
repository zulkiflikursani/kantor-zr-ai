/*
 * ZR CORP AI — OTAK AGEN (agent-brain.cjs)
 *
 * Dua mode otak:
 *   1. LLM sungguhan  : set env ZR_API_KEY (wajib) + opsional ZR_API_BASE & ZR_API_MODEL
 *                       (OpenAI-compatible: DeepSeek, OpenRouter, Gemini-compat, Mistral, dsb.)
 *   2. Simulasi lokal : tanpa key — rencana & jawaban disusun dari pola + data kantor.
 * Dipakai oleh server.cjs untuk endpoint /api/directive dan /api/chat.
 */
const fs = require("fs");
const path = require("path");

/* Data kantor dibaca dari blok JSON zr-data di index.html (satu sumber kebenaran). */
function loadOfficeData() {
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const m = html.match(/<script type="application\/json" id="zr-data">([\s\S]*?)<\/script>/);
  if (!m) throw new Error("blok zr-data tidak ditemukan di index.html");
  return JSON.parse(m[1]);
}

/* Pengetahuan ringkas per blok untuk otak simulasi & prompt LLM. */
const TEAMS_KB = {
  resepsionis: { label: "Blok Resepsionis", mission: "layanan tamu, reservasi, protokol kantor", skills: ["Hospitality Leadership", "Reservation Management", "Event Management"], steps: ["Audit kebutuhan layanan", "Susun SOP & alur kerja", "Uji coba & pelatihan staf"] },
  keuangan: { label: "Blok Keuangan", mission: "anggaran, cash flow, pajak, payroll, pelaporan finansial", skills: ["Financial Planning", "Budgeting & Forecasting", "Tax Compliance"], steps: ["Kumpulkan data & angka dasar", "Susun rencana/anggaran", "Review & laporan akhir"] },
  it: { label: "Blok IT-Developer", mission: "arsitektur, pengembangan AI, infrastruktur cloud, keamanan", skills: ["System Architecture", "LLM Fine-Tuning & RAG", "CI/CD & Cloud Security"], steps: ["Definisi kebutuhan teknis & desain", "Implementasi bertahap", "Testing, deploy & monitoring"] },
  riset: { label: "Blok Riset & Penelitian", mission: "riset AI, benchmark model, publikasi, tata kelola etis", skills: ["Research Methodology", "NLP & Computer Vision", "AI Governance & Ethics"], steps: ["Tinjauan pustaka & baseline", "Desain eksperimen & pengumpulan data", "Analisis & dokumentasi hasil"] },
  designer: { label: "Blok Designer", mission: "desain produk, brand, UI/UX, motion & visual", skills: ["Brand Identity & Art Direction", "UI/UX & Design Systems", "3D & Motion Graphics"], steps: ["Riset & moodboard visual", "Wireframe / desain high-fidelity", "Review & handoff aset"] },
  marketing: { label: "Blok Marketing", mission: "go-to-market, kampanye, SEO/performa, komunikasi brand", skills: ["Go-To-Market Strategy", "Performance Marketing", "Funnel Analytics"], steps: ["Riset pasar & kompetitor", "Susun kampanye & konten", "Eksekusi & ukur hasil"] },
  manager: { label: "Blok Manager", mission: "koordinasi lintas tim, KPI/OKR, proses agile", skills: ["KPI Management", "Project Management", "Agile Facilitation"], steps: ["Petakan risiko & sumber daya", "Susun rencana & jadwal", "Pantau KPI & evaluasi"] },
  direktur: { label: "Blok Direktur", mission: "visi strategis, investasi, kemitraan, budaya organisasi", skills: ["Strategic Visioning", "Capital & Investment Strategy", "Stakeholder Negotiation"], steps: ["Kaji strategi & opsi", "Putuskan arah & alokasi", "Eksekusi & tinjauan berkala"] },
  ut: { label: "Blok Dosen UT", mission: "tutor Universitas Terbuka: kelas tuton, bimbingan skripsi, penilaian mahasiswa — dengan TutorBot (agen otomasi elearning.ut.ac.id: skoring rubrik, balasan & rating forum, dashboard tutor)", skills: ["Online Tutorial Facilitation", "Moodle Automation (TutorBot)", "Thesis Guidance", "Assessment & Feedback"], steps: ["Susun bahan & jadwal / siapkan skor & draft forum via TutorBot", "Eksekusi sesi tutorial atau apply ke Moodle dengan verifikasi baca-ulang", "Penilaian, feedback & rekap hasil belajar"] },
  pnup: { label: "Blok Tim PNUP", mission: "membantu pekerjaan CEO sebagai dosen di PNUP: jadwal kuliah, materi, absensi, PKL", skills: ["Lecturer Workload Coordination", "Lecture Material Development", "PKL Coordination"], steps: ["Rekap jadwal & kebutuhan mengajar", "Siapkan materi & administrasi", "Laporkan beban mengajar"] },
};

/* ===== Simulasi: pemetaan tujuan → tim & tugas ===== */
const BUCKETS = [
  { re: /kampanye|marketing|iklan|launch|peluncuran|gtm|promosi|funnel/i, teams: ["marketing", "designer"] },
  { re: /kode|website|sistem|api|deploy|devops|cloud|keamanan|security|rag|model|llm|aplikasi|ai/i, teams: ["it", "riset"] },
  { re: /keuangan|anggaran|budget|invoice|pajak|gaji|payroll|cash|laporan keuangan/i, teams: ["keuangan"] },
  { re: /tuton|tutorial|kuliah|skripsi|tugas akhir|mahasiswa|dosen|materi|bimbingan|plagiat/i, teams: ["ut", "pnup"] },
  { re: /pkl|praktik|absensi|jadwal kuliah|beban mengajar|handout/i, teams: ["pnup", "ut"] },
  { re: /desain|design|ui|ux|logo|figma|brand|motion/i, teams: ["designer", "marketing"] },
  { re: /riset|paper|publikasi|benchmark|nlp|dataset|etika ai/i, teams: ["riset", "it"] },
  { re: /proses|sprint|kpi|okr|agile|koordinasi|manajemen/i, teams: ["manager"] },
  { re: /tamu|reservasi|event|kios|lobby/i, teams: ["resepsionis"] },
  { re: /investor|mitra|kemitraan|pendanaan|strategi besar/i, teams: ["direktur", "manager"] },
];

function simPlan(goal) {
  const bucket = BUCKETS.find(b => b.re.test(goal)) || { teams: ["manager"] };
  const g = goal.length > 60 ? goal.slice(0, 57) + "…" : goal;
  return {
    engine: "sim",
    plan: bucket.teams.map(team => ({
      team,
      tasks: (TEAMS_KB[team].steps).map(s => `${s} — ${g}`),
    })),
  };
}

function simReply({ blockId, roleTitle, message, context }) {
  const kb = TEAMS_KB[blockId] || TEAMS_KB.manager;
  const agent = context && context.agent;
  const statusLine = agent && agent.status === "working" && agent.task
    ? `Sedang mengerjakan: “${agent.task}” (${Math.round(agent.progress)}%).`
    : "Saat ini saya siaga — belum ada tugas berjalan.";
  if (/^(hai|halo|hi|hello|pagi|siang|sore|malam|assalam)/i.test(message.trim())) {
    return { engine: "sim", reply: `Halo! Saya ${roleTitle} — ${kb.mission}. ${statusLine} Ada yang bisa saya kerjakan? Tulis perintah di Konsol Perintah atau langsung sampaikan kebutuhannya.` };
  }
  if (/status|progress|kabar|bagaimana perkembangan/i.test(message)) {
    return { engine: "sim", reply: `Laporan singkat — ${kb.label}. ${statusLine} Fokus kami: ${kb.mission}.` };
  }
  const short = message.length > 80 ? message.slice(0, 77) + "…" : message;
  return { engine: "sim", reply: `Siap — sebagai ${roleTitle}, “${short}” masuk ranah kami: ${kb.mission}. Rencana kerja saya: (1) ${kb.steps[0]}, (2) ${kb.steps[1]}, (3) ${kb.steps[2]}. ${statusLine} Perintahkan lewat Konsol Perintah agar CEO menugaskan resmi, atau biarkan saya lanjut otomatis.` };
}

/* ===== LLM (OpenAI-compatible) ===== */
async function llmChat(cfg, messages, temperature, maxTokens) {
  const base = (cfg.apiBase || "https://api.openai.com/v1").replace(/\/$/, "");
  const res = await fetch(base + "/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({ model: cfg.apiModel || "gpt-4o-mini", messages, temperature, max_tokens: maxTokens }),
  });
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

function extractJson(text) {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const s = cleaned.indexOf("{"), e = cleaned.lastIndexOf("}");
  return JSON.parse(cleaned.slice(s, e + 1));
}

async function llmPlan(cfg, goal, officeData) {
  const teams = Object.keys(TEAMS_KB).map(t => `- ${t}: ${TEAMS_KB[t].mission}`).join("\n");
  const sys = `Anda adalah CEO ZR Corp AI (kantor AI dengan 10 tim). Tugas: pecah tujuan user menjadi tugas konkret per tim.
Balas HANYA dengan JSON valid persis: {"plan":[{"team":"<slug tim>","tasks":["<tugas>", "..."]}]}
Aturan: 2-4 tim relevan saja; 3-4 tugas per tim; tugas spesifik & actionable; bahasa Indonesia.
Daftar tim:\n${teams}`;
  const out = await llmChat(cfg, [{ role: "system", content: sys }, { role: "user", content: goal }], 0.4, 700);
  const parsed = extractJson(out);
  parsed.plan = (parsed.plan || []).filter(p => officeData.teams[p.team] && Array.isArray(p.tasks) && p.tasks.length);
  if (!parsed.plan.length) throw new Error("LLM tidak menghasilkan rencana valid");
  parsed.engine = "llm";
  return parsed;
}

async function llmReply(cfg, args, officeData) {
  const { blockId, roleTitle, message, context } = args;
  const kb = TEAMS_KB[blockId] || TEAMS_KB.manager;
  const projs = (officeData.projects || []).filter(p => p.team === blockId)
    .map(p => `- ${p.name} (${p.tasks.filter(t => t[1]).length}/${p.tasks.length} task, lead ${p.lead})`).join("\n");
  const agent = context && context.agent;
  const status = agent && agent.status === "working" && agent.task ? `${agent.task} (${Math.round(agent.progress)}%)` : "siaga";
  const sys = `Anda adalah "${roleTitle}" di ZR Corp AI.
Tim: ${kb.label} — misi: ${kb.mission}. Keahlian: ${kb.skills.join(", ")}.
Proyek tim saat ini:\n${projs || "- (belum ada proyek terdaftar)"}\nStatus Anda sekarang: ${status}.
Jawab sebagai profesional di peran ini: ringkas (maks 5 kalimat), praktis, bahasa Indonesia, sesuai keahlian Anda.`;
  return { engine: "llm", reply: await llmChat(cfg, [{ role: "system", content: sys }, { role: "user", content: message }], 0.7, 500) };
}

function createBrain(cfg) {
  const officeData = loadOfficeData();
  const useLlm = Boolean(cfg.apiKey);
  return {
    engine: useLlm ? "llm" : "sim",
    model: useLlm ? (cfg.apiModel || "gpt-4o-mini") : "simulasi-lokal",
    officeData,
    async plan(goal) {
      if (useLlm) { try { return await llmPlan(cfg, goal, officeData); } catch (e) { return { ...simPlan(goal), fallbackReason: String(e.message || e) }; } }
      return simPlan(goal);
    },
    async reply(args) {
      if (useLlm) { try { return await llmReply(cfg, args, officeData); } catch (e) { return { ...simReply(args), fallbackReason: String(e.message || e) }; } }
      return simReply(args);
    },
  };
}

module.exports = { createBrain, loadOfficeData, TEAMS_KB };
