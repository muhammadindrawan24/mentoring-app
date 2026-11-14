# SIM Mentoring Islam

Sistem Manajemen Mentoring Agama Islam untuk mahasiswa baru. Aplikasi web berbasis Next.js dengan dua peran: **Admin/Panitia** dan **Mentor**.

## Fitur

- **Admin**: dashboard, kelola mentee, mentor, kelompok, pertemuan, materi, absensi, verifikasi izin, dokumentasi, catatan mentoring, evaluasi, pengumuman, laporan, dan pengaturan.
- **Mentor**: dashboard, kelompok saya, mentee, pertemuan, materi, absensi, dokumentasi, catatan mentoring, evaluasi, pengumuman, dan profil.
- **Penyimpanan lokal**: data tersimpan di `localStorage` browser (satu key per tabel).
- **Backup Excel**: export seluruh data ke satu file `.xlsx` (12 sheet) dan import kembali untuk restore, tersedia di **Admin → Pengaturan**.
- **Responsive**: sidebar dan layout menyesuaikan desktop maupun mobile.

## Teknologi

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- Zustand (state management)
- React Hook Form + Zod (form & validasi)
- SheetJS (`xlsx`) untuk export/import Excel

## Menjalankan

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

Perintah lain:

```bash
npm run build    # build produksi
npm run start    # jalankan hasil build
npm run lint     # lint
```

## Data & Backup

1. Data domain (mentor, mentee, kelompok, pertemuan, dll.) disimpan di browser yang sedang dipakai.
2. Buka **Pengaturan** untuk:
   - **Export ke Excel**: mengunduh `sim-mentoring-YYYY-MM-DD.xlsx`.
   - **Import dari Excel**: memilih file `.xlsx` dan mengganti data pada sheet yang ada di file.
   - **Reset Data**: menghapus data lokal dan memuat ulang aplikasi.
3. Untuk berpindah perangkat/domain, gunakan Export lalu Import.

> Import hanya mengganti sheet yang ada di file. Data akun login tidak termasuk dalam file Excel.

## Struktur Singkat

```
src/
  app/                 # halaman admin, mentor, login
  components/          # layout dan komponen UI
  lib/
    excel.ts           # export/import .xlsx
    local-db.ts        # penyimpanan localStorage
    persist.ts         # auto-save store ke localStorage
    *-store.ts         # state per entitas (Zustand)
  types/               # tipe data
```

## Deploy

Aplikasi dapat di-deploy ke Vercel atau server sendiri. Karena data disimpan di browser, tidak diperlukan backend database. Gunakan domain yang sudah disiapkan dan arahkan ke hasil deployment.
