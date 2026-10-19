/*
 * ZR ENGINE — ORKESTRATOR (engine/orchestrator.cjs)
 *
 * Alur: tujuan → CEO/Manager menyusun rencana (JSON tervalidasi) → spesialis
 * mengerjakan tugas secara paralel dengan persona + matriks skill masing-masing →
 * reviewer lintas tim menilai → revisi sekali bila ada temuan → QA deterministik →
 * artefak nyata ditulis ke teams/<tim>/projects/<proyek>/ + laporan run.
 *
 * Semua langkah mengalir sebagai event (SSE) sehingga UI tidak perlu polling.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { buildPersonas, personaPrompt, projectDigest } = require("./personas.cjs");
const { createLLM } = require("./llm.cjs");
const { createRun } = require("./store.cjs");
const { getConfig } = require("./config.cjs");
const qa = require("./qa.cjs");
const { BodyExtractor } = require("./stream-body.cjs");

const MAX_BODY_CTX = 1600;
/** Batas per pesan yang disimpan ke `prompts.ndjson`, agar berkas tidak meledak. */
const MAX_PROMPT_CHARS = 24000;

/**
 * Menyimpan instruksi yang BENAR-BENAR dikirim ke model ke `prompts.ndjson` di folder
 * run, supaya bisa diperiksa (dan ditampilkan di kantor 3D) setelah run selesai.
 * `label`: plan | kerja | revisi-qa | revisi-review | review.
 */
function recordPrompt(run, { label, taskId = null, team = null, role = null, model, messages, meta = {} }) {
  const entry = {
    at: new Date().toISOString(),
    label,
    taskId,
    team,
    role,
    model: model || null,
    ...meta,
    messages: (messages || []).map((m) => {
      const content = String(m.content || "");
      return {
        role: m.role,
        content: content.length > MAX_PROMPT_CHARS
          ? content.slice(0, MAX_PROMPT_CHARS) + `\n\n[…dipotong pada ${MAX_PROMPT_CHARS} karakter]`
          : content,
      };
    }),
  };
  try {
    fs.appendFileSync(path.join(run.dir, "prompts.ndjson"), JSON.stringify(entry) + "\n");
  } catch { /* pencatatan prompt gagal: jangan hentikan run */ }
  return entry;
}

function slugify(s, max = 48) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max) || "artefak";
}

function extractJson(text) {
  const raw = String(text || "").replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = raw.indexOf("{");
  if (start < 0) throw new Error("tidak ada objek JSON pada respons");
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const slice = raw.slice(start, i + 1);
        try { return JSON.parse(slice); }
        catch {
          // perbaikan aman: koma menggantung sebelum } atau ]
          return JSON.parse(slice.replace(/,\s*([}\]])/g, "$1"));
        }
      }
    }
  }
  throw new Error("JSON terpotong / tidak seimbang");
}

function normalizeArtifact(a, task) {
  return {
    title: String((a && a.title) || task.title || "Artefak").slice(0, 200),
    summary: String((a && a.summary) || ""),
    body: String((a && a.body) || ""),
    decisions: Array.isArray(a && a.decisions) ? a.decisions.map(String) : [],
    risks: Array.isArray(a && a.risks) ? a.risks.map(String) : [],
    openQuestions: Array.isArray(a && a.openQuestions) ? a.openQuestions.map(String) : [],
  };
}

function validatePlan(plan, personas, maxTasks = 8) {
  const issues = [];
  if (!plan || typeof plan !== "object") issues.push("respons bukan objek");
  const tasks = (plan && plan.tasks) || [];
  if (!Array.isArray(tasks) || tasks.length < 2) issues.push("minimal 2 tugas");
  if (tasks.length > maxTasks) issues.push(`maksimal ${maxTasks} tugas`);
  const ids = new Set();
  for (const t of tasks) {
    if (!t || !t.id) issues.push("tugas tanpa id");
    else if (ids.has(t.id)) issues.push(`id ganda: ${t.id}`);
    else ids.add(t.id);
    if (!t || !personas[t.team]) issues.push(`tim tidak dikenal: ${t && t.team}`);
    if (!t || !String(t.title || "").trim()) issues.push(`tugas ${t && t.id} tanpa judul`);
  }
  for (const t of tasks) {
    for (const d of (t && t.dependsOn) || []) if (!ids.has(d)) issues.push(`dependensi ${d} tidak ada (tugas ${t.id})`);
  }
  // deteksi siklus
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const state = new Map();
  const visit = (id) => {
    if (!byId.has(id)) return false;
    if (state.get(id) === 1) return true;
    if (state.get(id) === 2) return false;
    state.set(id, 1);
    for (const d of byId.get(id).dependsOn || []) if (visit(d)) return true;
    state.set(id, 2);
    return false;
  };
  for (const id of byId.keys()) if (visit(id)) { issues.push("dependensi melingkar"); break; }
  return issues;
}

function waves(tasks) {
  const remaining = new Map(tasks.map((t) => [t.id, t]));
  const done = new Set();
  const out = [];
  while (remaining.size) {
    const wave = [...remaining.values()].filter((t) => (t.dependsOn || []).every((d) => done.has(d)));
    if (!wave.length) throw new Error("rencana tidak bisa diurutkan (dependensi melingkar)");
    out.push(wave);
    for (const t of wave) { remaining.delete(t.id); done.add(t.id); }
  }
  return out;
}

async function callJson(llm, opts, validate, run, label) {
  let lastErr;
  for (let pass = 0; pass < 2; pass++) {
    const res = await llm.chat(opts);
    try {
      const parsed = extractJson(res.text);
      const issues = validate ? validate(parsed) : [];
      if (issues.length) throw new Error(issues.join("; "));
      return { json: parsed, res };
    } catch (e) {
      lastErr = e;
      if (pass === 0) {
        run.emit("agent.retry", { label, reason: String(e.message || e).slice(0, 240) });
        opts = {
          ...opts,
          messages: [
            ...opts.messages,
            { role: "assistant", content: String(res.text).slice(0, 4000) },
            { role: "user", content: `Respons sebelumnya tidak valid: ${e.message}. Balas ULANG hanya JSON valid sesuai skema, tanpa penjelasan.` },
          ],
        };
      }
    }
  }
  throw lastErr;
}

function planPrompt(personas, goal, digest, maxTasks = 8) {
  const roster = Object.values(personas).map((p) => {
    const roles = p.roles.map((r) => `${r.title}${r.lead ? " (lead)" : ""}`).join("; ");
    return `- ${p.slug} | ${p.name} | misi: ${p.mission} | peran: ${roles} | skill: ${p.allSkills.slice(0, 8).join(", ")}`;
  }).join("\n");

  const sys = `Anda adalah CEO ZR Corp AI yang dibantu General Manager. Tugas: ubah tujuan Direktur menjadi rencana kerja 2-8 tugas untuk tim internal.
Aturan:
1. Pilih hanya tim yang benar-benar relevan (2-5 tim). Jangan menugaskan semua tim. Jumlah tugas maksimal ${maxTasks}.
2. Setiap tugas harus punya keluaran konkret yang bisa dinilai, bukan "riset lebih lanjut" tanpa target.
3. Saling bergantung bila perlu (dependsOn berisi id tugas lain). Tugas yang bisa paralel: dependsOn kosong.
4. Bahasa Indonesia, spesifik, tanpa placeholder.
Balas HANYA JSON:
{"title":"...","objective":"...","assumptions":["..."],"tasks":[{"id":"T1","team":"<slug>","role":"<jabatan persis dari daftar>","title":"...","brief":"instruksi kerja detail untuk spesialis","acceptance":["kriteria terukur"],"dependsOn":[]}]}
Tim tersedia:
${roster}
Konteks dokumen internal (bila ada):\n${digest || "(belum ada)"}`;

  return [
    { role: "system", content: sys },
    { role: "user", content: `Tujuan Direktur: ${goal}` },
  ];
}

function workPrompt(personas, task, plan, upstream, digest, extraNotes) {
  const persona = personas[task.team];
  const role = persona.roles.find((r) => r.title.toLowerCase() === String(task.role || "").toLowerCase())
    || persona.leadRole;
  const sys = `${personaPrompt(persona, role)}

Anda bekerja dalam satu run bersama tim lain. Jangan mengulang pekerjaan tim lain; bangun di atas hasil mereka.

FORMAT BALASAN — HANYA JSON valid:
{"title":"judul artefak","summary":"2 kalimat keputusan inti","body":"markdown lengkap","decisions":["keputusan + alasan"],"risks":["risiko + mitigasi"],"openQuestions":["pertanyaan yang butuh jawaban manusia"]}

Body WAJIB memakai heading markdown persis ini (## level 2):
## Ringkasan Eksekutif
## Analisis
## Keputusan
## Rencana Eksekusi
## Risiko & Mitigasi
## Metrik Keberhasilan
## Pertanyaan Terbuka
## Asumsi & Sumber

Isi harus memakai kompetensi Anda secara nyata: sebut trade-off, angka/asumsi, dan keputusan. Minimum 700 karakter. Dilarang placeholder (TODO/TBD), basa-basi, atau mengaku sebagai AI.
Setiap angka wajib disertai rumus/perhitungan atau sumbernya; estimasi harus ditandai sebagai asumsi. Data yang belum tersedia masuk bagian "Pertanyaan Terbuka", bukan dikarang.`;

  const deps = upstream.length
    ? upstream.map((u) => `### ${u.taskId} — ${u.artifact.title} (${u.team}/${u.role})\n${u.artifact.summary}\n${u.artifact.body.slice(0, MAX_BODY_CTX)}`).join("\n\n")
    : "(tidak ada tugas pendahulu)";

  const user = `TUJUAN: ${plan.objective || plan.title}
ASUMSI RENCANA: ${(plan.assumptions || []).join("; ") || "-"}

TUGAS ANDA (${task.id} — ${task.team}):
Judul: ${task.title}
Brief: ${task.brief || "-"}
Kriteria penerimaan:
${(task.acceptance || []).map((a) => "- " + a).join("\n") || "-"}

HASIL TIM PENDAHULU (pakai, jangan diulang):
${deps}

DOKUMEN INTERNAL TIM:
${digest || "(belum ada)"}
${extraNotes ? "\nCATATAN REVISI:\n" + extraNotes : ""}`;

  return {
    persona: { team: task.team, role: role.title, skills: role.skills && role.skills.length ? role.skills : persona.allSkills, mission: persona.mission, name: persona.name },
    messages: [{ role: "system", content: sys }, { role: "user", content: user }],
  };
}

function reviewPrompt(personas, artifacts, plan) {
  const reviewer = personas.manager;
  const sys = `${personaPrompt(reviewer, reviewer.roles.find((r) => /Senior Project Manager/i.test(r.title)) || reviewer.leadRole)}

Anda reviewer independen. Nilai tiap artefak: 1-5 untuk spesifisitas, kelayakan eksekusi, dan bukti/asumsi.
Tolak (blocking) bila: isi generik bisa dipakai tim mana pun, keputusan tidak ada, angka tanpa asumsi, atau kriteria penerimaan tidak dijawab.
Balas HANYA JSON: {"verdict":"pass|revise","reviews":[{"taskId":"T1","score":1-5,"blocking":["..."],"notes":["..."]}]}`;

  const items = artifacts.map((a) => {
    const qaIssues = ((a.qa && a.qa.issues) || []).filter((i) => i.severity === "blocking").map((i) => i.message);
    return `### ${a.taskId} — ${a.artifact.title} (${a.team}/${a.role})
Kriteria: ${(a.task.acceptance || []).join("; ") || "-"}
QA lokal: ${qaIssues.length ? qaIssues.join("; ") : "lulus"}
Isi artefak:
${a.artifact.body.slice(0, 9000)}`;
  }).join("\n\n");

  return [
    { role: "system", content: sys },
    { role: "user", content: `TUJUAN: ${plan.objective || plan.title}\n\n${items}` },
  ];
}

function reviewOnePrompt(personas, rec, plan) {
  const reviewer = personas.manager;
  const role = reviewer.roles.find((r) => /Senior Project Manager/i.test(r.title)) || reviewer.leadRole;
  const sys = `${personaPrompt(reviewer, role)}

Nilai SATU artefak. Balas HANYA JSON valid, tanpa teks lain:
{"reviews":[{"taskId":"${rec.taskId}","score":1,"blocking":["masalah konkret"],"notes":["catatan singkat"]}]}
Blocking bila: isi generik, keputusan tidak ada, angka tanpa asumsi, atau kriteria penerimaan tidak dijawab.`;
  const user = `TUJUAN: ${plan.objective || plan.title}
TUGAS: ${rec.taskId} — ${rec.artifact.title} (${rec.team}/${rec.role})
KRITERIA: ${(rec.task.acceptance || []).join("; ") || "-"}
ISI ARTEFAK:
${rec.artifact.body.slice(0, 9000)}`;
  return [{ role: "system", content: sys }, { role: "user", content: user }];
}

/* Review batch; bila JSON batch rusak, jatuh ke review per-artefak yang lebih kecil. */
async function reviewArtifacts({ llm, cfg, personas, recs, plan, signal, run, track, label }) {
  const meta = { kind: "review", artifacts: recs.map((r) => ({ taskId: r.taskId, title: r.artifact.title })) };
  const reviewMessages = reviewPrompt(personas, recs, plan);
  recordPrompt(run, {
    label: "review", model: cfg.reviewModel, messages: reviewMessages,
    meta: { stage: label, taskIds: recs.map((r) => r.taskId), role: (personas.manager.leadRole || {}).title || "Reviewer" },
  });
  try {
    const res = await callJson(
      llm,
      { model: cfg.reviewModel, messages: reviewMessages, temperature: 0.2, maxTokens: 2200, signal, meta },
      (j) => (Array.isArray(j.reviews) ? [] : ["reviews harus array"]),
      run,
      label
    );
    track(res.res);
    return res.json;
  } catch (e) {
    run.emit("review.fallback", { label, message: String(e.message || e).slice(0, 220) });
    const collected = [];
    for (const rec of recs) {
      try {
        const oneMessages = reviewOnePrompt(personas, rec, plan);
        recordPrompt(run, {
          label: "review", taskId: rec.taskId, team: rec.team, role: rec.role, model: cfg.reviewModel,
          messages: oneMessages, meta: { stage: `${label}/single`, single: rec.taskId },
        });
        const one = await callJson(
          llm,
          {
            model: cfg.reviewModel, messages: oneMessages,
            temperature: 0.1, maxTokens: 700, signal,
            meta: { kind: "review", single: rec.taskId, artifacts: [{ taskId: rec.taskId, title: rec.artifact.title }] },
          },
          (j) => (Array.isArray(j.reviews) ? [] : ["reviews harus array"]),
          run,
          `${rec.taskId}/review-single`
        );
        track(one.res);
        collected.push(...one.json.reviews);
      } catch (err) {
        run.emit("review.failed", { taskId: rec.taskId, message: String(err.message || err).slice(0, 180) });
      }
    }
    if (!collected.length) throw e;
    return {
      verdict: collected.every((r) => Number(r.score) >= 3 && !(r.blocking || []).length) ? "pass" : "revise",
      reviews: collected,
    };
  }
}

function deltaSink(run, task, role) {
  const extractor = new BodyExtractor();
  return (text) => {
    const body = extractor.push(text);
    if (body) run.emit("agent.delta", { taskId: task.id, team: task.team, role, text: body }, { persist: false });
  };
}

function frontMatter(rec, run) {
  const skills = (rec.skills || []).join(", ").replace(/\n/g, " ");
  return [
    "---",
    `run: ${run.id}`,
    `team: ${rec.team}`,
    `role: ${rec.role}`,
    `skills: ${skills}`,
    `task: ${rec.taskId}`,
    `review: ${rec.review ? rec.review.score + "/5" : "-"}`,
    `revised: ${rec.revised ? "ya" : "-"}`,
    `qa: ${rec.qa ? (rec.qa.pass ? "lulus" : "perlu-perbaikan") : "-"}`,
    `model: ${rec.model || "-"}`,
    `generated: ${new Date().toISOString()}`,
    "---",
    "",
  ].join("\n");
}

function writeArtifact(teamsDir, projectSlug, rec, run) {
  const folder = path.join(teamsDir, rec.team, "projects", projectSlug);
  fs.mkdirSync(folder, { recursive: true });
  const name = rec.file ? path.basename(rec.file) : `${rec.taskId}-${slugify(rec.artifact.title, 44)}.md`;
  const file = rec.file || path.join(folder, name);
  const content = frontMatter(rec, run) + rec.artifact.body.trim() + "\n";
  fs.writeFileSync(file, content);
  const copyDir = path.join(run.dir, "artifacts", rec.team);
  fs.mkdirSync(copyDir, { recursive: true });
  fs.writeFileSync(path.join(copyDir, name), content);
  return {
    file,
    rel: path.relative(path.join(teamsDir, ".."), file).split(path.sep).join("/"),
    // URL yang selalu bisa disajikan server, tak bergantung lokasi folder tim
    url: `/api/runs/${run.id}/artifacts/${encodeURIComponent(rec.team)}/${encodeURIComponent(name)}`,
  };
}

function buildReport(run, plan, records, reviews, quality, usage, startedAt) {
  const cost = usage.costUsd;
  const lines = [
    `# Laporan Run ${run.id}`,
    "",
    `- **Tujuan:** ${plan.objective || plan.title}`,
    `- **Provider/model:** ${usage.provider} / ${[...usage.models].join(", ") || "-"}`,
    `- **Status QA:** ${quality.pass ? "LULUS" : "PERLU PERBAIKAN"}${quality.degraded ? " (DEGRADED: mock)" : ""}`,
    `- **Durasi:** ${((Date.now() - startedAt) / 1000).toFixed(1)} detik`,
    `- **Token:** ${usage.prompt} masuk / ${usage.completion} keluar${cost ? ` — perkiraan biaya $${cost.toFixed(4)}` : ""}`,
    "",
    "## Tim yang bekerja",
    "",
    "| Tugas | Tim | Peran | Skor review | Artefak |",
    "| --- | --- | --- | --- | --- |",
    ...records.map((r) => `| ${r.taskId} | ${r.team} | ${r.role} | ${r.review ? r.review.score : "-"} | [${path.basename(r.file)}](${r.url}) |`),
    "",
    "## Keputusan kunci",
    "",
    ...records.flatMap((r) => (r.artifact.decisions || []).map((d) => `- **${r.team} (${r.taskId}):** ${d}`)),
    "",
    "## Risiko",
    "",
    ...records.flatMap((r) => (r.artifact.risks || []).map((d) => `- ${r.team}: ${d}`)),
    "",
    "## Temuan QA",
    "",
    ...(quality.blocking.length || quality.warnings.length
      ? [...quality.blocking.map((i) => `- ❌ ${i.code}: ${i.message}`), ...quality.warnings.map((i) => `- ⚠️ ${i.code}: ${i.message}`)]
      : ["- Tidak ada temuan."]),
    "",
    "## Langkah berikutnya (butuh manusia)",
    "",
    ...(records.flatMap((r) => r.artifact.openQuestions || []).length
      ? [...new Set(records.flatMap((r) => r.artifact.openQuestions))].map((q) => `- ${q}`)
      : ["- Tidak ada pertanyaan terbuka."]),
    "",
  ];
  return lines.join("\n");
}

async function runGoal(goal, options = {}) {
  const cfg = getConfig(options.config || {});
  const llm = options.llm || createLLM(cfg);
  const personas = options.personas || buildPersonas();
  const teamsDir = options.teamsDir || cfg.teamsDir;
  const runsDir = options.runsDir || cfg.runsDir;
  const concurrency = options.concurrency || cfg.concurrency;
  const maxTasks = Math.max(2, Math.min(8, Number(options.maxTasks || cfg.maxTasks || 8)));
  const projectSlug = slugify(options.project || goal, 40);
  const signal = options.signal || new AbortController().signal;

  const run = createRun({
    runsDir,
    goal,
    project: projectSlug,
    meta: { provider: llm.provider, model: llm.model, mocked: Boolean(llm.mocked) },
  });
  const startedAt = Date.now();
  const usage = { prompt: 0, completion: 0, costUsd: 0, models: new Set(), provider: llm.provider };
  const records = [];
  let reviews = [];

  const unsub = typeof options.onEvent === "function" ? run.subscribe(options.onEvent) : () => {};
  const track = (res) => {
    usage.prompt += res.usage.prompt;
    usage.completion += res.usage.completion;
    usage.costUsd += res.costUsd || 0;
    if (res.model) usage.models.add(res.model);
    return res;
  };

  try {
    run.emit("run.start", {
      runId: run.id, goal, project: projectSlug, provider: llm.provider, model: llm.model, mocked: Boolean(llm.mocked),
      personas: Object.fromEntries(Object.entries(personas).map(([k, p]) => [k, { name: p.name, lead: p.leadRole.title, skills: p.allSkills.length }])),
    });

    const teamsRoot = path.dirname(teamsDir);
    const planContext = options.planContext || [projectDigest(teamsRoot, "manager", 1600), projectDigest(teamsRoot, "direktur", 1600)]
      .filter(Boolean).join("\n");
    run.emit("plan.start", { message: "CEO & Manager menyusun rencana" });
    const planMessages = planPrompt(personas, goal, planContext, maxTasks);
    recordPrompt(run, { label: "plan", model: cfg.planModel, messages: planMessages, meta: { goal, maxTasks } });
    const planCall = await callJson(
      llm,
      {
        model: cfg.planModel,
        messages: planMessages,
        temperature: 0.35,
        maxTokens: 1800,
        signal,
        meta: { kind: "plan", goal, teams: Object.keys(personas) },
      },
      (p) => validatePlan(p, personas, maxTasks),
      run,
      "plan"
    );
    track(planCall.res);
    const plan = planCall.json;
    plan.tasks = plan.tasks.map((t) => ({
      ...t,
      role: (personas[t.team].roles.find((r) => r.title.toLowerCase() === String(t.role || "").toLowerCase()) || personas[t.team].leadRole).title,
      acceptance: Array.isArray(t.acceptance) ? t.acceptance.map(String) : [],
      dependsOn: Array.isArray(t.dependsOn) ? t.dependsOn : [],
    }));
    fs.writeFileSync(path.join(run.dir, "plan.json"), JSON.stringify(plan, null, 2));
    run.emit("plan.ready", {
      title: plan.title, objective: plan.objective, assumptions: plan.assumptions || [],
      tasks: plan.tasks.map((t) => ({ id: t.id, team: t.team, role: t.role, title: t.title, dependsOn: t.dependsOn })),
    });

    for (const wave of waves(plan.tasks)) {
      if (signal.aborted) throw new Error("dibatalkan");
      let index = 0;
      const worker = async () => {
        while (index < wave.length) {
          const task = wave[index++];
          if (signal.aborted) return;
          const persona = personas[task.team];
          const upstream = records.filter((r) => (task.dependsOn || []).includes(r.taskId));
          const tdigest = projectDigest(teamsRoot, task.team, 2600);
          const prepared = workPrompt(personas, task, plan, upstream, tdigest);
          const role = prepared.persona.role;

          run.emit("task.start", { taskId: task.id, team: task.team, role, title: task.title });
          recordPrompt(run, {
            label: "kerja", taskId: task.id, team: task.team, role, model: cfg.workModel,
            messages: prepared.messages,
            meta: { title: task.title, acceptance: task.acceptance || [], dependsOn: task.dependsOn || [], persona: prepared.persona },
          });

          const workCall = await callJson(
            llm,
            {
              model: cfg.workModel,
              messages: prepared.messages,
              temperature: cfg.temperature,
              maxTokens: 2800,
              signal,
              meta: { kind: "artifact", task, persona: prepared.persona, goal },
              onDelta: deltaSink(run, task, role),
            },
            null,
            run,
            `${task.id}/${task.team}`
          );
          track(workCall.res);
          let artifact = normalizeArtifact(workCall.json, task);
          let quality = qa.evaluateArtifact({ task, persona: prepared.persona, artifact });

          if (!quality.pass) {
            run.emit("revise.start", { taskId: task.id, issues: quality.issues.filter((i) => i.severity === "blocking").map((i) => i.message) });
            const critique = quality.issues.map((i) => `- ${i.message}`).join("\n");
            const reviseMessages = workPrompt(personas, task, plan, upstream, tdigest, critique).messages;
            recordPrompt(run, {
              label: "revisi-qa", taskId: task.id, team: task.team, role, model: cfg.workModel,
              messages: reviseMessages,
              meta: { title: task.title, reason: "qa", issues: quality.issues.map((i) => i.message), persona: prepared.persona },
            });
            const revised = await callJson(
              llm,
              {
                model: cfg.workModel,
                messages: reviseMessages,
                temperature: 0.35,
                maxTokens: 2800,
                signal,
                meta: { kind: "revise", task, persona: prepared.persona, goal },
                onDelta: deltaSink(run, task, role),
              },
              null,
              run,
              `${task.id}/revisi`
            );
            track(revised.res);
            artifact = normalizeArtifact(revised.json, task);
            quality = qa.evaluateArtifact({ task, persona: prepared.persona, artifact });
            run.emit("revise.done", { taskId: task.id, pass: quality.pass, issues: quality.issues });
          }

          const rec = {
            taskId: task.id, team: task.team, role, task, artifact,
            skills: prepared.persona.skills, model: workCall.res.model,
            qa: quality, review: null,
          };
          const written = writeArtifact(teamsDir, projectSlug, rec, run);
          rec.file = written.file;
          rec.rel = written.rel;
          rec.url = written.url;
          records.push(rec);
          run.emit("artifact.ready", {
            taskId: rec.taskId, team: rec.team, role: rec.role, title: artifact.title,
            file: rec.rel, url: rec.url, chars: artifact.body.length,
            excerpt: artifact.body.slice(0, 1200),
            decisions: artifact.decisions, summary: artifact.summary,
            qa: { pass: quality.pass, issues: quality.issues },
          });
        }
      };
      await Promise.all(Array.from({ length: Math.min(concurrency, wave.length) }, worker));
    }

    if (records.length) {
      run.emit("review.start", { artifacts: records.length });
      try {
        const revCall = await reviewArtifacts({ llm, cfg, personas, recs: records, plan, signal, run, track, label: "review" });
        reviews = revCall.reviews || [];
        for (const r of reviews) {
          const rec = records.find((x) => x.taskId === r.taskId);
          if (rec) rec.review = { score: Number(r.score) || 0, blocking: r.blocking || [], notes: r.notes || [] };
        }
        run.emit("review.ready", { verdict: revCall.verdict || "pass", reviews, round: 1 });

        /* Temuan reviewer tidak boleh jadi pajangan: artefak yang dinilai rendah
           atau punya blocking direvisi sekali, lalu direview ulang. */
        const needsFix = records.filter((r) => r.review && (r.review.score < 3 || r.review.blocking.length));
        if (needsFix.length) {
          run.emit("review.revise.start", { taskIds: needsFix.map((r) => r.taskId) });
          let fixIndex = 0;
          const fixWorker = async () => {
            while (fixIndex < needsFix.length) {
              const rec = needsFix[fixIndex++];
              if (signal.aborted) return;
              const upstream = records.filter((r) => (rec.task.dependsOn || []).includes(r.taskId));
              const tdigest = projectDigest(teamsRoot, rec.team, 2200);
              const critique = [
                "Temuan reviewer yang WAJIB diperbaiki (jangan diabaikan):",
                ...(rec.review.blocking || []).map((b) => "- " + b),
                ...(rec.review.notes || []).map((n) => "- catatan: " + n),
                "",
                "Artefak sebelumnya (perbaiki bagian yang bermasalah, pertahankan yang sudah baik):",
                rec.artifact.body.slice(0, 8000),
              ].join("\n");
              const prepared = workPrompt(personas, rec.task, plan, upstream, tdigest, critique);
              recordPrompt(run, {
                label: "revisi-review", taskId: rec.taskId, team: rec.team, role: rec.role, model: cfg.workModel,
                messages: prepared.messages,
                meta: {
                  title: rec.artifact.title, reason: "review",
                  blocking: rec.review.blocking || [], notes: rec.review.notes || [],
                },
              });
              const fixCall = await callJson(
                llm,
                {
                  model: cfg.workModel,
                  messages: prepared.messages,
                  temperature: 0.3,
                  maxTokens: 2800,
                  signal,
                  meta: { kind: "revise", task: rec.task, persona: prepared.persona, goal },
                  onDelta: deltaSink(run, rec.task, rec.role),
                },
                null,
                run,
                `${rec.taskId}/review-revisi`
              );
              track(fixCall.res);
              rec.artifact = normalizeArtifact(fixCall.json, rec.task);
              rec.qa = qa.evaluateArtifact({ task: rec.task, persona: prepared.persona, artifact: rec.artifact });
              rec.revised = true;
              const written = writeArtifact(teamsDir, projectSlug, rec, run);
              rec.file = written.file; rec.rel = written.rel; rec.url = written.url;
              run.emit("artifact.updated", {
                taskId: rec.taskId, team: rec.team, role: rec.role, title: rec.artifact.title,
                file: rec.rel, url: rec.url, chars: rec.artifact.body.length,
                excerpt: rec.artifact.body.slice(0, 1200), reason: "review",
                qa: { pass: rec.qa.pass, issues: rec.qa.issues },
              });
            }
          };
          await Promise.all(Array.from({ length: Math.min(concurrency, needsFix.length) }, fixWorker));

          run.emit("review.start", { artifacts: needsFix.length, round: 2 });
          try {
            const rev2 = await reviewArtifacts({ llm, cfg, personas, recs: needsFix, plan, signal, run, track, label: "review-ulang" });
            const second = rev2.reviews || [];
            for (const r of second) {
              const rec = records.find((x) => x.taskId === r.taskId);
              if (rec) rec.review = { score: Number(r.score) || 0, blocking: r.blocking || [], notes: r.notes || [] };
            }
            reviews = reviews.map((r) => second.find((x) => x.taskId === r.taskId) || r);
            run.emit("review.ready", { verdict: rev2.verdict || "pass", reviews: second, round: 2 });
          } catch (e) {
            run.emit("review.failed", { message: "review ulang: " + String(e.message || e), round: 2 });
          }
        }
      } catch (e) {
        run.emit("review.failed", { message: String(e.message || e) });
      }
    }

    /* Tulis ulang front matter agar skor review final ikut tercatat di artefak. */
    for (const rec of records) {
      const written = writeArtifact(teamsDir, projectSlug, rec, run);
      rec.file = written.file; rec.rel = written.rel; rec.url = written.url;
    }

    const quality = qa.evaluateRun({ artifacts: records, reviews, plan, mocked: Boolean(llm.mocked) });
    const manifest = {
      run: run.id, goal, project: projectSlug, createdAt: run.createdAt,
      finishedAt: new Date().toISOString(),
      provider: usage.provider, models: [...usage.models], mocked: Boolean(llm.mocked),
      plan, reviews, artifacts: records.map((r) => ({
        taskId: r.taskId, team: r.team, role: r.role, title: r.artifact.title,
        file: r.rel, review: r.review ? r.review.score : null,
        revised: Boolean(r.revised), qa: r.qa,
      })),
      usage: { prompt: usage.prompt, completion: usage.completion, costUsd: Math.round(usage.costUsd * 1e6) / 1e6 },
      qa: quality,
      durationMs: Date.now() - startedAt,
    };
    fs.writeFileSync(path.join(run.dir, "manifest.json"), JSON.stringify(manifest, null, 2));
    const report = buildReport(run, plan, records, reviews, quality, usage, startedAt);
    fs.writeFileSync(path.join(run.dir, "LAPORAN.md"), report);
    fs.writeFileSync(path.join(run.dir, "QUALITY.md"), [
      `# Gerbang Kualitas ${run.id}`,
      "", `Status: **${quality.pass ? "LULUS" : "PERLU PERBAIKAN"}**`,
      quality.degraded ? "\n> Dijalankan dengan provider **mock** — bukan hasil model." : "",
      "", "## Temuan", ...([...quality.blocking.map((i) => `- ❌ ${i.code}: ${i.message}`), ...quality.warnings.map((i) => `- ⚠️ ${i.code}: ${i.message}`)].length
        ? [...quality.blocking.map((i) => `- ❌ ${i.code}: ${i.message}`), ...quality.warnings.map((i) => `- ⚠️ ${i.code}: ${i.message}`)]
        : ["- Tidak ada temuan."]), "",
    ].join("\n"));

    run.emit("run.done", {
      qa: quality,
      usage: manifest.usage,
      durationMs: manifest.durationMs,
      artifacts: manifest.artifacts,
      report: `/kantor/runs/${run.id}/LAPORAN.md`,
      manifest: `/kantor/runs/${run.id}/manifest.json`,
    });
    return { run, manifest, plan, records, quality };
  } catch (e) {
    const cancelled = signal.aborted;
    run.emit(cancelled ? "run.cancelled" : "run.error", { message: String((e && e.message) || e) });
    throw e;
  } finally {
    unsub();
  }
}

module.exports = { runGoal, extractJson, validatePlan, waves, slugify };
