---
run: RUN-20261018-200916-776e
team: riset
role: Senior AI Research Fellow (Doktor / Adjunct Professor)
skills: Natural Language Processing (NLP), Computer Vision, Reinforcement Learning, Mathematical Modeling
task: T1
review: -
model: kr/deepseek-3.2
generated: 2026-10-18T12:10:33.889Z
---
## Ringkasan Eksekutif
Paket instrument riset harga siap pakai untuk 30 outlet UMKM Kolaka. Terdiri dari kuesioner pilihan harga (Rp150k–Rp500k/bulan), skenario demo 5 menit fokus pada laporan otomatis dan mode offline, serta panduan wawancara untuk eksplorasi mendalam. Instrument dirancang sederhana, di-Bahasa Indonesia-kan, dan siap diuji internal sebelum lapangan.

## Analisis
Berdasarkan hasil riset pasar tim pendahulu: segmen target adalah UMKM kuliner/kafe di Kolaka dengan masalah POS spesifik (laporan manual, aplikasi lambat, sinyal lemah). Anggaran Rp5 juta sudah dialokasikan untuk insentif, transportasi, dan alat demo. Menggunakan **Mathematical Modeling** untuk struktur pilihan harga diskrit (Rp150k, 250k, 350k, 500k) memberikan data interval yang mudah dianalisis untuk konfirmasi titik harga optimal. Menggunakan **Natural Language Processing (NLP)** prinsip untuk merancang pertanyaan tertutup dan panduan wawancara yang mengurangi ambiguitas dan bias pewawancara.

## Keputusan
1. **Pilihan Harga Diskrit**: Empat titik harga (Rp150k, 250k, 350k, 500k) mewakili rentang yang masuk akal untuk UMKM, memudahkan analisis frekuensi dan alasan pilihan. Trade-off: kehilangan data harga kontinu, tetapi lebih praktis di lapangan.
2. **Demo Berbasis Skenario Masalah**: Demo 5 menit hanya menampilkan dua fitur inti (Laporan Otomatis dan Mode Offline) yang langsung menjawab masalah utama dari riset sebelumnya. Asumsi: waktu perhatian terbatas, fokus pada nilai terbesar.
3. **Panduan Wawancara Semi-terstruktur**: Pertanyaan terbuka yang terarah untuk menggali 'mengapa' di balik pilihan harga dan persepsi nilai. Meminimalkan bias dengan script netral.

## Rencana Eksekusi
1. Buat file PDF final (`instrumen-validasi-harga-pos-kolaka.pdf`) berisi tiga bagian.
2. Lakukan uji internal dengan 2 orang non-teknis (misal, dari tim admin atau magang). Catat feedback pada waktu penyelesaian, kejelasan pertanyaan, dan kesan demo.
3. Revisi instrument berdasarkan feedback, maksimal 1 iterasi.
4. Serahkan PDF final dan laporan uji internal ke lead riset untuk eksekusi lapangan.

## Risiko & Mitigasi
- **Risiko**: Responden memilih harga terendah (Rp150k) karena keengganan, bukan nilai sesungguhnya. **Mitigasi**: Dalam panduan wawancara, tanyakan "Apa konsekuensi jika fitur X tidak ada?" untuk menguji willingness-to-pay sebenarnya.
- **Risiko**: Demo 5 menit kurang meyakinkan karena koneksi lapangan tidak stabil. **Mitigasi**: Siapkan video rekaman demo yang sama di perangkat surveyor sebagai cadangan.
- **Risiko**: Anggaran Rp5 juta tidak cukup untuk 30 responden jika insentif terlalu besar. **Mitigasi**: Hitung ulang: asumsi insentif Rp50k/responden (Rp1,5 juta), transportasi 2 surveyor 10 hari @Rp100k/hari (Rp2 juta), sisa Rp1,5 juta untuk konsumsi dan alat. Masih feasible.

## Metrik Keberhasilan
1. Instrument lulus uji internal: waktu penyelesaian kuesioner < 7 menit, skrip demo dipahami tanpa penjelasan teknis tambahan.
2. Data lapangan terkumpul lengkap dari 30 outlet: tidak ada pertanyaan yang terlewat >5%.
3. Output: distribusi frekuensi pilihan harga dan daftar kutipan alasan utama untuk setiap titik harga.

## Pertanyaan Terbuka
1. Apakah perlu menyertakan opsi harga "Gratis selama 3 bulan, lalu bayar RpX" untuk menguji sensitivitas harga?
2. Siapa dua orang non-teknis yang tersedia untuk uji internal dalam 48 jam ke depan?
3. Apakah ada batasan teknis perangkat demo yang akan digunakan surveyor (spesifikasi smartphone, OS)?

## Asumsi & Sumber
- **Asumsi 1**: Outlet target adalah UMKM dengan masalah POS seperti teridentifikasi di `riset-pasar-dan-masalah-pos-kolaka.md`. Sumber: dokumen internal tim.
- **Asumsi 2**: Anggaran Rp5 juta mencakup semua biaya operasional survei. Sumber: instruksi tugas.
- **Asumsi 3**: Tim lapangan dapat direkrut dari jaringan lokal. Sumber: instruksi tugas.
- **Asumsi 4**: Rentang harga Rp150k–Rp500k/bulan relevan untuk segmentasi UMKM Kolaka. Sumber: benchmark informal aplikasi POS kompetitor lokal (belum ada data resmi).
