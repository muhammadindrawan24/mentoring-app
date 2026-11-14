'use client';

import { useState, useMemo } from 'react';
import { useAbsensiStore } from '@/lib/absensi-store';
import { useMenteeStore } from '@/lib/mentee-store';
import { usePertemuanStore } from '@/lib/pertemuan-store';
import { useAuthStore } from '@/lib/auth-store';
import { StatusBadge } from '@/components/ui/status-badge';
import { Pagination } from '@/components/ui/pagination';
import { CheckSquare, Search, UserCheck, Clock } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export default function MentorAbsensiPage() {
  const { absensiList } = useAbsensiStore();
  const { menteeList } = useMenteeStore();
  const { pertemuanList } = usePertemuanStore();
  const { mentorProfile } = useAuthStore();

  const [filterPertemuan, setFilterPertemuan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const myAbsensi = useMemo(() => {
    let data = absensiList.filter(
      (a) => a.kelompok_id === mentorProfile?.kelompok_id
    );

    if (filterPertemuan) {
      data = data.filter((a) => a.pertemuan_id === filterPertemuan);
    }

    if (filterStatus) {
      data = data.filter((a) => a.status === filterStatus);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter((a) => {
        const mentee = menteeList.find((m) => m.mentee_id === a.mentee_id);
        if (!mentee) return false;
        return (
          mentee.nama.toLowerCase().includes(q) ||
          mentee.NIM.includes(q)
        );
      });
    }

    return data;
  }, [absensiList, mentorProfile, filterPertemuan, filterStatus, searchQuery, menteeList]);

  const totalPages = Math.ceil(myAbsensi.length / ITEMS_PER_PAGE);
  const paginatedData = myAbsensi.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const stats = useMemo(() => {
    const total = myAbsensi.length;
    const hadir = myAbsensi.filter((a) => a.status === 'HADIR').length;
    const izin = myAbsensi.filter((a) => a.status === 'IZIN').length;
    const sakit = myAbsensi.filter((a) => a.status === 'SAKIT').length;
    const alfa = myAbsensi.filter((a) => a.status === 'ALFA').length;
    return { total, hadir, izin, sakit, alfa };
  }, [myAbsensi]);

  const getMenteeName = (menteeId: string) => {
    const mentee = menteeList.find((m) => m.mentee_id === menteeId);
    return mentee ? mentee.nama : '-';
  };

  const getMenteeNIM = (menteeId: string) => {
    const mentee = menteeList.find((m) => m.mentee_id === menteeId);
    return mentee ? mentee.NIM : '-';
  };

  const getPertemuanLabel = (pertemuanId: string) => {
    const p = pertemuanList.find((pt) => pt.pertemuan_id === pertemuanId);
    return p ? `Pertemuan ${p.pertemuan_ke}` : '-';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Absensi Mentee</h1>
        <p className="text-sm text-gray-500 mt-1">
          Lihat data kehadiran mentee di kelompok Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <CheckSquare className="h-4 w-4" />
            Total
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <UserCheck className="h-4 w-4" />
            Hadir
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.hadir}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Clock className="h-4 w-4" />
            Izin
          </div>
          <p className="text-2xl font-bold text-yellow-600">{stats.izin}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Clock className="h-4 w-4" />
            Sakit
          </div>
          <p className="text-2xl font-bold text-orange-600">{stats.sakit}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Clock className="h-4 w-4" />
            Alfa
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.alfa}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari berdasarkan nama atau NIM..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterPertemuan}
            onChange={(e) => {
              setFilterPertemuan(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Semua Pertemuan</option>
            {pertemuanList.map((p) => (
              <option key={p.pertemuan_id} value={p.pertemuan_id}>
                Pertemuan {p.pertemuan_ke} - {p.tanggal}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Semua Status</option>
            <option value="HADIR">Hadir</option>
            <option value="IZIN">Izin</option>
            <option value="SAKIT">Sakit</option>
            <option value="ALFA">Alfa</option>
          </select>
        </div>
      </div>

      {paginatedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <CheckSquare className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Tidak Ada Data Absensi</h3>
          <p className="text-sm text-gray-500 mt-1">
            {searchQuery || filterPertemuan || filterStatus
              ? 'Tidak ada data yang cocok dengan filter yang dipilih.'
              : 'Belum ada data absensi untuk kelompok Anda.'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Pertemuan
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Mentee
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Keterangan
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tanggal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((a, idx) => (
                    <tr key={a.absensi_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {getPertemuanLabel(a.pertemuan_id)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">
                          {getMenteeName(a.mentee_id)}
                        </p>
                        <p className="text-xs text-gray-500">{getMenteeNIM(a.mentee_id)}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {a.keterangan || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{a.tanggal_input}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Menampilkan {paginatedData.length} dari {myAbsensi.length} data absensi
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
