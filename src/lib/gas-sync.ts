'use client';

import { readSheet } from '@/lib/local-db';

/**
 * Kompatibilitas nama modul lama. Data kini disimpan di localStorage
 * (lihat local-db.ts) dan dapat di-backup/restore lewat file Excel.
 */

export const isGasEnabled = () => false;

/**
 * Ambil data dari localStorage. Bila belum ada, gunakan data seed (mock).
 */
export async function hydrateList<T>(sheet: string, seed: T[]): Promise<T[]> {
  return readSheet<T>(sheet) ?? seed;
}

export function persistCreate(_sheet: string, _record: Record<string, unknown>) {
  // Persistensi ditangani oleh subscription pada lib/persist.ts.
}

export function persistUpdate(
  _sheet: string,
  _idField: string,
  _idValue: string,
  _data: Record<string, unknown>
) {
  // Persistensi ditangani oleh subscription pada lib/persist.ts.
}

export function persistDelete(_sheet: string, _idField: string, _idValue: string) {
  // Persistensi ditangani oleh subscription pada lib/persist.ts.
}

export function generateId(prefix: string, count: number): string {
  return `${prefix}${String(count).padStart(3, '0')}`;
}
