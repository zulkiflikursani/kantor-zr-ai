---
run: RUN-20261018-203643-7a27
team: manager
role: Scrum Master / Agile Coordinator
skills: Agile/Scrum Facilitation, Sprint Planning, Impediment Removal, Kanban Workflow Optimization
task: T4
review: 5/5
revised: -
qa: lulus
model: kr/deepseek-3.2
generated: 2026-10-18T12:44:25.754Z
---
## Ringkasan Eksekutif
Jadwal 30 outlet teridentifikasi untuk wawancara validasi POS di Kolaka, dieksekusi dalam 10 hari kerja (3 outlet/hari/surveyor). Sistem tracking real-time menggunakan Google Sheets terkunci dan kanal Telegram untuk lapangan. Laporan konsolidasi harian otomatis dikirim 20:00 WITA ke tim inti.

## Analisis
**Agile/Scrum Facilitation**: Sprint wawancara 10 hari dengan daily standup via Telegram (09:00 WITA) dan review harian. **Sprint Planning**: Buffer 1 outlet cadangan per cluster untuk antisipasi tutup/tolak. Kapasitas 3 outlet/hari berdasarkan estimasi T3: 60 menit wawancara + 30 menit transit radius 5 km. **Kanban Workflow Optimization**: Flow: Identifikasi → Kontak Awal → Kunjungan → Data Masuk → Validasi. Work In Progress (WIP) limit: 9 outlet aktif/hari (3 surveyor × 3). **Impediment Removal**: Blocker sinyal diatasi dengan Google Forms offline; outlet tutup pakai cadangan; konflik jadwal diselesaikan surveyor via WhatsApp.

**Trade-off**: Real-time tracking via Telegram (cepat, akrab) vs platform enterprise (biaya, training). Pilih Telegram karena surveyor mahasiswa sudah mahir dan biaya nol. **Angka**: Kapasitas total 30 outlet / (3 outlet/hari × 3 surveyor) = 3.33 hari. Buffer 20% jadi 4 hari kerja, tetapi jadwal 10 hari untuk sebar geografis dan kontak awal. **Asumsi**: 90% success rate kunjungan (27 outlet tercapai), butuh 33 outlet dikontak awal untuk hasil 30.

## Keputusan
1. **Jadwal Rolling 3 Outlet/Hari**: Bagi 30 outlet ke 3 cluster geografis (Utara, Tengah, Selatan Kolaka). Setiap surveyor dapat 1 cluster tetap untuk efisiensi transit. Jadwal harian dirilis H-1 via Google Sheets.
2. **Tracking Real-time**: Google Sheets dengan kolom: Outlet ID, Nama, Alamat, Kontak, Status (Terjadwal/Dikunjungi/Selesai/Tolak), Timestamp, Surveyor ID, Link Bukti Foto. Sheet terkunci edit hanya untuk manager, surveyor input via form Telegram bot.
3. **Kanal Telegram**: Grup "Survey POS Kolaka" untuk koordinasi. Setiap surveyor wajib kirim laporan harian format: "[Nama] - [Jumlah] outlet - [Kendala] - [Foto bukti]". Bot otomatis ambil dan log ke Sheets.
4. **Laporan Harian 20:00 WITA**: Script Apps Script gabung data Sheets, generate summary PDF, kirim ke email tim inti dan grup Telegram.

## Rencana Eksekusi
**Hari 1 (Persiapan)**:
- Identifikasi 33 outlet UMKM retail F&B dari data sekunder (Dinas Koperasi, Google Maps).
- Hubungi via telepon/WA untuk konfirmasi ketersediaan dan jadwal, catat di Sheets.
- Setup Google Sheets dengan formula validasi dan filter view per surveyor.
- Buat grup Telegram, invite surveyor, training input laporan.
- Deploy bot Telegram sederhana (pytgbot atau script Apps Script) untuk capture pesan ke Sheets.

**Hari 2-11 (Eksekusi)**:
- Setiap pagi (08:00 WITA): Share jadwal hari itu di grup (3 outlet per surveyor).
- Daily standup 09:00 WITA via voice note di grup: target hari ini, kendala kemarin.
- Surveyor kunjungi outlet, wawancara 15-20 menit, isi Google Forms offline, upload foto bukti.
- Real-time: Surveyor kirim laporan ke bot Telegram (otomatis ke Sheets).
- Sore (18:00 WITA): Manager cek progres, isi cadangan jika ada tolakan.
- 20:00 WITA: Laporan konsolidasi otomatis terkirim.

**Hari 12 (Konsolidasi)**:
- Verifikasi 30 data wawancara lengkap.
- Analisis awal temuan (skor WTP, kebutuhan fitur) untuk tim produk.
- Tutup sprint, evaluasi dengan surveyor.

## Risiko & Mitigasi
- **Outlet Menolak/Tutup (Risiko 30%)**: Mitigasi: Siapkan 6 outlet cadangan per cluster. Jika tolak, surveyor langsung geser ke cadangan, laporkan ke grup.
- **Sinyal Lemah, Google Forms Gagal Sync (Risiko 20%)**: Mitigasi: Form offline-aware sudah disiapkan T3. Surveyor simpan draft lokal, sync saat ada sinyal. Bot Telegram terima foto bukti sebagai backup.
- **Surveyor Sakit/Absen (Risiko 10%)**: Mitigasi: Jadwal fleksibel, antar surveyor backup cluster. Kontrak harian memotivasi kehadiran.
- **Data Duplikat/Invalid (Risiko 15%)**: Mitigasi: Validasi di Sheets (unique Outlet ID, wajib foto bukti). Manager cek harian.

## Metrik Keberhasilan
- **Throughput**: 30 outlet terwawancara dalam 10 hari (≥3 outlet/hari rata-rata).
- **Kualitas Data**: 100% data memiliki foto bukti dan timestamp valid.
- **Kepatuhan Waktu**: Laporan harian terkirim 20:00 WITA 10 hari berturut-turut.
- **Response Rate**: ≥90% outlet terjadwal bersedia diwawancara (27 dari 30).

## Pertanyaan Terbuka
1. Apakah data sekunder 33 outlet UMKM Kolaka retail F&B sudah tersedia dari tim riset atau perlu scraping manual?
2. Nomor kontak outlet apakah sudah ada atau surveyor cari di lokasi?
3. Apakah perlu surat resmi dari Dinas Koperasi untuk legitimasi wawancara, atau cukup surat pengantar ZR Corp?

## Asumsi & Sumber
- **Asumsi Kecepatan**: 3 outlet/hari/surveyor berdasarkan estimasi T3 (60 menit wawancara + 30 menit transit). Sumber: T3-Analisis.
- **Asumsi Success Rate**: 90% berdasarkan pengalaman riset pasar UMKM Kolaka sebelumnya (tim riset internal).
- **Asumsi Biaya Tracking**: Rp 0 untuk Telegram dan Google Sheets. Sumber: kapabilitas internal.
- **Asumsi Waktu Persiapan**: 1 hari untuk identifikasi outlet dan kontak awal. Sumber: velocity tim riset sebelumnya.
- **Rumus Kapasitas**: Outlet perlu dikontak = Target / Success Rate = 30 / 0.9 = 33.33 ≈ 33 outlet.
