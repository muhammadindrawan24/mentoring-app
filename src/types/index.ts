export type Role = 'ADMIN' | 'MENTOR';
export type Status = 'ACTIVE' | 'INACTIVE';
export type MeetingStatus = 'DRAFT' | 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
export type AttendanceStatus = 'HADIR' | 'IZIN' | 'SAKIT' | 'ALFA';
export type VerificationStatus = 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK';
export type DevCategory = 'SANGAT_BAIK' | 'BAIK' | 'CUKUP' | 'PERLU_PENDAMPINGAN';
export type AnnouncementTarget = 'SEMUA_MENTOR' | 'MENTOR_TERTENTU' | 'KELOMPOK_TERTENTU';
export type FileType = 'PDF' | 'PPT' | 'DOC' | 'XLS' | 'VIDEO' | 'LINK';

export interface User {
  user_id: string;
  nama: string;
  email: string;
  password_hash: string;
  role: Role;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface Mentor {
  mentor_id: string;
  /** Terisi hanya bila mentor punya akun login di tabel Users. */
  user_id?: string;
  NIM: string;
  nama: string;
  prodi: string;
  email: string;
  no_hp: string;
  kelompok_id: string;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface Mentee {
  mentee_id: string;
  NIM: string;
  nama: string;
  prodi: string;
  angkatan: string;
  no_hp: string;
  email?: string;
  kelompok_id: string;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface Kelompok {
  kelompok_id: string;
  kode_kelompok: string;
  nama_kelompok: string;
  mentor_id: string;
  jumlah_anggota: number;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface Pertemuan {
  pertemuan_id: string;
  pertemuan_ke: number;
  judul: string;
  tema: string;
  deskripsi: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  status: MeetingStatus;
  created_at: string;
  updated_at: string;
}

export interface Materi {
  materi_id: string;
  pertemuan_id: string;
  judul: string;
  deskripsi: string;
  file_id: string;
  file_url: string;
  jenis_file: FileType;
  uploaded_by: string;
  uploaded_at: string;
}

export interface Absensi {
  absensi_id: string;
  pertemuan_id: string;
  kelompok_id: string;
  mentee_id: string;
  mentor_id: string;
  status: AttendanceStatus;
  keterangan: string;
  bukti_izin_url: string;
  bukti_izin_file_id: string;
  waktu_input: string;
  tanggal_input: string;
  status_verifikasi: VerificationStatus;
}

export interface BuktiIzin {
  bukti_izin_id: string;
  mentee_id: string;
  pertemuan_id: string;
  kelompok_id: string;
  file_id: string;
  file_url: string;
  alasan: string;
  uploaded_by: string;
  uploaded_at: string;
  status_verifikasi: VerificationStatus;
  verified_by: string;
  verified_at: string;
  catatan_verifikasi: string;
}

export interface BuktiPertemuan {
  bukti_id: string;
  pertemuan_id: string;
  kelompok_id: string;
  mentor_id: string;
  file_id: string;
  file_url: string;
  keterangan: string;
  uploaded_at: string;
}

export interface CatatanPertemuan {
  catatan_id: string;
  pertemuan_id: string;
  kelompok_id: string;
  mentor_id: string;
  jumlah_hadir: number;
  topik: string;
  kondisi: string;
  catatan: string;
  tindak_lanjut: string;
  created_at: string;
  updated_at: string;
}

export interface CatatanMentee {
  catatan_id: string;
  mentee_id: string;
  pertemuan_id: string;
  mentor_id: string;
  keaktifan: DevCategory;
  pemahaman: DevCategory;
  catatan: string;
  tindak_lanjut: string;
  created_at: string;
}

export interface Evaluasi {
  evaluasi_id: string;
  mentee_id: string;
  mentor_id: string;
  pertemuan_id: string;
  kehadiran: DevCategory;
  keaktifan: DevCategory;
  pemahaman: DevCategory;
  partisipasi: DevCategory;
  komitmen: DevCategory;
  catatan: string;
  created_at: string;
  updated_at: string;
}

export interface Pengumuman {
  pengumuman_id: string;
  judul: string;
  isi: string;
  target: AnnouncementTarget;
  target_ids: string;
  status: Status;
  published_at: string;
  created_by: string;
  created_at: string;
}

export interface AuditLog {
  log_id: string;
  user_id: string;
  role: Role;
  action: string;
  entity: string;
  entity_id: string;
  description: string;
  timestamp: string;
  ip_optional: string;
}

export interface DashboardStats {
  totalMentee: number;
  totalMentor: number;
  totalKelompok: number;
  totalPertemuan: number;
  menteeTanpaKelompok: number;
  persentaseKehadiran: number;
  izinMenunggu: number;
}

export interface MentorDashboardStats {
  namaMentor: string;
  namaKelompok: string;
  kodeKelompok: string;
  jumlahMentee: number;
  persentaseKehadiran: number;
  pertemuanSaatIni: Pertemuan | null;
  pertemuanBerikutnya: Pertemuan | null;
  menteeAbsensiRendah: number;
  pengumumanBaru: number;
  laporanBelumSelesai: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
    mentor?: Mentor;
    mentee?: Mentee;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  total?: number;
}
