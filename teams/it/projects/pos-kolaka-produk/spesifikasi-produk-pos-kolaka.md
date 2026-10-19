# 💻 POS Kolaka — Spesifikasi Produk Digital POS

- **Program:** DIR-1 · **Tim:** Blok IT-Developer · **Lead:** Lead Software Architect
- **Skill terpakai:** System Architecture · Tech Stack Evaluation · Tech Leadership
- **Status:** Spesifikasi + MVP backlog selesai (2/5) — arsitektur detail, build & pilot menyusul

## 1. Prinsip
Setiap fitur wajib **menjawab satu masalah hasil riset** (rujuk `teams/riset/projects/pos-kolaka-riset-pasar/riset-pasar-dan-masalah-pos-kolaka.md`) — tidak ada fitur tanpa masalah.

## 2. Peta Masalah → Fitur
| Masalah (riset) | Fitur MVP |
| --- | --- |
| Internet buruk → kasir mati | **Offline-first** (DB lokal, antrean sinkron otomatis) |
| Aplikasi lambat/server down | Klien ringan, tanpa dependensi server pusat saat transaksi |
| Data offline berisiko hilang | Backup otomatis berkala + ekspor CSV bulanan |
| Pemilik tak bisa monitor jarak jauh | **Dashboard harian ringkas** (omzet, item terlaris, jam ramai) via HP |
| Kesalahan operator / laporan tak akurat | Alur kasir **≤3 klik**, mode shift, **Z-report harian otomatis** |
| Butuh pendampingan | Onboarding 1 layar (wizard set up menu pertama) |

## 3. Cakupan MVP
1. Kasir offline-first + sinkronisasi (menu, harga, transaksi)
2. Menu & modifikasi (panas/dingin, add-on), manajemen meja
3. Bayar: tunai (kembalian) + **QRIS**
4. Laporan harian: ringkasan omzet, item terlaris, selisih kas
5. Cetak struk Bluetooth/ESC-POS (printer yang beredar di pasaran lokal)
6. Multi-kasir + hak akses pemilik (diskon/refund)

**Pasca-MVP:** stok berbasis resep, loyalitas, multi-outlet, integrasi delivery.

## 4. Arsitektur ringkas
Klien Android/web ringan (DB lokal) → API REST tenant-per-outlet → adaptor QRIS (payment gateway lokal) → laporan & dashboard pemilik.

## 5. Milestone
M1 spesifikasi+desain UI (Designer) → M2–M3 inti kasir+laporan → M4 QRIS+print → M5 uji internal → M6 pilot 1–2 kafe Kolaka.

## 6. Risiko
Koneksi daerah (mitigasi: offline-first = syarat utama) · kompetitor mapan (mitigasi: keunggulan lokal dari riset) · adopsi digital rendah (mitigasi: pendampingan UT/PNUP).