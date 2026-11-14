'use client';

import { create } from 'zustand';
import { BuktiIzin } from '@/types';
import { hydrateList, persistCreate, persistUpdate, isGasEnabled, generateId } from '@/lib/gas-sync';

interface BuktiIzinStore {
  buktiIzinList: BuktiIzin[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addBuktiIzin: (bukti: Omit<BuktiIzin, 'bukti_izin_id'>) => void;
  updateBuktiIzin: (id: string, data: Partial<BuktiIzin>) => void;
  getBuktiIzinMenunggu: () => BuktiIzin[];
  getBuktiIzinByMentee: (menteeId: string) => BuktiIzin[];
}

export const useBuktiIzinStore = create<BuktiIzinStore>((set, get) => ({
  buktiIzinList: [],
  hydrated: false,

  hydrate: async () => {
    const list = await hydrateList<BuktiIzin>('BuktiIzin', get().buktiIzinList);
    set({ buktiIzinList: list, hydrated: true });
  },

  addBuktiIzin: (bukti) => {
    const id = generateId('BKI', get().buktiIzinList.length + 1);
    const record: BuktiIzin = { ...bukti, bukti_izin_id: id };
    set((state) => ({ buktiIzinList: [...state.buktiIzinList, record] }));
    persistCreate('BuktiIzin', record as unknown as Record<string, unknown>);
  },

  updateBuktiIzin: (id, data) => {
    set((state) => ({
      buktiIzinList: state.buktiIzinList.map((b) =>
        b.bukti_izin_id === id ? { ...b, ...data } : b
      ),
    }));
    if (isGasEnabled()) persistUpdate('BuktiIzin', 'bukti_izin_id', id, data as Record<string, unknown>);
  },

  getBuktiIzinMenunggu: () => {
    return get().buktiIzinList.filter((b) => b.status_verifikasi === 'MENUNGGU');
  },

  getBuktiIzinByMentee: (menteeId) => {
    return get().buktiIzinList.filter((b) => b.mentee_id === menteeId);
  },
}));