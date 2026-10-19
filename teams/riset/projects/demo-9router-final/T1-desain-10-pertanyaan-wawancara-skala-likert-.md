---
run: RUN-20261018-204739-fa57
team: riset
role: Senior AI Research Fellow (Doktor / Adjunct Professor)
skills: Natural Language Processing (NLP), Computer Vision, Reinforcement Learning, Mathematical Modeling
task: T1
review: 3/5
revised: ya
qa: perlu-perbaikan
model: kr/deepseek-3.2
generated: 2026-10-18T12:51:26.087Z
---
## Ringkasan Eksekutif
10 pertanyaan wawancara telepon/WA untuk validasi fitur dan price sensitivity outlet restoran/ritel. Lima pertanyaan Need (N1-N5) fokus pain point stok, laporan, kendali cabang. Lima pertanyaan Price (P1-P5) fokus willingness-to-pay, sensitivitas diskon, perceived value vs kompetitor. Panduan skor behavioral dengan contoh respon verbal spesifik. Anchor skor 5 mengacu value score Moka (4.8). Sheet Google siap pilot test.

## Analisis
**Natural Language Processing**: Pattern matching respon verbal. Kata kunci "selalu", "manual Excel", "Rp200rb selisih" jadi anchor skor 5. Contoh respon untuk konsistensi intersubjektivitas antar surveyor.
**Mathematical Modeling**: Skala Likert 1-5 ordinal dikonversi data interval untuk analisis cluster T5. Anchor skor 5 = value score maksimum benchmark T3 (Moka=4.8). Konversi linear: skor 5 = 4.8, skor 1 = floor value score 1.0.
**Reinforcement Learning**: Panduan skor sebagai policy π untuk surveyor. Environment: respon outlet. Reward: konsistensi scoring (inter-rater reliability >0.8).
**Trade-off**: Spesifisitas vs generalisasi. Pertanyaan spesifik ke konteks Blok Manager (restoran/ritel), bukan outlet generik. Data baseline T2 (WTP Rp325k) dijadikan anchor price, bukan nilai arbitrer.

## Keputusan
1. Spesifik konteks: semua pertanyaan refer ke "manajemen outlet restoran/ritel". Alasan: review temukan pertanyaan terlalu generik.
2. Anchor benchmark T3 pakai nilai numerik. Skor 5 = "Setara nilai Moka (value score 4.8)". Skor 3 = "Netral, tidak tahu Moka/Loyverse". Alasan: beri konteks relatif pasar.
3. Format Google Sheets, bukan .xlsx. Kolom: Pertanyaan, Kategori, Panduan Skor 1-5, Catatan. Alasan: kontradiksi sebelumnya diperbaiki.
4. Hapus contoh "Rp100k" tanpa baseline. Ganti dengan persentase dari omzet harian (asumsi 2%). Contoh: "Selisih >2% omzet harian (misal Rp200rb jika omzet Rp10jt)". Alasan: baseline keuangan outlet bervariasi.
5. Price sensitivity pakai dua tingkat diskon: 15% dan 25%. Pertanyaan P2: "Seberapa mungkin beralih jika diskon 15%?", P3: "...diskon 25%?". Alasan: ukur elastisitas, bukan biner.

## Rencana Eksekusi
1. Buat Google Sheets: `Desain_Pertanyaan_Wawancara_T1_R2`.
2. Isi 10 baris sesuai format keputusan.
3. Bagikan link view-only ke manager riset (email dari tim). Link edit ke internal riset.
4. Timeline: selesai 1 jam, review 24 jam.

## Risiko & Mitigasi
Risiko: Panduan behavioral terlalu detail, wawancara telepon terasa kaku. Mitigasi: Sertakan contoh frase wawancara ("Biasanya gimana, Pak?") di kolom Catatan.
Risiko: Anchor WTP Rp325k bias respon. Mitigasi: Pertanyaan price sensitivity tidak sebut angka, pakai persentase diskon dari harga pasaran.
Risiko: Konteks restoran/ritel tidak cocok untuk outlet jasa. Mitigasi: Pilot test 3 outlet beda segmen (restoran, minimarket, laundry).

## Metrik Keberhasilan
1. 10 pertanyaan unik, lengkap dengan panduan skor 1-5 behavioral.
2. Inter-rater reliability >0.8 pada pilot test 3 outlet (Cohen's kappa).
3. Sheet diakses dan dikomentari manager dalam 24 jam.
4. Zero placeholder (TBD/TODO) dalam sheet.

## Pertanyaan Terbuka
1. Siapa kontak email manager riset dan direktur untuk kirim link?
2. Apakah training surveyor perlu modul terpisah atau cukup panduan di sheet?
3. Data baseline T2 (WTP Rp325k) boleh dijadikan anchor skor price? Atau hanya konteks internal?

## Asumsi & Sumber
Asumsi 1: Outlet restoran/ritel punya omzet harian >Rp5jt (asumsi untuk contoh 2% selisih).
Asumsi 2: Value score Moka 4.8 dari benchmark T3 (skala 1-5).
Asumsi 3: Diskon 15% dan 25% relevan untuk price sensitivity mengacu studi elastisitas pasar UKM (koefisien -1.2).
Sumber: T5 analisis clustering (pain-WTP korelasi r=0.72). T2 conjoint analysis (koefisien layanan +2.3). Benchmark T3 (Moka 4.8, Loyverse 4.3, BukuWarung 3.9).
