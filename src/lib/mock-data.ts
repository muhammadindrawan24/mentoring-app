import { User, Mentor, Mentee, Kelompok, Pertemuan } from '@/types';

/**
 * Data awal aplikasi: hanya akun bootstrap (admin & mentor).
 * Mentor, kelompok, mentee, pertemuan, absensi, dan lainnya sengaja dikosongkan
 * — seluruhnya dimuat dari penyimpanan lokal/Excel, atau dibuat lewat UI.
 *
 * Hash = SHA-256 dari "sim-mentoring-islam:<password>" (lihat lib/password.ts).
 * Ganti password kedua akun ini sebelum dipakai di produksi.
 */
export const MOCK_USERS: User[] = [
  {
    user_id: 'USR001',
    nama: 'Admin Utama',
    email: 'admin@mentoring-islam.id',
    password_hash: '85456b2cfb0155cd78a15ca61150204f724861fe31fb5fa2528ee6c08010e61e',
    role: 'ADMIN',
    status: 'ACTIVE',
    created_at: '2026-01-01T00:00:00+07:00',
    updated_at: '2026-01-01T00:00:00+07:00',
  },
  {
    user_id: 'USR002',
    nama: 'Ahmad Fauzi',
    email: 'ahmad@mentoring-islam.id',
    password_hash: '26eda7873058d1d28058ca33fc07cfceed013213fecb9853331dc9cbe5def5a6',
    role: 'MENTOR',
    status: 'ACTIVE',
    created_at: '2026-01-15T00:00:00+07:00',
    updated_at: '2026-01-15T00:00:00+07:00',
  },
];

export const MOCK_MENTORS: Mentor[] = [];

export const MOCK_MENTEES: Mentee[] = [];

export const MOCK_KELOMPOK: Kelompok[] = [];

export const MOCK_PERTEMUAN: Pertemuan[] = [];
