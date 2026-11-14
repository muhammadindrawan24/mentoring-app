'use client';

import { create } from 'zustand';
import { Mentee } from '@/types';
import { MOCK_MENTEES } from '@/lib/mock-data';
import { hydrateList, persistCreate, persistUpdate, persistDelete, isGasEnabled, generateId } from '@/lib/gas-sync';

interface MenteeStore {
  menteeList: Mentee[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addMentee: (mentee: Omit<Mentee, 'mentee_id' | 'created_at' | 'updated_at'>) => void;
  updateMentee: (id: string, data: Partial<Mentee>) => void;
  deleteMentee: (id: string) => void;
  getMenteeById: (id: string) => Mentee | undefined;
  getMenteeByKelompok: (kelompokId: string) => Mentee[];
  searchMentee: (query: string) => Mentee[];
}

export const useMenteeStore = create<MenteeStore>((set, get) => ({
  menteeList: [...MOCK_MENTEES],
  hydrated: false,

  hydrate: async () => {
    const list = await hydrateList<Mentee>('Mentees', get().menteeList);
    set({ menteeList: list, hydrated: true });
  },

  addMentee: (mentee) => {
    const now = new Date().toISOString();
    const id = generateId('MNT', get().menteeList.length + 1);
    const record: Mentee = { ...mentee, mentee_id: id, created_at: now, updated_at: now };
    set((state) => ({ menteeList: [...state.menteeList, record] }));
    persistCreate('Mentees', record as unknown as Record<string, unknown>);
  },

  updateMentee: (id, data) => {
    set((state) => ({
      menteeList: state.menteeList.map((m) =>
        m.mentee_id === id
          ? { ...m, ...data, updated_at: new Date().toISOString() }
          : m
      ),
    }));
    if (isGasEnabled()) persistUpdate('Mentees', 'mentee_id', id, data as Record<string, unknown>);
  },

  deleteMentee: (id) => {
    set((state) => ({
      menteeList: state.menteeList.filter((m) => m.mentee_id !== id),
    }));
    if (isGasEnabled()) persistDelete('Mentees', 'mentee_id', id);
  },

  getMenteeById: (id) => {
    return get().menteeList.find((m) => m.mentee_id === id);
  },

  getMenteeByKelompok: (kelompokId) => {
    return get().menteeList.filter((m) => m.kelompok_id === kelompokId);
  },

  searchMentee: (query) => {
    const q = query.toLowerCase();
    return get().menteeList.filter(
      (m) =>
        m.nama.toLowerCase().includes(q) ||
        m.NIM.includes(q) ||
        m.prodi.toLowerCase().includes(q)
    );
  },
}));