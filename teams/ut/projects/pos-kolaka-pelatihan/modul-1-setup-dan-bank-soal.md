# 🎓 POS Kolaka — Modul 1 (Setup & Operasional Dasar) + Bank Soal Sertifikasi

- **Program:** DIR-1 · **Tim:** Dosen_UT · **Lead:** Koordinator Tim Dosen UT
- **Skill terpakai:** Curriculum Design · Learning Assessment · UGC (Public Relations) untuk sesi UMKM
- **Status:** **SELESAI** — materi + asesmen siap untuk sesi tatap muka (mengikuti outline 3 sesi).

## Modul 1: Setup & Operasional Dasar (90 menit)
**Capaian akhir:** peserta bisa menyetel menu, melakukan transaksi, dan membaca laporan **tanpa koneksi internet**.

| Blok | Menit | Materi | Aktivitas |
| --- | ---: | --- | --- |
| 1.1 Data & kepemilikan | 15 | Data tersimpan di perangkat sendiri; backup JSON 1× seminggu | Praktik backup + restore |
| 1.2 Setup menu | 15 | Input produk, harga jual, modal (untuk laba) | Set 10 item menu masing-masing |
| 1.3 Diskon & retribusi | 10 | Tarif retribusi toko 2% khusus sore, tetap 12% (verifikasi petahana) | Simulasi nota gabungan |
| 1.4 Transaksi | 20 | Tunai & QRIS · aturan kembalian · cetak struk | Role-play 5 transaksi |
| 1.5 Mode offline | 15 | Antrian sinkron saat sinyal hilang → kirim ulang otomatis | Simulasi putus internet |
| 1.6 Laporan harian | 10 | Tab Hari Ini / Bulan Ini / Best seller + ekspor CSV | Tolak rekap manual |
| 1.7 Ujian | 5 | Kuis 5 butir + praktek 3 transaksi | Rubrik penilaian |

**Alat bantu:** `mvp-pos-kolaka.html` (praktik hands-on), lembar panduan luring, skrip simulasi “bagaimana kalau sinyal hilang?” dari hasil riset.

## Bank Soal Sertifikasi (Ujian Mini — 20 soal, kelulusan ≥80)
**Bagian A — 10 soal pilihan ganda** (contoh materi):
1. Saat internet mati, transaksi POS Kolaka: (a) berhenti (b) tetap tersimpan lokal ✔ (c) hilang
2. Untuk menghindari kehilangan data, frekuensi minimum backup: (a) tiap hari (b) 1× seminggu ✔ (c) tidak perlu
3. Kembalian tunai dihitung dari: … total dikurangi diskon, ditambah retribusi ✔
4. Laba kotor per item = harga jual − … (modal/biaya) ✔
5. Antrian sinkron saat offline dikirim: (a) segera internet kembali ✔ (b) manual restart (c) tidak bisa
6–10. (skrip: struk, QRIS, best seller, CSV, peran reseller support)

**Bagian B — 10 butir praktik rubrik** (2 poin/butir):
1. Input 10 menu lengkap harga+modal · 2. Transaksi 3 item + diskon · 3. Transaksi QRIS · 4. Cetak struk benar · 5. Simulasi offline → sync · 6. Restore data dari backup · 6. Cek laba bulanan di tab laporan · 8. Ekspor CSV · 9. Tutup kasir harian · 10. Jelaskan 1 keunggulan POS ke pelanggan (komunikasi).

**Butir 2-butir A diganti skenario offline** sesuai temuan survei (bias perangkat lama) setelah hasil survei masuk.

**Progres:** modul 1 ✅ → modul 2 (interpretasi laba-rugi & kas/bon) → modul 3 (pelayanan & kas kelola) menyusul mengikuti `outline-pelatihan-pos-untuk-umkm.md`.