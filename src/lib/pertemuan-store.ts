'use client';

import { create } from 'zustand';
import { Pertemuan } from '@/types';
import { MOCK_PERTEMUAN } from '@/lib/mock-data';
import { hydrateList, persistCreate, persistUpdate, persistDelete, isGasEnabled, generateId } from '@/lib/gas-sync';

interface PertemuanStore {
  pertemuanList: Pertemuan[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addPertemuan: (pertemuan: Omit<Pertemuan, 'pertemuan_id' | 'created_at' | 'updated_at'>) => void;
  updatePertemuan: (id: string, data: Partial<Pertemuan>) => void;
  deletePertemuan: (id: string) => void;
  getPertemuanById: (id: string) => Pertemuan | undefined;
}

export const usePertemuanStore = create<PertemuanStore>((set, get) => ({
  pertemuanList: [...MOCK_PERTEMUAN],
  hydrated: false,

  hydrate: async () => {
    const list = await hydrateList<Pertemuan>('Pertemuan', get().pertemuanList);
    set({ pertemuanList: list, hydrated: true });
  },

  addPertemuan: (pertemuan) => {
    const now = new Date().toISOString();
    const id = generateId('P', get().pertemuanList.length + 1);
    const record: Pertemuan = { ...pertemuan, pertemuan_id: id, created_at: now, updated_at: now };
    set((state) => ({ pertemuanList: [...state.pertemuanList, record] }));
    persistCreate('Pertemuan', record as unknown as Record<string, unknown>);
  },

  updatePertemuan: (id, data) => {
    set((state) => ({
      pertemuanList: state.pertemuanList.map((p) =>
        p.pertemuan_id === id
          ? { ...p, ...data, updated_at: new Date().toISOString() }
          : p
      ),
    }));
    if (isGasEnabled()) persistUpdate('Pertemuan', 'pertemuan_id', id, data as Record<string, unknown>);
  },

  deletePertemuan: (id) => {
    set((state) => ({
      pertemuanList: state.pertemuanList.filter((p) => p.pertemuan_id !== id),
    }));
    if (isGasEnabled()) persistDelete('Pertemuan', 'pertemuan_id', id);
  },

  getPertemuanById: (id) => {
    return get().pertemuanList.find((p) => p.pertemuan_id === id);
  },
}));