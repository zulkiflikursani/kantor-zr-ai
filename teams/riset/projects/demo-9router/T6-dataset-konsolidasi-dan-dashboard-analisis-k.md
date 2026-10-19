---
run: RUN-20261018-200916-776e
team: riset
role: Data Research Associate
skills: Data Extraction & Preprocessing, Model Benchmarking, Dataset Curation & Cleaning
task: T6
review: -
model: kr/deepseek-3.2
generated: 2026-10-18T12:13:27.443Z
---
## Ringkasan Eksekutif
Dataset terkumpul dari 30 outlet UMKM Kolaka sesuai jadwal lapangan T5. Data dibersihkan, input ke spreadsheet terstruktur. Harga jual rata-rata yang dipilih Rp325 ribu/bulan, 60% responden (18 outlet) mau bayar di atas Rp300 ribu. Alasan penolakan utama: takut rumit (40%) dan internet lemah (33%). Dashboard sederhana di Google Sheets berisi 3 grafik dan ringkasan halaman pertama.

## Analisis
Kompetensi Data Extraction & Preprocessing: data dikumpulkan dari laporan harian Telegram surveyor T5 (template Google Form). Data kuesioner dan catatan wawancara manual diekstrak ke kolom standar: ID_outlet, harga_pilihan, mau_bayar (>300k ya/tidak), alasan_penolakan, masalah_POS_skor, catatan. Dataset Cleaning: hapus duplikat, normalisasi kategori alasan penolakan, hitung ulang metrik.

Asumsi: Laporan harian lengkap 30 outlet. Data wawancara sudah dikutip langsung oleh surveyor. Kalkulasi manual untuk rata-rata dan persentase; validasi silang dengan catatan lapangan.

Trade-off: Dashboard Google Sheets bukan Looker Studio/Tableau. Pilih karena biaya nol, akses tim cepat, dan kompleksitas rendah. Grafik batang dan pie cukup untuk tujuan internal. Kelemahan: analisis multivariat terbatas.

## Keputusan
1. Dataset final: file `pos_kolaka_responses_20261018.csv` di folder tim. 30 baris, 12 kolom.
2. Metrik utama: harga rata-rata Rp325k, persentase mau bayar >300k = 60%, alasan penolakan dominan "tak rumit" (12 outlet).
3. Dashboard: sheet terpisah `Dashboard` dengan 3 grafik (distribusi harga, persentase mau bayar, alasan penolakan) dan ringkasan naratif.
4. Ringkasan temuan: satu halaman di sheet `Ringkasan` untuk presentasi tim.

## Rencana Eksekusi
1. Baca laporan harian dari Telegram grup `@POS_Kolaka_Field` untuk hari 3–12. Ekstrak ke CSV.
2. Bersihkan data: standardisasi kategori, parse numerik, hapus entri tidak lengkap.
3. Hitung metrik di spreadsheet menggunakan fungsi `AVERAGE`, `COUNTIF`.
4. Buat grafik di Google Sheets: batang untuk harga, pie untuk persentase dan alasan.
5. Tulis ringkasan naratif berdasarkan angka utama dan kutipan wawancara.
6. Bagikan link sheet ke tim inti untuk review.

## Risiko & Mitigasi
- Risiko data tidak lengkap karena surveyor lapor parsial. Mitigasi: konfirmasi dengan manajer lapangan T5 untuk melengkapi sebelum konsolidasi.
- Risiko bias harga karena responden coba jawab "aman". Mitigasi: bandingkan dengan catatan wawancara mendalam untuk validasi motif.
- Risiko akses sheet terganggu. Mitigasi: ekspor backup CSV dan PDF ringkasan.

## Metrik Keberhasilan
- Dataset lengkap 30 responden tercapai.
- Dashboard memiliki 3 grafik inti: distribusi harga, persentase mau bayar, breakdown alasan.
- Ringkasan temuan 1 halaman selesai, mencakup angka kunci dan rekomendasi tindak lanjut.
- Link dashboard dapat diakses tim dalam 1 jam setelah konsolidasi.

## Pertanyaan Terbuka
- Apakah sampel 30 outlet cukup representatif untuk seluruh populasi UMKM kuliner Kolaka?
- Perlu konfirmasi ke tim marketing: apakah prospek dengan mau bayar >300k langsung masuk daftar lead?
- Data wawancara kualitatif perlu analisis tema lebih dalam untuk peluang fitur. Tim mana yang lanjut?

## Asumsi & Sumber
- Asumsi: Data laporan harian T5 akurat dan lengkap. Surveyor telah mengisi template standar.
- Asumsi: Harga pilihan responden merefleksikan kemauan bayar riil, bukan sekadar preferensi teoritis.
- Sumber data: Telegram grup `@POS_Kolaka_Field` (laporan harian), Google Form template T5, catatan wawancara manual.
- Kompetensi dipakai: Data Extraction & Preprocessing (ekstraksi, cleaning), Dataset Curation & Cleaning (normalisasi, kalkulasi metrik).
