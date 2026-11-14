'use client';

import * as XLSX from 'xlsx';
import type {
  Absensi,
  BuktiIzin,
  BuktiPertemuan,
  CatatanMentee,
  CatatanPertemuan,
  Evaluasi,
  Kelompok,
  Materi,
  Mentee,
  Mentor,
  Pengumuman,
  Pertemuan,
} from '@/types';
import { useAbsensiStore } from '@/lib/absensi-store';
import { useBuktiIzinStore } from '@/lib/bukti-izin-store';
import { useCatatanStore } from '@/lib/catatan-store';
import { useDokumentasiStore } from '@/lib/dokumentasi-store';
import { useEvaluasiStore } from '@/lib/evaluasi-store';
import { useKelompokStore } from '@/lib/kelompok-store';
import { useMateriStore } from '@/lib/materi-store';
import { useMenteeStore } from '@/lib/mentee-store';
import { useMentorStore } from '@/lib/mentor-store';
import { usePengumumanStore } from '@/lib/pengumuman-store';
import { usePertemuanStore } from '@/lib/pertemuan-store';

interface SheetDef {
  name: string;
  headers: string[];
  numericFields?: string[];
  getRows: () => Record<string, unknown>[];
  setRows: (rows: Record<string, unknown>[]) => void;
}

function rowsOf<T>(list: T[]): Record<string, unknown>[] {
  return list.map((item) => ({ ...(item as Record<string, unknown>) }));
}

const SHEET_DEFS: SheetDef[] = [
  {
    name: 'Mentors',
    headers: ['mentor_id', 'user_id', 'NIM', 'nama', 'prodi', 'email', 'no_hp', 'kelompok_id', 'status', 'created_at', 'updated_at'],
    getRows: () => rowsOf<Mentor>(useMentorStore.getState().mentorList),
    setRows: (rows) => useMentorStore.setState({ mentorList: rows as unknown as Mentor[] }),
  },
  {
    name: 'Mentees',
    headers: ['mentee_id', 'NIM', 'nama', 'prodi', 'angkatan', 'no_hp', 'email', 'kelompok_id', 'status', 'created_at', 'updated_at'],
    getRows: () => rowsOf<Mentee>(useMenteeStore.getState().menteeList),
    setRows: (rows) => useMenteeStore.setState({ menteeList: rows as unknown as Mentee[] }),
  },
  {
    name: 'Kelompok',
    headers: ['kelompok_id', 'kode_kelompok', 'nama_kelompok', 'mentor_id', 'jumlah_anggota', 'status', 'created_at', 'updated_at'],
    numericFields: ['jumlah_anggota'],
    getRows: () => rowsOf<Kelompok>(useKelompokStore.getState().kelompokList),
    setRows: (rows) => useKelompokStore.setState({ kelompokList: rows as unknown as Kelompok[] }),
  },
  {
    name: 'Pertemuan',
    headers: ['pertemuan_id', 'pertemuan_ke', 'judul', 'tema', 'deskripsi', 'tanggal', 'jam_mulai', 'jam_selesai', 'status', 'created_at', 'updated_at'],
    numericFields: ['pertemuan_ke'],
    getRows: () => rowsOf<Pertemuan>(usePertemuanStore.getState().pertemuanList),
    setRows: (rows) => usePertemuanStore.setState({ pertemuanList: rows as unknown as Pertemuan[] }),
  },
  {
    name: 'Materi',
    headers: ['materi_id', 'pertemuan_id', 'judul', 'deskripsi', 'file_id', 'file_url', 'jenis_file', 'uploaded_by', 'uploaded_at'],
    getRows: () => rowsOf<Materi>(useMateriStore.getState().materiList),
    setRows: (rows) => useMateriStore.setState({ materiList: rows as unknown as Materi[] }),
  },
  {
    name: 'Absensi',
    headers: ['absensi_id', 'pertemuan_id', 'kelompok_id', 'mentee_id', 'mentor_id', 'status', 'keterangan', 'bukti_izin_url', 'bukti_izin_file_id', 'waktu_input', 'tanggal_input', 'status_verifikasi'],
    getRows: () => rowsOf<Absensi>(useAbsensiStore.getState().absensiList),
    setRows: (rows) => useAbsensiStore.setState({ absensiList: rows as unknown as Absensi[] }),
  },
  {
    name: 'BuktiIzin',
    headers: ['bukti_izin_id', 'mentee_id', 'pertemuan_id', 'kelompok_id', 'file_id', 'file_url', 'alasan', 'uploaded_by', 'uploaded_at', 'status_verifikasi', 'verified_by', 'verified_at', 'catatan_verifikasi'],
    getRows: () => rowsOf<BuktiIzin>(useBuktiIzinStore.getState().buktiIzinList),
    setRows: (rows) => useBuktiIzinStore.setState({ buktiIzinList: rows as unknown as BuktiIzin[] }),
  },
  {
    name: 'Dokumentasi',
    headers: ['bukti_id', 'pertemuan_id', 'kelompok_id', 'mentor_id', 'file_id', 'file_url', 'keterangan', 'uploaded_at'],
    getRows: () => rowsOf<BuktiPertemuan>(useDokumentasiStore.getState().dokumentasiList),
    setRows: (rows) => useDokumentasiStore.setState({ dokumentasiList: rows as unknown as BuktiPertemuan[] }),
  },
  {
    name: 'CatatanPertemuan',
    headers: ['catatan_id', 'pertemuan_id', 'kelompok_id', 'mentor_id', 'jumlah_hadir', 'topik', 'kondisi', 'catatan', 'tindak_lanjut', 'created_at', 'updated_at'],
    numericFields: ['jumlah_hadir'],
    getRows: () => rowsOf<CatatanPertemuan>(useCatatanStore.getState().catatanPertemuanList),
    setRows: (rows) => useCatatanStore.setState({ catatanPertemuanList: rows as unknown as CatatanPertemuan[] }),
  },
  {
    name: 'CatatanMentee',
    headers: ['catatan_id', 'mentee_id', 'pertemuan_id', 'mentor_id', 'keaktifan', 'pemahaman', 'catatan', 'tindak_lanjut', 'created_at'],
    getRows: () => rowsOf<CatatanMentee>(useCatatanStore.getState().catatanMenteeList),
    setRows: (rows) => useCatatanStore.setState({ catatanMenteeList: rows as unknown as CatatanMentee[] }),
  },
  {
    name: 'Evaluasi',
    headers: ['evaluasi_id', 'mentee_id', 'mentor_id', 'pertemuan_id', 'kehadiran', 'keaktifan', 'pemahaman', 'partisipasi', 'komitmen', 'catatan', 'created_at', 'updated_at'],
    getRows: () => rowsOf<Evaluasi>(useEvaluasiStore.getState().evaluasiList),
    setRows: (rows) => useEvaluasiStore.setState({ evaluasiList: rows as unknown as Evaluasi[] }),
  },
  {
    name: 'Pengumuman',
    headers: ['pengumuman_id', 'judul', 'isi', 'target', 'target_ids', 'status', 'published_at', 'created_by', 'created_at'],
    getRows: () => rowsOf<Pengumuman>(usePengumumanStore.getState().pengumumanList),
    setRows: (rows) => usePengumumanStore.setState({ pengumumanList: rows as unknown as Pengumuman[] }),
  },
];

export const EXCEL_SHEET_NAMES = SHEET_DEFS.map((def) => def.name);

function normalizeRow(def: SheetDef, row: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  def.headers.forEach((header) => {
    const value = row[header];
    result[header] = value === null || value === undefined ? '' : value;
  });
  (def.numericFields ?? []).forEach((field) => {
    const num = Number(result[field]);
    result[field] = Number.isFinite(num) ? num : 0;
  });
  return result;
}

export function exportAllToExcel(): void {
  const workbook = XLSX.utils.book_new();

  SHEET_DEFS.forEach((def) => {
    const rows = def.getRows();
    const data = [
      def.headers,
      ...rows.map((row) => def.headers.map((header) => row[header] ?? '')),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet['!cols'] = def.headers.map((header) => ({
      wch: Math.max(14, Math.min(header.length + 4, 40)),
    }));
    XLSX.utils.book_append_sheet(workbook, worksheet, def.name);
  });

  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `sim-mentoring-${stamp}.xlsx`);
}

export interface ImportResult {
  rows: number;
  sheets: string[];
}

export async function importFromExcel(file: File): Promise<ImportResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  let rows = 0;
  const sheets: string[] = [];

  SHEET_DEFS.forEach((def) => {
    const worksheet = workbook.Sheets[def.name];
    if (!worksheet) return;

    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
    def.setRows(raw.map((row) => normalizeRow(def, row)));
    rows += raw.length;
    sheets.push(def.name);
  });

  if (sheets.length === 0) {
    throw new Error(
      'File tidak dikenali. Pastikan berisi sheet: ' + EXCEL_SHEET_NAMES.join(', ')
    );
  }

  return { rows, sheets };
}
