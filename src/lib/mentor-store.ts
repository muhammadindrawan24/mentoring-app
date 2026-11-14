'use client';

import { create } from 'zustand';
import { Mentor } from '@/types';
import { MOCK_MENTORS } from '@/lib/mock-data';
import { hydrateList, persistCreate, persistUpdate, persistDelete, isGasEnabled, generateId } from '@/lib/gas-sync';

interface MentorStore {
  mentorList: Mentor[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addMentor: (mentor: Omit<Mentor, 'mentor_id' | 'created_at' | 'updated_at'>) => void;
  updateMentor: (id: string, data: Partial<Mentor>) => void;
  deleteMentor: (id: string) => void;
  getMentorById: (id: string) => Mentor | undefined;
  getMentorByKelompok: (kelompokId: string) => Mentor | undefined;
}

export const useMentorStore = create<MentorStore>((set, get) => ({
  mentorList: [...MOCK_MENTORS],
  hydrated: false,

  hydrate: async () => {
    const list = await hydrateList<Mentor>('Mentors', get().mentorList);
    set({ mentorList: list, hydrated: true });
  },

  addMentor: (mentor) => {
    const now = new Date().toISOString();
    const id = generateId('MTR', get().mentorList.length + 1);
    const record: Mentor = { ...mentor, mentor_id: id, created_at: now, updated_at: now };
    set((state) => ({ mentorList: [...state.mentorList, record] }));
    persistCreate('Mentors', record as unknown as Record<string, unknown>);
  },

  updateMentor: (id, data) => {
    set((state) => ({
      mentorList: state.mentorList.map((m) =>
        m.mentor_id === id
          ? { ...m, ...data, updated_at: new Date().toISOString() }
          : m
      ),
    }));
    if (isGasEnabled()) persistUpdate('Mentors', 'mentor_id', id, data as Record<string, unknown>);
  },

  deleteMentor: (id) => {
    set((state) => ({
      mentorList: state.mentorList.filter((m) => m.mentor_id !== id),
    }));
    if (isGasEnabled()) persistDelete('Mentors', 'mentor_id', id);
  },

  getMentorById: (id) => {
    return get().mentorList.find((m) => m.mentor_id === id);
  },

  getMentorByKelompok: (kelompokId) => {
    return get().mentorList.find((m) => m.kelompok_id === kelompokId);
  },
}));