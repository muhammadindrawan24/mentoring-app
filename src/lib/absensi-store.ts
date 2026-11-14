'use client';

import { create } from 'zustand';
import { Absensi } from '@/types';
import { hydrateList, persistCreate, persistUpdate, persistDelete, isGasEnabled, generateId } from '@/lib/gas-sync';

interface AbsensiStore {
  absensiList: Absensi[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addAbsensi: (absensi: Omit<Absensi, 'absensi_id'>) => void;
  updateAbsensi: (id: string, data: Partial<Absensi>) => void;
  deleteAbsensi: (id: string) => void;
  getAbsensiByPertemuan: (pertemuanId: string) => Absensi[];
  getAbsensiByKelompok: (kelompokId: string) => Absensi[];
  getAbsensiByMentee: (menteeId: string) => Absensi[];
  getAbsensiByMentor: (mentorId: string) => Absensi[];
  getAbsensiByPertemuanAndKelompok: (pertemuanId: string, kelompokId: string) => Absensi[];
}

export const useAbsensiStore = create<AbsensiStore>((set, get) => ({
  absensiList: [],
  hydrated: false,

  hydrate: async () => {
    const list = await hydrateList<Absensi>('Absensi', get().absensiList);
    set({ absensiList: list, hydrated: true });
  },

  addAbsensi: (absensi) => {
    const id = generateId('ABS', get().absensiList.length + 1);
    const record: Absensi = { ...absensi, absensi_id: id };
    set((state) => ({ absensiList: [...state.absensiList, record] }));
    persistCreate('Absensi', record as unknown as Record<string, unknown>);
  },

  updateAbsensi: (id, data) => {
    set((state) => ({
      absensiList: state.absensiList.map((a) =>
        a.absensi_id === id ? { ...a, ...data } : a
      ),
    }));
    if (isGasEnabled()) persistUpdate('Absensi', 'absensi_id', id, data as Record<string, unknown>);
  },

  deleteAbsensi: (id) => {
    set((state) => ({
      absensiList: state.absensiList.filter((a) => a.absensi_id !== id),
    }));
    if (isGasEnabled()) persistDelete('Absensi', 'absensi_id', id);
  },

  getAbsensiByPertemuan: (pertemuanId) => {
    return get().absensiList.filter((a) => a.pertemuan_id === pertemuanId);
  },

  getAbsensiByKelompok: (kelompokId) => {
    return get().absensiList.filter((a) => a.kelompok_id === kelompokId);
  },

  getAbsensiByMentee: (menteeId) => {
    return get().absensiList.filter((a) => a.mentee_id === menteeId);
  },

  getAbsensiByMentor: (mentorId) => {
    return get().absensiList.filter((a) => a.mentor_id === mentorId);
  },

  getAbsensiByPertemuanAndKelompok: (pertemuanId, kelompokId) => {
    return get().absensiList.filter(
      (a) => a.pertemuan_id === pertemuanId && a.kelompok_id === kelompokId
    );
  },
}));