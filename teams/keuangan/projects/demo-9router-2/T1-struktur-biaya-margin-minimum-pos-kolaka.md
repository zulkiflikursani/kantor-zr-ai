---
run: RUN-20261018-201739-d423
team: keuangan
role: Senior Financial Controller
skills: Financial Statement Analysis, Budgeting & Forecasting, Internal Auditing, Cash Flow Management
task: T1
review: 2/5
revised: ya
model: kr/deepseek-3.2
generated: 2026-10-18T12:21:45.322Z
---
## Ringkasan Eksekutif
Breakdown biaya tetap Rp3.455.000 per bulan: server cloud Rp1.2 juta, lisensi software Rp1.5 juta, support lokal Rp750 ribu, bandwidth cadangan Rp5 ribu. Biaya variabel per outlet Rp18.000. Floor price teoritis Rp87.583 per bulan untuk 100 outlet target margin 40%. Harga pasar rata-rata Rp325.000 dan willingness-to-pay >Rp300k (60% responden). Rekomendasi: pakai struktur harga final tim (Starter Rp175k, Pro Rp350k, Elite Rp650k) yang sudah disahkan, memberi margin kotor 89.7% dan feasible untuk go/no-go conditional.

## Analisis
Kompetensi terpakai: Financial Statement Analysis, Budgeting & Forecasting, Internal Auditing, Cash Flow Management.

**Biaya Tetap Bulanan (asumsi dari dokumen final tim):**
- Server Cloud (AWS EC2 t3.large + RDS db.t3.medium): Rp 1.200.000
- Lisensi Software (platform POS + payment gateway): Rp 1.500.000
- Support Lokal (1 FTE paruh waktu @ Rp15.000/jam, 50 jam/bulan): Rp 750.000
- Bandwidth Cadangan (backup ISP): Rp 5.000
- **Total Biaya Tetap: Rp 3.455.000**

**Biaya Variabel per Outlet (asumsi dari project final pos-kolaka-harga-anggaran):**
- Onboarding & Setup (aktivasi akun, konfigurasi): Rp 10.000
- Training Dasar (video + dokumen): Rp 5.000
- Bantuan Teknis Bulanan (rata-rata 1 ticket/outlet): Rp 3.000
- **Total Biaya Variabel per Outlet: Rp 18.000**

**Target Margin:** Minimum 40% Gross Profit sesuai kebijakan internal ZR Corp untuk produk software baru.

**Perhitungan Floor Price (100 outlet):**
- Biaya per Outlet = (Rp3.455.000 / 100) + Rp18.000 = Rp 52.550
- Harga Minimum untuk Margin 40% = Rp52.550 / (1 - 0.4) = **Rp 87.583**

**Model Sensitivitas Skala:**
| Skala Outlet | Biaya Tetap/Outlet | Biaya Variabel/Outlet | Total Biaya/Outlet | Floor Price (40% margin) |
|--------------|---------------------|------------------------|---------------------|--------------------------|
| 50           | Rp 69.100           | Rp 18.000              | Rp 87.100           | Rp 145.167               |
| 100          | Rp 34.550           | Rp 18.000              | Rp 52.550           | Rp 87.583                |
| 200          | Rp 17.275           | Rp 18.000              | Rp 35.275           | Rp 58.792                |

**Trade-off:** Floor price teoritis (Rp87k) jauh di bawah harga pasar (Rp325k) dan willingness-to-pay (>Rp300k). Memilih harga pasar lebih tinggi (Rp175k+) memberi margin tinggi (89.7%) dan ruang untuk CAC (Customer Acquisition Cost) Rp50.000/outlet masih aman. Data lapangan valid: riset 30 outlet, 60% responden mau bayar >Rp300.000.

## Keputusan
1. **Struktur Biaya:** Pakai breakdown biaya tetap Rp3.455.000 dan variabel Rp18.000/outlet. Alasannya: sesuai data biaya layanan di dokumen final tim pos-kolaka-harga-anggaran (Rp18.000 untuk paket Starter).
2. **Margin Target:** Pertahankan 40% sebagai batas bawah profitabilitas. Alasannya: menjaga cushion jika biaya cloud naik atau harga perlu diskon untuk penetrasi pasar.
3. **Harga Final:** Rekomendasikan pakai harga paket final yang sudah disahkan (Starter Rp175k, Pro Rp350k, Elite Rp650k). Alasannya: sudah memenuhi target margin (89.7% untuk Starter), berdasarkan riset pasar valid, dan disahkan oleh tim keuangan sebelumnya (dokumen project.md status 100% selesai).

## Rencana Eksekusi
1. Buat model Excel (`struktur-biaya-pos-kolaka.xlsx`) dengan variabel biaya dan 3 skenario skala (50,100,200 outlet).
2. Buat dokumen 1 halaman PDF rekomendasi harga minimum (floor price) untuk profitabilitas.
3. Buat presentasi 5 slide ke direktur:
   - Slide 1: Struktur biaya & margin (fixed + variable)
   - Slide 2: Perbandingan floor price vs harga final (chart)
   - Slide 3: Sensitivitas skala outlet (50,100,200)
   - Slide 4: Rekomendasi go/no-go (conditional go - syarat: mitigasi offline & simulasi onboarding selesai dalam 2 minggu)
   - Slide 5: Langkah berikutnya (onboarding pilot 30 outlet, monitoring cashflow 3 bulan)

## Risiko & Mitigasi
1. **Risiko:** Biaya cloud naik signifikan di atas skala 200 outlet. **Mitigasi:** Monitor AWS usage daily, negosiasi tiered pricing dengan AWS Enterprise Support.
2. **Risiko:** Biaya support meledak jika kompleksitas masalah tinggi. **Mitigasi:** Kembangkan knowledge base self-service, otomatisasi ticketing dengan Zendesk basic plan Rp200.000/bulan.
3. **Risiko:** Target 100 outlet tidak tercapai, meningkatkan biaya tetap per outlet. **Mitigasi:** Model sensitivitas sudah siapkan skenario 50 outlet sebagai fallback (floor price Rp145k masih di bawah harga Starter Rp175k).

## Metrik Keberhasilan
- Gross Profit Margin ≥40% pada bulan ke-3 operasi.
- Break-even point tercapai pada outlet ke-65 (biaya tetap Rp3.455.000 / (Rp175.000 - Rp18.000)).
- Cashflow positif pada bulan ke-2 (asumsi onboarding 50 outlet/bulan).

## Pertanyaan Terbuka
1. Apakah anggaran Rp5 juta untuk insentif & demo sudah termasuk CAC Rp50.000/outlet?
2. Siapa penanggung jawab negosiasi pricing tiered dengan provider cloud?
3. Timeline review mingguan untuk evaluasi conditional go?

## Asumsi & Sumber
- Asumsi biaya cloud: AWS EC2 t3.large (Rp800.000) + RDS db.t3.medium (Rp400.000) = Rp1.200.000 (sumber: AWS Indonesia pricing calculator).
- Asumsi biaya variabel Rp18.000/outlet: dari dokumen final tim pos-kolaka-harga-anggaran project.md.
- Asumsi harga pasar Rp325.000/bulan: dari data lapangan riset 30 outlet.
- Asumsi willingness-to-pay >Rp300k (60% responden): dari brief asumsi rencana valid.
