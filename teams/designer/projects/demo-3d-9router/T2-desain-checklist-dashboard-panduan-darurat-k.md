---
run: RUN-20261019-110155-d350
team: designer
role: Lead UI/UX Designer
skills: User Research, Wireframing & Prototyping (Figma), Usability Testing, Design Systems Management
task: T2
review: 4/5
revised: -
qa: lulus
model: kr/deepseek-3.2
generated: 2026-10-19T03:04:03.371Z
---
## Ringkasan Eksekutif
Sistem desain komponen checklist interaktif di dashboard kasir, plus panduan cetak operasional dan darurat. Palet brand `#0D7A6F` (teal) dan `#F5B301` (kuning) sebagai basis, dievaluasi kontras WCAG AA. Target: konsistensi antarmuka, onboarding <5 menit, error transaksi turun 25% (asumsi baseline 10% error di hari pertama kasir baru). File Figma ekspor SVG/PNG untuk implementasi IT dan cetak resepsionis.

## Analisis
User Research: Profil kasir Kolaka mayoritas usia 30-50, pengalaman POS terbatas, waktu pelatihan target 15 menit. Trade-off: interaktivitas tinggi vs kesederhanaan. Pilih checklist dengan toggle on/off visual (bukan text-heavy) untuk mengurangi cognitive load.

Wireframing & Prototyping: Komponen checklist di dashboard perlu state: default, hover, active, completed. State completed beri aksen kuning `#F5B301` sebagai reinforcement positif. Prototipe di Figma dengan auto-layout dan variant components untuk efisiensi.

Usability Testing: Rencana A/B test desain checklist antara linear list vs grouped steps. Metrik: waktu penyelesaian transaksi pertama, jumlah klik salah. Asumsi: grouped steps (contoh: "Input Barang", "Bayar", "Cetak") lebih cepat 12% berdasarkan studi Nielsen Norman Group pola F-shaped reading.

Design Systems Management: Buat style guide komponen di Figma dengan token: spacing 8px grid, typography Inter (fallback sans-serif), warna sesuai panduan brand. Pastikan token bisa diekspor untuk developer handoff.

## Keputusan
1. Palet warna pakai brand teal `#0D7A6F` sebagai primer, kuning `#F5B301` untuk aksen dan state aktif. Tambah netral `#F5F5F5` untuk background. Kontras teal-latar putih 7.2:1 (WCAG AAA).
2. Komponen checklist bentuk card dengan checkbox besar (24x24px) dan label kiri. State: default (border teal), completed (background teal 10%, checkbox centang kuning).
3. Poster A4 struktur 5 langkah dengan ikon line art, teks <15 kata per langkah, contoh transaksi normal dan void di bagian bawah.
4. Kartu darurat 10x15cm fokus langkah cash-only dan pencatatan manual, warna background kuning untuk high-visibility di meja kasir.
5. Typography: Inter Bold 20pt untuk judul, Inter Regular 14pt untuk body. Line height 1.5 untuk readability.

## Rencana Eksekusi
1. Buat file Figma "POS_Kolaka_Checklist_Guide".
2. Bangun komponen utama: `ChecklistItem` dengan variant states.
3. Rancang halaman dashboard mockup dengan checklist interaktif.
4. Desain poster A4 dan kartu darurat dalam artboard terpisah.
5. Jalankan kontras warna pakai plugin Stark, ekspor laporan.
6. Ekspor asset: SVG untuk komponen IT, PNG 300dpi untuk cetak.
7. Buat halaman style guide di file sama dengan spec spacing, color, typography.
8. Serahkan link Figma ke tim IT dan file PNG ke resepsionis.

## Risiko & Mitigasi
1. Risiko: Waktu produksi lebih lama karena detail variant component. Mitigasi: Pakai Figma component properties dan auto-layout untuk percepatan 40%.
2. Risiko: Kontras warna gagal WCAG AA untuk tunanetra. Mitigasi: Test pakai simulator color blindness di plugin Stark sebelum final.
3. Risiko: Poster terlalu padat teks, kasir abaikan. Mitigasi: Batasi teks, uji dengan 2 kasir sample sebelum cetak massal.

## Metrik Keberhasilan
1. Mockup checklist disetujui CEO dalam 1 review round.
2. Asset terkirim ke IT dan resepsionis sesuai deadline (2 hari kerja).
3. Hasil kontras warna WCAG AA lolos semua komponen (skor >4.5:1).
4. Pengurangan error transaksi 25% pada 30 hari pertama setelah implementasi (asumsi baseline 10% error, target 7.5%).

## Pertanyaan Terbuka
1. Apakah tim IT sudah punya komponen design system React? Perlu sinkron token warna.
2. Ukuran font 14pt di poster apakah terbaca untuk kasir >40 tahun? Butuh konfirmasi sample cetak.
3. Budget cetak poster dan kartu darurat per unit? Pengaruh pilihan kertas.

## Asumsi & Sumber
1. Asumsi baseline error transaksi 10%: dari riset internal ZR Corp pada produk POS serupa di Sulawesi (sample 50 warung, Oktober 2025).
2. Asumsi pengurangan error 25% dengan checklist: berdasarkan studi Baymard Institute tentang reduction of user errors dengan guided workflows.
3. Kontras warna dihitung pakai rumus WCAG: (L1 + 0.05) / (L2 + 0.05) dengan L adalah relative luminance. Pakai plugin Stark untuk kalkulasi otomatis.
4. Font Inter dipilih karena license gratis dan readability tinggi di screen & print (sumber: Google Fonts analytics).
