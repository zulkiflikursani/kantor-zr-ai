---
run: RUN-20261018-202733-4208
team: it
role: Senior Full-Stack Developer
skills: Python, TypeScript/Go, React/Next.js, FastAPI/Node.js, RESTful & GraphQL APIs
task: T3
review: 5/5
revised: -
model: kr/deepseek-3.2
generated: 2026-10-18T12:33:48.185Z
---
## Ringkasan Eksekutif
Implementasi kanal real-time resepsionis dengan Google Sheet sebagai database ringan. Apps Script handle ticket generation, status updates, filtering. Telegram bot kirim notifikasi otomatis saat tiket di-escalate ke IT atau keuangan. Memenuhi SLA respons 1 jam dengan visibility real-time dan audit trail. Build time: 1 jam 45 menit.

## Analisis
Kompetensi dipakai: TypeScript (Apps Script), RESTful APIs (Telegram Bot API), System Architecture (offline-first consideration). Trade-off: Google Sheet bukan database relasional — batas 5 juta cells, locking concurrent edits. Asumsi: maksimal 100 tiket per hari, 10 kolom per tiket → 1000 cells/hari, sustainable. Apps Script quota 6 menit runtime per execution — cukup untuk operasi CRUD. Telegram bot free tier 30 pesan/detik, lebih dari cukup. Alternatif considered: Airtable (lebih mahal), internal mini‑tool (butuh hosting, >2 jam). Keputusan: Sheet + Apps Script paling cepat deploy, zero infra cost, resepsionis sudah familiar.

## Keputusan
1. **Sheet schema flat dengan 10 kolom**: `ticketId`, `outlet`, `customerName`, `channel`, `priority`, `status`, `createdAt`, `updatedAt`, `assignedTo`, `notes`. Alasan: cukup untuk tracking, sorting, filtering; simpan sebagai CSV backup.
2. **Apps Script trigger onEdit kirim notifikasi hanya untuk eskalasi (priority P1/P2)**. Alasan: hindari spam; IT hanya perlu tahu saat urgent.
3. **Telegram bot pakai webhook, notifikasi format markdown dengan deep link ke sheet**. Alasan: IT bisa klik langsung ke tiket; markdown baca cepat.
4. **Filter view per outlet menggunakan built‑in Filter Views**. Alasan: native feature Sheet, zero code, resepsionis bisa toggle.

## Rencana Eksekusi
1. Buat Google Sheet baru, set schema. 2. Tulis Apps Script: generate ticketId (timestamp‑outlet‑seq), update status, sendToTelegram. 3. Setup Telegram bot via BotFather, dapat token, set webhook. 4. Deploy script sebagai Web App (execute as me, access anyone). 5. Buat menu custom di Sheet untuk resepsionis. 6. Test flow lengkap: buat tiket, update status, terima notifikasi.

## Risiko & Mitigasi
- **Concurrent edit conflicts**: Sheet locking bisa cause write failure. Mitigasi: tambah retry logic di script, gunakan queue dengan PropertiesService.
- **Apps Script quota exceeded**: jika >1000 tiket/day. Mitigasi: batch notifications, atau pindah ke Cloud Functions nanti.
- **Telegram token exposure**: token di script visible oleh editor sheet. Mitigasi: simpan token di PropertiesService (encrypted), restrict sheet editor list.
- **Internet required**: Sheet online‑only. Mitigasi: resepsionis bisa catat di form kertas sementara jika offline, input ulang saat online — sesuai SOP T1.

## Metrik Keberhasilan
- Ticket creation‑to‑notification < 2 detik.
- Resepsionis bisa buat/tutup tiket dalam 3 klik.
- IT menerima notifikasi dalam 5 detik setelah eskalasi.
- Sistem tetap operasional dengan 10 concurrent users (simulasi).

## Pertanyaan Terbuka
- Siapa PIC IT yang akan terima notifikasi Telegram? Perlu daftar chat‑id.
- Apakah perlu audit log terpisah selain sheet history? Revision history Sheet cukup untuk traceability?
- Jika outlet belum ada di daftar, bolehkah resepsionis tambah manual? Atau harus lewat admin dulu?

## Asumsi & Sumber
- Asumsi: Google Workspace environment sudah ada, resepsionis punya akses Google Account.
- Asumsi: Telegram accessible di jaringan internal (no firewall block).
- Sumber: Telegram Bot API docs, Apps Script quotas, Google Sheet limits.
- Perhitungan: 100 tiket/hari × 10 kolom × 30 hari = 30k rows, aman di limit Sheet.
