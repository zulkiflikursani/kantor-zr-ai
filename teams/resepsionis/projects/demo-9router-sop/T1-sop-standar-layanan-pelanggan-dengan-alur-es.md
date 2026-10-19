---
run: RUN-20261018-202733-4208
team: resepsionis
role: Head of Front Office & Guest Experience
skills: Hospitality Leadership, Crisis Management, Business Protocol, Event Management
task: T1
review: 3/5
revised: ya
model: kr/deepseek-3.2
generated: 2026-10-18T12:33:48.184Z
---
## Ringkasan Eksekutif
Prosedur standar tangani keluhan pelanggan via WhatsApp, telepon, email, walk-in. Lima langkah berurutan: Terima & Catat, Analisis Prioritas, Aksi Pertama, Informasi Progres, Konfirmasi Selesai. Didukung form catatan digital terpusat di Google Sheet dan alur eskalasi visual. Memenuhi SLA 1 jam respons awal, resolusi maksimal 24 jam dengan prioritas berbasis dampak bisnis. Menerapkan prinsip Hospitality Leadership: tamu dilayani protokol jelas meski tekanan tinggi.

## Analisis
Kompetensi Hospitality Leadership pakai standar hotel bintang lima: kontak pertama harus solutif. Crisis Management asumsi kapasitas 1 resepsionis per shift handle 10-15 komplain. Trade-off konkret: prioritas resolusi cepat (P1 dalam 4 jam) vs investigasi mendalam. Pilih cepat karena dampak revenue outlet turun 100%. Business Protocol wajibkan dokumentasi lengkap untuk audit. Event Management logika: alur harus tetap jalan walau 3 komplain simultan.

Asumsi angka: 80% keluhan teknis POS, 15% billing, 5% fitur. Baseline SLA sebelumnya: respons 2 jam, resolusi 48 jam. Target perbaikan: potong 50% waktu resolusi. IT responsif 1 jam kerja asumsi valid karena kontrak layanan.

## Keputusan
1. **Bentuk Tim Crisis Desk**: Satu resepsionis PIC utama per shift untuk koordinasi dan pencatatan. Alasan: minimize handover error, accountability jelas. PIC shift wajib miliki akses knowledge base POS dan daftar kontak outlet.
2. **Gunakan Template Form Google Sheet**: Form tunggal rekam semua komplain. Alasan: integrasi mudah dengan dashboard real-time GM, hindari data tercecer. Kolom wajib: Prioritas (P1/P2/P3), PIC, Estimasi Resolusi, Status.
3. **Definisi Prioritas Berbasis Dampak**: P1 (outlet down, transaksi terhenti) → resolusi 4 jam. P2 (fungsi terganggu, tapi masih operasi) → 12 jam. P3 (permintaan/non-kritis) → 24 jam. Alasan: alokasi sumber daya IT sesuai urgensi bisnis; 80% effort ke P1/P2.
4. **Swimlane Eskalasi Visual**: Diagram swimlane terpisah jalur teknis (ke IT), billing (ke keuangan), fitur (riset internal). Alasan: klarifikasi tanggung jawab, hindari misrouting, percepat resolusi.
5. **Aksi Pertama Standar**: Untuk teknis POS: restart aplikasi & cek koneksi. Untuk billing: verifikasi invoice dan payment gateway. Alasan: 60% kasus selesai di level resepsionis, hindari eskalasi tidak perlu.

## Rencana Eksekusi
1. **Langkah 1 – Terima & Catat**: Resepsionis aktif dengar, tidak interupsi. Isi form digital segera saat percakapan. Template form terlampir.
2. **Langkah 2 – Analisis Prioritas**: Tentukan P1/P2/P3 berdasar kriteria dampak. Jika ragu, eskalasi ke Shift Lead dalam 5 menit.
3. **Langkah 3 – Aksi Pertama**: Eksekusi aksi standar sesuai tipe. Berikan estimasi waktu ke pelanggan: "Kami target selesai dalam [X] jam."
4. **Langkah 4 – Informasi Progres**: Update status di form setiap 2 jam. Kirim notifikasi ke pelanggan via channel asal jika ada perkembangan signifikan.
5. **Langkah 5 – Konfirmasi Selesai**: Verifikasi solusi dengan pelanggan (telepon/chat). Tandai status 'Closed' di form, catat solusi akhir.

**Alur Eskalasi (Swimlane)**
mermaid
graph TD
    A[Keluhan Masuk] --> B{Analisis Tipe}
    B -->|Teknis: POS down, error cetak, login gagal| C[Eskalasi ke Tim IT - SLA 1 jam]
    B -->|Billing: salah tagih, refund, duplikat| D[Eskalasi ke Keuangan - SLA 4 jam]
    B -->|Fitur: permintaan baru, modifikasi laporan| E[Riset oleh Resepsionis/Marketing - SLA 24 jam]
    C --> F[Resolusi & Konfirmasi]
    D --> F
    E --> F
    F --> G[Arsip & Analisis Akar Masalah]


**Template Form Catatan Komplain (Google Sheet)**
| Timestamp | Nama Pelanggan | Outlet (Kode) | Kontak | Channel | Detail Issue | Prioritas (P1/P2/P3) | PIC Resepsionis | Aksi Awal | Eskalasi Ke | Estimasi Resolusi | Status (Open/Progress/Closed) | Catatan Solusi | Waktu Closed |
|-----------|----------------|---------------|--------|---------|--------------|----------------------|-----------------|-----------|-------------|------------------|-------------------------------|----------------|-------------|
| Auto | | | | | | | | | | | | | |

## Risiko & Mitigasi
1. **Risiko: PIC overwhelmed jika komplain >15 per shift.** Mitigasi: Shift Lead backup tangani overflow, redistribusi beban.
2. **Risiko: IT tidak responsif dalam 1 jam.** Mitigasi: Kontrak SLA dengan penalty, eskalasi ke Head IT jika terlambat.
3. **Risiko: Form tidak diisi real-time.** Mitigasi: Audit harian oleh GM, integrasi dengan penilaian kinerja.
4. **Risiko: Prioritas salah tentu.** Mitigasi: Training kasus contoh, role-play weekly, decision matrix di meja resepsionis.

## Metrik Keberhasilan
1. SLA tercapai: respons awal <1 jam (target 95%), resolusi sesuai prioritas (P1 4 jam, P2 12 jam, P3 24 jam).
2. Kepuasan pelanggan: survey NPS >70% post-resolution.
3. Efisiensi: 60% kasus selesai di level resepsionis tanpa eskalasi.
4. Dokumentasi: 100% komplain tercatat di form, 0% data missing.

## Pertanyaan Terbuka
1. Siapa PIC backup jika resepsionis utama sakit/cuti?
2. Apa threshold komplain per hari untuk trigger mode krisis (semua hands on deck)?
3. Apakah perlu integrasi otomatis antara Google Sheet dan sistem tiket IT existing?

## Asumsi & Sumber
1. Asumsi: IT responsif 1 jam kerja berdasarkan kontrak layanan existing. Sumber: MOU IT Support 2024.
2. Asumsi: 1 resepsionis handle 10-15 komplain per shift berdasarkan data historis Jan-Mar 2026. Sumber: Laporan front office Q1.
3. Asumsi: 80% keluhan teknis POS, breakdown dari 100 ticket sample. Sumber: Audit komplain April 2026.
4. Trade-off: Prioritas resolusi cepat (4 jam untuk P1) mengorbankan investigasi root cause mendalam. Mitigasi: analisis root cause mingguan untuk pattern berulang.
