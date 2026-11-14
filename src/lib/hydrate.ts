'use client';

import { usePertemuanStore } from '@/lib/pertemuan-store';
import { useMateriStore } from '@/lib/materi-store';
import { useMentorStore } from '@/lib/mentor-store';
import { useMenteeStore } from '@/lib/mentee-store';
import { useKelompokStore } from '@/lib/kelompok-store';
import { useAbsensiStore } from '@/lib/absensi-store';
import { useBuktiIzinStore } from '@/lib/bukti-izin-store';
import { useDokumentasiStore } from '@/lib/dokumentasi-store';
import { useCatatanStore } from '@/lib/catatan-store';
import { useEvaluasiStore } from '@/lib/evaluasi-store';
import { usePengumumanStore } from '@/lib/pengumuman-store';
import { attachLocalPersistence } from '@/lib/persist';

let hydratedOnce = false;

async function hydrateAll() {
  if (hydratedOnce) return;
  hydratedOnce = true;
  await Promise.allSettled([
    usePertemuanStore.getState().hydrate(),
    useMateriStore.getState().hydrate(),
    useMentorStore.getState().hydrate(),
    useMenteeStore.getState().hydrate(),
    useKelompokStore.getState().hydrate(),
    useAbsensiStore.getState().hydrate(),
    useBuktiIzinStore.getState().hydrate(),
    useDokumentasiStore.getState().hydrate(),
    useCatatanStore.getState().hydrate(),
    useEvaluasiStore.getState().hydrate(),
    usePengumumanStore.getState().hydrate(),
  ]);
  attachLocalPersistence();
}

export { hydrateAll };
