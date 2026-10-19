/*
 * ZR ENGINE — PENYIMPANAN RUN (engine/store.cjs)
 * Satu run = satu folder kantor/runs/<id>/ dengan events.ndjson + run.json.
 * Event disiarkan langsung ke subscriber (SSE) — UI tidak perlu polling.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function makeId() {
  return `RUN-${stamp()}-${crypto.randomBytes(2).toString("hex")}`;
}

class Run {
  constructor({ id, dir, goal, project, meta }) {
    this.id = id;
    this.dir = dir;
    this.goal = goal;
    this.project = project;
    this.meta = meta || {};
    this.createdAt = new Date().toISOString();
    this.seq = 0;
    this.status = "running";
    this.subscribers = new Set();
    this.finishedAt = null;
    this.cancelled = false;
    this.abort = new AbortController();
  }

  eventFile() { return path.join(this.dir, "events.ndjson"); }
  snapshotFile() { return path.join(this.dir, "run.json"); }

  emit(type, data = {}, opts = {}) {
    const ev = { seq: ++this.seq, ts: new Date().toISOString(), type, ...data };
    if (type === "run.done" || type === "run.error" || type === "run.cancelled") {
      this.status = type === "run.done" ? (data.qa && data.qa.pass ? "done" : "needs_attention") : type === "run.error" ? "error" : "cancelled";
      this.finishedAt = ev.ts;
      this.writeSnapshot(data);
    }
    if (opts.persist !== false) {
      try { fs.appendFileSync(this.eventFile(), JSON.stringify(ev) + "\n"); } catch { /* disk penuh: jangan matikan run */ }
    }
    for (const fn of this.subscribers) {
      try { fn(ev); } catch { /* subscriber putus */ }
    }
    return ev;
  }

  writeSnapshot(extra = {}) {
    const snap = {
      id: this.id, goal: this.goal, project: this.project, status: this.status,
      createdAt: this.createdAt, finishedAt: this.finishedAt, seq: this.seq,
      meta: this.meta, ...extra,
    };
    try { fs.writeFileSync(this.snapshotFile(), JSON.stringify(snap, null, 2)); } catch { /* abaikan */ }
  }

  subscribe(fn) {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  replay(fromSeq = 0) {
    if (!fs.existsSync(this.eventFile())) return [];
    return fs.readFileSync(this.eventFile(), "utf8").split("\n").filter(Boolean)
      .map((l) => { try { return JSON.parse(l); } catch { return null; } })
      .filter((e) => e && e.seq > fromSeq);
  }

  close() { this.subscribers.clear(); }
}

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }

/* Instance aktif disimpan agar SSE berlangganan objek yang sama dengan orchestrator. */
const REGISTRY = new Map();

function createRun({ runsDir, goal, project, meta }) {
  ensureDir(runsDir);
  let id = makeId();
  while (fs.existsSync(path.join(runsDir, id))) id = makeId();
  const dir = path.join(runsDir, id);
  ensureDir(dir);
  const run = new Run({ id, dir, goal, project, meta });
  REGISTRY.set(runsDir + "|" + id, run);
  run.writeSnapshot({ logs: [] });
  return run;
}

function loadRun(runsDir, id) {
  if (!/^RUN-[0-9]{8}-[0-9]{6}-[0-9a-f]{4}$/.test(String(id))) return null;
  const key = runsDir + "|" + id;
  if (REGISTRY.has(key)) return REGISTRY.get(key);
  const dir = path.join(runsDir, id);
  if (!fs.existsSync(dir)) return null;
  let snap = {};
  try { snap = JSON.parse(fs.readFileSync(path.join(dir, "run.json"), "utf8")); } catch { snap = { id }; }
  const run = new Run({ id, dir, goal: snap.goal || "", project: snap.project || "", meta: snap.meta || {} });
  run.seq = snap.seq || 0;
  run.status = snap.status || "unknown";
  run.createdAt = snap.createdAt;
  run.finishedAt = snap.finishedAt || null;
  return run;
}

function listRuns(runsDir, limit = 25) {
  if (!fs.existsSync(runsDir)) return [];
  return fs.readdirSync(runsDir)
    .filter((d) => /^RUN-/.test(d) && fs.statSync(path.join(runsDir, d)).isDirectory())
    .map((d) => {
      try { return JSON.parse(fs.readFileSync(path.join(runsDir, d, "run.json"), "utf8")); }
      catch { return { id: d, status: "unknown" }; }
    })
    .sort((a, b) => String(b.createdAt || b.id).localeCompare(String(a.createdAt || a.id)))
    .slice(0, limit);
}

module.exports = { createRun, loadRun, listRuns, Run, makeId };
