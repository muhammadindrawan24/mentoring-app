'use client';

import { useState, useMemo } from 'react';
import { useMenteeStore } from '@/lib/mentee-store';
import { useKelompokStore } from '@/lib/kelompok-store';
import { PRODI_LIST } from '@/lib/constants';
import { useToastStore } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { exportToCSV } from '@/lib/utils';
import {
  Users,
  Search,
  Filter,
  Plus,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  GraduationCap,
  Download,
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

interface FormData {
  nama: string;
  NIM: string;
  prodi: string;
  angkatan: string;
  no_hp: string;
  kelompok_id: string;
  status: 'ACTIVE' | 'INACTIVE';
}

const defaultForm: FormData = {
  nama: '',
  NIM: '',
  prodi: '',
  angkatan: '2026',
  no_hp: '',
  kelompok_id: '',
  status: 'ACTIVE',
};

export default function AdminMenteesPage() {
  const { menteeList, addMentee, updateMentee, deleteMentee } = useMenteeStore();
  const { kelompokList } = useKelompokStore();
  const { addToast } = useToastStore();

  const [filterKelompok, setFilterKelompok] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    let data = [...menteeList];

    if (filterKelompok) {
      data = data.filter((m) => m.kelompok_id === filterKelompok);
    }
    if (filterStatus) {
      data = data.filter((m) => m.status === filterStatus);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (m) =>
          m.nama.toLowerCase().includes(q) ||
          m.NIM.includes(q) ||
          m.prodi.toLowerCase().includes(q) ||
          m.no_hp.includes(q)
      );
    }

    return data;
  }, [menteeList, filterKelompok, filterStatus, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const stats = useMemo(() => {
    const total = menteeList.length;
    const active = menteeList.filter((m) => m.status === 'ACTIVE').length;
    const inactive = total - active;
    const withGroup = menteeList.filter((m) => m.kelompok_id).length;
    return { total, active, inactive, withGroup };
  }, [menteeList]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!form.nama.trim()) newErrors.nama = 'Nama wajib diisi';
    if (!form.NIM.trim()) newErrors.NIM = 'NIM wajib diisi';
    else if (menteeList.some((m) => m.NIM === form.NIM && m.mentee_id !== editId)) {
      newErrors.NIM = 'NIM sudah terdaftar';
    }
    if (!form.prodi) newErrors.prodi = 'Program studi wajib dipilih';
    if (!form.no_hp.trim()) newErrors.no_hp = 'No. HP wajib diisi';
    if (!form.kelompok_id) newErrors.kelompok_id = 'Kelompok wajib dipilih';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    if (editId) {
      updateMentee(editId, form);
      addToast('Data mentee berhasil diperbarui.', 'success');
    } else {
      addMentee(form);
      addToast('Mentee baru berhasil ditambahkan.', 'success');
    }

    setShowForm(false);
    setEditId(null);
    setForm(defaultForm);
    setErrors({});
  };

  const handleEdit = (mentee_id: string) => {
    const m = menteeList.find((x) => x.mentee_id === mentee_id);
    if (!m) return;
    setForm({
      nama: m.nama,
      NIM: m.NIM,
      prodi: m.prodi,
      angkatan: m.angkatan,
      no_hp: m.no_hp,
      kelompok_id: m.kelompok_id,
      status: m.status,
    });
    setEditId(mentee_id);
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMentee(deleteId);
    addToast('Mentee berhasil dihapus.', 'success');
    setDeleteId(null);
  };

  const handleExportCSV = () => {
    const headers = ['No', 'Nama', 'NIM', 'Prodi', 'Angkatan', 'No HP', 'Kelompok', 'Status'];
    const rows = filteredData.map((m, idx) => {
      const kelompok = kelompokList.find((k) => k.kelompok_id === m.kelompok_id);
      return [
        idx + 1,
        m.nama,
        m.NIM,
        m.prodi,
        m.angkatan,
        m.no_hp,
        kelompok ? kelompok.nama_kelompok : '-',
        m.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif',
      ];
    });
    exportToCSV(headers, rows, 'mentees');
  };

  const openAddForm = () => {
    setForm(defaultForm);
    setEditId(null);
    setShowForm(true);
    setErrors({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Mentee</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola data mentee program mentoring Islam
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={openAddForm}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Mentee
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Users className="h-4 w-4" />
            Total Mentee
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <UserCheck className="h-4 w-4" />
            Aktif
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <UserX className="h-4 w-4" />
            Tidak Aktif
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <GraduationCap className="h-4 w-4" />
            Sudah Berkelompok
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.withGroup}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Filter & Pencarian</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Tidak Aktif</option>
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Cari</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Cari nama, NIM, prodi, atau no. HP..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {paginatedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <Users className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Tidak Ada Data Mentee</h3>
          <p className="text-sm text-gray-500 mt-1">
            {filterKelompok || filterStatus || searchQuery
              ? 'Tidak ada data yang cocok dengan filter.'
              : 'Belum ada data mentee yang terdaftar.'}
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelompok</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((m, idx) => {
                    const kelompok = kelompokList.find((k) => k.kelompok_id === m.kelompok_id);
                    return (
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
                        <td className="px-4 py-3 text-sm text-gray-600">{m.no_hp}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">
                            {kelompok ? kelompok.nama_kelompok : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={m.status} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEdit(m.mentee_id)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteId(m.mentee_id)}
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
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Menampilkan {paginatedData.length} dari {filteredData.length} mentee
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
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditId(null); setErrors({}); }}
        title={editId ? 'Edit Mentee' : 'Tambah Mentee Baru'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.nama ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Masukkan nama lengkap"
              />
              {errors.nama && <p className="text-xs text-red-500 mt-1">{errors.nama}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NIM <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.NIM}
                onChange={(e) => setForm({ ...form, NIM: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono ${
                  errors.NIM ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Masukkan NIM"
              />
              {errors.NIM && <p className="text-xs text-red-500 mt-1">{errors.NIM}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Program Studi <span className="text-red-500">*</span>
              </label>
              <select
                value={form.prodi}
                onChange={(e) => setForm({ ...form, prodi: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.prodi ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Program Studi</option>
                {PRODI_LIST.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {errors.prodi && <p className="text-xs text-red-500 mt-1">{errors.prodi}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Angkatan</label>
              <input
                type="text"
                value={form.angkatan}
                onChange={(e) => setForm({ ...form, angkatan: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Contoh: 2026"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                No. HP <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.no_hp}
                onChange={(e) => setForm({ ...form, no_hp: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.no_hp ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Masukkan no. HP"
              />
              {errors.no_hp && <p className="text-xs text-red-500 mt-1">{errors.no_hp}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kelompok <span className="text-red-500">*</span>
              </label>
              <select
                value={form.kelompok_id}
                onChange={(e) => setForm({ ...form, kelompok_id: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.kelompok_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Kelompok</option>
                {kelompokList.map((k) => (
                  <option key={k.kelompok_id} value={k.kelompok_id}>
                    {k.nama_kelompok} ({k.kode_kelompok})
                  </option>
                ))}
              </select>
              {errors.kelompok_id && <p className="text-xs text-red-500 mt-1">{errors.kelompok_id}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="ACTIVE"
                    checked={form.status === 'ACTIVE'}
                    onChange={() => setForm({ ...form, status: 'ACTIVE' })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Aktif</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="INACTIVE"
                    checked={form.status === 'INACTIVE'}
                    onChange={() => setForm({ ...form, status: 'INACTIVE' })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Tidak Aktif</span>
                </label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => { setShowForm(false); setEditId(null); setErrors({}); }}
            >
              Batal
            </Button>
            <Button onClick={handleSubmit}>
              {editId ? 'Simpan Perubahan' : 'Tambah Mentee'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Mentee"
        message="Apakah Anda yakin ingin menghapus mentee ini? Data yang dihapus tidak dapat dikembalikan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
