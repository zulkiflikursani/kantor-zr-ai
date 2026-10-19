/*
 * ZR ENGINE — KLIEN LLM (engine/llm.cjs)
 * Zero-dependency, OpenAI-compatible, streaming SSE, retry + timeout.
 * Dipakai semua agen; tidak ada fallback diam-diam ke template.
 */
const { getConfig } = require("./config.cjs");
const mock = require("./mock.cjs");

class LLMError extends Error {
  constructor(message, extra = {}) {
    super(message);
    this.name = "LLMError";
    Object.assign(this, extra);
  }
}

function combineSignals(a, b) {
  if (!a) return b;
  if (!b) return a;
  if (typeof AbortSignal !== "undefined" && AbortSignal.any) return AbortSignal.any([a, b]);
  const ctl = new AbortController();
  const onAbort = () => ctl.abort();
  a.addEventListener("abort", onAbort, { once: true });
  b.addEventListener("abort", onAbort, { once: true });
  return ctl.signal;
}

const RETRYABLE = new Set([408, 409, 429, 500, 502, 503, 504]);

function estimateTokens(s) {
  return Math.max(1, Math.ceil(String(s || "").length / 4));
}

function calcCost(usage, cfg) {
  const c = (usage.prompt / 1e6) * (cfg.priceIn || 0) + (usage.completion / 1e6) * (cfg.priceOut || 0);
  return Math.round(c * 1e6) / 1e6;
}

async function readSse(res, onDelta) {
  let buffer = "";
  let text = "";
  let usage = null;
  const decoder = new TextDecoder();

  for await (const chunk of res.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const rawLine of lines) {
      const line = rawLine.replace(/\r$/, "");
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      let j;
      try { j = JSON.parse(payload); } catch { continue; }
      if (j.usage) usage = j.usage;
      const delta = j.choices && j.choices[0] && j.choices[0].delta;
      const piece = (delta && delta.content) || "";
      if (piece) {
        text += piece;
        if (onDelta) onDelta(piece);
      }
    }
  }
  return { text, usage };
}

async function once(cfg, opts, attempt) {
  const model = opts.model || cfg.model;
  const body = {
    model,
    messages: opts.messages,
    temperature: opts.temperature != null ? opts.temperature : cfg.temperature,
    max_tokens: opts.maxTokens || 1600,
    stream: true,
  };
  if (opts.includeUsage !== false) body.stream_options = { include_usage: true };

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(new Error("timeout")), opts.timeoutMs || cfg.timeoutMs);
  const signal = combineSignals(opts.signal, ctl.signal);

  let res;
  try {
    res = await fetch(cfg.apiBase + "/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + cfg.apiKey,
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (e) {
    clearTimeout(timer);
    throw new LLMError(`koneksi LLM gagal: ${e.message || e}`, { retryable: true, attempt });
  }

  if (!res.ok) {
    clearTimeout(timer);
    const raw = await res.text().catch(() => "");
    const retryAfter = Number(res.headers.get("retry-after")) || 0;
    throw new LLMError(`LLM HTTP ${res.status}: ${raw.slice(0, 300)}`, {
      status: res.status,
      retryable: RETRYABLE.has(res.status),
      retryAfter,
      body: raw,
      attempt,
    });
  }

  try {
    const ct = res.headers.get("content-type") || "";
    let text;
    let usage;
    if (!ct.includes("text/event-stream")) {
      const j = await res.json();
      text = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || "";
      usage = j.usage;
      if (text && opts.onDelta) opts.onDelta(text);
    } else {
      const out = await readSse(res, opts.onDelta);
      text = out.text;
      usage = out.usage;
    }
    if (!text) throw new LLMError("LLM mengembalikan respons kosong", { retryable: true, attempt });
    const norm = {
      prompt: (usage && (usage.prompt_tokens || usage.input_tokens)) || estimateTokens(opts.messages.map((m) => m.content).join("\n")),
      completion: (usage && (usage.completion_tokens || usage.output_tokens)) || estimateTokens(text),
    };
    norm.total = (usage && usage.total_tokens) || norm.prompt + norm.completion;
    return {
      text,
      model,
      provider: cfg.provider,
      usage: norm,
      costUsd: calcCost(norm, cfg),
      mocked: false,
      attempts: attempt + 1,
    };
  } catch (e) {
    if (e instanceof LLMError) throw e;
    throw new LLMError(`gagal membaca stream: ${e.message || e}`, { retryable: true, attempt });
  } finally {
    clearTimeout(timer);
  }
}

function createLLM(overrides = {}) {
  const cfg = getConfig(overrides);
  if (cfg.provider === "mock") {
    return {
      provider: "mock",
      model: "mock",
      mocked: true,
      config: cfg,
      async chat(opts) { return mock.chat(opts); },
    };
  }
  if (!cfg.apiKey) {
    throw new LLMError(
      "ZR_API_KEY belum diisi. Isi .env (lihat .env.example) atau jalankan dengan --mock untuk uji offline. " +
      "Engine sengaja menolak berjalan tanpa model sungguhan agar tidak menghasilkan 'simulasi' yang terlihat seperti kerja agen."
    );
  }
  return {
    provider: cfg.provider,
    model: cfg.model,
    mocked: false,
    config: cfg,
    async chat(opts) {
      let includeUsage = true;
      let lastErr;
      for (let attempt = 0; attempt <= cfg.retries; attempt++) {
        try {
          return await once(cfg, { ...opts, includeUsage }, attempt);
        } catch (e) {
          lastErr = e;
          if (e.status === 400 && includeUsage && /stream_options/i.test(e.body || "")) {
            includeUsage = false;
            attempt--;      // ulangi tanpa stream_options, tidak dihitung sebagai retry
            continue;
          }
          if (!e.retryable || attempt >= cfg.retries || (opts.signal && opts.signal.aborted)) break;
          const wait = e.retryAfter ? e.retryAfter * 1000 : Math.min(8000, 500 * 2 ** attempt) + Math.floor(Math.random() * 200);
          if (opts.onRetry) opts.onRetry({ attempt: attempt + 1, wait, error: e.message });
          await new Promise((r) => setTimeout(r, wait));
        }
      }
      throw lastErr;
    },
  };
}

module.exports = { createLLM, LLMError, estimateTokens };
