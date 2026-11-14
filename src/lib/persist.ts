'use client';

import { writeSheet } from '@/lib/local-db';
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

let attached = false;

/**
 * Simpan otomatis setiap perubahan store ke localStorage.
 * Dipanggil sekali setelah data awal di-hydrate.
 */
export function attachLocalPersistence() {
  if (attached || typeof window === 'undefined') return;
  attached = true;

  useMentorStore.subscribe((state) => writeSheet('Mentors', state.mentorList));
  useMenteeStore.subscribe((state) => writeSheet('Mentees', state.menteeList));
  useKelompokStore.subscribe((state) => writeSheet('Kelompok', state.kelompokList));
  usePertemuanStore.subscribe((state) => writeSheet('Pertemuan', state.pertemuanList));
  useMateriStore.subscribe((state) => writeSheet('Materi', state.materiList));
  useAbsensiStore.subscribe((state) => writeSheet('Absensi', state.absensiList));
  useBuktiIzinStore.subscribe((state) => writeSheet('BuktiIzin', state.buktiIzinList));
  useDokumentasiStore.subscribe((state) => writeSheet('Dokumentasi', state.dokumentasiList));
  useCatatanStore.subscribe((state) => {
    writeSheet('CatatanPertemuan', state.catatanPertemuanList);
    writeSheet('CatatanMentee', state.catatanMenteeList);
  });
  useEvaluasiStore.subscribe((state) => writeSheet('Evaluasi', state.evaluasiList));
  usePengumumanStore.subscribe((state) => writeSheet('Pengumuman', state.pengumumanList));
}
