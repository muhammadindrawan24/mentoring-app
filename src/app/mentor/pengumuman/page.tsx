'use client';

import { useState, useMemo } from 'react';
import { usePengumumanStore } from '@/lib/pengumuman-store';
import { useAuthStore } from '@/lib/auth-store';
import { Pagination } from '@/components/ui/pagination';
import { Megaphone, Search, Bell, Users } from 'lucide-react';
import { Pengumuman } from '@/types';

const ITEMS_PER_PAGE = 10;

export default function MentorPengumumanPage() {
  const { pengumumanList, getPengumumanByTarget } = usePengumumanStore();
  const { mentorProfile } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const relevantPengumuman = useMemo(() => {
    if (!mentorProfile) return [];

    const byTarget = getPengumumanByTarget('KELOMPOK_TERTENTU', mentorProfile.kelompok_id);
    const byAll = pengumumanList.filter(
      (p) => p.status === 'ACTIVE' && p.target === 'SEMUA_MENTOR'
    );

    const seen = new Set<string>();
    const merged: Pengumuman[] = [];

    for (const p of [...byAll, ...byTarget]) {
      if (!seen.has(p.pengumuman_id)) {
        seen.add(p.pengumuman_id);
        merged.push(p);
      }
    }

    return merged.sort(
      (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );
  }, [pengumumanList, mentorProfile, getPengumumanByTarget]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return relevantPengumuman;

    const q = searchQuery.toLowerCase();
    return relevantPengumuman.filter(
      (p) =>
        p.judul.toLowerCase().includes(q) ||
        p.isi.toLowerCase().includes(q)
    );
  }, [relevantPengumuman, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTargetBadge = (target: string) => {
    switch (target) {
      case 'SEMUA_MENTOR':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            Semua Mentor
          </span>
        );
      case 'KELOMPOK_TERTENTU':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            Kelompok Tertentu
          </span>
        );
      case 'MENTOR_TERTENTU':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
            Mentor Tertentu
          </span>
        );
      default:
        return null;
    }
  };

  const getBorderColor = (target: string) => {
    switch (target) {
      case 'SEMUA_MENTOR': return 'border-l-blue-500';
      case 'KELOMPOK_TERTENTU': return 'border-l-green-500';
      case 'MENTOR_TERTENTU': return 'border-l-purple-500';
      default: return 'border-l-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengumuman</h1>
        <p className="text-sm text-gray-500 mt-1">
          Lihat pengumuman terbaru dari admin
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Megaphone className="h-4 w-4" />
            Total Pengumuman
          </div>
          <p className="text-2xl font-bold text-gray-900">{relevantPengumuman.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Bell className="h-4 w-4" />
            Untuk Semua Mentor
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {relevantPengumuman.filter((p) => p.target === 'SEMUA_MENTOR').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Users className="h-4 w-4" />
            Untuk Kelompok
          </div>
          <p className="text-2xl font-bold text-green-600">
            {relevantPengumuman.filter((p) => p.target === 'KELOMPOK_TERTENTU').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Cari judul atau isi pengumuman..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {paginatedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <Megaphone className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Tidak Ada Pengumuman</h3>
          <p className="text-sm text-gray-500 mt-1">
            {searchQuery
              ? 'Tidak ada pengumuman yang cocok dengan pencarian.'
              : 'Belum ada pengumuman yang tersedia untuk Anda.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedData.map((p) => (
              <div
                key={p.pengumuman_id}
                className={`bg-white rounded-xl border border-gray-200 border-l-4 p-5 hover:shadow-md transition-shadow ${getBorderColor(p.target)}`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{p.judul}</h3>
                  {getTargetBadge(p.target)}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line mb-4">
                  {p.isi}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    Dipublikasikan: {formatDate(p.published_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Menampilkan {paginatedData.length} dari {filteredData.length} pengumuman
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      )}
    </div>
  );
}
