'use client';

import { create } from 'zustand';
import { Materi } from '@/types';
import { hydrateList, persistCreate, persistUpdate, persistDelete, isGasEnabled, generateId } from '@/lib/gas-sync';

interface MateriStore {
  materiList: Materi[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addMateri: (materi: Omit<Materi, 'materi_id' | 'uploaded_at'>) => void;
  updateMateri: (id: string, data: Partial<Materi>) => void;
  deleteMateri: (id: string) => void;
  getMateriById: (id: string) => Materi | undefined;
  getMateriByPertemuan: (pertemuanId: string) => Materi[];
}

export const useMateriStore = create<MateriStore>((set, get) => ({
  materiList: [],
  hydrated: false,

  hydrate: async () => {
    const list = await hydrateList<Materi>('Materi', get().materiList);
    set({ materiList: list, hydrated: true });
  },

  addMateri: (materi) => {
    const id = generateId('MTR', get().materiList.length + 1);
    const record: Materi = { ...materi, materi_id: id, uploaded_at: new Date().toISOString() };
    set((state) => ({ materiList: [...state.materiList, record] }));
    persistCreate('Materi', record as unknown as Record<string, unknown>);
  },

  updateMateri: (id, data) => {
    set((state) => ({
      materiList: state.materiList.map((m) =>
        m.materi_id === id ? { ...m, ...data } : m
      ),
    }));
    if (isGasEnabled()) persistUpdate('Materi', 'materi_id', id, data as Record<string, unknown>);
  },

  deleteMateri: (id) => {
    set((state) => ({
      materiList: state.materiList.filter((m) => m.materi_id !== id),
    }));
    if (isGasEnabled()) persistDelete('Materi', 'materi_id', id);
  },

  getMateriById: (id) => {
    return get().materiList.find((m) => m.materi_id === id);
  },

  getMateriByPertemuan: (pertemuanId) => {
    return get().materiList.filter((m) => m.pertemuan_id === pertemuanId);
  },
}));