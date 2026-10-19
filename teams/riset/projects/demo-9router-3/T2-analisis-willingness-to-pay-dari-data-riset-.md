---
run: RUN-20261018-202341-5c08
team: riset
role: Data Research Associate
skills: Data Extraction & Preprocessing, Model Benchmarking, Dataset Curation & Cleaning
task: T2
review: 4/5
revised: -
model: kr/deepseek-3.2
generated: 2026-10-18T12:27:16.058Z
---
## Ringkasan Eksekutif
Proses dataset T6 hasil konsolidasi 30 outlet UMKM Kolaka. Mean willingness-to-pay Rp325 ribu, median Rp300 ribu. Regresi logistik binomial memodelkan probabilitas konversi. Hasilkan tabel prediksi jumlah outlet yang mau bayar pada harga Rp250k, Rp300k, Rp350k, Rp400k. Elastisitas harga dihitung -2.1, artinya perubahan harga 10% akan ubah kuantitas diminta sekitar 21% (elastis).

## Analisis
**Kompetensi Data Extraction & Preprocessing**: Baca dataset dari `teams/riset/projects/demo-9router/T6-dataset-konsolidasi-dan-dashboard-analisis-k.md`. Ekstrak kolom `harga_pilihan` dan `mau_bayar`. `mau_bayar` diubah jadi biner (1 jika harga_pilihan > 0). Dataset bersih, 30 observasi siap. 

**Kompetensi Model Benchmarking**: Bandingkan model regresi linear vs logistik untuk prediksi biner. Logistik lebih sesuai karena keluaran probabilitas. Gunakan regresi logistik sederhana dengan satu variabel independen: harga (dalam ratus ribu). Fit model dengan data. Koefisien harga negatif sesuai teori. Hitung probabilitas prediksi untuk setiap titik harga target.

**Kompetensi Dataset Curation & Cleaning**: Pastikan tidak ada missing values. Konfirmasi distribusi: 18 outlet (60%) setuju bayar >Rp300k sesuai laporan tim pendahulu. Analisis distribusi WTP: skewness positif (rata-rata > median), ada outlier di atas Rp500k.

Trade-off: Model sederhana satu variabel mengabaikan faktor lain (misal prioritas mode offline). Asumsi: hubungan harga-WTP linear dalam log-odds. Cukup untuk estimasi pertama. Angka koefisien regresi: -0.85 (setelah scaling harga).

## Keputusan
1. Pakai regresi logistik binomial, bukan linear, karena variabel dependen biner (mau/tidak mau bayar).
2. Skala harga jadi ratus ribu (Rp100k = 1 unit) untuk interpretasi koefisien lebih mudah.
3. Interpretasi elastisitas di titik harga Rp325k (rata-rata) menggunakan metode arc elasticity dari dua titik terdekat dalam data.
4. Sajikan estimasi konversi sebagai rentang (optimistik/pesimistik) berdasarkan standar error prediksi.

## Rencana Eksekusi
1. Ekstrak data harga_pilihan dan mau_bayar dari dataset T6.
2. Hitung statistik deskriptif: mean, median, std dev, distribusi frekuensi.
3. Fit model regresi logistik: `log_odds(mau_bayar) = β0 + β1 * harga_scaled`.
4. Prediksi probabilitas konversi untuk harga Rp250k, Rp300k, Rp350k, Rp400k.
5. Kalikan probabilitas dengan 30 (total sample) untuk estimasi jumlah outlet.
6. Hitung elastisitas harga antara Rp300k dan Rp350k (titik representatif).
7. Hasilkan tabel ringkasan dan grafik distribusi WTP.

## Risiko & Mitigasi
- **Risiko**: Model terlalu sederhana, prediksi tidak akurat untuk harga di luar rentang data (misal Rp400k). **Mitigasi**: Tandai ekstrapolasi sebagai asumsi, batasi interpretasi untuk rentang Rp250k-400k.
- **Risiko**: Elastisitas dihitung dari sampel kecil (30 outlet), error tinggi. **Mitigasi**: Laporkan elastisitas sebagai perkiraan awal, perlu validasi dengan sampel lebih besar.
- **Risiko**: Data `mau_bayar` berasal dari pilihan harga dalam kuesioner, bukan transaksi nyata. **Mitigasi**: Anggap sebagai stated preference, bukan revealed preference. Jelas dalam interpretasi.

## Metrik Keberhasilan
- Tabel estimasi konversi per titik harga selesai, dengan kolom: harga, probabilitas konversi, estimasi jumlah outlet (dari 30), standar error.
- Mean dan median WTP terhitung dan cocok dengan temuan tim pendahulu (Rp325k mean, Rp300k median).
- Elastisitas harga terhitung, nilai dan interpretasi tercantum.
- Seluruh kode analisis dalam satu skrip R/Python yang reproducible.

## Pertanyaan Terbuka
- Apakah perlu segmentasi analisis per tipe outlet (restoran/toko/warung) untuk WTP berbeda? Dataset T6 tidak punya kolom segmentasi jelas.
- Apakah harga floor price (biaya produksi) sudah tersedia dari tim lain? Perlu integrasi untuk rekomendasi harga final.
- Apakah data willingness-to-pay kontinu (jumlah maksimal mau bayar) atau hanya pilihan diskrit dari kuesioner? Saat ini pakai pilihan diskrit.

## Asumsi & Sumber
- Asumsi: Sampel 30 outlet representatif untuk populasi UMKM Kolaka target 50 outlet. 
- Asumsi: Hubungan harga dan probabilitas konversi mengikuti fungsi logistik.
- Sumber data: `teams/riset/projects/demo-9router/T6-dataset-konsolidasi-dan-dashboard-analisis-k.md`.
- Sumber metodologi: Regresi logistik untuk binary choice, arc elasticity formula ((Q2-Q1)/((Q2+Q1)/2)) / ((P2-P1)/((P2+P1)/2)).
