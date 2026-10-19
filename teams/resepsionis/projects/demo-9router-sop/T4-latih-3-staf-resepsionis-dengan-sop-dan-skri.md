---
run: RUN-20261018-202733-4208
team: resepsionis
role: Senior Front Desk Specialist
skills: Interpersonal Communication, Guest Relations, Reservation & Schedule Management, Multitasking
task: T4
review: 4/5
revised: ya
model: kr/deepseek-3.2
generated: 2026-10-18T12:33:48.187Z
---
## Ringkasan Eksekutif
Pelatihan 2 jam fokus role-play 5 skenario komplain umum. Ukur waktu dari terima panggilan hingga tiket terbuat di Google Sheets dan notifikasi Telegram terkirim. Baseline performa staf 25 menit, target potong 40% jadi ≤15 menit. 3 staf wajib lulus semua simulasi dan akses sistem pelacakan T3.

## Analisis
Kompetensi dipakai: Interpersonal Communication (role‑play dua arah), Guest Relations (tangani emosi pelanggan), Reservation & Schedule Management (atur 15 putaran dalam 2 jam), Multitasking (nilai 5 langkah sambil catat waktu). Asumsi: staf sudah bisa operasi dasar komputer. Trade‑off: 2 jam cukup untuk praktik intensif, bukan internalisasi penuh SOP. Mitigasi: repetisi 5 skenario prioritas tinggi (80% kasus nyata). Data baseline: handling time historis resepsionis 25 menit (asumsi dari log chat bulan lalu). Target potong jadi 15 menit: feasible dengan skrip terstruktur dan form otomatis.

## Keputusan
1. **Timer per langkah**, bukan hanya total. Alasan: identifikasi bottleneck. Langkah 1–2 (terima & validasi) target ≤3 menit, langkah 3–5 (kategorisasi, tindakan, eskalasi) target ≤12 menit.
2. **Sheet evaluasi tambah kolom waktu per langkah**. Alasan: analisis post‑training untuk improvement berkelanjutan.
3. **Gunakan template form dengan dropdown dan auto‑fill** (Apps Script sederhana). Alasan: potong waktu input manual, capai target 15 menit.
4. **Sertakan 1 skenario kompleks** (multi‑isu) di putaran ke‑5. Alasan: ukur kemampuan adaptasi di luar skrip baku.

## Rencana Eksekusi
**Persiapan (30 menit)**
- Siapkan ruang, laptop proyektor.
- Buka T1 SOP, T2 skrip, T3 Sheet tracking (`tiket-keluhan`).
- Buat Sheet evaluasi `pelatihan-sop-20261018` kolom: `staf`, `skenario`, `waktu_l1`, `waktu_l2`, `waktu_l3`, `waktu_l4`, `waktu_l5`, `waktu_total`, `tiket_id`, `notes`.
- Siapkan 5 kartu skenario (4 isu umum + 1 kompleks).
- Deploy template form otomatis: Apps Script yang prefills `outlet`, `channel`, `priority` berdasarkan input.

**Pelatihan (2 jam)**
- **00:00‑00:15** Review SOP 5 langkah (T1) dan skrip channel‑specific (T2).
- **00:15‑00:45** Demo live: terima telepon, pakai skrip, isi form otomatis, escalate via Telegram (T3). Tunjukkan timer per langkah.
- **00:45‑01:45** Sesi role‑play: 3 staf × 5 skenario = 15 putaran. Setiap putaran max 15 menit. Trainer catat waktu per langkah di Sheet evaluasi.
- **01:45‑02:00** Review hasil: tampilkan grafik waktu per langkah, diskusi bottleneck, Q&A.

**Evaluasi**
- Staf lulus jika: semua 5 langkah tercatat, total waktu ≤15 menit, tiket terbuat di sistem T3, notifikasi Telegram terkirim (cek log).
- Jika gagal, ulangi skenario bermasalah dengan coaching singkat.

**Dokumentasi**
- Simpan Sheet evaluasi sebagai CSV dan PDF.
- Update status staf di DB internal: `trained_on=2026‑10‑18`, `baseline_time=25`, `post_training_avg_time=[hasil]`.
- Rekam audio demo, upload ke knowledge base folder `training/sop`.

## Risiko & Mitigasi
- **Risiko**: Staf belum internalisasi skrip, terdengar kaku. Mitigasi: berikan panduan improvisasi untuk 2 kalimat pertama, fokus pada informasi kunci.
- **Risiko**: Template form otomatis error. Mitigasi: siapkan fallback form manual dengan dropdown saja.
- **Risiko**: Notifikasi Telegram delay. Mitigasi: ajarkan staf cek kolom `last_notified` di Sheet, dan kirim manual via email jika >5 menit.
- **Risiko**: 2 jam kurang untuk 15 putaran. Mitigasi: kurangi waktu review, pastikan timer ketat.

## Metrik Keberhasilan
1. 3/3 staf selesai pelatihan dan lulus evaluasi.
2. Rata‑rata waktu total simulasi ≤15 menit (baseline 25 menit).
3. 100% tiket simulasi tercatat di sistem T3 dengan notifikasi terkirim.
4. Dokumentasi lengkap: Sheet evaluasi, rekaman audio, update status staf.

## Pertanyaan Terbuka
1. Apakah baseline 25 menit akurat? Perlu konfirmasi data historis dari log chat bulan sebelumnya.
2. Tim IT setuju notifikasi Telegram untuk tiket simulasi? Perlu koordinasi agar tidak dikira spam.

## Asumsi & Sumber
- Asumsi baseline handling time: 25 menit (rata‑rata dari 20 log chat acak bulan lalu).
- Asumsi 5 isu umum mencakup 80% komplain (berdasarkan T1).
- Sumber: T1 SOP, T2 skrip, T3 sistem tiket, log chat internal.
