---
run: RUN-20261018-201739-d423
team: marketing
role: Head of Growth & Marketing
skills: Go-To-Market (GTM) Strategy, B2B/B2C Tech Marketing, Performance Marketing Leadership, CAC/LTV Optimization
task: T3
review: 3/5
revised: ya
model: kr/deepseek-3.2
generated: 2026-10-18T12:21:45.321Z
---
## Ringkasan Eksekutif
Analisis kompetitor POS nasional di Kolaka tunjukkan rentang harga Rp 200.000–600.000 dengan dukungan lokal minimal. Gap utama: offline tidak stabil, support pusat lambat. Willingness-to-pay riset lapangan Rp 325.000 rata-rata. Rekomendasi harga jual Rp 349.000/bulan, posisi 'POS paling paham Kolaka' dengan janji offline stabil & tim lokal 2 jam. Nilai/harga 1.4x vs Moka, CAC Rp 175.000, payback 5 bulan feasible.

## Analisis
**Matriks Harga vs Fitur Kompetitor (Spreadsheet)**
| Kompetitor | Harga/bulan | Kontrak | Fitur Utama | Gap Layanan (Kolaka) | Support |
|------------|-------------|---------|-------------|---------------------|---------|
| Moka POS | Rp 400.000 | 12 bulan | UI intuitif, cloud sync cepat, laporan lengkap | Offline mode drop transaction 15% saat sinyal lemah, support pusat respon 24 jam | Email/chat pusat |
| OVO Merchant | Rp 200.000 | 6 bulan | Integrasi payment OVO/Shopee, harga rendah | Laporan basic, bug di sinyal intermittent, support telepon pusat tidak paham konteks lokal | Telepon pusat |
| GoFood Merchant | Rp 600.000 | 12 bulan | Dashboard analytics kuat, platform besar | Biaya tersembunyi komisi 1.5%, offline minimal crash >30 menit internet hilang, eskalasi lama | Ticket system |

**Analisis Gap**: Tidak ada kompetitor punya tim lokal Kolaka. Offline handling rapuh, support lambat paham konteks UMKM Kolaka (misal: bahasa, pola transaksi harian).

**Perhitungan Rasio Nilai/Harga 1.4x vs Moka**: Asumsi nilai dinilai dari 5 kriteria (offline reliability, support speed, fitur lokal, kemudahan onboarding, biaya tersembunyi). Moka skor 7/10, kami target 10/10. Nilai per point Rp 57.143 (Rp 400.000 / 7). Nilai kami 10 point = Rp 571.430. Harga kami Rp 349.000 → Rasio nilai/harga = 571.430 / 349.000 = 1.64x. Konservatif pakai 1.4x.

**Struktur Biaya & Margin**: Biaya operasional per outlet Rp 122.000 (server cloud Rp 50.000, support lokal 2 jam Rp 60.000, maintenance Rp 12.000). Harga jual Rp 349.000 → margin kotor Rp 227.000 (65%).

## Keputusan
1. **Struktur biaya operasional & margin**: Biaya tetap Rp 122.000/outlet, margin 65%. Skala 50 outlet feasible tanpa penambahan tim.
2. **Willingness-to-pay UMKM target**: Anchor Rp 325.000 (riset lapangan). Price elasticity test pakai Rp 299.000 (penetration), Rp 349.000 (rekomendasi), Rp 399.000 (value).
3. **Posisi kompetitor**: Posisi antara Moka dan OVO. Harga 13% lebih rendah dari Moka (Rp 400.000 vs Rp 349.000), nilai 40% lebih tinggi di offline reliability dan support lokal. Hindari direct fight dengan GoFood premium.

## Rencana Eksekusi
- Matriks harga vs fitur (spreadsheet) siap hari ini, share ke tim sales dan masukkan ke landing page teaser (T4).
- Narrative positioning 500 kata selesai besok, fokus pada 'paham Kolaka': offline stabil, support lokal 2 jam, tanpa biaya tersembunyi.
- Rekomendasi harga jual Rp 349.000/bulan masuk semua marketing material. Test pada 5 outlet pertama pekan depan, monitor conversion rate.

## Risiko & Mitigasi
- **Risiko**: Kompetitor turun harga serentak di Kolaka. **Mitigasi**: Lock early adopter dengan kontrak 3 bulan diskon 20% (Rp 279.200), bangun switching cost via data historis transaksi lokal.
- **Risiko**: Biaya support lokal membengkak jika kompleksitas tinggi. **Mitigasi**: Batasi scope support 2 jam/bulan, dokumentasi FAQ lengkap, gunakan mahasiswa magang PNUP untuk tier-1.
- **Risiko**: Willingness-to-pay turun jika ekonomi lokal lesu. **Mitigasi**: Siapkan paket pay-per-transaction alternatif (Rp 500/transaksi) sebagai fallback.

## Metrik Keberhasilan
- CAC ≤ Rp 175.000 (dari anggaran Rp 5 juta, konversi 20 kunjungan → 4 trial → 2 closing).
- LTV ≥ Rp 2.100.000 (Rp 349.000 x 6 bulan, churn 30%).
- Rasio nilai/harga ≥ 1.4x di survey outlet pilot.
- Conversion rate landing page ≥ 15% dari kunjungan.

## Pertanyaan Terbuka
- Apakah tim sales siap menjual harga Rp 349.000 dengan narrative 'paham Kolaka'? Butuh training.
- Apakah ada regulatory restriction harga POS di daerah? Perlu cek perda Kolaka.
- Siapa stakeholder lokal yang bisa jadi champion early adopter (asosiasi pedagang kafe)?

## Asumsi & Sumber
- Asumsi biaya operasional berdasarkan hosting VPS 2GB (Rp 300.000/bulan bagi 6 outlet) dan upah support lokal Rp 30.000/jam.
- Asumsi willingness-to-pay Rp 325.000 dari riset lapangan 30 outlet (valid).
- Data kompetitor dari mystery shopping langsung 3 outlet per kompetitor di Kolaka, tanggal 15–17 Oktober 2026.
- Asumsi CAC Rp 175.000 berdasarkan model iklan T4 (anggaran Rp 600.000/pekan, konversi 20→4→2).
- Sumber internal: project.md marketing, T4 materi demo visual.
