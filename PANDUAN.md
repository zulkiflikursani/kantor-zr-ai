# Panduan Penggunaan — Kantor ZR AI

Kantor AI multi-agen yang **benar-benar bekerja**: tujuan berbahasa manusia dipecah
jadi tugas, dikerjakan agen dengan jabatan + matriks kompetensi, dinilai reviewer
independen, dan ditolak oleh gerbang kualitas kalau hasilnya lemah. Semua terlihat
di kantor 3D secara realtime.

> Ringkasan rute: `/` = kantor 3D · `/live` = konsol live (SSE) · `/office.html` = arsip kantor lama.

---

## 1. Apa yang Anda dapat

| Bagian | Folder | Fungsi |
| --- | --- | --- |
| Kantor 3D | `kantor3d/` | scene visual (React + three). Kru duduk mengerjakan tugas, berjalan-jalan saat siaga, dan bisa diklik untuk melihat instruksi yang dikirim ke model |
| Engine | `engine/` | otak: perencana, pekerja, reviewer, gerbang QA, penyimpanan run, klien LLM |
| Server + API | `server.cjs` | menyajikan kantor 3D, konsol live, API run, SSE, dan artefak |
| CLI | `zr.cjs` | menjalankan/tanya/riwayat dari terminal |
| Konsol live | `kantor/live.html` | jalankan run, lihat token mengalir, batalkan run |
| Arsip kantor lama | `kantor-lama/` | halaman 130 KB versi lama, disimpan sebagai arsip |
| Hasil kerja | `teams/`, `laporan/`, `kantor/runs/` | artefak markdown, laporan, manifest, jejak event |

Alur satu run:

```
tujuan → CEO + Manager memecah jadi 2–8 tugas
       → spesialis mengerjakan (paralel) dengan jabatan + skill aslinya
       → reviewer independen memberi skor 1–5 + temuan
       → revisi sekali bila ada temuan (lalu review ulang)
       → gerbang QA deterministik (tanpa LLM)
       → artefak + LAPORAN.md + manifest.json + QUALITY.md
```

---

## 2. Kebutuhan

- **Node.js 20.19+ atau 22.12+** (diuji pada v22.22.0 — Vite 7 di `kantor3d` menuntut versi ini).
- **npm** (diuji pada 11.11.0).
- **Gateway model** ber-API OpenAI-compatible. Contoh yang dipakai di sini: **9router**
  (`npm i -g 9router`, diuji versi 0.5.104) yang membuka `http://localhost:20128/v1`.
  Bisa juga langsung OpenAI/DeepSeek/OpenRouter dengan `ZR_API_BASE` yang sesuai.
- Perintah di panduan ini bergaya bash. Di Windows gunakan **Git Bash**.
- Ruang disk: `kantor3d/node_modules` sekitar 200 MB (hanya untuk build tampilan 3D).

Engine sendiri **tanpa dependensi npm** — `node server.cjs` dan `zr.cjs` berjalan
langsung tanpa `npm install`.

---

## 3. Pemasangan

```bash
git clone https://github.com/zulkiflikursani/kantor-zr-ai.git
cd kantor-zr-ai

cp .env.example .env                 # lalu isi kredensial (bagian 4)
chmod 600 .env                       # kunci akses berkas kredensial

cd kantor3d && npm install && npm run build && cd ..
node server.cjs
```

Buka **http://127.0.0.1:7868/**.

Kalau `kantor3d` belum dibangun, halaman depan tetap terbuka dan menampilkan
instruksi `npm install && npm run build` — bukan error 404. Konsol live di
`/live` dan arsip di `/office.html` tetap bisa dipakai tanpa build.

---

## 4. Menyalakan model (contoh: 9router)

```bash
npm i -g 9router                        # sekali saja
9router --no-browser --skip-update      # gateway di http://localhost:20128

curl -s localhost:20128/v1/models | head -c 400   # daftar model yang tersedia
```

Isi `.env`:

```ini
ZR_PROVIDER=openai-compatible
ZR_API_BASE=http://localhost:20128/v1
ZR_API_MODEL=kr/deepseek-3.2      # pilih salah satu id dari /v1/models
ZR_API_KEY=<key 9router Anda>
```

Catatan penting:

- `.env` **tidak pernah disajikan HTTP** (`http://127.0.0.1:7868/.env` → 404) dan sudah
  masuk `.gitignore`. Jangan pernah menempelkan nilainya ke chat, issue, atau commit.
- Tanpa key, tombol **Jalankan** menolak dengan kode `NO_CREDENTIALS` — engine tidak
  berpura-pura bekerja.
- Kalau gateway mati, run berhenti dengan `koneksi LLM gagal` dan kantor 3D menampilkan
  status **Gagal** (bukan sukses palsu).
- Untuk uji alur tanpa model: centang **mock** di kantor 3D atau pakai `--mock`.
  Hasil mock selalu diberi label `degraded` / "bukan hasil produksi".
- Harga token bersifat opsional: isi `ZR_PRICE_IN` / `ZR_PRICE_OUT` bila ingin
  `costUsd` terisi di manifest.

---

## 5. Tiga cara menjalankan pekerjaan

### a. Dari kantor 3D (halaman depan)

1. Tulis tujuan di kotak atas, mis. *"Susun 3 langkah verifikasi kasir sebelum tutup shift"*.
2. (Opsional) isi nama proyek — dipakai sebagai nama folder artefak.
3. Klik **Jalankan**. Kru yang mendapat tugas akan duduk di meja dengan balon bicara
   berisi judul tugasnya; yang lain berjalan-jalan di lounge, pantry, atau lantai 2.
4. **Klik kru, label namanya, atau mejanya** → panel detail menampilkan *Instruksi ke model*:
   prompt asli (`system prompt` berisi jabatan + matriks kompetensi, lalu `pesan user`
   berisi tujuan, brief, kriteria penerimaan, dan hasil tim pendahulu). Setiap percobaan
   punya labelnya: **Kerja**, **Revisi — gerbang QA**, **Revisi — temuan reviewer**,
   **Review**, dan **Rencana (CEO + Manager)**.
5. Tombol lain: **💤 Tidur** (semua kru siaga ke kamar), **✥ Geser** (mode geser),
   **↺ Reset view**, angka **1/2** untuk ganti lantai, ikon ☾/☀ untuk siang/malam.
6. Selama run berjalan, tombol berubah menjadi **Batalkan**.

### b. Dari konsol live (`/live`)

Cocok untuk melihat token mengalir (`agent.delta`) dan status tiap tahap lewat SSE,
plus menghentikan run.

### c. Dari terminal (CLI)

```bash
node zr.cjs run "naikkan penjualan POS 2x dalam 90 hari" --project pos-q4
node zr.cjs run "tujuan" --max-tasks 3 --concurrency 3 --stream
node zr.cjs ask it "trade-off arsitektur untuk POS offline-first?"
node zr.cjs list                 # riwayat run + status QA
node zr.cjs show <runId>         # artefak + skor review satu run
node zr.cjs personas [tim]       # jabatan + skill yang dipakai prompt

node zr.cjs                      # bantuan
```

Arti **exit code** `run`: `0` = QA lulus · `2` = perlu perbaikan · `1` = gagal.
Berguna untuk menjadwalkan run di cron atau pipeline.

> `--max-tasks` membatasi jumlah tugas (2–8). Kalau model merencanakan lebih banyak
> dari batas itu, run ditolak dengan pesan `GAGAL: maksimal N tugas` — jalankan ulang
> dengan batas lebih tinggi. Batas ini cara termurah mengendalikan biaya.

---

## 6. Halaman dan API

| Rute | Isi |
| --- | --- |
| `/` atau `/3d/` | kantor 3D (kru + status + panel instruksi) |
| `/live` | konsol live: form run, stream token, tombol batalkan |
| `/office.html` | arsip kantor lama (`kantor-lama/index.html`) |

| Endpoint | Fungsi |
| --- | --- |
| `GET /api/personas` | daftar tim, jabatan, dan skill |
| `POST /api/runs` | `{goal, project?, mock?}` → `202 {runId}` |
| `GET /api/runs` · `GET /api/runs/:id` | riwayat · snapshot run |
| `GET /api/runs/:id/stream` | SSE: replay + event langsung |
| `POST /api/runs/:id/cancel` | batalkan run aktif |
| `GET /api/runs/:id/prompts` | instruksi yang dikirim ke model (per tahap/tugas) |
| `GET /api/runs/:id/artifacts/:tim/:berkas` | unduh artefak |
| `GET /api/office3d` | snapshot kru untuk kantor 3D (dibaca tiap 2,5 detik) |
| `GET /api/files` | daftar deliverable di `teams/` dan `laporan/` |
| `POST /api/chat` | tanya satu ahli: `{team, role?, message}` |
| `POST /api/tutorbot` | TutorBot UT (read-only, daftar perintah dibatasi) |

Server hanya mendengarkan di `127.0.0.1` (ubah dengan `ZR_PORT`).

---

## 7. Ke mana hasilnya pergi

```
teams/<tim>/projects/<proyek>/T1-*.md     artefak nyata + front matter
kantor/runs/<runId>/
  ├─ LAPORAN.md        ringkasan: tim, keputusan, risiko, temuan QA, pertanyaan untuk manusia
  ├─ QUALITY.md        daftar temuan gerbang kualitas
  ├─ manifest.json     token/biaya/model, plan, review, status QA
  ├─ plan.json         rencana yang dibuat CEO + Manager
  ├─ prompts.ndjson    instruksi persis yang dikirim ke model per tahap
  ├─ events.ndjson     jejak event yang sama dengan yang dilihat SSE
  └─ artifacts/<tim>/  salinan artefak saat run berjalan
```

Front matter setiap artefak mencatat `run`, `team`, `role`, `skills`, `task`,
`review` (skor 1–5), `revised`, `qa`, dan `model` — jadi Anda tahu siapa yang
mengerjakan, dengan kompetensi apa, dan bagaimana penilaiannya.

`kantor/runs/` **tidak disertakan di repo** (berisi instruksi + dokumen internal tim).
Riwayat run adalah milik mesin Anda masing-masing.

---

## 8. Kenapa hasil bisa berstatus "perlu perbaikan"

Ini fitur, bukan kegagalan sistem. Gerbang QA deterministik (tanpa LLM) menolak artefak
yang: isinya < 500 karakter, memuat `TODO/TBD`, menjawab sebagai AI, kehilangan lebih dari
dua bagian wajib, kurang dari 2 keputusan eksplisit, tanpa risiko, tanpa pertanyaan
terbuka, atau ringkasan terlalu pendek. Tingkat run juga menolak rencana < 2 tugas,
tugas yang tidak menghasilkan artefak, dan output kembar.

Artefak yang gagal **tetap ditulis** dengan front matter `qa: perlu-perbaikan` dan status
run menjadi `needs_attention`, supaya bisa diperiksa manusia — bukan disembunyikan.
QA menilai bentuk dan konsistensi, **bukan kebenaran fakta**.

---

## 9. Konfigurasi `.env`

| Variabel | Default | Fungsi |
| --- | --- | --- |
| `ZR_PROVIDER` | `openai-compatible` bila key ada | label provider |
| `ZR_API_KEY` | — | kredensial (wajib) |
| `ZR_API_BASE` | `https://api.openai.com/v1` | endpoint OpenAI-compatible |
| `ZR_API_MODEL` | `gpt-4o-mini` | model untuk semua tahap |
| `ZR_PLAN_MODEL` · `ZR_WORK_MODEL` · `ZR_REVIEW_MODEL` | = `ZR_API_MODEL` | pisahkan model per tahap |
| `ZR_TEMPERATURE` | `0.5` | kreativitas pekerja |
| `ZR_CONCURRENCY` | `3` | tugas paralel (1–6) |
| `ZR_MAX_TASKS` | `8` | batas tugas per run (2–8) |
| `ZR_TIMEOUT_MS` · `ZR_RETRIES` | `90000` · `2` | timeout per panggilan & jumlah percobaan ulang |
| `ZR_PRICE_IN` · `ZR_PRICE_OUT` | `0` | harga per 1 juta token untuk laporan biaya |
| `ZR_RUNS_DIR` · `ZR_TEAMS_DIR` | `kantor/runs` · `teams` | lokasi penyimpanan |
| `ZR_PORT` | `7868` | port server |
| `ZR_TUTORBOT_DIR` | `~/Desktop/UT/agen-ut` | folder TutorBot (opsional) |

---

## 10. Uji mandiri

```bash
node --test engine/test/*.test.cjs      # 11 uji engine (parsing skill, QA, plan, SSE, prompt)
cd kantor3d && npm run build            # typecheck (tsc --noEmit) + build tampilan 3D
```

---

## 11. Kalau ada masalah

| Gejala | Sebab | Solusi |
| --- | --- | --- |
| Status **Gagal** + pesan `koneksi LLM gagal` | gateway model mati | jalankan `9router`, cek `curl localhost:20128/v1/models` |
| Tombol Jalankan ditolak, `NO_CREDENTIALS` | `ZR_API_KEY` kosong | isi `.env`, lalu **restart** `node server.cjs` |
| Halaman depan menampilkan "belum dibangun" | `kantor3d/dist` belum ada | `cd kantor3d && npm install && npm run build` |
| `EADDRINUSE` saat start | port 7868 dipakai proses lain | hentikan proses itu atau pakai `ZR_PORT=7900 node server.cjs` |
| `GAGAL: maksimal N tugas` | model merencanakan tugas melebihi batas | naikkan `--max-tasks` atau `ZR_MAX_TASKS` |
| Run berakhir `needs_attention` | gerbang QA menolak | buka `QUALITY.md`, perbaiki brief/kriteria, jalankan ulang |
| Kantor 3D kosong / hitam | WebGL tidak aktif di browser | coba browser lain, atau pakai `/live` |
| Perubahan tampilan tidak muncul | dist basi | `npm run build` lalu muat ulang halaman |

---

## 12. Menyesuaikan kantor

- **Menambah/mengubah jabatan & skill** — edit
  [`struktur_organisasi_dan_tata_letak_kantor_ai.md`](struktur_organisasi_dan_tata_letak_kantor_ai.md).
  Engine mem-parse dokumen itu tiap run, jadi prompt agen ikut berubah tanpa kode baru.
- **Menyegarkan folder tim & proyek** — `node tools/gen-folders.cjs`
  (sumbernya blok `zr-data` di `kantor-lama/index.html`).
- **Model berbeda per tahap** — isi `ZR_PLAN_MODEL`, `ZR_WORK_MODEL`, `ZR_REVIEW_MODEL`.
- **Menghapus arsip kantor lama** — hapus folder `kantor-lama/` dan rute `/office.html`
  di `server.cjs` bila tidak diperlukan.

---

## 13. Keamanan & privasi

- Server hanya bind `127.0.0.1`; `.env`, `.git`, `.freebuff`, dan `node_modules`
  tidak pernah disajikan.
- Akses berkas artefak dinormalisasi dan dibatasi di dalam folder proyek.
- Teks tujuan **tidak** dieksekusi sebagai perintah shell. Satu-satunya eksekusi
  eksternal adalah TutorBot dengan daftar perintah read-only.
- `prompts.ndjson` memuat ringkasan dokumen tim Anda — perlakukan `kantor/runs/`
  sebagai data lokal.
- Tidak ada autentikasi: jangan menjalankan server ini di jaringan publik.

---

## 14. Atribusi & lisensi

Scene 3D di `kantor3d/` berasal dari proyek **[ruang](https://github.com/yugienugraha/ruang)**
(lisensi MIT — salinannya ada di [`kantor3d/LICENSE-ruang`](kantor3d/LICENSE-ruang)).
Sumber datanya diganti engine 9router di repo ini. Sisa kode di repo ini adalah milik
pemilik repo.

---

## 15. Batasan jujur

- Satu operator lokal: belum ada auth, multi-tenant, antrean persisten, atau penagihan.
- QA menilai bentuk (bagian lengkap, angka punya asumsi, tidak ada placeholder),
  bukan kebenaran fakta — verifikasi tetap pekerjaan manusia.
- Biaya token hanya terisi bila `ZR_PRICE_IN`/`ZR_PRICE_OUT` diisi.
- Tampilan 3D memerlukan langkah build; `dist/` tidak ikut di-commit.
- Kualitas akhir bergantung pada model yang Anda pilih.
