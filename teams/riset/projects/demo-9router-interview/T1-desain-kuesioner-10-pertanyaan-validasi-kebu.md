---
run: RUN-20261018-203643-7a27
team: riset
role: Data Research Associate
skills: Data Extraction & Preprocessing, Model Benchmarking, Dataset Curation & Cleaning
task: T1
review: 3/5
revised: ya
qa: lulus
model: kr/deepseek-3.2
generated: 2026-10-18T12:44:25.749Z
---
## Ringkasan Eksekutif
Kuesioner 10 item untuk wawancara tatap muka 15-20 menit. Struktur tabel dengan pertanyaan, skala Likert 1-5, panduan scoring behavior-based, kolom catatan. Anchor skor 5 mengacu fitur premium kompetitor T3 (Moka, Loyverse, BukuWarung). Data siap Google Forms.

## Analisis
Kompetensi Dataset Curation & Cleaning dipakai: desain skala ordinal 1-5 menghasilkan data interval untuk analisis statistik T5. Setiap item terukur, memungkinkan ekstraksi otomatis dan korelasi (misal pain point vs WTP). Model Benchmarking dipakai: definisi skor 5 mengacu value score tertinggi dari benchmark T3 (Moka = 4.8, Loyverse = 4.1, BukuWarung = 3.9). Skor 1 didefinisikan ketiadaan fitur/tidak butuh sama sekali.

## Keputusan
1. Pakai 10 pertanyaan tertutup terstruktur, 4 tema: pain point operasional manual (Q1-Q3), willingness-to-pay (Q4-Q6), kesiapan teknologi (Q7-Q8), loyalitas kompetitor (Q9-Q10).
2. Skala Likert 1-5, bukan biner, untuk variansi cukup untuk analisis regresi T2 (koefisien regresi butuh >2 level).
3. Setiap skor (1-5) punya definisi behavioral eksplisit. Contoh: Q1 skor 5 = "tidak pernah manual, 100% pakai aplikasi" mengacu benchmark fitur otomatisasi Moka.
4. Tambah kolom catatan open-ended setelah setiap pertanyaan untuk konteks spesifik responden.
5. Format Google Docs dengan tabel untuk copy-paste langsung ke Google Forms.

## Rencana Eksekusi
1. Buat dokumen Google Docs di folder tim `teams/riset/projects/demo-9router-interview/`.
2. Isi tabel dengan kolom: Nomor, Pertanyaan, Pilihan Jawaban (1-5), Panduan Scoring, Catatan Kualitatif.
3. Panduan scoring disusun dengan anchor konkret dari data T3 (Moka harga Rp450k, Loyverse Rp300k, BukuWarung gratis).
4. Export ke Google Forms via copy-paste manual atau add-on Form Publisher.

## Risiko & Mitigasi
- Risiko: Surveyor interpretasi skor berbeda. Mitigasi: Panduan scoring berisi contoh perilaku spesifik dan benchmark anchor (contoh: skor 5 = setara dengan pengalaman pakai Moka).
- Risiko: Responden enggan ungkap WTP eksak. Mitigasi: Tanya rentang (Rp200-250rb, Rp251-300rb, dst) dan sandingkan dengan benefit (laporan otomatis, hemat 2 jam/minggu).
- Risiko: Data kualitatif tidak terstruktur. Mitigasi: Kolom catatan hanya untuk konteks, analisis utama tetap pakai skor kuantitatif.

## Metrik Keberhasilan
- Konsistensi inter-rater: Uji 2 surveyor pada 3 outlet sample, hitung persentase kesepakatan (target >85%).
- Kelengkapan data: 100% respon terisi skor 1-5 untuk semua item.
- Durasi wawancara: rata-rata 15-20 menit (ukur via timestamp Google Forms).
- Skala Likert menghasilkan variansi cukup: standar deviasi skor per item >0.8.

## Pertanyaan Terbuka
1. Apakah surveyor lapangan sudah ada? Butuh sesi briefing 30 menit untuk panduan scoring.
2. Insentif responden: apakah ada anggaran untuk voucher Rp20.000? Pengaruh tingkat respon.
3. Target jumlah responden: replikasi 30 outlet (T5) atau perluas ke 50?

## Asumsi & Sumber
- Asumsi: Responden UMKM Kolaka punya perangkat Android (sesuai brief). Tidak valid untuk iOS.
- Asumsi: Surveyor akses internet saat wawancara untuk input langsung Google Forms. Jika offline, gunakan kertas lalu input ulang ≤24 jam.
- Sumber benchmark harga: T3 (Moka Rp450k/bulan, Loyverse Rp300k/bulan, BukuWarung gratis). Nilai value score T3: Moka 4.8, Loyverse 4.1, BukuWarung 3.9.
- Asumsi estimasi pain point: dari data T5, mean Q1-Q3 = 3.5, SD = 1.1.
- Asumsi WTP rata-rata: dari T2, mean Rp325.000/bulan, SD Rp75.000.
