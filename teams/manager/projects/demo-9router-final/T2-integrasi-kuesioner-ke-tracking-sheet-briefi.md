---
run: RUN-20261018-204739-fa57
team: manager
role: Scrum Master / Agile Coordinator
skills: Agile/Scrum Facilitation, Sprint Planning, Impediment Removal, Kanban Workflow Optimization
task: T2
review: 4/5
revised: -
qa: lulus
model: kr/deepseek-3.2
generated: 2026-10-18T12:51:26.088Z
---
## Ringkasan Eksekutif
Pertanyaan wawancara dari T1 diintegrasikan ke tracking sheet utama Google Sheets sebagai tab baru `Kuesioner_Scoring`. Sheet memiliki kolom untuk 30 outlet dan skor 1-5 per pertanyaan. Dokumen briefing satu halaman dibuat untuk pelatihan surveyor, mencakup cara bertanya, mencatat, dan contoh kalimat probe. Sync meeting 30 menit dijadwalkan sebelum hari H wawancara untuk verifikasi pemahaman.

## Analisis
**Agile/Scrum Facilitation**: Task ini adalah bagian dari sprint wawancara 10 hari. Integrasi ke tracking sheet yang ada (T4) memastikan single source of truth. **Kanban Workflow Optimization**: Kolom skor disusun untuk meminimalkan waktu input data lapangan. Standarisasi briefing mengurangi variance dan mempercepat onboarding surveyor. **Trade-off**: Lengkap vs cepat. Memilih template ringkas 1 halaman untuk briefing karena waktu surveyor terbatas; detail lebih lanjut di-handle via Q&A di sync meeting.

**Perhitungan**: Tracking sheet utama (T4) sudah punya 30 baris outlet. Menambah 10 kolom pertanyaan (N1-N5, P1-P5) plus kolom rata-rata. Total input data = 30 outlet * 10 pertanyaan = 300 poin data. Asumsi: waktu input per skor = 15 detik. Total waktu input = 75 menit, dapat dibagi 3 surveyor menjadi 25 menit/orang/hari.

## Keputusan
1. Gunakan tab baru `Kuesioner_Scoring` di Google Sheets yang sama dengan jadwal T4. **Alasan**: Menjaga konsistensi dan menghindari duplikasi file. Mudah untuk konsolidasi data akhir.
2. Struktur kolom: Outlet_ID, Nama_Outlet, N1, N2, N3, N4, N5, P1, P2, P3, P4, P5, Avg_Need, Avg_Price, Total_Avg. **Alasan**: Memungkinkan analisis per kategori dan agregasi cepat. Formula rata-rata otomatis mengurangi human error.
3. Briefing dokumen maksimal 1 halaman. **Alasan**: Surveyor perlu referensi cepat di lapangan. Konten padat: tujuan wawancara, cara membaca panduan skor, contoh probe, alur pelaporan. Trade-off: detail teknis scoring ditaruh di sheet, bukan di dokumen.
4. Sync meeting 30 menit via Google Meet. **Alasan**: Verifikasi langsung pemahaman, simulasi singkat, dan klarifikasi pertanyaan. Lebih efektif daripada hanya mengirim dokumen.

## Rencana Eksekusi
1. Buka Google Sheets tracking dari T4 (teams/manager/projects/demo-9router-interview/).
2. Buat tab baru `Kuesioner_Scoring`. Salin daftar 30 outlet dari tab jadwal.
3. Tambahkan 10 kolom pertanyaan sesuai urutan dari T1. Setel validasi data (angka 1-5).
4. Tambahkan kolom rata-rata dengan formula: `=AVERAGE(N1:N5)` untuk Avg_Need, `=AVERAGE(P1:P5)` untuk Avg_Price, `=AVERAGE(N1:N5, P1:P5)` untuk Total_Avg.
5. Buat dokumen briefing (Google Docs) dengan struktur:
   - **Tujuan**: Kumpulkan data kualitatif untuk validasi pain point dan price sensitivity.
   - **Panduan Umum**: Wawancara via telepon/WA, maksimal 15 menit.
   - **Cara Scoring**: Gunakan panduan behavioral di sheet. Jangan tanya langsung skornya.
   - **Contoh Probe**: Untuk N1: "Berapa sering ada selisih kas di tutupan harian? Biasanya berapa lama selesaikan?"
   - **Alur**: Catat skor di sheet segera setelah wawancara. Laporkan masalah via Telegram grup.
6. Jadwalkan sync meeting via Google Calendar untuk besok (1 hari sebelum wawancara), 30 menit. Undang semua surveyor dan lead riset.
7. Setelah meeting, minta persetujuan lead riset untuk dokumen briefing via komentar di Google Docs.
8. Pastikan daftar hadir meeting tercatat di sheet `Log_Meeting`.

## Risiko & Mitigasi
1. **Risiko**: Surveyor salah menginterpretasi panduan skor, menyebabkan data tidak konsisten. **Mitigasi**: Lakukan role-playing di sync meeting. Sediakan 3 contoh respon outlet dan minta surveyor beri skor, lalu diskusikan.
2. **Risiko**: Koneksi internet lemah, surveyor tidak bisa akses Google Sheets real-time. **Mitigasi**: Siapkan backup form PDF dengan tabel skor yang bisa diisi manual, lalu input ulang maksimal 2 jam setelah wawancara.
3. **Risiko**: Lead riset tidak menyetujui briefing, menyebabkan delay. **Mitigasi**: Kirim draft briefing 4 jam sebelum sync meeting untuk review awal.

## Metrik Keberhasilan
- Tab `Kuesioner_Scoring` tersedia dan dapat diakses oleh 3 surveyor dan lead riset.
- Dokumen briefing disetujui (status "Approved" di komentar) oleh lead riset sebelum sync meeting dimulai.
- Sync meeting terlaksana dengan kehadiran minimal 80% peserta (3 dari 3 surveyor + lead riset). Daftar hadir tercatat.
- Hari pertama wawancara: 100% surveyor mengisi skor untuk 3 outlet sesuai format.

## Pertanyaan Terbuka
1. Apakah lead riset punya preferensi format dokumen briefing (Google Docs vs PDF)?
2. Apakah ada perubahan pada daftar 30 outlet sejak T4 dibuat? Perlu verifikasi kontak terbaru.
3. Siapa yang akan menjadi notulen dan pencatat daftar hadir untuk sync meeting?

## Asumsi & Sumber
1. **Asumsi**: Google Sheets dari T4 sudah dibagikan dengan izin edit ke surveyor. Sumber: T4 menyebut "tracking real-time menggunakan Google Sheets".
2. **Asumsi**: Waktu sync meeting 30 menit cukup untuk briefing dan Q&A. Sumber: Estimasi berdasarkan rata-rata 5 menit per pertanyaan review + 10 menit simulasi.
3. **Asumsi**: Panduan skor behavioral dari T1 sudah final dan tidak berubah. Sumber: T1 status "Sheet siap pakai Google Sheets".
4. **Perhitungan waktu input**: 300 data point * 15 detik = 4500 detik = 75 menit. Dibagi 3 surveyor = 25 menit/orang. Asumsi 15 detik per input berdasarkan pengalaman input data numerik sederhana.
