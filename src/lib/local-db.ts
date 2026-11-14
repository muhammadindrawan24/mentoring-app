'use client';

/**
 * Penyimpanan lokal berbasis localStorage, satu key per "sheet".
 * Data domain tetap berada di browser dan dapat di-backup lewat file Excel.
 */
export const DB_PREFIX = 'sim-mentoring:db:';

export const DB_SHEETS = [
  'Mentors',
  'Mentees',
  'Kelompok',
  'Pertemuan',
  'Materi',
  'Absensi',
  'BuktiIzin',
  'Dokumentasi',
  'CatatanPertemuan',
  'CatatanMentee',
  'Evaluasi',
  'Pengumuman',
] as const;

export type DbSheet = (typeof DB_SHEETS)[number];

export function readSheet<T>(sheet: string): T[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DB_PREFIX + sheet);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    return null;
  }
}

export function writeSheet<T>(sheet: string, rows: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DB_PREFIX + sheet, JSON.stringify(rows));
  } catch {
    // Abaikan bila kuota localStorage penuh.
  }
}

export function clearAllSheets(): void {
  if (typeof window === 'undefined') return;
  DB_SHEETS.forEach((sheet) => localStorage.removeItem(DB_PREFIX + sheet));
}
