# Kantor AI 3D

Kantor visual 3D yang **digerakkan engine 9router** di repo ini. Dibuka di
`http://127.0.0.1:7868/` (atau `/3d/`) setelah `npm run build`.

## Dari mana asalnya

Scene (gedung, perabot, karakter, tata letak, lantai 2, jalan-jalan saat siaga)
diambil dari proyek **`ruang`** (MIT — lihat [LICENSE-ruang](LICENSE-ruang)):
`office3d-layout.ts`, `agents.ts`, `office-state.ts`, `scene3d/*`, `pages/Office3D.tsx`.
Repo `ruang` sendiri sudah dihapus dari mesin ini karena ia **viewer baca-saja** yang
hanya membaca CLI `hermes` dan tidak punya tempat untuk API key/endpoint — jadi ia tidak
bisa dijalankan dengan 9router. Yang dipertahankan hanya scene-nya, dan sumber datanya
diganti engine 9router di repo ini.

## Sumber data

`GET /api/office3d` (di `server.cjs`) memetakan event run nyata ke posisi kru:

| Status | Asal | Perilaku di scene |
| --- | --- | --- |
| `Working` | `task.start` / `artifact.ready` | duduk di meja, balon bicara berisi judul tugas |
| `Reviewing` | `review.ready` | tetap di meja dengan status review |
| `Idle` | tim tanpa tugas aktif | pindah ke lounge / lantai 2 dan berjalan-jalan sendiri |
| `Offline` | tidak dipakai (semua tim engine hidup) | — |

Tidak ada status yang dikarang di frontend: header, HUD, balon bicara, dan log semuanya
berasal dari `kantor/runs/<id>/` run terakhir.

## Inspektur instruksi

Klik **kru** di panel kanan, label namanya di scene, atau **mejanya** di lantai 1; panel detail
menampilkan *Instruksi ke model* untuk tugas yang sedang dipegang tim itu. Isinya prompt asli
yang dikirim engine (`system prompt` berisi jabatan + matriks kompetensi, lalu `pesan user`
berisi tujuan, brief tugas, kriteria penerimaan, dan hasil tim pendahulu) — bukan rekonstruksi
UI. Setiap percobaan punya labelnya sendiri: **Kerja**, **Revisi — gerbang QA**,
**Revisi — temuan reviewer**, **Review**, dan **Rencana (CEO + Manager)**.

Sumbernya `kantor/runs/<id>/prompts.ndjson` yang ditulis `engine/orchestrator.cjs`, dibaca
lewat `GET /api/runs/:id/prompts` (di-cache per run di browser). Run yang dijalankan sebelum
perekaman aktif tidak punya berkas itu, dan panel menjelaskannya apa adanya.

## Perintah

```bash
npm install         # sekali
npm run build       # typecheck (tsc --noEmit) + vite build ke dist/
npm run dev         # dev server di 127.0.0.1:5174 (perlu proxy API sendiri)
npm run typecheck
```

Di produksi lokal frontend disajikan `node server.cjs` (bukan `vite preview`), karena
`/api/*` hidup di server yang sama.

## Kontrol

- Seret = putar · seret kanan / dua jari = geser · gulir = zoom · Page Up/Down = ganti lantai.
- **💤 Tidur** mengirim semua kru siaga ke kamar lantai 2; **✥ Geser** menukar mode seret;
  **↺ Reset view** mengembalikan kamera.
- Tombol ☾/☀ di header mengganti siang/malam (malam menyalakan lampu kantor).
