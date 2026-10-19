/*
 * ZR ENGINE — SERVER (server.cjs)
 *
 *   node server.cjs            → http://127.0.0.1:7868/  (kantor 3D, /3d/)
 *                               → /live                  (konsol live, SSE)
 *                               → /office.html           (kantor lama, arsip di kantor-lama/)
 *
 * Realtime: browser tidak polling. Satu koneksi SSE per run, event dikirim
 * begitu agen menghasilkan token/keputusan/artefak.
 *
 * API:
 *   GET  /api/personas           daftar tim + peran + skill
 *   POST /api/runs               {goal, project?, mock?} → 202 {runId}
 *   GET  /api/runs               daftar run
 *   GET  /api/runs/:id           snapshot run
 *   GET  /api/runs/:id/stream    SSE (replay + live)
 *   POST /api/runs/:id/cancel    batalkan run aktif
 *   POST /api/chat               {team, role?, message} → jawaban ahli (JSON)
 *   POST /api/tutorbot           {cmd, args} — read-only TutorBot UT
 *   GET  /api/office3d           snapshot tim + run untuk scene 3D (/3d/)
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");
const { getConfig } = require("./engine/config.cjs");
const { buildPersonas, personaPrompt, projectDigest } = require("./engine/personas.cjs");
const { createLLM } = require("./engine/llm.cjs");
const { runGoal } = require("./engine/orchestrator.cjs");
const { listRuns, loadRun } = require("./engine/store.cjs");

const ROOT = __dirname;
const PORT = Number(process.env.ZR_PORT || 7868);
const active = new Map();          // runId → { controller, done }
const cfg0 = getConfig();

/* ---------- util ---------- */
function sendJson(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(obj));
}
function readBody(req, limit = 256 * 1024) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > limit) { reject(new Error("body terlalu besar")); req.destroy(); }
    });
    req.on("end", () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch { reject(new Error("JSON tidak valid")); }
    });
  });
}
function sseWrite(res, ev) {
  res.write(`id: ${ev.seq}\nevent: ${ev.type}\ndata: ${JSON.stringify(ev)}\n\n`);
}
function safeFile(relPath) {
  const rel = decodeURIComponent(relPath);
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT + path.sep)) return null;
  if (/(^|[\\/])\.(env|git|freebuff)([\\/]|$)/i.test(rel) || rel.includes("node_modules")) return null;
  return file;
}
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".cjs": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".ndjson": "application/x-ndjson; charset=utf-8",
  ".md": "text/markdown; charset=utf-8", ".css": "text/css; charset=utf-8", ".csv": "text/csv; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".ico": "image/x-icon",
  ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8",
};

/* ---------- TutorBot (dipertahankan dari server lama) ---------- */
const TUTORBOT_DIR = process.env.ZR_TUTORBOT_DIR || path.join(os.homedir(), "Desktop", "UT", "agen-ut");
const TB_SAFE = new Set(["peta", "cari", "uji", "cek", "tugas", "forum", "rubrik", "gaya"]);
function runTutorbot(cmd, args) {
  return new Promise((resolve) => {
    cmd = String(cmd || "");
    if (!TB_SAFE.has(cmd)) return resolve({ ok: false, error: `perintah '${cmd}' tidak diizinkan dari API (read-only: ${[...TB_SAFE].join(", ")})` });
    if (!fs.existsSync(TUTORBOT_DIR)) return resolve({ ok: false, error: `folder tutorbot tidak ditemukan: ${TUTORBOT_DIR}` });
    const clean = (Array.isArray(args) ? args : []).slice(0, 4)
      .map((a) => String(a)).filter((a) => /^[A-Za-z0-9_.\-]{1,60}$/.test(a) && !/apply/i.test(a));
    execFile("python3", ["-m", "tutorbot", cmd, ...clean], { cwd: TUTORBOT_DIR, timeout: 45000, maxBuffer: 1 << 20 }, (err, stdout, stderr) => {
      resolve({
        ok: !err, cmd, args: clean, dir: TUTORBOT_DIR,
        out: String(stdout || "").slice(0, 12000),
        errOut: String(stderr || "").slice(0, 2000),
        code: err ? (err.killed ? 124 : (err.code || 1)) : 0,
      });
    });
  });
}

/* Halaman pengganti bila kantor 3D belum dibangun, supaya `/` tidak jadi 404. */
const BUILD_NOTICE = `<!doctype html><html lang="id"><head><meta charset="utf-8">
<title>Kantor AI — 3D</title><style>body{margin:0;background:#0b0f0c;color:#eef9ef;font:15px/1.6 ui-monospace,Menlo,monospace;display:grid;place-items:center;height:100vh}
code{background:#121a16;border:1px solid #26312a;border-radius:6px;display:block;margin:12px 0;padding:12px 14px}a{color:#6fd6a8}</style></head>
<body><div><h1>Kantor AI 3D belum dibangun</h1>
<p>Bangun dulu scene 3D-nya, lalu muat ulang halaman ini:</p>
<code>cd kantor3d &amp;&amp; npm install &amp;&amp; npm run build</code>
<p>Konsol live tetap tersedia di <a href="/live">/live</a>, dan kantor lama di <a href="/office.html">/office.html</a>.</p></div></body></html>`;

/* ---------- pemindai deliverable (dipakai kartu lama & audit) ---------- */
function scanDeliverables() {
  const out = { projects: [], reports: [] };
  const teamsDir = path.join(ROOT, "teams");
  if (fs.existsSync(teamsDir)) {
    for (const tid of fs.readdirSync(teamsDir)) {
      const projRoot = path.join(teamsDir, tid, "projects");
      if (!fs.existsSync(projRoot) || !fs.statSync(projRoot).isDirectory()) continue;
      for (const slug of fs.readdirSync(projRoot)) {
        const dir = path.join(projRoot, slug);
        if (!fs.statSync(dir).isDirectory()) continue;
        const files = fs.readdirSync(dir).filter((f) => f !== "project.md" && fs.statSync(path.join(dir, f)).isFile()).map((f) => {
          const st = fs.statSync(path.join(dir, f));
          return { name: f, url: `/teams/${tid}/projects/${slug}/${encodeURIComponent(f)}`, size: st.size, mtime: st.mtime.toISOString() };
        });
        out.projects.push({ team: tid, slug, files });
      }
    }
  }
  const lapDir = path.join(ROOT, "laporan");
  if (fs.existsSync(lapDir)) {
    out.reports = fs.readdirSync(lapDir).filter((f) => f.endsWith(".md")).map((f) => {
      const st = fs.statSync(path.join(lapDir, f));
      return { name: f, url: `/laporan/${encodeURIComponent(f)}`, size: st.size, mtime: st.mtime.toISOString() };
    }).sort((a, b) => b.mtime.localeCompare(a.mtime));
  }
  return out;
}

/* ---------- snapshot untuk kartu kantor lama (/office.html) ---------- */
function officeSnapshot() {
  const latest = listRuns(cfg0.runsDir, 1)[0];
  const base = { engine: "engine", mode: cfg0.provider, state: { agents: {}, tasks: [], directives: [], chats: [], log: [], brain: { status: "idle" } } };
  if (!latest) return base;
  const run = loadRun(cfg0.runsDir, latest.id);
  const events = run.replay(0);
  const agents = {};
  for (const slug of Object.keys(buildPersonas())) agents[slug] = { status: "idle", task: null, progress: 0 };
  for (const ev of events) {
    if (ev.type === "task.start" && agents[ev.team]) agents[ev.team] = { status: "working", task: ev.title, progress: 35 };
    if (ev.type === "artifact.ready" && agents[ev.team]) agents[ev.team] = { status: "working", task: ev.title, progress: 100 };
  }
  const log = events.filter((e) => ["plan.ready", "task.start", "artifact.ready", "review.ready", "run.done", "run.error"].includes(e.type))
    .slice(-40).reverse().map((e) => ({
      id: e.seq, time: new Date(e.ts).toLocaleTimeString("id-ID", { hour12: false }),
      blockId: e.team || "manager", text: e.type === "artifact.ready" ? `menyelesaikan “${e.title}”` : (e.message || e.verdict || e.type),
    }));
  return { ...base, state: { ...base.state, agents, log, directives: [{ id: latest.id, time: latest.createdAt, text: latest.goal, status: latest.status }] } };
}

/* ---------- snapshot kantor 3D (/3d/) ----------
 * Memetakan event run engine ke bentuk OfficeStation yang dipakai scene 3D.
 * Sumbernya event nyata (task.start / artifact.ready / review.ready), bukan karangan UI:
 * tim yang sedang mengerjakan duduk di meja, sisanya istirahat di lounge.
 */
function office3dSnapshot() {
  const personas = buildPersonas();
  const runs = listRuns(cfg0.runsDir, 12);
  const stations = Object.keys(personas).map((slug, index) => ({
    id: slug,
    name: personas[slug].name,
    role: personas[slug].leadRole.title,
    room: "Lounge",
    roomPosition: "desk",
    state: "Idle",
    currentTask: "",
    recentActivity: "",
    activity: "",
    seat: index + 1,
    /** Tugas terakhir tim ini di run terakhir — kunci untuk menampilkan instruksi kerjanya. */
    taskId: null,
    provenance: "engine:run.json",
    freshness: "",
  }));
  const byId = new Map(stations.map((s) => [s.id, s]));
  const base = {
    provider: cfg0.provider,
    model: cfg0.model,
    mocked: false,
    run: null,
    stations,
    log: [],
    runs: runs.length,
    fetchedAt: new Date().toISOString(),
  };
  if (!runs.length) return { ...base, summary: { teams: stations.length, working: 0, idle: stations.length, artifacts: 0 } };

  const info = runs[0];
  const run = loadRun(cfg0.runsDir, info.id);
  if (!run) return { ...base, summary: { teams: stations.length, working: 0, idle: stations.length, artifacts: 0 } };
  const events = run.replay(0);
  const isActive = active.has(info.id);
  const artifacts = new Set();

  for (const ev of events) {
    const station = byId.get(ev.team);
    if (ev.type === "task.start" && station) {
      station.state = "Working";
      station.currentTask = ev.title || station.currentTask;
      station.activity = `Mengerjakan: ${ev.title || "tugas"}`;
      station.taskId = ev.taskId || station.taskId;
    }
    if ((ev.type === "artifact.ready" || ev.type === "artifact.updated") && station) {
      artifacts.add(ev.team);
      station.state = "Working";
      station.currentTask = ev.title || station.currentTask;
      station.activity = `Menulis: ${ev.title || "artefak"}`;
      station.taskId = ev.taskId || station.taskId;
    }
    if (ev.type === "revise.start" && station) {
      station.state = "Working";
      station.activity = `Revisi: ${station.currentTask || "artefak"}`;
      station.taskId = ev.taskId || station.taskId;
    }
    if (ev.type === "review.ready") {
      for (const team of artifacts) {
        const target = byId.get(team);
        if (!target) continue;
        target.state = "Reviewing";
        target.activity = ev.verdict === "pass" ? "Review: lulus" : "Review: perlu revisi";
      }
    }
  }

  for (const station of stations) {
    const busy = station.state === "Working" || station.state === "Reviewing";
    // Tim yang tidak bekerja pindah ke lounge (scene membuat mereka berjalan-jalan sendiri).
    station.room = busy && isActive ? "Workspace" : "Lounge";
    if (!busy || !isActive) {
      station.recentActivity = station.recentActivity || station.currentTask;
      station.state = "Idle";
      station.activity = "";
      if (isActive) station.currentTask = "";
    }
  }

  const log = events
    .filter((e) => ["plan.ready", "task.start", "artifact.ready", "artifact.updated", "review.ready", "run.done", "run.error", "run.cancelled"].includes(e.type))
    .slice(-24)
    .reverse()
    .map((e) => ({
      seq: e.seq,
      time: new Date(e.ts).toLocaleTimeString("id-ID", { hour12: false }),
      team: e.team || "kantor",
      text: e.type === "artifact.ready" || e.type === "artifact.updated"
        ? `menyelesaikan “${e.title || "artefak"}”`
        : e.type === "review.ready"
          ? `review ${e.verdict || "selesai"}`
          : e.type === "task.start"
            ? `mulai “${e.title || "tugas"}”`
            : e.type === "plan.ready"
              ? "rencana siap"
              : e.type.replace("run.", "run "),
    }));

  const working = stations.filter((s) => s.state === "Working" || s.state === "Reviewing").length;
  return {
    ...base,
    // Header kantor menampilkan konfigurasi engine yang sedang aktif; model yang dipakai
    // run terakhir tetap ikut di `run` supaya tidak tertukar dengan run mock.
    provider: cfg0.provider,
    model: cfg0.model,
    mocked: Boolean(info.meta?.mocked),
    run: {
      id: info.id,
      goal: info.goal || "",
      status: info.status || "unknown",
      active: isActive,
      provider: info.meta?.provider || cfg0.provider,
      model: info.meta?.model || cfg0.model,
      mocked: Boolean(info.meta?.mocked),
      createdAt: info.createdAt,
      finishedAt: info.finishedAt || null,
      durationMs: info.durationMs,
      artifacts: Array.isArray(info.artifacts) ? info.artifacts.length : artifacts.size,
      qa: info.qa ? { pass: Boolean(info.qa.pass), degraded: Boolean(info.qa.degraded), blocking: (info.qa.blocking || []).length } : null,
    },
    log,
    summary: { teams: stations.length, working, idle: stations.length - working, artifacts: artifacts.size },
  };
}

/* ---------- API ---------- */
async function handleApi(req, res, url) {
  const p = url.pathname;

  if (req.method === "GET" && p === "/api/office3d") return sendJson(res, 200, office3dSnapshot());

  if (req.method === "GET" && p === "/api/personas") {
    const personas = buildPersonas();
    return sendJson(res, 200, {
      teams: Object.fromEntries(Object.entries(personas).map(([slug, x]) => [slug, {
        name: x.name, floor: x.floor, mission: x.mission,
        roles: x.roles.map((r) => ({ title: r.title, lead: r.lead, skills: r.skills })),
      }])),
    });
  }

  if (req.method === "GET" && p === "/api/runs") {
    return sendJson(res, 200, { runs: listRuns(cfg0.runsDir, 40) });
  }

  if (req.method === "GET" && p === "/api/files") return sendJson(res, 200, scanDeliverables());

  if (req.method === "POST" && p === "/api/runs") {
    let body;
    try { body = await readBody(req); } catch (e) { return sendJson(res, 400, { error: e.message }); }
    const goal = String(body.goal || "").trim();
    if (goal.length < 8) return sendJson(res, 400, { error: "tujuan minimal 8 karakter" });
    if (goal.length > 2000) return sendJson(res, 400, { error: "tujuan maksimal 2000 karakter" });

    let llm;
    try {
      llm = createLLM(body.mock ? { provider: "mock" } : {});
    } catch (e) {
      return sendJson(res, 400, { error: e.message, code: "NO_CREDENTIALS" });
    }

    const controller = new AbortController();
    const entry = { controller, done: false };
    let id = null;   // run.start di-emit sinkron oleh runGoal()
    const started = runGoal(goal, {
      llm,
      project: body.project ? String(body.project).slice(0, 60) : undefined,
      signal: controller.signal,
      onEvent: (ev) => { if (ev.type === "run.start" && ev.runId) id = ev.runId; },
    });
    entry.done = started.then(() => true).catch(() => true);
    if (!id) {
      const err = await started.then(() => null).catch((e) => e);
      return sendJson(res, 500, { error: "run gagal dimulai: " + String((err && err.message) || err || "tidak diketahui") });
    }
    active.set(id, entry);
    entry.done.finally(() => active.delete(id));
    return sendJson(res, 202, { runId: id, mocked: Boolean(llm.mocked), provider: llm.provider, model: llm.model });
  }

  /* Instruksi yang dikirim ke model untuk run ini (dipakai kantor 3D saat meja/kru diklik). */
  const promptMatch = p.match(/^\/api\/runs\/(RUN-[0-9]{8}-[0-9]{6}-[0-9a-f]{4})\/prompts$/);
  if (promptMatch && req.method === "GET") {
    const id = promptMatch[1];
    const dir = path.join(cfg0.runsDir, id);
    if (!fs.existsSync(dir)) return sendJson(res, 404, { error: "run tidak ditemukan" });
    const file = path.join(dir, "prompts.ndjson");
    const prompts = fs.existsSync(file)
      ? fs.readFileSync(file, "utf8").split("\n").filter(Boolean)
        .map((line) => { try { return JSON.parse(line); } catch { return null; } })
        .filter(Boolean)
      : [];
    return sendJson(res, 200, { runId: id, count: prompts.length, prompts });
  }

  const artMatch = p.match(/^\/api\/runs\/(RUN-[0-9]{8}-[0-9]{6}-[0-9a-f]{4})\/artifacts\/([A-Za-z0-9_-]+)\/([^/]+)$/);
  if (artMatch && req.method === "GET") {
    const [, id, team, rawName] = artMatch;
    const name = path.basename(decodeURIComponent(rawName));
    const base = path.join(cfg0.runsDir, id, "artifacts", team);
    const file = path.join(base, name);
    if (!file.startsWith(base + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      return sendJson(res, 404, { error: "artefak tidak ditemukan" });
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "text/plain; charset=utf-8", "Cache-Control": "no-store" });
    return fs.createReadStream(file).pipe(res);
  }

  const runMatch = p.match(/^\/api\/runs\/(RUN-[0-9]{8}-[0-9]{6}-[0-9a-f]{4})(\/stream|\/cancel)?$/);
  if (runMatch) {
    const id = runMatch[1];
    const sub = runMatch[2];
    const run = loadRun(cfg0.runsDir, id);
    if (!run) return sendJson(res, 404, { error: "run tidak ditemukan" });

    if (req.method === "GET" && !sub) {
      const snap = JSON.parse(fs.readFileSync(path.join(run.dir, "run.json"), "utf8"));
      return sendJson(res, 200, { ...snap, active: active.has(id) });
    }

    if (req.method === "POST" && sub === "/cancel") {
      const entry = active.get(id);
      if (!entry) return sendJson(res, 409, { error: "run tidak sedang berjalan" });
      entry.controller.abort();
      return sendJson(res, 202, { ok: true });
    }

    if (req.method === "GET" && sub === "/stream") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      });
      res.write(": connected\n\n");

      const lastId = Number(req.headers["last-event-id"] || url.searchParams.get("after") || 0) || 0;
      let lastSent = lastId;
      let closed = false;
      let hb = null;

      const cleanup = () => { if (hb) clearInterval(hb); unsubscribe(); };
      const send = (ev) => {
        if (closed || ev.seq <= lastSent) return;
        lastSent = ev.seq;
        sseWrite(res, ev);
        if (["run.done", "run.error", "run.cancelled"].includes(ev.type)) {
          closed = true;
          cleanup();
          res.end();
        }
      };

      // berlangganan dulu (objek Run yang sama dengan orchestrator), lalu replay.
      const unsubscribe = run.subscribe(send);
      for (const ev of run.replay(lastId)) { if (closed) break; send(ev); }
      hb = setInterval(() => { if (!closed) res.write(": ping\n\n"); }, 15000);
      req.on("close", () => { closed = true; cleanup(); });
      return;
    }
  }

  if (req.method === "POST" && p === "/api/chat") {
    let body;
    try { body = await readBody(req); } catch (e) { return sendJson(res, 400, { error: e.message }); }
    const personas = buildPersonas();
    const team = String(body.team || body.blockId || "").trim();
    const message = String(body.message || "").trim();
    if (!personas[team]) return sendJson(res, 400, { error: `tim tidak dikenal: ${team}` });
    if (!message) return sendJson(res, 400, { error: "message wajib" });
    let llm;
    try { llm = createLLM(body.mock ? { provider: "mock" } : {}); }
    catch (e) { return sendJson(res, 400, { error: e.message, code: "NO_CREDENTIALS" }); }
    const persona = personas[team];
    const wanted = String(body.role || body.roleTitle || "").toLowerCase();
    const role = persona.roles.find((r) => r.title.toLowerCase().includes(wanted)) || persona.leadRole;
    const digest = projectDigest(ROOT, team, 2000);
    try {
      const out = await llm.chat({
        messages: [
          { role: "system", content: personaPrompt(persona, role) + (digest ? `\n\nDokumen tim:\n${digest}` : "") },
          { role: "user", content: message },
        ],
        maxTokens: 1200,
        meta: { kind: "chat", persona: { role: role.title, skills: role.skills } },
        signal: AbortSignal.timeout(120000),
      });
      return sendJson(res, 200, { team, role: role.title, reply: out.text.trim(), mocked: Boolean(out.mocked), usage: out.usage, state: officeSnapshot().state });
    } catch (e) {
      return sendJson(res, 502, { error: String(e.message || e) });
    }
  }

  if (req.method === "POST" && p === "/api/tutorbot") {
    let body;
    try { body = await readBody(req); } catch (e) { return sendJson(res, 400, { error: e.message }); }
    const r = await runTutorbot(body.cmd, body.args);
    return sendJson(res, 200, r);
  }

  /* Kompatibilitas kartu kantor lama (/office.html). */
  if (req.method === "GET" && p === "/api/office") return sendJson(res, 200, officeSnapshot());
  if (req.method === "POST" && p === "/api/worktick") return sendJson(res, 200, { events: [], state: officeSnapshot().state });
  if (req.method === "POST" && p === "/api/directive") {
    let body;
    try { body = await readBody(req); } catch (e) { return sendJson(res, 400, { error: e.message }); }
    const text = String(body.text || "").trim();
    if (text.length < 8) return sendJson(res, 400, { error: "perintah minimal 8 karakter" });
    let llm;
    try { llm = createLLM({}); }
    catch (e) { return sendJson(res, 400, { error: e.message, code: "NO_CREDENTIALS" }); }
    const controller = new AbortController();
    let id = null;
    const started = runGoal(text, { llm, signal: controller.signal, onEvent: (ev) => { if (ev.type === "run.start") id = ev.runId; } });
    const entry = { controller, done: started.then(() => true).catch(() => true) };
    if (id) { active.set(id, entry); entry.done.finally(() => active.delete(id)); }
    return sendJson(res, 202, { engine: llm.provider, accepted: true, runId: id, state: officeSnapshot().state });
  }

  return sendJson(res, 404, { error: "endpoint tidak ditemukan" });
}

/* ---------- server ---------- */
http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  try {
    if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url);

    let rel = url.pathname;
    if (rel === "/" || rel === "") rel = "/kantor3d/dist/index.html";
    else if (rel === "/live" || rel === "/live.html") rel = "/kantor/live.html";
    else if (rel === "/office" || rel === "/office.html") rel = "/kantor-lama/index.html";
    else if (rel === "/3d" || rel === "/3d/") rel = "/kantor3d/dist/index.html";
    else if (rel.startsWith("/3d/")) rel = "/kantor3d/dist/" + rel.slice(4);

    // Kantor 3D dihidangkan dari hasil build; sebelum dibangun, tunjukkan caranya.
    if (rel === "/kantor3d/dist/index.html" && !fs.existsSync(path.join(ROOT, rel))) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      return res.end(BUILD_NOTICE);
    }

    const file = safeFile(rel);
    if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Not found");
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    console.error("[ZR] error:", e);
    if (!res.headersSent) sendJson(res, 500, { error: String(e.message || e) });
  }
}).listen(PORT, "127.0.0.1", () => {
  console.log(`[ZR] engine ${cfg0.provider.toUpperCase()} — http://127.0.0.1:${PORT}/`);
  if (cfg0.provider === "unset") console.log("[ZR] ZR_API_KEY kosong: /api/runs akan menolak sampai .env diisi (lihat .env.example).");
});
