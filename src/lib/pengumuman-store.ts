'use client';

import { create } from 'zustand';
import { Pengumuman } from '@/types';
import { hydrateList, persistCreate, persistUpdate, persistDelete, isGasEnabled, generateId } from '@/lib/gas-sync';

interface PengumumanStore {
  pengumumanList: Pengumuman[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addPengumuman: (pengumuman: Omit<Pengumuman, 'pengumuman_id' | 'created_at'>) => void;
  updatePengumuman: (id: string, data: Partial<Pengumuman>) => void;
  deletePengumuman: (id: string) => void;
  getPengumumanByTarget: (target: string, targetIds: string) => Pengumuman[];
  getPengumumanAktif: () => Pengumuman[];
}

export const usePengumumanStore = create<PengumumanStore>((set, get) => ({
  pengumumanList: [],
  hydrated: false,

  hydrate: async () => {
    const list = await hydrateList<Pengumuman>('Pengumuman', get().pengumumanList);
    set({ pengumumanList: list, hydrated: true });
  },

  addPengumuman: (pengumuman) => {
    const id = generateId('PNG', get().pengumumanList.length + 1);
    const record: Pengumuman = { ...pengumuman, pengumuman_id: id, created_at: new Date().toISOString() };
    set((state) => ({ pengumumanList: [...state.pengumumanList, record] }));
    persistCreate('Pengumuman', record as unknown as Record<string, unknown>);
  },

  updatePengumuman: (id, data) => {
    set((state) => ({
      pengumumanList: state.pengumumanList.map((p) =>
        p.pengumuman_id === id ? { ...p, ...data } : p
      ),
    }));
    if (isGasEnabled()) persistUpdate('Pengumuman', 'pengumuman_id', id, data as Record<string, unknown>);
  },

  deletePengumuman: (id) => {
    set((state) => ({
      pengumumanList: state.pengumumanList.filter((p) => p.pengumuman_id !== id),
    }));
    if (isGasEnabled()) persistDelete('Pengumuman', 'pengumuman_id', id);
  },

  getPengumumanByTarget: (target, targetIds) => {
    return get().pengumumanList.filter((p) => {
      if (p.status !== 'ACTIVE') return false;
      if (p.target === 'SEMUA_MENTOR') return true;
      if (p.target === target) {
        const ids = p.target_ids.split(',').map((id) => id.trim());
        return ids.includes(targetIds);
      }
      return false;
    });
  },

  getPengumumanAktif: () => {
    return get().pengumumanList.filter((p) => p.status === 'ACTIVE');
  },
}));