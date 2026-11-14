'use client';

import { create } from 'zustand';
import { Kelompok } from '@/types';
import { MOCK_KELOMPOK } from '@/lib/mock-data';
import { hydrateList, persistCreate, persistUpdate, persistDelete, isGasEnabled, generateId } from '@/lib/gas-sync';

interface KelompokStore {
  kelompokList: Kelompok[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addKelompok: (kelompok: Omit<Kelompok, 'kelompok_id' | 'created_at' | 'updated_at'>) => void;
  updateKelompok: (id: string, data: Partial<Kelompok>) => void;
  deleteKelompok: (id: string) => void;
  getKelompokById: (id: string) => Kelompok | undefined;
  getKelompokByMentor: (mentorId: string) => Kelompok | undefined;
}

export const useKelompokStore = create<KelompokStore>((set, get) => ({
  kelompokList: [...MOCK_KELOMPOK],
  hydrated: false,

  hydrate: async () => {
    const list = await hydrateList<Kelompok>('Kelompok', get().kelompokList);
    set({ kelompokList: list, hydrated: true });
  },

  addKelompok: (kelompok) => {
    const now = new Date().toISOString();
    const id = generateId('K', get().kelompokList.length + 1);
    const record: Kelompok = { ...kelompok, kelompok_id: id, created_at: now, updated_at: now };
    set((state) => ({ kelompokList: [...state.kelompokList, record] }));
    persistCreate('Kelompok', record as unknown as Record<string, unknown>);
  },

  updateKelompok: (id, data) => {
    set((state) => ({
      kelompokList: state.kelompokList.map((k) =>
        k.kelompok_id === id
          ? { ...k, ...data, updated_at: new Date().toISOString() }
          : k
      ),
    }));
    if (isGasEnabled()) persistUpdate('Kelompok', 'kelompok_id', id, data as Record<string, unknown>);
  },

  deleteKelompok: (id) => {
    set((state) => ({
      kelompokList: state.kelompokList.filter((k) => k.kelompok_id !== id),
    }));
    if (isGasEnabled()) persistDelete('Kelompok', 'kelompok_id', id);
  },

  getKelompokById: (id) => {
    return get().kelompokList.find((k) => k.kelompok_id === id);
  },

  getKelompokByMentor: (mentorId) => {
    return get().kelompokList.find((k) => k.mentor_id === mentorId);
  },
}));