---
run: RUN-20261018-203643-7a27
team: it
role: Senior Full-Stack Developer
skills: Python, TypeScript/Go, React/Next.js, FastAPI/Node.js, RESTful & GraphQL APIs
task: T2
review: 4/5
revised: -
qa: lulus
model: kr/deepseek-3.2
generated: 2026-10-18T12:44:25.751Z
---
## Ringkasan Eksekutif
Form validasi kebutuhan & WTP POS siap wawancara tatap muka. Struktur: 10 pertanyaan Likert 1-5 dengan definisi skor konsisten. Validasi sisi client via required fields dan pattern validation (nomor HP). Form terhubung ke Google Sheets via trigger Apps Script. Sheet template sudah siap dengan kolom analisis (total skor, timestamp, outlet). Build time ~45 menit.

## Analisis
Kompetensi TypeScript/Go & RESTful APIs dipakai: Apps Script (JavaScript/TypeScript subset) untuk automasi, Google Forms & Sheets API untuk integrasi. Trade-off: validasi Google Forms client-side hanya basic (required, pattern). Validasi range skor 1-5 harus via question type 'Scale'. Asumsi: target responden 50 UMKM di Kolaka; 1 form submission per wawancara; data masuk ke sheet untuk analisis T3 (WTP Rp325k mean, elastisitas -2.1). Template T1 dari tim riset (teams/riset/projects/demo-9router-3/) sudah final.

## Keputusan
1. Pakai Google Forms native (bukan Forms API) untuk speed deployment. Validasi wajib isi dan skala 1-5 via question type 'Scale'. Validasi nomor HP via pattern validation (regex `^08[0-9]{9,11}$`).
2. Setup trigger `onFormSubmit` di Apps Script untuk otomatis push response ke Google Sheets. Logic: ambil response item, hitung total skor (sum Q1-Q10), tulis ke sheet dengan format kolom terstruktur.
3. Sheet template siap untuk analisis T3: kolom `timestamp`, `outlet`, `nama`, `hp`, `q1`...`q10`, `total_skor`, `catatan_kualitatif`. Tambah sheet `metadata` untuk definisi skor.

## Rencana Eksekusi
1. Buat Google Form baru di akun Google Workspace tim (folder: teams/it/projects/pos-kolaka-produk/).
2. Import 10 pertanyaan dari template T1 (Google Docs). Set each as 'Scale' 1-5, required. Add short text for `outlet`, `nama`, `hp` (with pattern validation).
3. Create linked Google Sheets via Form responses tab. Structure columns as per template.
4. Open Apps Script editor from Form, write `onFormSubmit` function to calculate total score and append row.
5. Deploy trigger, test with dummy submission, verify real-time sync.
6. Generate short URL via bit.ly or Google's built-in URL shortener.

## Risiko & Mitigasi
1. **Concurrent edit lock pada Sheet** jika banyak surveyor submit bersamaan. Mitigasi: Apps Script gunakan `LockService` untuk serialize writes; asumsi throughput rendah (max 5 submissions/min).
2. **Validasi nomor HP bisa miss** (nomor kantor, non-Indonesia). Mitigasi: regex dasar `^08[0-9]{9,11}$` untuk mobile Indonesia; tambah kolom validasi manual di sheet.
3. **Trigger gagal** jika quota Apps Script terlampaui (daily limit 90 min runtime). Mitigasi: log error ke sheet terpisah; notifikasi email ke admin via `MailApp`.

## Metrik Keberhasilan
- Form online accessible via short URL (`bit.ly/pos-kolaka-survey` atau `goo.gl/forms/...`) dalam 1 jam.
- Setiap submission masuk ke Sheet dalam <5 detik (real-time).
- Sheet template ready untuk analisis: kolom total_skor terhitung otomatis, format data konsisten.
- Uji 5 dummy submissions berhasil tanpa error.

## Pertanyaan Terbuka
1. **API key untuk URL shortener** – perlu bit.ly API key atau cukup pakai built-in Google URL shortener (yang menghasilkan URL panjang)?
2. **Ownership Sheet** – apakah sheet ditaruh di Google Drive tim riset atau IT? Perlu set sharing permissions untuk surveyor lapangan (view only vs edit).
3. **Backup data** – apakah perlu otomatis export harian ke CSV atau cukup andalkan Google Sheet version history?

## Asumsi & Sumber
- Asumsi throughput: 50 submissions total, 5 per hari maksimal. Runtime Apps Script aman (function ~2 sec per execution).
- Sumber regex nomor HP: standar Indonesia prefix 08, length 10-12 digit (contoh: 08123456789).
- Sumber template pertanyaan: T1 dari tim riset (dokumen `teams/riset/projects/demo-9router-3/`).
- Sumber struktur sheet: T3 arsitektur ticketing tracker (proyek demo-9router-sop) sebagai referensi kolom terstruktur.
