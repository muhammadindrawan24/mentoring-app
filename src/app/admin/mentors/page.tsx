'use client';

import { useState, useMemo } from 'react';
import { useMentorStore } from '@/lib/mentor-store';
import { useKelompokStore } from '@/lib/kelompok-store';
import { PRODI_LIST } from '@/lib/constants';
import { useToastStore } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Users,
  Search,
  Filter,
  Plus,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  BookOpen,
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

interface FormData {
  nama: string;
  NIM: string;
  prodi: string;
  email: string;
  no_hp: string;
  kelompok_id: string;
  status: 'ACTIVE' | 'INACTIVE';
}

const defaultForm: FormData = {
  nama: '',
  NIM: '',
  prodi: '',
  email: '',
  no_hp: '',
  kelompok_id: '',
  status: 'ACTIVE',
};

export default function AdminMentorsPage() {
  const { mentorList, addMentor, updateMentor, deleteMentor } = useMentorStore();
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
    let data = [...mentorList];

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
          m.email.toLowerCase().includes(q) ||
          m.no_hp.includes(q)
      );
    }

    return data;
  }, [mentorList, filterKelompok, filterStatus, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const stats = useMemo(() => {
    const total = mentorList.length;
    const active = mentorList.filter((m) => m.status === 'ACTIVE').length;
    const inactive = total - active;
    const assigned = mentorList.filter((m) => m.kelompok_id).length;
    return { total, active, inactive, assigned };
  }, [mentorList]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!form.nama.trim()) newErrors.nama = 'Nama wajib diisi';
    if (!form.NIM.trim()) newErrors.NIM = 'NIM wajib diisi';
    else if (mentorList.some((m) => m.NIM === form.NIM && m.mentor_id !== editId)) {
      newErrors.NIM = 'NIM sudah terdaftar';
    }
    if (!form.prodi) newErrors.prodi = 'Program studi wajib dipilih';
    if (!form.email.trim()) newErrors.email = 'Email wajib diisi';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Format email tidak valid';
    }
    else if (mentorList.some((m) => m.email === form.email && m.mentor_id !== editId)) {
      newErrors.email = 'Email sudah terdaftar';
    }
    if (!form.no_hp.trim()) newErrors.no_hp = 'No. HP wajib diisi';
    if (!form.kelompok_id) newErrors.kelompok_id = 'Kelompok wajib dipilih';
    else if (mentorList.some((m) => m.kelompok_id === form.kelompok_id && m.mentor_id !== editId)) {
      newErrors.kelompok_id = 'Kelompok sudah diassign ke mentor lain';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    if (editId) {
      updateMentor(editId, form);
      addToast('Data mentor berhasil diperbarui.', 'success');
    } else {
      addMentor(form);
      addToast('Mentor baru berhasil ditambahkan.', 'success');
    }

    setShowForm(false);
    setEditId(null);
    setForm(defaultForm);
    setErrors({});
  };

  const handleEdit = (mentor_id: string) => {
    const m = mentorList.find((x) => x.mentor_id === mentor_id);
    if (!m) return;
    setForm({
      nama: m.nama,
      NIM: m.NIM,
      prodi: m.prodi,
      email: m.email,
      no_hp: m.no_hp,
      kelompok_id: m.kelompok_id,
      status: m.status,
    });
    setEditId(mentor_id);
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMentor(deleteId);
    addToast('Mentor berhasil dihapus.', 'success');
    setDeleteId(null);
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
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Mentor</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola data mentor program mentoring Islam
          </p>
        </div>
        <Button onClick={openAddForm}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Mentor
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Users className="h-4 w-4" />
            Total Mentor
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
            <BookOpen className="h-4 w-4" />
            Sudah Assign Kelompok
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.assigned}</p>
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
                placeholder="Cari nama, NIM, prodi, email, atau no. HP..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {paginatedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <Users className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Tidak Ada Data Mentor</h3>
          <p className="text-sm text-gray-500 mt-1">
            {filterKelompok || filterStatus || searchQuery
              ? 'Tidak ada data yang cocok dengan filter.'
              : 'Belum ada data mentor yang terdaftar.'}
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
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
                      <tr key={m.mentor_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{m.nama}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{m.NIM}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{m.prodi}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{m.email}</td>
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
                              onClick={() => handleEdit(m.mentor_id)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteId(m.mentor_id)}
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
              Menampilkan {paginatedData.length} dari {filteredData.length} mentor
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
        title={editId ? 'Edit Mentor' : 'Tambah Mentor Baru'}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Masukkan email"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="flex gap-4 pt-2">
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
              {editId ? 'Simpan Perubahan' : 'Tambah Mentor'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Mentor"
        message="Apakah Anda yakin ingin menghapus mentor ini? Data yang dihapus tidak dapat dikembalikan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
