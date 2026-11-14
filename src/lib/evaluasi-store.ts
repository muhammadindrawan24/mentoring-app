'use client';

import { create } from 'zustand';
import { Evaluasi, DevCategory } from '@/types';
import { MOCK_EVALUASI } from '@/lib/mock-evaluasi';
import { hydrateList, persistCreate, persistUpdate, isGasEnabled, generateId } from '@/lib/gas-sync';

interface EvaluasiStore {
  evaluasiList: Evaluasi[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addEvaluasi: (evaluasi: Omit<Evaluasi, 'evaluasi_id' | 'created_at' | 'updated_at'>) => void;
  updateEvaluasi: (id: string, data: Partial<Evaluasi>) => void;
  getEvaluasiByMentor: (mentorId: string) => Evaluasi[];
  getEvaluasiByMentee: (menteeId: string) => Evaluasi[];
  getEvaluasiByPertemuan: (pertemuanId: string) => Evaluasi[];
  getEvaluasiByPertemuanAndMentor: (pertemuanId: string, mentorId: string) => Evaluasi[];
  getExistingEvaluasiKeys: (pertemuanId: string, mentorId: string) => Set<string>;
}

export const useEvaluasiStore = create<EvaluasiStore>((set, get) => ({
  evaluasiList: [...MOCK_EVALUASI],
  hydrated: false,

  hydrate: async () => {
    const list = await hydrateList<Evaluasi>('Evaluasi', get().evaluasiList);
    set({ evaluasiList: list, hydrated: true });
  },

  addEvaluasi: (evaluasi) => {
    const now = new Date().toISOString();
    const id = generateId('EVL', get().evaluasiList.length + 1);
    const record: Evaluasi = {
      ...evaluasi,
      evaluasi_id: id,
      created_at: now,
      updated_at: now,
    };
    set((state) => ({ evaluasiList: [...state.evaluasiList, record] }));
    persistCreate('Evaluasi', record as unknown as Record<string, unknown>);
  },

  updateEvaluasi: (id, data) => {
    set((state) => ({
      evaluasiList: state.evaluasiList.map((e) =>
        e.evaluasi_id === id
          ? { ...e, ...data, updated_at: new Date().toISOString() }
          : e
      ),
    }));
    if (isGasEnabled()) persistUpdate('Evaluasi', 'evaluasi_id', id, data as Record<string, unknown>);
  },

  getEvaluasiByMentor: (mentorId) => {
    return get().evaluasiList.filter((e) => e.mentor_id === mentorId);
  },

  getEvaluasiByMentee: (menteeId) => {
    return get().evaluasiList.filter((e) => e.mentee_id === menteeId);
  },

  getEvaluasiByPertemuan: (pertemuanId) => {
    return get().evaluasiList.filter((e) => e.pertemuan_id === pertemuanId);
  },

  getEvaluasiByPertemuanAndMentor: (pertemuanId, mentorId) => {
    return get().evaluasiList.filter(
      (e) => e.pertemuan_id === pertemuanId && e.mentor_id === mentorId
    );
  },

  getExistingEvaluasiKeys: (pertemuanId, mentorId) => {
    const existing = get().evaluasiList.filter(
      (e) => e.pertemuan_id === pertemuanId && e.mentor_id === mentorId
    );
    return new Set(existing.map((e) => e.mentee_id));
  },
}));