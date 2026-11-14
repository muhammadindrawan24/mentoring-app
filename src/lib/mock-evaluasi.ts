import { Evaluasi } from '@/types';

export const MOCK_EVALUASI: Evaluasi[] = [];

export const DEV_CATEGORY_LABELS: Record<string, string> = {
  SANGAT_BAIK: 'Sangat Baik',
  BAIK: 'Baik',
  CUKUP: 'Cukup',
  PERLU_PENDAMPINGAN: 'Perlu Pendampingan',
};

export const DEV_CATEGORY_COLORS: Record<string, string> = {
  SANGAT_BAIK: 'bg-green-100 text-green-800',
  BAIK: 'bg-blue-100 text-blue-800',
  CUKUP: 'bg-yellow-100 text-yellow-800',
  PERLU_PENDAMPINGAN: 'bg-red-100 text-red-800',
};
