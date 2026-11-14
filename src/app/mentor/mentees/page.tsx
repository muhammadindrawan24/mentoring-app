'use client';

import { useState, useMemo } from 'react';
import { useMenteeStore } from '@/lib/mentee-store';
import { useKelompokStore } from '@/lib/kelompok-store';
import { useAuthStore } from '@/lib/auth-store';
import { StatusBadge } from '@/components/ui/status-badge';
import { Pagination } from '@/components/ui/pagination';
import { Users, Search, Phone } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export default function MentorMenteesPage() {
  const { menteeList } = useMenteeStore();
  const { kelompokList } = useKelompokStore();
  const { mentorProfile } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const myKelompok = kelompokList.find(
    (k) => k.mentor_id === mentorProfile?.mentor_id
  );

  const myMentees = useMemo(() => {
    let data = menteeList.filter(
      (m) => m.kelompok_id === mentorProfile?.kelompok_id
    );

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (m) =>
          m.nama.toLowerCase().includes(q) ||
          m.NIM.includes(q) ||
          m.prodi.toLowerCase().includes(q)
      );
    }

    return data;
  }, [menteeList, mentorProfile, searchQuery]);

  const totalPages = Math.ceil(myMentees.length / ITEMS_PER_PAGE);
  const paginatedData = myMentees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const stats = useMemo(() => {
    const total = myMentees.length;
    const active = myMentees.filter((m) => m.status === 'ACTIVE').length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [myMentees]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Daftar Mentee</h1>
        <p className="text-sm text-gray-500 mt-1">
          {myKelompok
            ? `Anggota ${myKelompok.nama_kelompok} (${myKelompok.kode_kelompok})`
            : 'Anda belum terdaftar di kelompok manapun'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Users className="h-4 w-4" />
            Total Mentee
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Users className="h-4 w-4" />
            Aktif
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Users className="h-4 w-4" />
            Tidak Aktif
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Cari berdasarkan nama, NIM, atau prodi..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {paginatedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <Users className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Tidak Ada Data Mentee</h3>
          <p className="text-sm text-gray-500 mt-1">
            {searchQuery
              ? 'Tidak ada data yang cocok dengan pencarian.'
              : 'Belum ada mentee yang terdaftar di kelompok Anda.'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIM</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program Studi</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. HP</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((m, idx) => (
                    <tr key={m.mentee_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{m.nama}</p>
                        <p className="text-xs text-gray-500">Angkatan {m.angkatan}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">{m.NIM}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{m.prodi}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          {m.no_hp}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={m.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Menampilkan {paginatedData.length} dari {myMentees.length} mentee
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
