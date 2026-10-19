# ZR Engine — kantor agen yang benar-benar bekerja

Dulu "kantor AI" ini adalah halaman 130 KB dengan polling 2 detik dan agen yang
hanya teks dekoratif: hasil kerja sebenarnya ditulis manual oleh satu agen.
Sekarang otaknya adalah **engine multi-agen** yang memanggil model sungguhan,
memakai matriks kompetensi tiap jabatan sebagai system prompt, menyiarkan kerja
secara **realtime lewat SSE**, dan menolak output lemah dengan **QA deterministik**.

> **Baru pertama kali?** Ikuti [PANDUAN.md](PANDUAN.md) — pemasangan, mengisi kredensial
> 9router, tiga cara menjalankan pekerjaan, arti status QA, dan solusi masalah umum.

## Quickstart

```bash
cp .env.example .env        # isi ZR_API_KEY + ZR_API_BASE + ZR_API_MODEL
cd kantor3d && npm install && npm run build && cd ..   # bangun kantor 3D (sekali)
node server.cjs             # buka http://127.0.0.1:7868/
```

Halaman depan (`/`) sekarang **kantor 3D**: kru berjalan-jalan saat siaga dan duduk
mengerjakan tugas saat run berjalan. Formulir di atas scene langsung memulai run baru.

| Halaman | Isi |
| --- | --- |
| `/` atau `/3d/` | kantor 3D (`kantor3d/`) |
| `/live` | konsol live + SSE (`kantor/live.html`) |
| `/office.html` | kantor lama (arsip di `kantor-lama/`) |

### Memakai 9router

9router adalah gateway lokal (npm `9router`), bukan bagian repo ini:

```bash
9router --no-browser --skip-update        # gateway di http://localhost:20128
curl -s localhost:20128/v1/models | head  # daftar model yang bisa dipakai
```

Lalu di `.env`: `ZR_API_BASE=http://localhost:20128/v1`, `ZR_API_MODEL=<model dari daftar>`,
`ZR_API_KEY=<key 9router>`. Tanpa gateway hidup, run akan berhenti dengan
`koneksi LLM gagal` — kantor menampilkannya sebagai status **Gagal**, bukan sukses palsu.

Tanpa API key engine **menolak jalan** — tidak ada lagi simulasi yang menyamar
sebagai hasil agen. Untuk uji alur offline: `node zr.cjs run "..." --mock`
(hasil selalu ditandai `degraded`, bukan produk).

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `node zr.cjs run "<tujuan>" [--project slug] [--max-tasks 3] [--stream] [--mock]` | jalankan pipeline penuh; exit `0` lulus QA, `2` perlu perbaikan, `1` gagal |
| `node zr.cjs ask it "trade-off arsitektur?"` | tanya satu ahli (persona + skill + dokumen tim) |
| `node zr.cjs list` / `show <id>` | riwayat run + manifest |
| `node zr.cjs personas [tim]` | cetak peran & skill yang dipakai prompt |
| `node server.cjs` | konsol live + API |

## Alur kerja

1. **CEO + Manager** memecah tujuan menjadi 2–8 tugas (JSON tervalidasi, dependensi dicek, siklus ditolak).
2. **Spesialis** mengerjakan tugas per gelombang dependensi, paralel maksimal `ZR_CONCURRENCY`.
   System prompt berisi jabatan, misi tim, dan **skills matrix asli** dari
   `struktur_organisasi_dan_tata_letak_kantor_ai.md`, plus dokumen tim yang sudah ada.
3. **Reviewer independen** (Senior Project Manager) memberi skor 1–5 dan temuan blocking. Temuan itu **memicu revisi** lalu **review ulang**, bukan sekadar dicatat.
4. **Revisi sekali** bila QA menemukan placeholder, bagian wajib hilang, keputusan/risiko kosong, atau output kembar. Bila JSON review rusak, engine jatuh ke review per-artefak.
5. **Artefak nyata** ditulis ke `teams/<tim>/projects/<proyek>/` dengan front matter
   (run, jabatan, skill, skor review) + `kantor/runs/<id>/LAPORAN.md`, `manifest.json`, `QUALITY.md`.

UI tidak polling: `/api/runs/:id/stream` mengirim event `task.start`,
`agent.delta` (isi markdown yang sedang ditulis), `artifact.ready`, `review.ready`,
`run.done`.

Setiap instruksi yang dikirim ke model direkam `engine/orchestrator.cjs` ke
`kantor/runs/<id>/prompts.ndjson` dan bisa dibaca lewat `GET /api/runs/:id/prompts`.
Kantor 3D memakainya untuk menampilkan prompt asli per tugas — klik kru, labelnya, atau
mejanya di lantai 1, lalu buka panel *Instruksi ke model*.

Kantor 3D membaca `GET /api/office3d`, yang memetakan event run nyata ke posisi kru:
`Working`/`Reviewing` duduk di meja (scene menyorot meja yang terpakai),
`Idle` pindah ke lounge/lantai 2 dan berjalan-jalan sendiri. Jadi yang terlihat di
scene bukan animasi hiasan: statusnya berasal dari `task.start`, `artifact.ready`, dan
`review.ready` run terakhir.

## Struktur folder

| Folder | Isi |
| --- | --- |
| `kantor3d/` | kantor 3D baru (Vite + React + three); scene `ruang` (MIT, lihat `kantor3d/LICENSE-ruang`) yang dijalankan engine 9router |
| `kantor-lama/` | kantor lama 130 KB (`index.html`, `agent-brain.cjs`, `state.json`) — disimpan sebagai arsip, disajikan di `/office.html` |
| `engine/` | otak multi-agen: orchestrator, persona/skill matrix, LLM, QA, store |
| `kantor/` | konsol live + `runs/` (event, manifest, laporan) |
| `teams/`, `laporan/` | artefak nyata hasil run |

Ganti tema scene dengan tombol ☾/☀ di kanan atas (malam menyalakan lampu kantor).

## Biaya & model

Model dipisah per tahap: `ZR_PLAN_MODEL`, `ZR_WORK_MODEL`, `ZR_REVIEW_MODEL`.
Token dan biaya (bila `ZR_PRICE_IN/OUT` diisi) tercatat di setiap manifest.
Retry menghormati `Retry-After`; timeout `ZR_TIMEOUT_MS`.

## Uji

```bash
node --test engine/test/*.test.cjs      # engine
cd kantor3d && npm run build            # typecheck + build kantor 3D
```

Cakupan: parsing matriks skill, QA negatif/positif, validasi rencana & siklus,
ekstraksi streaming body (chunk terpotong), run penuh dengan artefak + event,
perbaikan JSON rusak, serta server SSE + penolakan tanpa kredensial.

## Batasan

- Satu pengguna lokal (bind `127.0.0.1`), belum ada auth/multi-tenant/antrean persisten.
- Keluaran berupa markdown + manifest; belum ada billing, SLA, atau deployment produksi.
- Review & QA menangkap bentuk dan konsistensi, bukan kebenaran fakta. Artefak yang gagal tetap ditulis dengan front matter `qa: perlu-perbaikan` agar bisa diperiksa, bukan diam-diam dianggap final.
- Kualitas tetap bergantung pada model yang dipilih; QA menangkap bentuk, bukan kebenaran fakta.
- `mock` hanya untuk uji alur dan selalu ditandai `degraded` (kantor 3D menampilkan label **mock — bukan hasil produksi**).
- `kantor3d/` perlu `npm install` + `npm run build`; belum ada dev-server proxy, jadi jalankan lewat `node server.cjs`.
