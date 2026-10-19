/*
 * ZR ENGINE — KONFIGURASI (engine/config.cjs)
 * Membaca .env di root proyek (tanpa dependensi) lalu menormalkan opsi.
 *
 * Provider default: OpenAI-compatible (DeepSeek, OpenRouter, OpenAI, OpenLLM,
 * dsb). Tanpa key, engine MENOLAK jalan — tidak ada lagi "simulasi" yang
 * diam-diam dipresentasikan sebagai hasil kerja agen.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function loadEnvFile(file = path.join(ROOT, ".env")) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    const val = m[2].replace(/^["']|["']$/g, "");
    out[m[1]] = val;
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
  return out;
}

function num(v, d) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function getConfig(overrides = {}) {
  loadEnvFile();
  const apiModel = process.env.ZR_API_MODEL || "gpt-4o-mini";
  const provider = overrides.provider || process.env.ZR_PROVIDER || (process.env.ZR_API_KEY ? "openai-compatible" : "unset");
  const cfg = {
    provider,
    apiKey: process.env.ZR_API_KEY || "",
    apiBase: (process.env.ZR_API_BASE || "https://api.openai.com/v1").replace(/\/+$/, ""),
    model: apiModel,
    planModel: process.env.ZR_PLAN_MODEL || apiModel,
    workModel: process.env.ZR_WORK_MODEL || apiModel,
    reviewModel: process.env.ZR_REVIEW_MODEL || process.env.ZR_PLAN_MODEL || apiModel,
    temperature: num(process.env.ZR_TEMPERATURE, 0.5),
    timeoutMs: num(process.env.ZR_TIMEOUT_MS, 90000),
    retries: num(process.env.ZR_RETRIES, 2),
    concurrency: Math.max(1, Math.min(6, num(process.env.ZR_CONCURRENCY, 3))),
    maxTasks: Math.max(2, Math.min(8, num(process.env.ZR_MAX_TASKS, 8))),
    priceIn: num(process.env.ZR_PRICE_IN, 0),
    priceOut: num(process.env.ZR_PRICE_OUT, 0),
    runsDir: process.env.ZR_RUNS_DIR ? path.resolve(process.env.ZR_RUNS_DIR) : path.join(ROOT, "kantor", "runs"),
    teamsDir: process.env.ZR_TEAMS_DIR ? path.resolve(process.env.ZR_TEAMS_DIR) : path.join(ROOT, "teams"),
    root: ROOT,
  };
  return { ...cfg, ...overrides, apiKey: overrides.apiKey || cfg.apiKey, apiBase: overrides.apiBase || cfg.apiBase };
}

module.exports = { getConfig, loadEnvFile, ROOT };
