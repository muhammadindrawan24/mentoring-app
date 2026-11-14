'use client';

import { useState, useMemo } from 'react';
import { useCatatanStore } from '@/lib/catatan-store';
import { useMenteeStore } from '@/lib/mentee-store';
import { useMentorStore } from '@/lib/mentor-store';
import { useKelompokStore } from '@/lib/kelompok-store';
import { usePertemuanStore } from '@/lib/pertemuan-store';
import { DevCategory } from '@/types';
import { DEV_CATEGORY_LABELS, DEV_CATEGORY_COLORS } from '@/lib/mock-evaluasi';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { Clipboard, Search, Users, StickyNote, Eye, Filter } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export default function AdminCatatanPage() {
  const { catatanPertemuanList, catatanMenteeList } = useCatatanStore();
  const { menteeList } = useMenteeStore();
  const { mentorList } = useMentorStore();
  const { kelompokList } = useKelompokStore();
  const { pertemuanList } = usePertemuanStore();

  const [activeTab, setActiveTab] = useState<'pertemuan' | 'mentee'>('pertemuan');

  const [filterPertemuan, setFilterPertemuan] = useState('');
  const [filterKelompok, setFilterKelompok] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [detailItem, setDetailItem] = useState<string | null>(null);

  const filteredPertemuan = useMemo(() => {
    let data = [...catatanPertemuanList];

    if (filterPertemuan) {
      data = data.filter((c) => c.pertemuan_id === filterPertemuan);
    }
    if (filterKelompok) {
      data = data.filter((c) => c.kelompok_id === filterKelompok);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter((c) => {
        const topik = c.topik?.toLowerCase() || '';
        const catatan = c.catatan?.toLowerCase() || '';
        const mentor = mentorList.find((m) => m.mentor_id === c.mentor_id);
        const mentorName = mentor?.nama?.toLowerCase() || '';
        return topik.includes(q) || catatan.includes(q) || mentorName.includes(q);
      });
    }

    return data.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [catatanPertemuanList, filterPertemuan, filterKelompok, searchQuery]);

  const filteredMentee = useMemo(() => {
    let data = [...catatanMenteeList];

    if (filterPertemuan) {
      data = data.filter((c) => c.pertemuan_id === filterPertemuan);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter((c) => {
        const mentee = menteeList.find((m) => m.mentee_id === c.mentee_id);
        const menteeName = mentee?.nama?.toLowerCase() || '';
        const nim = mentee?.NIM || '';
        const catatan = c.catatan?.toLowerCase() || '';
        return menteeName.includes(q) || nim.includes(q) || catatan.includes(q);
      });
    }

    return data.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [catatanMenteeList, filterPertemuan, searchQuery]);

  const totalPertemuanPages = Math.ceil(filteredPertemuan.length / ITEMS_PER_PAGE);
  const paginatedPertemuan = filteredPertemuan.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalMenteePages = Math.ceil(filteredMentee.length / ITEMS_PER_PAGE);
  const paginatedMentee = filteredMentee.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const detailPertemuan = detailItem
    ? catatanPertemuanList.find((c) => c.catatan_id === detailItem)
    : null;

  const detailMentee = detailItem
    ? catatanMenteeList.find((c) => c.catatan_id === detailItem)
    : null;

  const currentTotal = activeTab === 'pertemuan' ? filteredPertemuan.length : filteredMentee.length;
  const currentPaginated = activeTab === 'pertemuan' ? paginatedPertemuan : paginatedMentee;
  const currentTotalPages = activeTab === 'pertemuan' ? totalPertemuanPages : totalMenteePages;

  const stats = useMemo(() => {
    return {
      totalPertemuan: catatanPertemuanList.length,
      totalMentee: catatanMenteeList.length,
      totalKelompok: new Set(catatanPertemuanList.map((c) => c.kelompok_id)).size,
      totalMentor: new Set(catatanPertemuanList.map((c) => c.mentor_id)).size,
    };
  }, [catatanPertemuanList, catatanMenteeList]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Catatan Mentoring</h1>
        <p className="text-sm text-gray-500 mt-1">
          Lihat catatan pertemuan dan catatan mentee dari seluruh mentor
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Clipboard className="h-4 w-4" />
            Catatan Pertemuan
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalPertemuan}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <StickyNote className="h-4 w-4" />
            Catatan Mentee
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.totalMentee}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Users className="h-4 w-4" />
            Kelompok Aktif
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.totalKelompok}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Users className="h-4 w-4" />
            Mentor Aktif
          </div>
          <p className="text-2xl font-bold text-purple-600">{stats.totalMentor}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => {
                setActiveTab('pertemuan');
                setCurrentPage(1);
                setSearchQuery('');
                setFilterPertemuan('');
                setFilterKelompok('');
              }}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'pertemuan'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clipboard className="h-4 w-4" />
                Catatan Pertemuan
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('mentee');
                setCurrentPage(1);
                setSearchQuery('');
                setFilterPertemuan('');
              }}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'mentee'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <StickyNote className="h-4 w-4" />
                Catatan Mentee
              </div>
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Filter</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Pertemuan</label>
              <select
                value={filterPertemuan}
                onChange={(e) => {
                  setFilterPertemuan(e.target.value);
                  setCurrentPage(1);
                }}
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
            {activeTab === 'pertemuan' && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Kelompok</label>
                <select
                  value={filterKelompok}
                  onChange={(e) => {
                    setFilterKelompok(e.target.value);
                    setCurrentPage(1);
                  }}
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
            )}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Cari</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={
                    activeTab === 'pertemuan'
                      ? 'Topik, catatan, atau mentor...'
                      : 'Nama, NIM, atau catatan...'
                  }
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4">
          {currentPaginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Clipboard className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Belum Ada Catatan</h3>
              <p className="text-sm text-gray-500 mt-1">
                {filterPertemuan || filterKelompok || searchQuery
                  ? 'Tidak ada data yang cocok dengan filter.'
                  : 'Belum ada catatan yang dibuat oleh mentor.'}
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  {activeTab === 'pertemuan' ? (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pertemuan</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelompok</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mentor</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Hadir</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Topik</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kondisi</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedPertemuan.map((item, idx) => {
                          const pertemuan = pertemuanList.find((p) => p.pertemuan_id === item.pertemuan_id);
                          const kelompok = kelompokList.find((k) => k.kelompok_id === item.kelompok_id);
                          const mentor = mentorList.find((m) => m.mentor_id === item.mentor_id);
                          return (
                            <tr key={item.catatan_id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                P{String(pertemuan?.pertemuan_ke || 0).padStart(2, '0')}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {kelompok?.nama_kelompok || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {mentor?.nama || '-'}
                              </td>
                              <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                                {item.jumlah_hadir}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 max-w-[200px] truncate">
                                {item.topik}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 max-w-[150px] truncate">
                                {item.kondisi}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {new Date(item.created_at).toLocaleDateString('id-ID')}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => setDetailItem(item.catatan_id)}
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
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mentee</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pertemuan</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mentor</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Keaktifan</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pemahaman</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catatan</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedMentee.map((item, idx) => {
                          const mentee = menteeList.find((m) => m.mentee_id === item.mentee_id);
                          const pertemuan = pertemuanList.find((p) => p.pertemuan_id === item.pertemuan_id);
                          const mentor = mentorList.find((m) => m.mentor_id === item.mentor_id);
                          return (
                            <tr key={item.catatan_id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-sm font-medium text-gray-900">{mentee?.nama || '-'}</p>
                                <p className="text-xs text-gray-500">{mentee?.NIM || '-'}</p>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                P{String(pertemuan?.pertemuan_ke || 0).padStart(2, '0')}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {mentor?.nama || '-'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <StatusBadge status={item.keaktifan} />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <StatusBadge status={item.pemahaman} />
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                                {item.catatan}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {new Date(item.created_at).toLocaleDateString('id-ID')}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => setDetailItem(item.catatan_id)}
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
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Menampilkan {currentPaginated.length} dari {currentTotal} data
                </p>
                <Pagination
                  currentPage={currentPage}
                  totalPages={currentTotalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={!!detailPertemuan && activeTab === 'pertemuan'}
        onClose={() => setDetailItem(null)}
        title="Detail Catatan Pertemuan"
        size="lg"
      >
        {detailPertemuan && (
          <div className="space-y-4">
            {(() => {
              const pertemuan = pertemuanList.find((p) => p.pertemuan_id === detailPertemuan.pertemuan_id);
              const kelompok = kelompokList.find((k) => k.kelompok_id === detailPertemuan.kelompok_id);
              const mentor = mentorList.find((m) => m.mentor_id === detailPertemuan.mentor_id);
              return (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Pertemuan:</span>{' '}
                    <span className="font-medium">
                      P{String(pertemuan?.pertemuan_ke || 0).padStart(2, '0')} - {pertemuan?.judul}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Kelompok:</span>{' '}
                    <span className="font-medium">{kelompok?.nama_kelompok || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Mentor:</span>{' '}
                    <span className="font-medium">{mentor?.nama || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Jumlah Hadir:</span>{' '}
                    <span className="font-medium">{detailPertemuan.jumlah_hadir} orang</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tanggal:</span>{' '}
                    <span className="font-medium">
                      {new Date(detailPertemuan.created_at).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Terakhir Diperbarui:</span>{' '}
                    <span className="font-medium">
                      {new Date(detailPertemuan.updated_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Topik</h4>
              <p className="text-sm text-gray-700">{detailPertemuan.topik}</p>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Kondisi Kelas</h4>
              <p className="text-sm text-gray-700">{detailPertemuan.kondisi}</p>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Catatan</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{detailPertemuan.catatan}</p>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Tindak Lanjut</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{detailPertemuan.tindak_lanjut}</p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!detailMentee && activeTab === 'mentee'}
        onClose={() => setDetailItem(null)}
        title="Detail Catatan Mentee"
        size="lg"
      >
        {detailMentee && (
          <div className="space-y-4">
            {(() => {
              const mentee = menteeList.find((m) => m.mentee_id === detailMentee.mentee_id);
              const pertemuan = pertemuanList.find((p) => p.pertemuan_id === detailMentee.pertemuan_id);
              const mentor = mentorList.find((m) => m.mentor_id === detailMentee.mentor_id);
              const kelompok = kelompokList.find((k) => k.kelompok_id === mentee?.kelompok_id);
              return (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Mentee:</span>{' '}
                    <span className="font-medium">{mentee?.nama || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">NIM:</span>{' '}
                    <span className="font-medium">{mentee?.NIM || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Kelompok:</span>{' '}
                    <span className="font-medium">{kelompok?.nama_kelompok || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Mentor:</span>{' '}
                    <span className="font-medium">{mentor?.nama || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Pertemuan:</span>{' '}
                    <span className="font-medium">
                      P{String(pertemuan?.pertemuan_ke || 0).padStart(2, '0')} - {pertemuan?.judul}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tanggal:</span>{' '}
                    <span className="font-medium">
                      {new Date(detailMentee.created_at).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Penilaian</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-gray-500 mb-1">Keaktifan</p>
                  <StatusBadge status={detailMentee.keaktifan} />
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-gray-500 mb-1">Pemahaman</p>
                  <StatusBadge status={detailMentee.pemahaman} />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Catatan</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{detailMentee.catatan}</p>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Tindak Lanjut</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{detailMentee.tindak_lanjut}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
