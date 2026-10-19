#!/usr/bin/env node
/*
 * ZR ENGINE — CLI (zr.cjs)
 *
 *   node zr.cjs run "naikkan penjualan POS 2x dalam 90 hari" --project pos-q4
 *   node zr.cjs run "..." --mock            # uji offline, jelas berlabel mock
 *   node zr.cjs ask keuangan "harga jual berapa?"
 *   node zr.cjs list
 *   node zr.cjs show RUN-20261018-101500-ab12
 *   node zr.cjs personas it
 *
 * Exit code `run`: 0 = QA lulus, 2 = perlu perbaikan, 1 = gagal.
 */
const fs = require("fs");
const path = require("path");
const { getConfig } = require("./engine/config.cjs");
const { buildPersonas, personaPrompt, projectDigest } = require("./engine/personas.cjs");
const { createLLM } = require("./engine/llm.cjs");
const { runGoal } = require("./engine/orchestrator.cjs");
const { listRuns } = require("./engine/store.cjs");

const C = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
};

function parseArgs(argv) {
  const args = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) { flags[key] = next; i++; }
      else flags[key] = true;
    } else args.push(a);
  }
  return { args, flags };
}

function usage() {
  console.log(`ZR Engine — agen ahli yang benar-benar bekerja

  node zr.cjs run "<tujuan>" [--project <slug>] [--max-tasks 3] [--mock] [--stream] [--concurrency 3]
  node zr.cjs ask <tim> "<pertanyaan>"
  node zr.cjs list
  node zr.cjs show <runId>
  node zr.cjs personas [tim]

Provider: .env → ZR_PROVIDER, ZR_API_KEY, ZR_API_BASE, ZR_API_MODEL.
Tanpa key, engine menolak berjalan (tidak ada simulasi diam-diam).
Lihat .env.example.`);
}

async function cmdRun(rest, flags) {
  const goal = rest.join(" ").trim();
  if (!goal) { console.error("Tujuan kosong. Contoh: node zr.cjs run \"naikkan omzet 2x\""); return 1; }
  const cfg = getConfig(flags.mock ? { provider: "mock" } : {});
  let llm;
  try { llm = createLLM(flags.mock ? { provider: "mock" } : cfg); }
  catch (e) { console.error(C.red(e.message)); return 1; }
  if (llm.mocked) console.log(C.yellow("⚠ provider MOCK — hasil tidak layak produksi, hanya untuk uji alur.\n"));

  const stream = Boolean(flags.stream);
  const controller = new AbortController();
  process.on("SIGINT", () => { controller.abort(); });

  try {
    const out = await runGoal(goal, {
      llm,
      project: flags.project,
      concurrency: flags.concurrency ? Number(flags.concurrency) : undefined,
      maxTasks: flags["max-tasks"] ? Number(flags["max-tasks"]) : undefined,
      signal: controller.signal,
      onEvent: (ev) => {
        if (ev.type === "run.start") console.log(`${C.dim("run")} ${ev.goal}\n${C.dim("model")} ${ev.provider}/${ev.model}\n`);
        else if (ev.type === "plan.ready") {
          console.log(C.bold(`\nRencana: ${ev.title}`));
          for (const t of ev.tasks) console.log(`  ${C.cyan(t.id)} ${t.team.padEnd(11)} ${t.role} — ${t.title}`);
          console.log("");
        } else if (ev.type === "task.start") console.log(`${C.dim("▸")} ${ev.taskId} ${ev.team}/${ev.role}`);
        else if (ev.type === "agent.delta" && stream) process.stdout.write(ev.text);
        else if (ev.type === "agent.retry") console.log(C.yellow(`  ↻ ${ev.label}: ${ev.reason}`));
        else if (ev.type === "revise.start") console.log(C.yellow(`  ! revisi ${ev.taskId}: ${ev.issues.join(" | ")}`));
        else if (ev.type === "review.revise.start") console.log(C.yellow(`  ↻ revisi pasca-review: ${ev.taskIds.join(", ")}`));
        else if (ev.type === "artifact.updated") console.log(`  ↻ ${ev.taskId} diperbarui (${ev.chars} char) → ${ev.file}`);
        else if (ev.type === "artifact.ready") {
          console.log(`  ${ev.qa.pass ? C.green("✓") : C.red("✗")} ${ev.title} ${C.dim(`(${ev.chars} char) → ${ev.file}`)}`);
          if (ev.summary) console.log(C.dim("    " + ev.summary));
        } else if (ev.type === "review.ready") {
          console.log(`\n${C.dim("Review")} ${ev.verdict} — ${ev.reviews.map((r) => `${r.taskId}:${r.score}/5`).join("  ")}`);
        } else if (ev.type === "review.failed") console.log(C.yellow(`review gagal: ${ev.message}`));
        else if (ev.type === "run.error") console.error(C.red(`\nGAGAL: ${ev.message}`));
      },
    });

    const q = out.quality;
    console.log(`\n${q.pass ? C.green("QA LULUS") : C.red("QA PERLU PERBAIKAN")} ${C.dim(`(${out.manifest.durationMs} ms, ${out.manifest.usage.prompt}+${out.manifest.usage.completion} token${out.manifest.usage.costUsd ? `, $${out.manifest.usage.costUsd}` : ""})`)}`);
    for (const i of q.blocking) console.log(C.red(`  ✗ ${i.code}: ${i.message}`));
    for (const i of q.warnings) console.log(C.yellow(`  ⚠ ${i.code}: ${i.message}`));
    console.log(C.dim(`\nLaporan: ${path.relative(process.cwd(), path.join(cfg.runsDir, out.run.id, "LAPORAN.md"))}`));
    console.log(C.dim(`Manifest: ${path.relative(process.cwd(), path.join(cfg.runsDir, out.run.id, "manifest.json"))}`));
    return q.pass ? 0 : 2;
  } catch (e) {
    console.error(C.red(`\nRun gagal: ${e.message || e}`));
    return 1;
  }
}

async function cmdAsk(rest, flags) {
  const team = rest[0];
  const question = rest.slice(1).join(" ").trim();
  if (!team || !question) { console.error("Pakai: node zr.cjs ask <tim> \"<pertanyaan>\""); return 1; }
  const personas = buildPersonas();
  const persona = personas[team];
  if (!persona) { console.error(`Tim '${team}' tidak dikenal. Pilihan: ${Object.keys(personas).join(", ")}`); return 1; }
  const cfg = getConfig(flags.mock ? { provider: "mock" } : {});
  let llm;
  try { llm = createLLM(flags.mock ? { provider: "mock" } : cfg); }
  catch (e) { console.error(C.red(e.message)); return 1; }
  const role = persona.roles.find((r) => r.title.toLowerCase().includes(String(flags.role || "").toLowerCase())) || persona.leadRole;
  const digest = projectDigest(cfg.root, team, 2400);
  const res = await llm.chat({
    messages: [
      { role: "system", content: personaPrompt(persona, role) + (digest ? `\n\nDokumen tim yang sudah ada:\n${digest}` : "") },
      { role: "user", content: question },
    ],
    temperature: 0.5,
    maxTokens: 1200,
    meta: { kind: "chat", persona: { role: role.title, skills: role.skills } },
    onDelta: (t) => process.stdout.write(t),
  });
  process.stdout.write("\n");
  if (llm.mocked) console.log(C.yellow("(mock — bukan hasil model)"));
  return 0;
}

function cmdList() {
  const cfg = getConfig();
  const runs = listRuns(cfg.runsDir, 30);
  if (!runs.length) { console.log("Belum ada run. Jalankan: node zr.cjs run \"...\""); return 0; }
  for (const r of runs) {
    const status = r.status === "done" ? C.green(r.status) : r.status === "needs_attention" ? C.yellow(r.status) : C.dim(r.status);
    console.log(`${r.id}  ${status.padEnd(24)}  ${String(r.goal || "").slice(0, 70)}`);
  }
  return 0;
}

function cmdShow(id) {
  const cfg = getConfig();
  const dir = path.join(cfg.runsDir, id);
  const mf = path.join(dir, "manifest.json");
  if (!fs.existsSync(mf)) { console.error(`Manifest tidak ada untuk ${id}`); return 1; }
  const m = JSON.parse(fs.readFileSync(mf, "utf8"));
  console.log(`${m.run} — ${m.provider}/${m.models.join(", ")}${m.mocked ? " (MOCK)" : ""}`);
  console.log(`Tujuan: ${m.goal}`);
  console.log(`QA: ${m.qa.pass ? "LULUS" : "PERLU PERBAIKAN"}  token ${m.usage.prompt}+${m.usage.completion}  biaya $${m.usage.costUsd}`);
  for (const a of m.artifacts) console.log(`  ${a.taskId} ${a.team.padEnd(11)} ${String(a.review ?? "-")}/5  ${a.file}`);
  for (const i of m.qa.blocking) console.log(C.red(`  ✗ ${i.code}: ${i.message}`));
  for (const i of m.qa.warnings) console.log(C.yellow(`  ⚠ ${i.code}: ${i.message}`));
  return 0;
}

function cmdPersonas(team) {
  const personas = buildPersonas();
  const keys = team ? [team] : Object.keys(personas);
  for (const k of keys) {
    const p = personas[k];
    if (!p) { console.error(`Tim '${k}' tidak dikenal`); return 1; }
    console.log(`\n${C.bold(p.name)} (${k}) — lantai ${p.floor}`);
    console.log(`Misi: ${p.mission}`);
    for (const r of p.roles) console.log(`  ${r.lead ? "★" : " "} ${r.title}\n    ${C.dim(r.skills.join(", ") || "-")}`);
  }
  return 0;
}

(async () => {
  const { args, flags } = parseArgs(process.argv.slice(2));
  const cmd = args.shift();
  let code = 1;
  if (!cmd || cmd === "help" || flags.help) { usage(); code = 0; }
  else if (cmd === "run") code = await cmdRun(args, flags);
  else if (cmd === "ask") code = await cmdAsk(args, flags);
  else if (cmd === "list") code = cmdList();
  else if (cmd === "show") code = cmdShow(args[0]);
  else if (cmd === "personas") code = cmdPersonas(args[0]);
  else { console.error(`Perintah tidak dikenal: ${cmd}`); usage(); code = 1; }
  process.exitCode = code;
})();
