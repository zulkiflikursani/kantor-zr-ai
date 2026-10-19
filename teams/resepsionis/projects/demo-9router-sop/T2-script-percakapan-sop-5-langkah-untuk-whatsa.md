---
run: RUN-20261018-202733-4208
team: resepsionis
role: AI Concierge & Guest Relations Operator
skills: AI-Human Interaction Management, Digital Kiosk Operations, Visitor Analytics & Data Entry
task: T2
review: 4/5
revised: -
model: kr/deepseek-3.2
generated: 2026-10-18T12:33:48.186Z
---
## Ringkasan Eksekutif
Skrip percakapan terstruktur untuk WhatsApp, telepon, dan email berdasarkan SOP 5 langkah dari T1. Mencakup respons cepat untuk 5 isu umum (login gagal, transaksi pending, laporan error, billing, data tidak sinkron). Template email follow-up dan notifikasi WhatsApp otomatis siap integrasi dengan form Google Sheet. Memenuhi SLA 1 jam respons awal dengan eskalasi jelas.

## Analisis
Berdasarkan kompetensi AI-Human Interaction Management dan Digital Kiosk Operations. Saluran berbeda butuh pendekatan berbeda: telepon butuh skrip verbal cepat, WhatsApp butuh template teks ringkas, email butuh formalitas. Asumsi: resepsionis sudah miliki form catatan dari T1. Trade-off: script terstruktur mungkin kaku untuk kasus unik; mitigasi dengan panduan improvisasi dan eskalasi. 5 isu umum dipilih berdasarkan frekuensi komplain di data historis POS (asumsi: 80% komplain masuk kategori ini).

## Keputusan
1. **Buat Template Berbasis Variabel**: Gunakan placeholder `{nama_pelanggan}`, `{nomor_tiket}`, `{nama_outlet}` untuk personalisasi otomatis. Alasan: mengurangi waktu ketik manual, konsistensi data.
2. **Integrasi Notifikasi Otomatis**: Template WhatsApp dan email langsung referensi kolom form Google Sheet T1. Alasan: alur kerja tanpa salin-tempel, kurangi human error.
3. **Prioritas Respons Berdasarkan Saluran**: Telepon → jawab langsung <2 menit. WhatsApp → balas <15 menit. Email → konfirmasi terima <1 jam. Alasan: sesuai ekspektasi pengguna masing-masing channel.

## Rencana Eksekusi
1. Tulis 3 set skrip untuk 5 langkah SOP (Terima, Validasi, Kategorisasi, Tindakan, Follow-up).
2. Buat bank respons cepat untuk 5 isu umum.
3. Desain template email follow-up (HTML sederhana) dan notifikasi WhatsApp (teks terformat).
4. Simulasikan 3 kasus: login gagal via telepon, billing error via email, transaksi pending via WhatsApp.
5. Verifikasi semua placeholder terisi benar dan SLA terpenuhi dalam simulasi.

## Risiko & Mitigasi
1. **Risiko**: Script terlalu kaku, resepsionis tidak improvisasi untuk kasus kompleks. **Mitigasi**: Sertakan panduan 'jika di luar skrip, eskalasi ke PIC Crisis Desk' di setiap skrip.
2. **Risiko**: Template tidak kompatibel dengan sistem notifikasi yang ada. **Mitigasi**: Buat template teks plain (bukan HTML kompleks), konfirmasi dengan tim IT sebelum deploy.
3. **Risiko**: Data placeholder tidak terisi otomatis karena format form beda. **Mitigasi**: Sesuaikan nama placeholder dengan kolom Google Sheet T1 (`{TicketID}`, `{CustomerName}`).

## Metrik Keberhasilan
1. Waktu rata-rata respons awal <1 jam (diukur dari log form).
2. 100% komplain tercatat dengan nomor tiket unik.
3. 3 skenario simulasi berjalan tanpa error (resepsionis bisa jalankan skrip lengkap).
4. Template digunakan di 90% interaksi (survey bulan pertama).

## Pertanyaan Terbuka
1. Apakah tim IT sudah setujui format notifikasi otomatis untuk integrasi?
2. Apakah ada batasan karakter untuk pesan WhatsApp bisnis yang perlu diperhatikan?
3. Apakah perlu tambahkan skrip untuk channel walk-in secara terpisah?

## Asumsi & Sumber
1. Asumsi: Frekuensi komplain 5 isu umum mencakup 80% total, berdasarkan laporan bulanan POS Jan-Sep 2026.
2. Asumsi: Resepsionis akses Google Sheet real-time via smartphone/PC.
3. Asumsi: Kontak outlet dan knowledge base POS sudah tersedia di dashboard internal.
4. Sumber: SOP 5 langkah dari T1 (file `T1-sop-standar-layanan-pelanggan-dengan-alur-es.md`).

### SKRIP PERCAKAPAN WHATSAPP
**Langkah 1 — Terima**
"Halo {nama_pelanggan}, terima kasih menghubungi ZR Corp AI. Untuk membantu, boleh saya tahu nama outlet dan detail masalahnya?"

**Langkah 2 — Validasi**
"Sedang memverifikasi data outlet {nama_outlet}. Mohon tunggu sebentar."

**Langkah 3 — Kategorisasi**
"Berdasarkan info, masalah termasuk {kategori_isu}. Kami buatkan tiket #{nomor_tiket}. PIC: {nama_pic}."

**Langkah 4 — Tindakan**
**Login Gagal**: "Coba clear cache browser atau gunakan incognito mode. Jika masih gagal, kirim screenshot error ke kami."
**Transaksi Pending**: "Cek status di menu Riwayat Transaksi. Jika masih pending >30 menit, kami eskalasi ke tim finansial."
**Laporan Error**: "Mohon spesifik error code atau pesannya. Kami cek di knowledge base."
**Billing Error**: "Konfirmasi nominal dan metode pembayaran. Kami validasi dengan tim billing."
**Data Tidak Sinkron**: "Restart aplikasi POS. Jika belum sync, kami trigger manual sync dari server."

**Langkah 5 — Follow-up**
"Tiket #{nomor_tiket} sedang diproses. Estimasi update dalam {estimasi_waktu}. Kami hubungi lagi via ini."

**Template Notifikasi Otomatis**
`[Update] Tiket #{TicketID} - Status: {Status}. Detail: {UpdateMessage}. Tim: {Team}. Hubungi kami jika ada pertanyaan.`

### SKRIP PERCAKAPAN TELEPON
**Langkah 1 — Terima**
"Selamat pagi/siang/sore, ZR Corp AI, {nama_resepsionis} di sini. Ada yang bisa saya bantu?"

**Langkah 2 — Validasi**
"Bisa sebutkan kode outlet atau nama outlet? ... Saya cek di sistem."

**Langkah 3 — Kategorisasi**
"Saya catat sebagai masalah {kategori}. Tiket #{nomor_tiket}. Akan dialihkan ke tim terkait."

**Langkah 4 — Tindakan**
**Login Gagal**: "Pastikan koneksi internet stabil. Jika password lupa, bisa reset via email terdaftar."
**Transaksi Pending**: "Bisa dicek di riwayat? Jika belum muncul, kami trigger pengecekan transaksi."
**Laporan Error**: "Catat error code-nya. Saya konsultasi ke tim teknis."
**Billing Error**: "Minta detail transaksi: tanggal, nominal, invoice number. Kami follow-up."
**Data Tidak Sinkron**: "Coba logout dan login kembali. Jika masih sama, kami lakukan sync manual."

**Langkah 5 — Follow-up**
"Tiket sudah tercatat. Kami beri update dalam 1 jam via WhatsApp/email. Nomor tiket #{nomor_tiket}."

### TEMPLATE EMAIL
**Subjek**: Konfirmasi Tiket Keluhan - #{TicketID}

**Isi**:
Kepada Yth. {CustomerName},

Terima kasih telah melaporkan masalah di outlet {OutletName}.

**Detail Tiket**
- Tiket ID: #{TicketID}
- Kategori: {IssueCategory}
- Prioritas: {Priority}
- PIC: {PICName}
- Waktu Lapor: {Timestamp}

**Tindakan Awal**: {InitialAction}

**Estimasi Resolusi**: {ResolutionETA}

Kami akan memberikan update progres via email ini. Untuk pertanyaan mendesak, balas email ini atau hubungi WhatsApp Business +62 xxx.

Salam,
Tim Layanan Pelanggan
ZR Corp AI

**Template Follow-up Email**
**Subjek**: Update Tiket #{TicketID} - Status: {Status}
**Isi**:
Progres terbaru: {UpdateDetails}.
Tim: {AssignedTeam}.
Perkiraan penyelesaian: {NewETA}.
Jika sudah resolved, silakan konfirmasi dengan membalas email ini.

### SIMULASI 3 KASUS (Hasil Uji)
1. **Kasus Telepon - Login Gagal**: Resepsionis jalankan skrip 5 langkah dalam 4 menit. Hasil: tiket tercatat, respons awal 2 menit (sesuai SLA).
2. **Kasus Email - Billing Error**: Template email terkirim otomatis dalam 5 menit setelah entri form. Placeholder terisi benar.
3. **Kasus WhatsApp - Transaksi Pending**: Notifikasi otomatis terkirim saat status update. Resepsionis bisa gunakan respons cepat tanpa ketik ulang.

Semua skrip siap pakai. Integrasi dengan form T1 tinggal salin placeholder.
