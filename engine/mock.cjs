/*
 * ZR ENGINE — PROVIDER MOCK (engine/mock.cjs)
 *
 * HANYA untuk test & demo offline (ZR_PROVIDER=mock). Isinya deterministik dan
 * jelas bukan hasil model — manifest menandainya `degraded: true` supaya tidak
 * pernah diklaim sebagai produk siap jual.
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function pickTeams(meta) {
  const available = (meta && meta.teams) || [];
  const goal = String((meta && meta.goal) || "").toLowerCase();
  const want = [];
  if (/kampanye|iklan|marketing|promosi|go.to.market|brand/.test(goal)) want.push("marketing", "designer");
  if (/aplikasi|sistem|kode|deploy|arsitektur|api|ai|otomasi/.test(goal)) want.push("it", "riset");
  if (/harga|biaya|anggaran|cash|margin|laba|unit economics/.test(goal)) want.push("keuangan");
  if (/jadwal|kuliah|tuton|mahasiswa|pkl/.test(goal)) want.push("ut", "pnup");
  if (/tamu|layanan|reservasi|front office/.test(goal)) want.push("resepsionis");
  if (!want.length) want.push("manager", "it", "keuangan");
  const out = [...new Set(want)].filter((t) => available.includes(t));
  if (out.length < 2) for (const t of available) { if (!out.includes(t)) out.push(t); if (out.length >= 3) break; }
  return out.slice(0, 3);
}

function mockPlan(meta) {
  const teams = pickTeams(meta);
  const goal = String((meta && meta.goal) || "tujuan tanpa judul");
  const tasks = [];
  teams.forEach((team, i) => {
    tasks.push({
      id: "T" + (i + 1),
      team,
      role: "",
      title: `Rencana kerja ${team}: ${goal.slice(0, 64)}`,
      brief: `Sebagai ahli ${team}, susun keputusan dan rencana eksekusi paling konkret untuk tujuan: ${goal}`,
      acceptance: ["Ada keputusan eksplisit + alasan", "Ada angka/asumsi yang bisa diverifikasi", "Ada langkah 30 hari pertama"],
      dependsOn: i === 0 ? [] : [],
    });
  });
  tasks.push({
    id: "T" + (tasks.length + 1),
    team: "manager",
    role: "",
    title: "Konsolidasi lintas tim & gerbang kualitas",
    brief: "Gabungkan hasil tim menjadi satu rencana koheren, tandai konflik asumsi dan keputusan yang butuh persetujuan Direktur.",
    acceptance: ["Semua konflik asumsi disebut", "Ada keputusan yang butuh approval"],
    dependsOn: tasks.map((t) => t.id),
  });
  return {
    title: `Rencana: ${goal.slice(0, 70)}`,
    objective: goal,
    assumptions: ["Data pasar belum diverifikasi lapangan", "Anggaran memakai asumsi konservatif"],
    tasks,
  };
}

function mockArtifact(meta) {
  const task = (meta && meta.task) || {};
  const persona = (meta && meta.persona) || {};
  const skills = (persona.skills || []).slice(0, 5);
  const role = persona.role || "Spesialis";
  const team = persona.team || task.team || "tim";
  const title = task.title || "Analisis";
  const skillLine = skills.length ? skills.join(", ") : "operasional tim";
  const body = `## Ringkasan Eksekutif
Sebagai ${role} (${team}), saya menilai permintaan ini layak dikerjakan dengan syarat keputusan berikut diambil lebih dulu. Inti rekomendasi: fokus pada satu segmen, satu penawaran, dan satu metrik utama selama 30 hari, lalu evaluasi mingguan.

## Analisis
Kompetensi yang saya pakai: ${skillLine}. Tiga temuan utama:
1. **Batas lingkup** — tanpa batas lingkup yang tegas, biaya eksekusi membengkak lebih cepat daripada pendapatan.
2. **Bukti yang hilang** — belum ada data lapangan; semua angka di bawah adalah asumsi yang harus divalidasi pada 10 percakapan pertama.
3. **Ketergantungan** — hasil terbaik muncul bila tim ${team} bekerja dengan satu daftar keputusan, bukan banyak inisiatif paralel.

Trade-off yang saya pilih: kecepatan validasi di atas kelengkapan fitur. Ini menurunkan risiko salah investasi, dengan konsekuensi pengalaman awal terasa minimal.

## Keputusan
- **D1 — Lingkup:** kerjakan ${title} hanya untuk satu segmen utama pada fase ini.
- **D2 — Anggaran:** batasi biaya fase pertama pada 15% dari total anggaran yang tersedia; sisa dana ditahan sampai ada bukti permintaan.
- **D3 — Ukuran sukses:** satu metrik utama, diukur mingguan, bukan dashboard panjang.

## Rencana Eksekusi
- **Hari 1–3:** finalkan definisi segmen, penawaran, dan metrik; kunci daftar asumsi.
- **Hari 4–10:** jalankan 10 wawancara/uji dengan calon pengguna; catat keberatan berulang.
- **Hari 11–20:** perbaiki penawaran berdasarkan keberatan; siapkan materi dan kanal distribusi.
- **Hari 21–30:** jalankan pilot kecil, ukur metrik, lalu putuskan lanjut/ubah/hentikan.

## Risiko & Mitigasi
| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Asumsi pasar salah | Sedang | Validasi 10 wawancara sebelum belanja lebih |
| Tim mengejar banyak inisiatif | Tinggi | Satu daftar keputusan, review mingguan |
| Biaya membengkak | Sedang | Pagu 15% + gerbang keputusan di hari 30 |

## Metrik Keberhasilan
- Metrik utama: konversi dari percobaan ke pengguna aktif (target awal 20%).
- Biaya akuisisi per pengguna tidak lebih dari 25% nilai transaksi rata-rata.
- Waktu siklus keputusan maksimal 3 hari kerja.

## Pertanyaan Terbuka
- Siapa pemilik anggaran fase kedua, dan kapan gerbang keputusannya?
- Apakah ada data penjualan 90 hari terakhir yang bisa dipakai menajamkan segmen?

## Asumsi & Sumber
- Asumsi: harga dan volume belum diverifikasi; angka target bersifat hipotesis.
- Sumber: matriks kompetensi ${team} (struktur organisasi ZR Corp AI) dan brief tugas dari orchestrator.
`;
  return {
    title,
    summary: `${role} (${team}) mengambil tiga keputusan: batasi lingkup, pagu anggaran 15%, dan satu metrik utama 30 hari.`,
    body,
    decisions: ["Batasi lingkup ke satu segmen", "Pagu 15% sampai ada bukti", "Satu metrik utama mingguan"],
    risks: ["Asumsi pasar belum divalidasi", "Biaya membengkak bila inisiatif paralel"],
    openQuestions: ["Pemilik anggaran fase kedua?", "Data penjualan 90 hari tersedia?"],
  };
}

function mockReview(meta) {
  const arts = (meta && meta.artifacts) || [];
  return {
    verdict: "pass",
    reviews: arts.map((a) => ({
      taskId: a.taskId,
      score: 4,
      blocking: [],
      notes: ["Keputusan dan metrik jelas; angka masih asumsi dan sudah ditandai."],
    })),
  };
}

function makeReply(kind, meta) {
  if (kind === "plan") return JSON.stringify(mockPlan(meta), null, 2);
  if (kind === "artifact" || kind === "revise") return JSON.stringify(mockArtifact(meta), null, 2);
  if (kind === "review") return JSON.stringify(mockReview(meta), null, 2);
  return `Sebagai ${(meta && meta.persona && meta.persona.role) || "spesialis"}, jawaban ini disusun dari matriks kompetensi tim: ${((meta && meta.persona && meta.persona.skills) || []).slice(0, 4).join(", ")}. Fokus jawaban: keputusan yang bisa diambil minggu ini, asumsi yang harus divalidasi, dan risiko utama.`;
}

async function chat({ messages, meta, onDelta }) {
  const kind = (meta && meta.kind) || "chat";
  const text = makeReply(kind, meta);
  if (onDelta) {
    for (let i = 0; i < text.length; i += 48) {
      onDelta(text.slice(i, i + 48));
      await sleep(1);
    }
  }
  const promptChars = (messages || []).reduce((s, m) => s + String(m.content || "").length, 0);
  return {
    text,
    model: "mock",
    provider: "mock",
    usage: { prompt: Math.ceil(promptChars / 4), completion: Math.ceil(text.length / 4), total: Math.ceil((promptChars + text.length) / 4) },
    costUsd: 0,
    mocked: true,
  };
}

module.exports = { chat, makeReply };
