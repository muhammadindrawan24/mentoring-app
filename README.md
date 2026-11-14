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

## Deploy ke GitHub Pages + Subdomain

Aplikasi disiapkan untuk static export (`output: "export"`). Hasil build ada di folder `out/`, lalu di-deploy ke branch `gh-pages`.

Domain utama `adiindwn.my.id` dipakai untuk portfolio. Aplikasi mentoring memakai subdomain `mentoring.adiindwn.my.id`.

1. Build dan deploy:

   ```bash
   npm run build
   npm run deploy:pages
   ```

2. Di repo GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
3. Pilih branch **`gh-pages`** dan folder **`/ (root)`**, lalu simpan.
4. Isi **Custom domain** dengan `mentoring.adiindwn.my.id` lalu simpan.
5. Di pengaturan DNS domain, tambahkan record berikut:

   | Type | Name | Value |
   |---|---|---|
   | CNAME | mentoring | muhammadindrawan24.github.io |

6. Tunggu propagasi DNS, lalu aktifkan **Enforce HTTPS**.

File `public/CNAME` sudah berisi `mentoring.adiindwn.my.id` dan `public/.nojekyll` mencegah pemrosesan Jekyll. Setiap ada perubahan, jalankan `npm run build` lalu `npm run deploy:pages` lagi.

> Akses lewat URL project (`muhammadindrawan24.github.io/mentoring-app/`) belum tentu berjalan karena aplikasi di-build untuk root domain. Gunakan domain kustom atau sesuaikan `basePath` bila ingin memakai URL project.


