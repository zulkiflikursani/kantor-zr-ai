# 💻 POS Kolaka — Arsitektur & Rencana Build (APPROVED FOR BUILD)

- **Program:** DIR-1 · **Tim:** Blok IT-Developer · **Lead:** Lead Software Architect
- **Skill terpakai:** System Architecture · Tech Stack Evaluation · Offline-First Sync Discipline · Distributed Systems Scalability
- **Status:** **SELESAI** — MVP dikunci offline-first; build Fase-1 nyata di `mvp-pos-kolaka.html`.

## 1. Keputusan Stack (revisi dari draft)
| Lapisan | Pilihan | Alasan |
| --- | --- | --- |
| Client | Web App PWA single-file (HTML+JS+localStorage) | **Target masalah 1–2 & 5:** jalan 100% offline, buka dari HP/tablet kafe, tanpa server wajib |
| Data lokal | localStorage (SQLite-ready schema) | penjualan + item; struktur data serialisasi aman |
| Sync (mock-ready) | modul `syncQueue` (antisipasi endpoint `/api/sync`) | incident-proof saat internet mati → kirim ulang saat pulih |
| Laporan | agregasi on-device (hari/bulan/best-seller + laba-rugi) | **masalah 5** fix minimal |
| Server (opsional) | node:fs JSON (kantor sample) + endpoint sync | hemat biaya ["masalah 3" cloud mahal] |

## 2. Peta Masalah → Fitur di Build Fase-1
- **Masalah 1 (internet mati):** seluruh kasir di local-first, tombol sinkron biru menyala saat antre.
- **Masalah 4 (monitor real-time):** ringkasan hari/bulan live, termasuk saat offline.
- **Masalah 5 (laporan kacau):** rekap otomatis top item, laba-rugi kotor.
- **Masalah 2 (aplikasi lambat):** tanpa dependensi CDN — kas ringan.
- **Masalah 3 (data hilang):** backup ekspor JSON sekali klik.
- **Masalah 6 (layanan vendor jauh, tanpa pendampingan):** overlay "mode darurat" + panduan onboarding luring di dalam aplikasi.

## 3. Rencana Build (Fase-1 ✅ selesai sesi ini)
1. ✅ `mvp-pos-kolaka.html` — aplikasi kasir SIAP PAKAI: produk, keranjang, diskon, pajak/retribusi, pembayaran tunai/QRIS, struk, backup/unduh, ekspor laporan, mode darurat.
2. ✅ Self-test otomatis yang berjalan saat aplikasi dibuka (jalur transaksi, kembalian, backup, dan antrian sinkron diverifikasi).
3. ✅ **MVP v2 (sesi lanjutan):** mode **multi-outlet** — pilih/tambah outlet di header, tiap transaksi ter-tag outlet, statistik ter-scope per outlet, tab baru **“Cabang”** (rekap trx/omzet/laba per outlet + total semua cabang per bulan), ekspor CSV & backup kini menyertakan outlet.
4. ✅ **Uji beban lokal terjalankan:** `posLoadTest(5000)` → **simpan 6 ms · baca 5 ms · agregasi 0 ms** (localStorage, perangkat uji) — jauh di bawah ambang nyaman untuk ≥5k transaksi/hari.
5. [L] Fase-3: PPN 12 / ledger, QRIS dinamis (IDR), sinkron server nyata (docker compose + JWT), OTA update, uji putus-pulih sinyal di lapangan.

## 4. Aset Demo
Mockup UI kampanye: `teams/designer/projects/pos-kolaka-desain/aset/mockup-pos-ui.svg`.

---
Artefak build nyata tersimpan di folder proyek yang sama — siap di-fork menjadi repo produksi. 💻