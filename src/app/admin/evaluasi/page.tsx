'use client';

import { useState, useMemo } from 'react';
import { useEvaluasiStore } from '@/lib/evaluasi-store';
import { useMenteeStore } from '@/lib/mentee-store';
import { useMentorStore } from '@/lib/mentor-store';
import { useKelompokStore } from '@/lib/kelompok-store';
import { usePertemuanStore } from '@/lib/pertemuan-store';
import { DEV_CATEGORY_LABELS, DEV_CATEGORY_COLORS } from '@/lib/mock-evaluasi';
import { DevCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import { exportToCSV } from '@/lib/utils';
import {
  Star,
  Search,
  Filter,
  Eye,
  BarChart3,
  Users,
  TrendingUp,
  Download,
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const ASPEK_LIST = ['kehadiran', 'keaktifan', 'pemahaman', 'partisipasi', 'komitmen'] as const;

const CATEGORIES: { value: DevCategory; label: string; color: string }[] = [
  { value: 'SANGAT_BAIK', label: 'Sangat Baik', color: 'bg-green-100 text-green-800' },
  { value: 'BAIK', label: 'Baik', color: 'bg-blue-100 text-blue-800' },
  { value: 'CUKUP', label: 'Cukup', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'PERLU_PENDAMPINGAN', label: 'Perlu Pendampingan', color: 'bg-red-100 text-red-800' },
];

function scoreToNumber(cat: DevCategory): number {
  const map: Record<DevCategory, number> = {
    SANGAT_BAIK: 4,
    BAIK: 3,
    CUKUP: 2,
    PERLU_PENDAMPINGAN: 1,
  };
  return map[cat] || 0;
}

function numberToCategory(n: number): DevCategory {
  if (n >= 3.5) return 'SANGAT_BAIK';
  if (n >= 2.5) return 'BAIK';
  if (n >= 1.5) return 'CUKUP';
  return 'PERLU_PENDAMPINGAN';
}

export default function AdminEvaluasiPage() {
  const { evaluasiList } = useEvaluasiStore();
  const { menteeList } = useMenteeStore();
  const { mentorList } = useMentorStore();
  const { kelompokList } = useKelompokStore();
  const { pertemuanList } = usePertemuanStore();

  const [filterPertemuan, setFilterPertemuan] = useState('');
  const [filterKelompok, setFilterKelompok] = useState('');
  const [filterMentor, setFilterMentor] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [detailMentee, setDetailMentee] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    let data = [...evaluasiList];

    if (filterPertemuan) {
      data = data.filter((e) => e.pertemuan_id === filterPertemuan);
    }
    if (filterMentor) {
      data = data.filter((e) => e.mentor_id === filterMentor);
    }
    if (filterKelompok) {
      const menteeIds = menteeList.filter((m) => m.kelompok_id === filterKelompok).map(
        (m) => m.mentee_id
      );
      data = data.filter((e) => menteeIds.includes(e.mentee_id));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter((e) => {
        const mentee = menteeList.find((m) => m.mentee_id === e.mentee_id);
        return (
          mentee?.nama.toLowerCase().includes(q) ||
          mentee?.NIM.includes(q)
        );
      });
    }

    return data;
  }, [evaluasiList, filterPertemuan, filterKelompok, filterMentor, searchQuery]);

  const aggregatedByMentee = useMemo(() => {
    const map: Record<string, {
      mentee_id: string;
      nama: string;
      NIM: string;
      prodi: string;
      kelompok_id: string;
      evaluasiCount: number;
      avgKehadiran: number;
      avgKeaktifan: number;
      avgPemahaman: number;
      avgPartisipasi: number;
      avgKomitmen: number;
      avgTotal: number;
      evaluations: typeof evaluasiList;
    }> = {};

    filteredData.forEach((ev) => {
      if (!map[ev.mentee_id]) {
        const mentee = menteeList.find((m) => m.mentee_id === ev.mentee_id);
        map[ev.mentee_id] = {
          mentee_id: ev.mentee_id,
          nama: mentee?.nama || '-',
          NIM: mentee?.NIM || '-',
          prodi: mentee?.prodi || '-',
          kelompok_id: mentee?.kelompok_id || '-',
          evaluasiCount: 0,
          avgKehadiran: 0,
          avgKeaktifan: 0,
          avgPemahaman: 0,
          avgPartisipasi: 0,
          avgKomitmen: 0,
          avgTotal: 0,
          evaluations: [],
        };
      }
      map[ev.mentee_id].evaluasiCount++;
      map[ev.mentee_id].avgKehadiran += scoreToNumber(ev.kehadiran);
      map[ev.mentee_id].avgKeaktifan += scoreToNumber(ev.keaktifan);
      map[ev.mentee_id].avgPemahaman += scoreToNumber(ev.pemahaman);
      map[ev.mentee_id].avgPartisipasi += scoreToNumber(ev.partisipasi);
      map[ev.mentee_id].avgKomitmen += scoreToNumber(ev.komitmen);
      map[ev.mentee_id].evaluations.push(ev);
    });

    Object.values(map).forEach((item) => {
      const n = item.evaluasiCount;
      if (n > 0) {
        item.avgKehadiran = Math.round((item.avgKehadiran / n) * 100) / 100;
        item.avgKeaktifan = Math.round((item.avgKeaktifan / n) * 100) / 100;
        item.avgPemahaman = Math.round((item.avgPemahaman / n) * 100) / 100;
        item.avgPartisipasi = Math.round((item.avgPartisipasi / n) * 100) / 100;
        item.avgKomitmen = Math.round((item.avgKomitmen / n) * 100) / 100;
        item.avgTotal =
          Math.round(
            ((item.avgKehadiran + item.avgKeaktifan + item.avgPemahaman + item.avgPartisipasi + item.avgKomitmen) / 5) *
              100
          ) / 100;
      }
    });

    return Object.values(map).sort((a, b) => b.avgTotal - a.avgTotal);
  }, [filteredData]);

  const totalPages = Math.ceil(aggregatedByMentee.length / ITEMS_PER_PAGE);
  const paginatedData = aggregatedByMentee.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const stats = useMemo(() => {
    const total = filteredData.length;
    const uniqueMentees = new Set(filteredData.map((e) => e.mentee_id)).size;
    const uniqueMentors = new Set(filteredData.map((e) => e.mentor_id)).size;
    const avgScore =
      aggregatedByMentee.length > 0
        ? Math.round(
            (aggregatedByMentee.reduce((sum, m) => sum + m.avgTotal, 0) /
              aggregatedByMentee.length) *
              100
          ) / 100
        : 0;
    return { total, uniqueMentees, uniqueMentors, avgScore };
  }, [filteredData, aggregatedByMentee]);

  const detailMenteeData = detailMentee
    ? aggregatedByMentee.find((m) => m.mentee_id === detailMentee)
    : null;

  const handleExportCSV = () => {
    const headers = ['No', 'Nama', 'NIM', 'Prodi', 'Kelompok', 'Jumlah Penilaian', 'Rata-rata Skor'];
    const rows = aggregatedByMentee.map((item, idx) => {
      const kelompok = kelompokList.find((k) => k.kelompok_id === item.kelompok_id);
      return [
        idx + 1,
        item.nama,
        item.NIM,
        item.prodi,
        kelompok ? kelompok.nama_kelompok : '-',
        item.evaluasiCount,
        item.avgTotal,
      ];
    });
    exportToCSV(headers, rows, 'evaluasi-penilaian');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Evaluasi Penilaian</h1>
        <p className="text-sm text-gray-500 mt-1">
          Lihat penilaian seluruh mentee dari semua mentor
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <BarChart3 className="h-4 w-4" />
            Total Penilaian
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Users className="h-4 w-4" />
            Mentee Dinilai
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.uniqueMentees}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Users className="h-4 w-4" />
            Mentor Aktif
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.uniqueMentors}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <TrendingUp className="h-4 w-4" />
            Rata-rata Skor
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {stats.avgScore > 0 ? stats.avgScore.toFixed(1) : '-'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Filter</h2>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Pertemuan</label>
            <select
              value={filterPertemuan}
              onChange={(e) => { setFilterPertemuan(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua Pertemuan</option>
              {pertemuanList.map((p) => (
                <option key={p.pertemuan_id} value={p.pertemuan_id}>
                  P{String(p.pertemuan_ke).padStart(2, '0')} - {p.judul}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Kelompok</label>
            <select
              value={filterKelompok}
              onChange={(e) => { setFilterKelompok(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua Kelompok</option>
              {kelompokList.map((k) => (
                <option key={k.kelompok_id} value={k.kelompok_id}>
                  {k.nama_kelompok} ({k.kode_kelompok})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Mentor</label>
            <select
              value={filterMentor}
              onChange={(e) => { setFilterMentor(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua Mentor</option>
              {mentorList.map((m) => (
                <option key={m.mentor_id} value={m.mentor_id}>
                  {m.nama}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Cari Mentee</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Nama atau NIM..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {paginatedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <Star className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Belum Ada Penilaian</h3>
          <p className="text-sm text-gray-500 mt-1">
            {filterPertemuan || filterKelompok || filterMentor || searchQuery
              ? 'Tidak ada data yang cocok dengan filter.'
              : 'Mentor belum mengisi penilaian untuk mentee.'}
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mentee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIM</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Penilaian</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Kehadiran</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Keaktifan</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pemahaman</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Partisipasi</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Komitmen</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Rata-rata</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((item, idx) => {
                    const avgCat = numberToCategory(item.avgTotal);
                    const avgColor = CATEGORIES.find((c) => c.value === avgCat)?.color || '';
                    return (
                      <tr key={item.mentee_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{item.nama}</p>
                          <p className="text-xs text-gray-500">{item.prodi}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.NIM}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-medium text-gray-900">{item.evaluasiCount}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORIES.find((c) => c.value === numberToCategory(item.avgKehadiran))?.color || ''}`}>
                            {DEV_CATEGORY_LABELS[numberToCategory(item.avgKehadiran)]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORIES.find((c) => c.value === numberToCategory(item.avgKeaktifan))?.color || ''}`}>
                            {DEV_CATEGORY_LABELS[numberToCategory(item.avgKeaktifan)]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORIES.find((c) => c.value === numberToCategory(item.avgPemahaman))?.color || ''}`}>
                            {DEV_CATEGORY_LABELS[numberToCategory(item.avgPemahaman)]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORIES.find((c) => c.value === numberToCategory(item.avgPartisipasi))?.color || ''}`}>
                            {DEV_CATEGORY_LABELS[numberToCategory(item.avgPartisipasi)]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORIES.find((c) => c.value === numberToCategory(item.avgKomitmen))?.color || ''}`}>
                            {DEV_CATEGORY_LABELS[numberToCategory(item.avgKomitmen)]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${avgColor}`}>
                            {item.avgTotal.toFixed(1)} - {DEV_CATEGORY_LABELS[avgCat]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setDetailMentee(item.mentee_id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Menampilkan {paginatedData.length} dari {aggregatedByMentee.length} mentee
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      )}

      <Modal
        isOpen={!!detailMentee}
        onClose={() => setDetailMentee(null)}
        title={`Detail Penilaian - ${detailMenteeData?.nama || ''}`}
        size="lg"
      >
        {detailMenteeData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">NIM:</span>{' '}
                <span className="font-medium">{detailMenteeData.NIM}</span>
              </div>
              <div>
                <span className="text-gray-500">Prodi:</span>{' '}
                <span className="font-medium">{detailMenteeData.prodi}</span>
              </div>
              <div>
                <span className="text-gray-500">Kelompok:</span>{' '}
                <span className="font-medium">
                  {kelompokList.find((k) => k.kelompok_id === detailMenteeData.kelompok_id)?.nama_kelompok || '-'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Jumlah Penilaian:</span>{' '}
                <span className="font-medium">{detailMenteeData.evaluasiCount}x</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Rata-rata Penilaian</h3>
              <div className="grid grid-cols-5 gap-2">
                {ASPEK_LIST.map((aspek) => {
                  const val = detailMenteeData[
                    `avg${aspek.charAt(0).toUpperCase() + aspek.slice(1)}` as keyof typeof detailMenteeData
                  ] as number;
                  const cat = numberToCategory(val);
                  const catInfo = CATEGORIES.find((c) => c.value === cat);
                  return (
                    <div key={aspek} className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 capitalize">{aspek}</p>
                      <p className={`text-sm font-bold mt-1 ${catInfo?.color?.split(' ')[1] || ''}`}>
                        {val.toFixed(1)}
                      </p>
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium mt-1 ${catInfo?.color || ''}`}>
                        {DEV_CATEGORY_LABELS[cat]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Riwayat Penilaian</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {detailMenteeData.evaluations.map((ev) => {
                  const pertemuan = pertemuanList.find((p) => p.pertemuan_id === ev.pertemuan_id);
                  const mentor = mentorList.find((m) => m.mentor_id === ev.mentor_id);
                  return (
                    <div key={ev.evaluasi_id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900">
                          Pertemuan {String(pertemuan?.pertemuan_ke || 0).padStart(2, '0')} - {pertemuan?.judul}
                        </p>
                        <span className="text-xs text-gray-500">{ev.created_at.split('T')[0]}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">Oleh: {mentor?.nama}</p>
                      <div className="flex flex-wrap gap-1">
                        {ASPEK_LIST.map((aspek) => {
                          const val = ev[aspek as keyof typeof ev] as DevCategory;
                          const catInfo = CATEGORIES.find((c) => c.value === val);
                          return (
                            <span key={aspek} className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${catInfo?.color || ''}`}>
                              {aspek.charAt(0).toUpperCase() + aspek.slice(1)}: {DEV_CATEGORY_LABELS[val]}
                            </span>
                          );
                        })}
                      </div>
                      {ev.catatan && (
                        <p className="text-xs text-gray-600 mt-2 italic">&quot;{ev.catatan}&quot;</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
