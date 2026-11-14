'use client';

import { create } from 'zustand';
import { CatatanPertemuan, CatatanMentee } from '@/types';
import { hydrateList, persistCreate, persistUpdate, persistDelete, isGasEnabled, generateId } from '@/lib/gas-sync';

interface CatatanStore {
  catatanPertemuanList: CatatanPertemuan[];
  catatanMenteeList: CatatanMentee[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addCatatanPertemuan: (catatan: Omit<CatatanPertemuan, 'catatan_id' | 'created_at' | 'updated_at'>) => void;
  updateCatatanPertemuan: (id: string, data: Partial<CatatanPertemuan>) => void;
  deleteCatatanPertemuan: (id: string) => void;
  addCatatanMentee: (catatan: Omit<CatatanMentee, 'catatan_id' | 'created_at'>) => void;
  updateCatatanMentee: (id: string, data: Partial<CatatanMentee>) => void;
  deleteCatatanMentee: (id: string) => void;
  getCatatanPertemuanByKelompok: (kelompokId: string) => CatatanPertemuan[];
  getCatatanPertemuanByPertemuan: (pertemuanId: string) => CatatanPertemuan[];
  getCatatanMenteeByMentee: (menteeId: string) => CatatanMentee[];
  getCatatanMenteeByPertemuan: (pertemuanId: string) => CatatanMentee[];
}

export const useCatatanStore = create<CatatanStore>((set, get) => ({
  catatanPertemuanList: [],
  catatanMenteeList: [],
  hydrated: false,

  hydrate: async () => {
    const [listPertemuan, listMentee] = await Promise.all([
      hydrateList<CatatanPertemuan>('CatatanPertemuan', get().catatanPertemuanList),
      hydrateList<CatatanMentee>('CatatanMentee', get().catatanMenteeList),
    ]);
    set({ catatanPertemuanList: listPertemuan, catatanMenteeList: listMentee, hydrated: true });
  },

  addCatatanPertemuan: (catatan) => {
    const now = new Date().toISOString();
    const id = generateId('CTP', get().catatanPertemuanList.length + 1);
    const record: CatatanPertemuan = { ...catatan, catatan_id: id, created_at: now, updated_at: now };
    set((state) => ({ catatanPertemuanList: [...state.catatanPertemuanList, record] }));
    persistCreate('CatatanPertemuan', record as unknown as Record<string, unknown>);
  },

  updateCatatanPertemuan: (id, data) => {
    set((state) => ({
      catatanPertemuanList: state.catatanPertemuanList.map((c) =>
        c.catatan_id === id ? { ...c, ...data, updated_at: new Date().toISOString() } : c
      ),
    }));
    if (isGasEnabled()) persistUpdate('CatatanPertemuan', 'catatan_id', id, data as Record<string, unknown>);
  },

  deleteCatatanPertemuan: (id) => {
    set((state) => ({
      catatanPertemuanList: state.catatanPertemuanList.filter((c) => c.catatan_id !== id),
    }));
    if (isGasEnabled()) persistDelete('CatatanPertemuan', 'catatan_id', id);
  },

  addCatatanMentee: (catatan) => {
    const id = generateId('CTM', get().catatanMenteeList.length + 1);
    const record: CatatanMentee = { ...catatan, catatan_id: id, created_at: new Date().toISOString() };
    set((state) => ({ catatanMenteeList: [...state.catatanMenteeList, record] }));
    persistCreate('CatatanMentee', record as unknown as Record<string, unknown>);
  },

  updateCatatanMentee: (id, data) => {
    set((state) => ({
      catatanMenteeList: state.catatanMenteeList.map((c) =>
        c.catatan_id === id ? { ...c, ...data } : c
      ),
    }));
    if (isGasEnabled()) persistUpdate('CatatanMentee', 'catatan_id', id, data as Record<string, unknown>);
  },

  deleteCatatanMentee: (id) => {
    set((state) => ({
      catatanMenteeList: state.catatanMenteeList.filter((c) => c.catatan_id !== id),
    }));
    if (isGasEnabled()) persistDelete('CatatanMentee', 'catatan_id', id);
  },

  getCatatanPertemuanByKelompok: (kelompokId) => {
    return get().catatanPertemuanList.filter((c) => c.kelompok_id === kelompokId);
  },

  getCatatanPertemuanByPertemuan: (pertemuanId) => {
    return get().catatanPertemuanList.filter((c) => c.pertemuan_id === pertemuanId);
  },

  getCatatanMenteeByMentee: (menteeId) => {
    return get().catatanMenteeList.filter((c) => c.mentee_id === menteeId);
  },

  getCatatanMenteeByPertemuan: (pertemuanId) => {
    return get().catatanMenteeList.filter((c) => c.pertemuan_id === pertemuanId);
  },
}));