'use client';

import { create } from 'zustand';
import { BuktiPertemuan } from '@/types';
import { hydrateList, persistCreate, persistUpdate, persistDelete, isGasEnabled, generateId } from '@/lib/gas-sync';

interface DokumentasiStore {
  dokumentasiList: BuktiPertemuan[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addDokumentasi: (doc: Omit<BuktiPertemuan, 'bukti_id'>) => void;
  updateDokumentasi: (id: string, data: Partial<BuktiPertemuan>) => void;
  deleteDokumentasi: (id: string) => void;
  getDokumentasiByPertemuan: (pertemuanId: string) => BuktiPertemuan[];
  getDokumentasiByKelompok: (kelompokId: string) => BuktiPertemuan[];
  getDokumentasiByMentor: (mentorId: string) => BuktiPertemuan[];
}

export const useDokumentasiStore = create<DokumentasiStore>((set, get) => ({
  dokumentasiList: [],
  hydrated: false,

  hydrate: async () => {
    const list = await hydrateList<BuktiPertemuan>('Dokumentasi', get().dokumentasiList);
    set({ dokumentasiList: list, hydrated: true });
  },

  addDokumentasi: (doc) => {
    const id = generateId('DOK', get().dokumentasiList.length + 1);
    const record: BuktiPertemuan = { ...doc, bukti_id: id };
    set((state) => ({ dokumentasiList: [...state.dokumentasiList, record] }));
    persistCreate('Dokumentasi', record as unknown as Record<string, unknown>);
  },

  updateDokumentasi: (id, data) => {
    set((state) => ({
      dokumentasiList: state.dokumentasiList.map((d) =>
        d.bukti_id === id ? { ...d, ...data } : d
      ),
    }));
    if (isGasEnabled()) persistUpdate('Dokumentasi', 'bukti_id', id, data as Record<string, unknown>);
  },

  deleteDokumentasi: (id) => {
    set((state) => ({
      dokumentasiList: state.dokumentasiList.filter((d) => d.bukti_id !== id),
    }));
    if (isGasEnabled()) persistDelete('Dokumentasi', 'bukti_id', id);
  },

  getDokumentasiByPertemuan: (pertemuanId) => {
    return get().dokumentasiList.filter((d) => d.pertemuan_id === pertemuanId);
  },

  getDokumentasiByKelompok: (kelompokId) => {
    return get().dokumentasiList.filter((d) => d.kelompok_id === kelompokId);
  },

  getDokumentasiByMentor: (mentorId) => {
    return get().dokumentasiList.filter((d) => d.mentor_id === mentorId);
  },
}));