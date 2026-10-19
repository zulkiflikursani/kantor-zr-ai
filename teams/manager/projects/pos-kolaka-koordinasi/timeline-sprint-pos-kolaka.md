# 👔 POS Kolaka — SCHEDULE PENGERJAAN (REVISI) — Sampai Selesai

- **Program:** DIR-1 · **Tim:** Blok Manager · **Lead:** General / Operational Manager
- **Skill terpakai:** Cross-Functional Operational Efficiency · KPI Management · Resource Allocation
- **Revisi:** dibuat ulang atas instruksi Direksi — semua tugas dipetakan sampai tuntas, urutan kerja jelas, status jujur (eksekusi lapangan dipisah dari kerja internal).

## Cara membaca schedule
**[E]** = dikerjakan otak Freebuff (produk dokumen/kode/aset — selesai pada fase berjalan)
**[L]** = eksekusi lapangan/dunia nyata (butuh tim manusia &/atau persetujuan/anggaran Direksi)

---

## FASE 0 — Fondasi (SELESAI ✅)
| Tim | Keluaran | Status |
| --- | --- | --- |
| Riset | riset-pasar-dan-masalah-pos-kolaka.md (6 masalah POS → keunggulan) | ✅ |
| Marketing | strategi-customer-dan-model-iklan.md (5 kanal + funnel) | ✅ |
| IT | spesifikasi-produk-pos-kolaka.md (peta masalah→fitur, MVP) | ✅ |
| Keuangan | model-harga-dan-anggaran.md (HPP,3 paket) | ✅ |
| Designer | brief-kampanye-pos-kolaka.md (konsep "Kasir Tak Kenal Mati Sinyal") | ✅ |
| Receptionis | database-prospect-dan-jadwal-kunjungan.md (struktur 30 outlet, skrip) | ✅ |
| UT | outline-pelatihan-pos-untuk-umkm.md (kurikulum 3 sesi) | ✅ |
| PNUP | rencana-pendampingan-vokasi.md | ✅ |
| Direksi | brief-direksi-pos-kolaka.md (positioning disahkan) | ✅ |

## FASE 1 — Eksekusi Internal [E] (dikerjakan sekarang, dijadwalkan sehari)
| Urut | Tim | Tugas | Keluaran | Status |
| --- | --- | --- | --- | --- |
| 1 | Manager | Buat ulang schedule ini | dokumen ini + `log-standup-dan-tracking.md` | ✅ |
| 2 | Keuangan | Cashflow 3 bulan + unit economics | `cashflow-dan-unit-economics.md` | ✅ |
| 3 | Marketing | Anggaran iklan final + KPI | `anggaran-iklan-final-dan-kpi.md` | ✅ |
| 4 | IT | Arsitektur & rencana build | `arsitektur-dan-rencana-build.md` | ✅ |
| 5 | IT | **Build MVP POS (kode nyata, jalan)** | `mvp-pos-kolaka.html` (app kasir offline-first) | ✅ |
| 6 | Designer | Panduan brand + feed seri 1 + mockup UI | `panduan-brand.md` + `aset/` (SVG) | ✅ |
| 7 | Riset | Instrumen survei + daftar prospect draft | `instrumen-survei-dan-prospect-draft.md` | ✅ |
| 8 | UT | Modul 1 + bank soal sertifikasi | `modul-1-setup-dan-bank-soal.md` | ✅ |
| 9 | PNUP | Shortlist lokasi uji coba & kandidat mitra | `shortlist-lokasi-uji-coba-dan-mitra.md` | ✅ |
| 10 | Direksi | Review Fase 0–1 + keputusan go/no-go | `review-go-no-go-POS-KOLAKA.md` | ✅ |
| 11 | Manager+Direksi | Laporan akhir program | `laporan/LAPORAN-FINAL-FASE1-POS-KOLAKA.md` | ✅ |

## FASE 2 — Eksekusi Lapangan [L] (SETELAH persetujuan/anggaran Direksi)
| Urut | Tim | Tugas | Prasyarat | Estimasi |
| --- | --- | --- | --- | --- |
| L1 | Riset | Survei & wawancara 30 outlet (kuesioner sudah jadi) | jadwal kunjungan (Receptionis) | pekan 3 |
| L2 | Riset+Marketing | Daftar prospect **terverifikasi** (WA/telepon valid) | L1 | pekan 3 |
| L3 | Receptionis+Marketing | Jalankan kunjungan door-to-door + aktivasi trial 14 hari | L1–L2, demo tablet |pekan 3–4 |
| L4 | Designer+Marketing | Tayangkan aset iklan (posting & spanduk) | anggaran disetujui | pekan 4 |
| L5 | IT | Pilot MVP di 1–2 kafe Kolaka | L3 (outlet relawan) | pekan 5 |
| L6 | UT+PNUP | Pelatihan operator + pendampingan trial | L3 | pekan 5 |
| L7 | PNUP | Laporan pendampingan 3 kasus | L6 | pekan 6 |
| L8 | Direksi | Review akhir: scale-up / pivot / hold | seluruh data | pekan 6 |

## Milestone Keputusan
- **Awal pekan 4:** trial ≥10 & prospect terverifikasi ≥20 → **GO** iklan & pilot.
- **Jika <5 trial:** **HOLD** — perdalam pesan/kanal (Riset+Marketing) sebelum belanja iklan.

## Ritme & Transparansi
Standup log di `log-standup-dan-tracking.md` + **log live** `kantor/state.json` (ticker & feed UI); banner otak Freebuff di UI menampilkan status kerja real-time agar tidak ada misinformasi. Progres checklist ter-sinkron di `zr-data` → regenerasi `node tools/gen-folders.cjs`.

---
Dibuat ulang oleh otak Freebuff atas instruksi Direksi — semua tugas Fase 1 dikerjakan sampai selesai pada sesi ini.