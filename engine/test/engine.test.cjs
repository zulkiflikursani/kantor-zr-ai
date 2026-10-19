/*
 * Uji engine: node --test engine/test
 * Tidak butuh API key — memakai provider mock yang jelas berlabel degraded.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");

const { buildPersonas, personaPrompt } = require("../personas.cjs");
const { evaluateArtifact, evaluateRun } = require("../qa.cjs");
const { validatePlan, waves, runGoal, extractJson } = require("../orchestrator.cjs");
const { createLLM } = require("../llm.cjs");
const { BodyExtractor } = require("../stream-body.cjs");
const mock = require("../mock.cjs");

const ROOT = path.join(__dirname, "..", "..");
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "zr-test-"));

test("persona diambil dari matriks skill dokumen organisasi", () => {
  const p = buildPersonas();
  assert.ok(Object.keys(p).length >= 10, "minimal 10 tim");
  for (const slug of ["it", "keuangan", "marketing", "manager", "riset", "designer", "resepsionis", "direktur"]) {
    assert.ok(p[slug], `tim ${slug} ada`);
    assert.ok(p[slug].roles.length >= 3, `${slug} punya >=3 peran`);
    assert.ok(p[slug].allSkills.length >= 8, `${slug} punya >=8 skill`);
  }
  assert.match(personaPrompt(p.it), /System Architecture/);
  assert.match(personaPrompt(p.it), /Misi tim:/);
});

test("QA menolak placeholder dan artefak tanpa keputusan", () => {
  const persona = { skills: ["System Architecture", "Cloud Security"] };
  const task = { acceptance: ["Ada keputusan arsitektur"] };
  const bad = evaluateArtifact({ task, persona, artifact: { summary: "pendek", body: "## Analisis\nTODO isi nanti", decisions: [], risks: [], openQuestions: [] } });
  assert.equal(bad.pass, false);
  const codes = bad.issues.map((i) => i.code);
  assert.ok(codes.includes("placeholder"));
  assert.ok(codes.includes("no-decisions"));

  const parsed = JSON.parse(mock.makeReply("artifact", {
    task: { title: "Arsitektur" },
    persona: { role: "Lead", team: "it", skills: persona.skills },
  }));
  const good = evaluateArtifact({ task, persona: { ...persona, role: "Lead" }, artifact: parsed });
  assert.equal(good.pass, true, JSON.stringify(good.issues));
});

test("validasi rencana menolak tim asing dan siklus dependensi", () => {
  const personas = buildPersonas();
  const badTeam = validatePlan({ tasks: [{ id: "T1", team: "pemasaran", title: "x" }, { id: "T2", team: "it", title: "y" }] }, personas);
  assert.ok(badTeam.some((i) => /tim tidak dikenal/.test(i)));
  const cycle = validatePlan({
    tasks: [
      { id: "T1", team: "it", title: "a", dependsOn: ["T2"] },
      { id: "T2", team: "keuangan", title: "b", dependsOn: ["T1"] },
    ],
  }, personas);
  assert.ok(cycle.some((i) => /melingkar/.test(i)));
  const ok = { tasks: [{ id: "T1", team: "it", title: "a", dependsOn: [] }, { id: "T2", team: "keuangan", title: "b", dependsOn: ["T1"] }] };
  assert.deepEqual(validatePlan(ok, personas), []);
  assert.equal(waves(ok.tasks).length, 2);
  assert.ok(validatePlan({ tasks: [{ id: "T1", team: "it", title: "a" }, { id: "T2", team: "it", title: "b" }, { id: "T3", team: "it", title: "c" }] }, personas, 2).some((i) => /maksimal 2/.test(i)));
});

test("extractJson tahan pagar markdown dan teks pembuka", () => {
  assert.deepEqual(extractJson('ini hasilnya:\n```json\n{"a":{"b":1}}\n```\nsemoga'), { a: { b: 1 } });
  assert.throws(() => extractJson("tidak ada json"));
});

test("stream body: hanya isi markdown yang dikirim ke UI, tahan chunk terpotong", () => {
  const body = '## Judul\nBaris "kutip" & backslash \\ — é\n- item';
  const json = JSON.stringify({ summary: "x", body, decisions: [] });
  for (const size of [1, 2, 3, 7, 64]) {
    const ex = new BodyExtractor();
    let out = "";
    for (let i = 0; i < json.length; i += size) out += ex.push(json.slice(i, i + size));
    assert.equal(out, body, `chunk size ${size}`);
  }
  const ex = new BodyExtractor();
  assert.equal(ex.push('{"body":"a\\u00e9b"}'), "aéb");
});

test("klien LLM: SSE sungguhan, usage, biaya, fallback stream_options", async () => {
  let calls = 0;
  const srv = http.createServer((req, res) => {
    let body = "";
    req.on("data", (d) => { body += d; });
    req.on("end", () => {
      const j = JSON.parse(body);
      calls++;
      if (j.stream_options) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: { message: "stream_options not supported" } }));
      }
      res.writeHead(200, { "Content-Type": "text/event-stream" });
      res.write('data: ' + JSON.stringify({ choices: [{ delta: { content: "Halo " } }] }) + "\n\n");
      res.write('data: ' + JSON.stringify({ choices: [{ delta: { content: "dunia" } }] }) + "\n\n");
      res.write('data: ' + JSON.stringify({ choices: [{ delta: {} }], usage: { prompt_tokens: 10, completion_tokens: 3, total_tokens: 13 } }) + "\n\n");
      res.end("data: [DONE]\n\n");
    });
  });
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  const port = srv.address().port;
  try {
    const llm = createLLM({
      provider: "openai-compatible", apiKey: "test", apiBase: `http://127.0.0.1:${port}`,
      apiModel: "fake", retries: 1, priceIn: 1, priceOut: 2, timeoutMs: 5000,
    });
    const deltas = [];
    const out = await llm.chat({ messages: [{ role: "user", content: "hi" }], onDelta: (d) => deltas.push(d) });
    assert.equal(out.text, "Halo dunia");
    assert.equal(out.usage.total, 13);
    assert.equal(calls, 2, "400 stream_options diulang tanpa opsi itu");
    assert.ok(Math.abs(out.costUsd - (10 / 1e6 + 6 / 1e6)) < 1e-9, String(out.costUsd));
    assert.deepEqual(deltas, ["Halo ", "dunia"]);
    assert.equal(out.mocked, false);
  } finally {
    srv.close();
  }
});

test("run penuh: artefak nyata, front matter, review, manifest, event", async () => {
  const teamsDir = path.join(tmp(), "teams");
  const runsDir = tmp();
  const events = [];
  const out = await runGoal("naikkan penjualan POS Kolaka 2x dalam 90 hari", {
    llm: createLLM({ provider: "mock" }),
    runsDir, teamsDir,
    onEvent: (ev) => events.push(ev),
  });

  assert.equal(out.quality.pass, true, JSON.stringify(out.quality.blocking));
  assert.equal(out.quality.degraded, true);
  assert.ok(out.records.length >= 2);
  for (const r of out.records) {
    assert.ok(fs.existsSync(r.file), "file artefak ada");
    const text = fs.readFileSync(r.file, "utf8");
    assert.match(text, /^---\nrun: RUN-/);
    assert.match(text, /skills: .+/);
    assert.match(text, /## Keputusan/);
    assert.match(text, /## Risiko & Mitigasi/);
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(out.run.dir, "manifest.json"), "utf8"));
  assert.equal(manifest.qa.pass, true);
  assert.equal(manifest.usage.prompt > 0, true);
  assert.ok(manifest.artifacts.every((a) => a.review >= 3));

  const types = events.map((e) => e.type);
  for (const t of ["run.start", "plan.ready", "task.start", "artifact.ready", "review.ready", "run.done"]) {
    assert.ok(types.includes(t), `event ${t} terkirim`);
  }
  const deltas = events.filter((e) => e.type === "agent.delta");
  assert.ok(deltas.length > 3, "token streaming dikirim");
  assert.ok(deltas.every((e) => !e.text.includes('"body"') && !e.text.includes("decisions")), "delta bukan JSON mentah");
  assert.match(deltas.map((e) => e.text).join(""), /Ringkasan Eksekutif[\s\S]*Keputusan/, "delta berisi isi analisis");
  const persisted = fs.readFileSync(path.join(out.run.dir, "events.ndjson"), "utf8").trim().split("\n").map(JSON.parse);
  assert.ok(persisted.some((e) => e.type === "run.done"));
  assert.equal(persisted.some((e) => e.type === "agent.delta"), false, "delta tidak membanjiri disk");
  assert.equal(JSON.parse(fs.readFileSync(path.join(out.run.dir, "run.json"), "utf8")).status, "done");
});

test("temuan reviewer memicu revisi, review ulang, dan front matter final", async () => {
  const teamsDir = path.join(tmp(), "teams");
  const runsDir = tmp();
  const base = createLLM({ provider: "mock" });
  let reviewCalls = 0;
  const llm = {
    provider: "fake", model: "fake", mocked: false,
    async chat(opts) {
      const res = await base.chat(opts);
      if (opts.meta && opts.meta.kind === "review") {
        reviewCalls++;
        const ids = ((opts.meta && opts.meta.artifacts) || []).map((a) => a.taskId);
        const reviews = ids.map((id, i) => ({
          taskId: id,
          score: reviewCalls === 1 && i === 0 ? 2 : 4,
          blocking: reviewCalls === 1 && i === 0 ? ["Daftar outlet belum konkret"] : [],
          notes: [],
        }));
        return { ...res, text: JSON.stringify({ verdict: reviewCalls === 1 ? "revise" : "pass", reviews }) };
      }
      if (opts.meta && opts.meta.kind === "revise") {
        const j = JSON.parse(res.text);
        j.body += "\n\n## Catatan Revisi\nDaftar outlet kini memuat nama, alamat, kontak, dan prioritas.\n";
        return { ...res, text: JSON.stringify(j) };
      }
      return res;
    },
  };
  const events = [];
  const out = await runGoal("uji revisi pasca review", { llm, runsDir, teamsDir, onEvent: (e) => events.push(e) });
  assert.equal(reviewCalls, 2, "review dijalankan dua putaran");
  assert.ok(events.some((e) => e.type === "review.revise.start"), "revisi pasca-review tercatat");
  assert.ok(events.some((e) => e.type === "artifact.updated"), "artefak diperbarui");
  assert.equal(out.quality.pass, true, JSON.stringify(out.quality.blocking));
  const rec = out.records.find((r) => r.revised);
  assert.ok(rec, "ada artefak yang direvisi");
  assert.equal(rec.review.score, 4);
  const text = fs.readFileSync(rec.file, "utf8");
  assert.match(text, /review: 4\/5/);
  assert.match(text, /revised: ya/);
  assert.match(text, /## Catatan Revisi/);
});

test("review batch rusak jatuh ke review per-artefak, bukan menggantung", async () => {
  const teamsDir = path.join(tmp(), "teams");
  const runsDir = tmp();
  const base = createLLM({ provider: "mock" });
  const llm = {
    provider: "fake", model: "fake", mocked: false,
    async chat(opts) {
      const res = await base.chat(opts);
      if (opts.meta && opts.meta.kind === "review") {
        if (!opts.meta.single) return { ...res, text: '{"reviews": [ {taskId: "T1", }' };
        return { ...res, text: JSON.stringify({ reviews: [{ taskId: opts.meta.single, score: 4, blocking: [], notes: [] }] }) };
      }
      return res;
    },
  };
  const events = [];
  const out = await runGoal("uji fallback review", { llm, runsDir, teamsDir, onEvent: (e) => events.push(e) });
  assert.ok(events.some((e) => e.type === "review.fallback"), "fallback tercatat");
  assert.equal(out.quality.pass, true, JSON.stringify(out.quality.blocking));
  assert.ok(out.records.every((r) => r.review && r.review.score === 4));
});

test("JSON rusak diperbaiki sekali, bukan diganti template", async () => {
  const teamsDir = path.join(tmp(), "teams");
  const runsDir = tmp();
  let first = true;
  const base = createLLM({ provider: "mock" });
  const flaky = {
    provider: "fake", model: "fake", mocked: false,
    async chat(opts) {
      const res = await base.chat(opts);
      if (opts.meta && opts.meta.kind === "plan" && first) { first = false; return { ...res, text: '{"plan": [' }; }
      return res;
    },
  };
  const events = [];
  const out = await runGoal("uji perbaikan JSON", { llm: flaky, runsDir, teamsDir, onEvent: (e) => events.push(e) });
  assert.ok(events.some((e) => e.type === "agent.retry"), "retry tercatat");
  assert.equal(out.quality.pass, true);
});

async function waitFor(url, ms = 8000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try { const r = await fetch(url); if (r.ok) return r; } catch { /* belum siap */ }
    await new Promise((r) => setTimeout(r, 120));
  }
  throw new Error("server tidak siap: " + url);
}

test("server: API run + SSE realtime + penolakan tanpa kredensial", async () => {
  const port = 17000 + Math.floor(Math.random() * 1000);
  const runsDir = tmp();
  const teamsDir = tmp();
  const env = {
    ...process.env,
    ZR_PORT: String(port),
    ZR_PROVIDER: "mock",
    ZR_RUNS_DIR: runsDir,
    ZR_TEAMS_DIR: teamsDir,
    ZR_API_KEY: "",
  };
  const child = spawn(process.execPath, [path.join(ROOT, "server.cjs")], { cwd: ROOT, env, stdio: ["ignore", "pipe", "pipe"] });
  let errOut = "";
  child.stderr.on("data", (d) => { errOut += d; });
  try {
    await waitFor(`http://127.0.0.1:${port}/api/runs`);

    const created = await fetch(`http://127.0.0.1:${port}/api/runs`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal: "uji SSE: naikkan penjualan POS 2x" }),
    });
    assert.equal(created.status, 202);
    const { runId } = await created.json();
    assert.match(runId, /^RUN-/);

    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 12000);
    const res = await fetch(`http://127.0.0.1:${port}/api/runs/${runId}/stream`, { signal: ctl.signal });
    assert.match(res.headers.get("content-type"), /text\/event-stream/);

    const decoder = new TextDecoder();
    let buf = "";
    const types = new Set();
    let artifacts = 0;
    let artifactUrl = null;
    for await (const chunk of res.body) {
      buf += decoder.decode(chunk, { stream: true });
      const blocks = buf.split("\n\n");
      buf = blocks.pop() || "";
      for (const block of blocks) {
        const evLine = block.split("\n").find((l) => l.startsWith("event: "));
        if (evLine) types.add(evLine.slice(7).trim());
        const dataLine = block.split("\n").find((l) => l.startsWith("data: "));
        if (dataLine) {
          const ev = JSON.parse(dataLine.slice(6));
          if (ev.type === "artifact.ready") { artifacts++; artifactUrl = artifactUrl || ev.url; }
        }
      }
      if (types.has("run.done") || types.has("run.error")) break;
    }
    clearTimeout(timer);

    assert.ok(types.has("run.start"));
    assert.ok(types.has("plan.ready"));
    assert.ok(types.has("artifact.ready"));
    assert.ok(artifacts >= 2, "minimal 2 artefak");
    assert.ok(types.has("run.done"), `event: ${[...types].join(",")} ${errOut}`);

    assert.ok(artifactUrl, "artefak punya URL");
    const fileRes = await fetch(`http://127.0.0.1:${port}${artifactUrl}`);
    assert.equal(fileRes.status, 200);
    assert.match(await fileRes.text(), /^---\nrun: RUN-/);

    const snap = await fetch(`http://127.0.0.1:${port}/api/runs/${runId}`).then((r) => r.json());
    assert.equal(snap.status, "done");

    // Instruksi yang dikirim ke model direkam, dan bisa dibaca kembali (dipakai kantor 3D
    // saat meja/kru diklik). Yang diperiksa: prompt perencana + prompt kerja satu tugas.
    const promptLog = await fetch(`http://127.0.0.1:${port}/api/runs/${runId}/prompts`).then((r) => r.json());
    assert.equal(promptLog.runId, runId);
    assert.ok(promptLog.count >= 2, `rencana + instruksi kerja, dapat ${promptLog.count}`);
    assert.ok(promptLog.prompts.some((p) => p.label === "plan"), "instruksi perencana tercatat");
    const work = promptLog.prompts.find((p) => p.label === "kerja");
    assert.ok(work, "ada instruksi kerja per tugas");
    assert.equal(work.messages[0].role, "system");
    assert.equal(work.messages[1].role, "user");
    assert.match(work.messages[0].content, /Matriks kompetensi/, "persona + skill ikut terekam");
    assert.match(work.messages[1].content, /TUGAS ANDA/, "brief tugas ikut terekam");
    assert.ok(work.team && work.role, "instruksi mencatat tim + jabatan yang dipakai");
    assert.match(work.messages[1].content, /Kriteria penerimaan/, "kriteria penerimaan ikut dikirim");
    assert.ok(typeof work.taskId === "string" && work.taskId.length > 0, "instruksi terikat ke taskId");

    // Halaman depan adalah kantor 3D; konsol live (SSE) ada di /live.
    const page = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Kantor AI — 3D/);

    const live = await fetch(`http://127.0.0.1:${port}/live`);
    assert.equal(live.status, 200);
    assert.match(await live.text(), /EventSource/);

    // Snapshot kantor 3D memetakan tiap tim engine jadi satu kru di scene.
    const office = await fetch(`http://127.0.0.1:${port}/api/office3d`).then((r) => r.json());
    const teams = await fetch(`http://127.0.0.1:${port}/api/personas`).then((r) => r.json());
    assert.equal(office.stations.length, Object.keys(teams.teams).length);
    assert.ok(office.stations.every((s) => s.seat >= 1 && typeof s.state === "string"));
    assert.equal(office.summary.teams, office.stations.length);
  } finally {
    child.kill("SIGTERM");
  }

  // Tanpa key & tanpa mock, engine harus menolak (bukan simulasi diam-diam).
  const port2 = port + 1;
  const env2 = { ...process.env, ZR_PORT: String(port2), ZR_PROVIDER: "unset", ZR_RUNS_DIR: tmp(), ZR_TEAMS_DIR: tmp(), ZR_API_KEY: "" };
  const child2 = spawn(process.execPath, [path.join(ROOT, "server.cjs")], { cwd: ROOT, env: env2, stdio: "ignore" });
  try {
    await waitFor(`http://127.0.0.1:${port2}/api/runs`);
    const r = await fetch(`http://127.0.0.1:${port2}/api/runs`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal: "harus ditolak tanpa kredensial" }),
    });
    assert.equal(r.status, 400);
    const j = await r.json();
    assert.equal(j.code, "NO_CREDENTIALS");
  } finally {
    child2.kill("SIGTERM");
  }
});
