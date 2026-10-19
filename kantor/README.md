# 🧠 ZR Engine — otak kantor (bukan lagi layar pantau)

Dokumen ini menggantikan protokol lama "UI read-only + `state.json` + otak Buffy
di chat". Masalah protokol lama: pekerjaan nyata hanya terjadi kalau manusia
mengetik di chat, UI melakukan polling, dan persona ahli tidak pernah masuk ke
model. Sekarang engine memanggil model sendiri dan mengalirkan kerja secara
realtime.

## Di mana otaknya?

| Lapisan | File | Peran |
| --- | --- | --- |
| Persona ahli | `engine/personas.cjs` | memparse jabatan + `Skills:` dari `struktur_organisasi_dan_tata_letak_kantor_ai.md`; tiap tim juga punya misi kerja |
| Klien model | `engine/llm.cjs` | OpenAI-compatible, streaming SSE, retry, timeout, hitung token/biaya |
| Orkestrasi | `engine/orchestrator.cjs` | rencana CEO → spesialis paralel → review → revisi → QA → tulis artefak |
| Gerbang kualitas | `engine/qa.cjs` | menolak placeholder, bagian wajib hilang, keputusan/risiko kosong, output kembar |
| Streaming | `engine/stream-body.cjs` | mengubah delta JSON menjadi teks analisis yang mengalir ke UI |
| Penyimpanan | `engine/store.cjs` | `kantor/runs/<id>/` + `events.ndjson` + snapshot |
| CLI | `zr.cjs` | `run`, `ask`, `list`, `show`, `personas` |
| Server | `server.cjs` | API + SSE + UI ringan |

## Menjalankan

```bash
cp .env.example .env      # isi ZR_API_KEY, ZR_API_BASE, ZR_API_MODEL
node zr.cjs run "tujuan yang ingin dicapai" --project nama-proyek
node server.cjs           # http://127.0.0.1:7868/
```

Mode `mock` ada hanya untuk test: `--mock` atau centang "mock" di UI. Semua
manifest/QA menandainya `degraded: true`.

## Protokol hasil kerja

Setiap run menghasilkan:

1. **Artefak per tugas** di `teams/<tim>/projects/<proyek>/T*-*.md`
   — front matter: run, tim, jabatan, skill yang dipakai, skor review, status QA, model.
   Skor rendah/blocking dari reviewer memicu **revisi + review ulang** (satu putaran),
   jadi temuan reviewer tidak berhenti sebagai catatan.
2. **Laporan** `kantor/runs/<id>/LAPORAN.md` — tim, keputusan, risiko, temuan QA,
   pertanyaan terbuka untuk manusia.
3. **Manifest** `manifest.json` — token, biaya, model, skor review, status QA.
4. **Jejak** `events.ndjson` — event yang sama dengan yang dilihat UI lewat SSE.

Tidak ada artefak yang dianggap selesai bila QA gagal; status run menjadi
`needs_attention` dan temuannya ditulis di `QUALITY.md`.

## Peta halaman

| Rute | Isi |
| --- | --- |
| `/` atau `/3d/` | kantor 3D (`kantor3d/`) — scene visual dari proyek `ruang` (MIT) yang digerakkan run engine |
| `/live` | `kantor/live.html` — konsol live + SSE (form run, stream token, tombol cancel) |
| `/office.html` | arsip kantor lama di `kantor-lama/` (dulu halaman depan repo ini) |

`state.json` peninggalan kantor lama tidak lagi dipakai dan sudah ikut dipindah ke
`kantor-lama/`.

## API

| Endpoint | Fungsi |
| --- | --- |
| `POST /api/runs` | `{goal, project?, mock?}` → `202 {runId}` |
| `GET /api/office3d` | kru + status + log untuk scene 3D (dibaca `/`, polling 2,5 dtk) |
| `GET /api/runs/:id/stream` | SSE: replay + live (`task.start`, `agent.delta`, `artifact.ready`, `review.ready`, `run.done`) |
| `GET /api/runs` / `GET /api/runs/:id` | riwayat / snapshot |
| `POST /api/runs/:id/cancel` | batalkan run aktif |
| `POST /api/chat` | `{team, role?, message}` → jawaban ahli (JSON) |
| `GET /api/personas` | roster peran + skill |
| `POST /api/tutorbot` | TutorBot UT read-only (whitelist lama) |

## Keamanan

- Server hanya bind `127.0.0.1`; `.env`, `.git`, dan `node_modules` tidak pernah disajikan.
- Tidak ada eksekusi shell dari tujuan/chat; satu-satunya eksekusi eksternal adalah TutorBot dengan whitelist read-only.
- Path artefak dinormalisasi dan dibatasi di dalam folder proyek.

## Batasan yang jujur

Belum ada auth, multi-tenant, antrean persisten, atau penagihan. Ini mesin kerja
lokal untuk satu operator — bukan SaaS siap jual tanpa lapisan itu.
