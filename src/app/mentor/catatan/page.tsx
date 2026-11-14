'use client';

import { useState, useMemo } from 'react';
import { useCatatanStore } from '@/lib/catatan-store';
import { usePertemuanStore } from '@/lib/pertemuan-store';
import { useKelompokStore } from '@/lib/kelompok-store';
import { useMenteeStore } from '@/lib/mentee-store';
import { useAuthStore } from '@/lib/auth-store';
import { useToastStore } from '@/components/ui/toast';
import { DevCategory } from '@/types';
import { DEV_CATEGORY_LABELS, DEV_CATEGORY_COLORS } from '@/lib/mock-evaluasi';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Clipboard,
  Search,
  Plus,
  Pencil,
  Trash2,
  Users,
  StickyNote,
  Eye,
  Filter,
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const DEV_CATEGORIES: { value: DevCategory; label: string }[] = [
  { value: 'SANGAT_BAIK', label: 'Sangat Baik' },
  { value: 'BAIK', label: 'Baik' },
  { value: 'CUKUP', label: 'Cukup' },
  { value: 'PERLU_PENDAMPINGAN', label: 'Perlu Pendampingan' },
];

interface CatatanPertemuanForm {
  pertemuan_id: string;
  jumlah_hadir: string;
  topik: string;
  kondisi: string;
  catatan: string;
  tindak_lanjut: string;
}

interface CatatanMenteeForm {
  pertemuan_id: string;
  mentee_id: string;
  keaktifan: DevCategory;
  pemahaman: DevCategory;
  catatan: string;
  tindak_lanjut: string;
}

const emptyPertemuanForm: CatatanPertemuanForm = {
  pertemuan_id: '',
  jumlah_hadir: '',
  topik: '',
  kondisi: '',
  catatan: '',
  tindak_lanjut: '',
};

const emptyMenteeForm: CatatanMenteeForm = {
  pertemuan_id: '',
  mentee_id: '',
  keaktifan: 'BAIK',
  pemahaman: 'BAIK',
  catatan: '',
  tindak_lanjut: '',
};

export default function MentorCatatanPage() {
  const {
    catatanPertemuanList,
    catatanMenteeList,
    addCatatanPertemuan,
    updateCatatanPertemuan,
    deleteCatatanPertemuan,
    addCatatanMentee,
    updateCatatanMentee,
    deleteCatatanMentee,
  } = useCatatanStore();

  const { pertemuanList } = usePertemuanStore();
  const { kelompokList } = useKelompokStore();
  const { menteeList } = useMenteeStore();
  const { mentorProfile } = useAuthStore();
  const { addToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<'pertemuan' | 'mentee'>('pertemuan');
  const [filterPertemuan, setFilterPertemuan] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [detailItem, setDetailItem] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [pertemuanForm, setPertemuanForm] = useState<CatatanPertemuanForm>(emptyPertemuanForm);
  const [menteeForm, setMenteeForm] = useState<CatatanMenteeForm>(emptyMenteeForm);

  const myKelompok = useMemo(() => {
    if (!mentorProfile) return null;
    return kelompokList.find((k) => k.mentor_id === mentorProfile.mentor_id) || null;
  }, [mentorProfile, kelompokList]);

  const myMentees = useMemo(() => {
    if (!myKelompok) return [];
    return menteeList.filter((m) => m.kelompok_id === myKelompok.kelompok_id);
  }, [myKelompok, menteeList]);

  const filteredPertemuan = useMemo(() => {
    if (!mentorProfile) return [];
    let data = catatanPertemuanList.filter((c) => c.mentor_id === mentorProfile.mentor_id);

    if (filterPertemuan) {
      data = data.filter((c) => c.pertemuan_id === filterPertemuan);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter((c) => {
        const topik = c.topik?.toLowerCase() || '';
        const catatan = c.catatan?.toLowerCase() || '';
        return topik.includes(q) || catatan.includes(q);
      });
    }

    return data.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [catatanPertemuanList, mentorProfile, filterPertemuan, searchQuery]);

  const filteredMentee = useMemo(() => {
    if (!mentorProfile) return [];
    let data = catatanMenteeList.filter((c) => c.mentor_id === mentorProfile.mentor_id);

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
  }, [catatanMenteeList, mentorProfile, filterPertemuan, searchQuery, menteeList]);

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

  const currentPaginated =
    activeTab === 'pertemuan' ? paginatedPertemuan : paginatedMentee;
  const currentTotalPages =
    activeTab === 'pertemuan' ? totalPertemuanPages : totalMenteePages;
  const currentTotal =
    activeTab === 'pertemuan' ? filteredPertemuan.length : filteredMentee.length;

  const detailPertemuan = detailItem
    ? catatanPertemuanList.find((c) => c.catatan_id === detailItem)
    : null;

  const detailMenteeItem = detailItem
    ? catatanMenteeList.find((c) => c.catatan_id === detailItem)
    : null;

  function resetForms() {
    setPertemuanForm(emptyPertemuanForm);
    setMenteeForm(emptyMenteeForm);
    setEditingId(null);
    setShowForm(false);
  }

  function openAddForm() {
    resetForms();
    setShowForm(true);
  }

  function openEditPertemuan(id: string) {
    const item = catatanPertemuanList.find((c) => c.catatan_id === id);
    if (!item) return;
    setPertemuanForm({
      pertemuan_id: item.pertemuan_id,
      jumlah_hadir: String(item.jumlah_hadir),
      topik: item.topik,
      kondisi: item.kondisi,
      catatan: item.catatan,
      tindak_lanjut: item.tindak_lanjut,
    });
    setEditingId(id);
    setShowForm(true);
  }

  function openEditMentee(id: string) {
    const item = catatanMenteeList.find((c) => c.catatan_id === id);
    if (!item) return;
    setMenteeForm({
      pertemuan_id: item.pertemuan_id,
      mentee_id: item.mentee_id,
      keaktifan: item.keaktifan,
      pemahaman: item.pemahaman,
      catatan: item.catatan,
      tindak_lanjut: item.tindak_lanjut,
    });
    setEditingId(id);
    setShowForm(true);
  }

  function handleSavePertemuan() {
    if (!mentorProfile || !myKelompok) return;
    if (!pertemuanForm.pertemuan_id || !pertemuanForm.jumlah_hadir || !pertemuanForm.topik) {
      addToast('Harap isi pertemuan, jumlah hadir, dan topik.', 'error');
      return;
    }

    if (editingId) {
      updateCatatanPertemuan(editingId, {
        pertemuan_id: pertemuanForm.pertemuan_id,
        jumlah_hadir: parseInt(pertemuanForm.jumlah_hadir, 10) || 0,
        topik: pertemuanForm.topik,
        kondisi: pertemuanForm.kondisi,
        catatan: pertemuanForm.catatan,
        tindak_lanjut: pertemuanForm.tindak_lanjut,
      });
      addToast('Catatan pertemuan berhasil diperbarui.', 'success');
    } else {
      addCatatanPertemuan({
        pertemuan_id: pertemuanForm.pertemuan_id,
        kelompok_id: myKelompok.kelompok_id,
        mentor_id: mentorProfile.mentor_id,
        jumlah_hadir: parseInt(pertemuanForm.jumlah_hadir, 10) || 0,
        topik: pertemuanForm.topik,
        kondisi: pertemuanForm.kondisi,
        catatan: pertemuanForm.catatan,
        tindak_lanjut: pertemuanForm.tindak_lanjut,
      });
      addToast('Catatan pertemuan berhasil ditambahkan.', 'success');
    }

    resetForms();
  }

  function handleSaveMentee() {
    if (!mentorProfile) return;
    if (!menteeForm.pertemuan_id || !menteeForm.mentee_id) {
      addToast('Harap isi pertemuan dan mentee.', 'error');
      return;
    }

    if (editingId) {
      updateCatatanMentee(editingId, {
        pertemuan_id: menteeForm.pertemuan_id,
        mentee_id: menteeForm.mentee_id,
        keaktifan: menteeForm.keaktifan,
        pemahaman: menteeForm.pemahaman,
        catatan: menteeForm.catatan,
        tindak_lanjut: menteeForm.tindak_lanjut,
      });
      addToast('Catatan mentee berhasil diperbarui.', 'success');
    } else {
      addCatatanMentee({
        pertemuan_id: menteeForm.pertemuan_id,
        mentee_id: menteeForm.mentee_id,
        mentor_id: mentorProfile.mentor_id,
        keaktifan: menteeForm.keaktifan,
        pemahaman: menteeForm.pemahaman,
        catatan: menteeForm.catatan,
        tindak_lanjut: menteeForm.tindak_lanjut,
      });
      addToast('Catatan mentee berhasil ditambahkan.', 'success');
    }

    resetForms();
  }

  function handleDelete() {
    if (!deleteId) return;
    if (activeTab === 'pertemuan') {
      deleteCatatanPertemuan(deleteId);
      addToast('Catatan pertemuan berhasil dihapus.', 'success');
    } else {
      deleteCatatanMentee(deleteId);
      addToast('Catatan mentee berhasil dihapus.', 'success');
    }
    setDeleteId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catatan Mentoring</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola catatan pertemuan dan catatan mentee
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Tambah Catatan
        </button>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      ? 'Topik atau catatan...'
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
                {filterPertemuan || searchQuery
                  ? 'Tidak ada data yang cocok dengan filter.'
                  : 'Klik "Tambah Catatan" untuk membuat catatan baru.'}
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
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Hadir</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Topik</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kondisi</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedPertemuan.map((item, idx) => {
                          const pertemuan = pertemuanList.find(
                            (p) => p.pertemuan_id === item.pertemuan_id
                          );
                          return (
                            <tr key={item.catatan_id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                P{String(pertemuan?.pertemuan_ke || 0).padStart(2, '0')}
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
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => setDetailItem(item.catatan_id)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Lihat Detail"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => openEditPertemuan(item.catatan_id)}
                                    className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                    title="Edit"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteId(item.catatan_id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Hapus"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
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
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Keaktifan</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pemahaman</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catatan</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedMentee.map((item, idx) => {
                          const mentee = menteeList.find(
                            (m) => m.mentee_id === item.mentee_id
                          );
                          const pertemuan = pertemuanList.find(
                            (p) => p.pertemuan_id === item.pertemuan_id
                          );
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
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => setDetailItem(item.catatan_id)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Lihat Detail"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => openEditMentee(item.catatan_id)}
                                    className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                    title="Edit"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteId(item.catatan_id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Hapus"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
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
        isOpen={showForm}
        onClose={resetForms}
        title={
          editingId
            ? activeTab === 'pertemuan'
              ? 'Edit Catatan Pertemuan'
              : 'Edit Catatan Mentee'
            : activeTab === 'pertemuan'
            ? 'Tambah Catatan Pertemuan'
            : 'Tambah Catatan Mentee'
        }
        size="lg"
      >
        {activeTab === 'pertemuan' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pertemuan *</label>
              <select
                value={pertemuanForm.pertemuan_id}
                onChange={(e) =>
                  setPertemuanForm({ ...pertemuanForm, pertemuan_id: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Pilih Pertemuan</option>
                {pertemuanList.map((p) => (
                  <option key={p.pertemuan_id} value={p.pertemuan_id}>
                    P{String(p.pertemuan_ke).padStart(2, '0')} - {p.judul}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jumlah Hadir *
              </label>
              <input
                type="number"
                value={pertemuanForm.jumlah_hadir}
                onChange={(e) =>
                  setPertemuanForm({ ...pertemuanForm, jumlah_hadir: e.target.value })
                }
                min={0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Jumlah anggota yang hadir"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topik *</label>
              <input
                type="text"
                value={pertemuanForm.topik}
                onChange={(e) =>
                  setPertemuanForm({ ...pertemuanForm, topik: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Topik yang dibahas"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kondisi Kelas
              </label>
              <input
                type="text"
                value={pertemuanForm.kondisi}
                onChange={(e) =>
                  setPertemuanForm({ ...pertemuanForm, kondisi: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Contoh: Antusias dan aktif"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
              <textarea
                value={pertemuanForm.catatan}
                onChange={(e) =>
                  setPertemuanForm({ ...pertemuanForm, catatan: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Catatan detail mengenai pertemuan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tindak Lanjut
              </label>
              <textarea
                value={pertemuanForm.tindak_lanjut}
                onChange={(e) =>
                  setPertemuanForm({ ...pertemuanForm, tindak_lanjut: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Rencana tindak lanjut"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={resetForms}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleSavePertemuan}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {editingId ? 'Perbarui' : 'Simpan'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pertemuan *</label>
              <select
                value={menteeForm.pertemuan_id}
                onChange={(e) =>
                  setMenteeForm({ ...menteeForm, pertemuan_id: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Pilih Pertemuan</option>
                {pertemuanList.map((p) => (
                  <option key={p.pertemuan_id} value={p.pertemuan_id}>
                    P{String(p.pertemuan_ke).padStart(2, '0')} - {p.judul}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mentee *</label>
              <select
                value={menteeForm.mentee_id}
                onChange={(e) =>
                  setMenteeForm({ ...menteeForm, mentee_id: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Pilih Mentee</option>
                {myMentees.map((m) => (
                  <option key={m.mentee_id} value={m.mentee_id}>
                    {m.nama} ({m.NIM})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keaktifan
                </label>
                <select
                  value={menteeForm.keaktifan}
                  onChange={(e) =>
                    setMenteeForm({
                      ...menteeForm,
                      keaktifan: e.target.value as DevCategory,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {DEV_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pemahaman
                </label>
                <select
                  value={menteeForm.pemahaman}
                  onChange={(e) =>
                    setMenteeForm({
                      ...menteeForm,
                      pemahaman: e.target.value as DevCategory,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {DEV_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
              <textarea
                value={menteeForm.catatan}
                onChange={(e) =>
                  setMenteeForm({ ...menteeForm, catatan: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Catatan mengenai mentee"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tindak Lanjut
              </label>
              <textarea
                value={menteeForm.tindak_lanjut}
                onChange={(e) =>
                  setMenteeForm({ ...menteeForm, tindak_lanjut: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Rencana tindak lanjut"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={resetForms}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleSaveMentee}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {editingId ? 'Perbarui' : 'Simpan'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!detailPertemuan && activeTab === 'pertemuan'}
        onClose={() => setDetailItem(null)}
        title="Detail Catatan Pertemuan"
        size="lg"
      >
        {detailPertemuan && (
          <div className="space-y-4">
            {(() => {
              const pertemuan = pertemuanList.find(
                (p) => p.pertemuan_id === detailPertemuan.pertemuan_id
              );
              const kelompok = kelompokList.find(
                (k) => k.kelompok_id === detailPertemuan.kelompok_id
              );
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
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {detailPertemuan.catatan}
              </p>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Tindak Lanjut</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {detailPertemuan.tindak_lanjut}
              </p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!detailMenteeItem && activeTab === 'mentee'}
        onClose={() => setDetailItem(null)}
        title="Detail Catatan Mentee"
        size="lg"
      >
        {detailMenteeItem && (
          <div className="space-y-4">
            {(() => {
              const mentee = menteeList.find(
                (m) => m.mentee_id === detailMenteeItem.mentee_id
              );
              const pertemuan = pertemuanList.find(
                (p) => p.pertemuan_id === detailMenteeItem.pertemuan_id
              );
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
                    <span className="text-gray-500">Pertemuan:</span>{' '}
                    <span className="font-medium">
                      P{String(pertemuan?.pertemuan_ke || 0).padStart(2, '0')} - {pertemuan?.judul}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tanggal:</span>{' '}
                    <span className="font-medium">
                      {new Date(detailMenteeItem.created_at).toLocaleDateString('id-ID', {
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
                  <StatusBadge status={detailMenteeItem.keaktifan} />
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-gray-500 mb-1">Pemahaman</p>
                  <StatusBadge status={detailMenteeItem.pemahaman} />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Catatan</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {detailMenteeItem.catatan}
              </p>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Tindak Lanjut</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {detailMenteeItem.tindak_lanjut}
              </p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Catatan"
        message="Apakah Anda yakin ingin menghapus catatan ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
        variant="danger"
      />
    </div>
  );
}
