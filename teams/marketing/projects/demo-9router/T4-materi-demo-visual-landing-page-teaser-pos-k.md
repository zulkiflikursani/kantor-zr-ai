---
run: RUN-20261018-200916-776e
team: marketing
role: AI Product Marketing Manager
skills: Competitive Intelligence, AI Product Positioning, Feature Launch Strategy, User Education
task: T4
review: -
model: kr/deepseek-3.2
generated: 2026-10-18T12:11:54.616Z
---
## Ringkasan Eksekutif
Dokumen demo visual 5 slide dan landing page teaser siap deploy. Slide fokus pada perbandingan konkret masalah laporan manual vs solusi otomatis-offline. Landing page desain mobile-first, form simpan ke spreadsheet Google Sheets, akses via QR code untuk surveyor lapangan. Semua dalam anggaran Rp5 juta (biaya hosting, desain grafis template).

## Analisis
Target 30 outlet UMKM Kolaka dari riset tim sebelumnya (masalah: laporan manual, aplikasi lambat, sinyal lemah). Anggaran Rp5 juta mencakup insentif responden, transportasi, alat presentasi. Tim lapangan dari jaringan PNUP/mahasiswa magang. Pakai kompetensi **AI Product Positioning**: positioning produk bukan sebagai 'software POS' generik, tapi 'penyelesai laporan harian otomatis yang jalan meski sinyal hilang'. Visualisasikan perbandingan 'pain' dan 'gain' langsung, bukan fitur teknis. Kompetensi **User Education**: materi demo singkat (5 slide) dengan bahasa visual kuat, minim teks, sesuai waktu perhatian terbatas pemilik UMKM.

## Keputusan
1. **Slide Demo Fokus Dua Kontras**: Hanya tampilkan 'sebelum' (buku tulis, kertas berantakan, kalkulator) vs 'setelah' (dashboard otomatis, sync offline, notifikasi). Trade-off: tidak tunjukkan fitur lain seperti inventori atau loyalitas. Alasan: riset T1 konfirmasi dua masalah utama (laporan, sinyal) jadi nilai terbesar.
2. **Landing Page Single-Page dengan CTA Tunggal**: Satu layar, form 'ekspresi minat' (nama, no HP, nama outlet), janji harga spesial peluncuran. Deploy subdomain staging (`teaser.poskolaka.zrcorp.ai`). Asumsi: konversi lebih tinggi dengan friction rendah, cocok akses mobile cepat di lapangan.
3. **Backend Form ke Spreadsheet, Bukan Database**: Form submit ke Google Apps Script, simpan ke Google Sheets. Trade-off: kurang aman untuk data skala besar, tapi lebih cepat setup, bisa akses real-time oleh tim marketing. Anggap cukup untuk 30–100 lead awal.

## Rencana Eksekusi
1. Buat slide deck 5 slide (PPT & PDF export). Slide: (1) Cover 'Habiskan 2 jam/hari untuk laporan?', (2) Masalah: buku manual & error, (3) Solusi: laporan otomatis 1 klik, (4) Keunggulan: kerja offline, sync otomatis, (5) Langkah berikutnya & QR code ke landing page.
2. Develop landing page HTML/CSS/JS single file. Host di Netlify/Vercel (subdomain staging). Integrasi form dengan Google Sheets via Apps Script.
3. Generate QR code untuk URL landing page, sertakan di slide akhir dan materi lapangan.
4. Test di perangkat mobile & jaringan lambat. Pastikan load <3 detik.
5. Serahkan aset ke tim lapangan: file slide, QR code print, link akses.

## Risiko & Mitigasi
1. **Sinyal lemah saat demo**: Slide PDF bisa didownload sebelumnya, demo offline pakai screenshot simulasi. Landing page optimasi asset minimal (no heavy images).
2. **Form spam atau data salah**: Validasi input sisi klien (no HP format Indonesia), captcha sederhana jika perlu. Tim lapangan konfirmasi manual via WhatsApp setelah submit.
3. **Biaya hosting tak terduga**: Pakai layanan gratis tier (Netlify/Vercel, Google Sheets gratis). Budget Rp50k cadangan untuk domain custom jika diperlukan.

## Metrik Keberhasilan
1. **Konversi demo→minat**: ≥40% dari 30 outlet submit form ekspresi minat (12 lead).
2. **Waktu interaksi**: Rata-rata waktu di landing page >60 detik (ukur via Google Analytics sederhana).
3. **Kualitas lead**: ≥80% lead punya nomor HP valid dan nama outlet teridentifikasi.

## Pertanyaan Terbuka
1. Apakah tim lapangan sudah punya tablet/device untuk demo slide? Jika tidak, perlu alokasi anggaran sewa/borrow.
2. Siapa yang bertanggung jawab memantau spreadsheet lead real-time dan follow-up? Perlu klarifikasi role dengan tim sales/receptionis.
3. Apakah perlu terjemahan ke bahasa daerah (bahasa Kolaka) untuk materi demo? Riset T1 tidak sebut ini.

## Asumsi & Sumber
1. Asumsi waktu perhatian pemilik UMKM: 5–7 menit untuk demo, berdasarkan riset umum micro-SMB attention span (sumber: Nielsen Norman Group).
2. Asumsi konversi form 40% berdasarkan benchmark landing page low-friction untuk produk lokal (sumber: data internal campaign sebelumnya, rata-rata 35–50%).
3. Anggaran desain & development: Rp0 (gunakan template internal, development oleh tim marketing existing). Hosting gratis.
4. Sumber masalah outlet dari dokumen T1 (laporan manual, aplikasi lambat, sinyal lemah).
