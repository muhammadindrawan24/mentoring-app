'use client';

import { useState, useMemo } from 'react';
import { usePertemuanStore } from '@/lib/pertemuan-store';
import { useToastStore } from '@/components/ui/toast';
import { StatusBadge } from '@/components/ui/status-badge';
import { Pagination } from '@/components/ui/pagination';
import { Calendar, Search, Clock, PlayCircle, CheckCircle } from 'lucide-react';
import { MeetingStatus } from '@/types';

const ITEMS_PER_PAGE = 10;

const STATUS_FILTERS: { label: string; value: MeetingStatus | 'ALL' }[] = [
  { label: 'Semua Status', value: 'ALL' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Upcoming', value: 'UPCOMING' },
  { label: 'Ongoing', value: 'ONGOING' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function PertemuanPage() {
  const { pertemuanList } = usePertemuanStore();

  const [statusFilter, setStatusFilter] = useState<MeetingStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    let data = [...pertemuanList];

    if (statusFilter !== 'ALL') {
      data = data.filter((p) => p.status === statusFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (p) =>
          p.judul.toLowerCase().includes(q) ||
          p.tema.toLowerCase().includes(q)
      );
    }

    return data;
  }, [pertemuanList, statusFilter, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const stats = useMemo(() => {
    const total = pertemuanList.length;
    const upcoming = pertemuanList.filter((p) => p.status === 'UPCOMING').length;
    const ongoing = pertemuanList.filter((p) => p.status === 'ONGOING').length;
    const completed = pertemuanList.filter((p) => p.status === 'COMPLETED').length;
    return { total, upcoming, ongoing, completed };
  }, [pertemuanList]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Daftar Pertemuan</h1>
        <p className="text-sm text-gray-500 mt-1">
          Lihat seluruh jadwal pertemuan mentoring
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Calendar className="h-4 w-4" />
            Total Pertemuan
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Clock className="h-4 w-4" />
            Upcoming
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <PlayCircle className="h-4 w-4" />
            Ongoing
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.ongoing}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <CheckCircle className="h-4 w-4" />
            Completed
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as MeetingStatus | 'ALL');
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {STATUS_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari berdasarkan judul atau tema..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {paginatedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <Calendar className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Tidak Ada Data Pertemuan</h3>
          <p className="text-sm text-gray-500 mt-1">
            {searchQuery || statusFilter !== 'ALL'
              ? 'Tidak ada data yang cocok dengan filter.'
              : 'Belum ada jadwal pertemuan.'}
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pertemuan Ke</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Judul</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tema</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jam</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((p, idx) => (
                    <tr key={p.pertemuan_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                          {p.pertemuan_ke}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.judul}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{p.tema}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(p.tanggal)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {p.jam_mulai} - {p.jam_selesai}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Menampilkan {paginatedData.length} dari {filteredData.length} pertemuan
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
