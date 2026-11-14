'use client';

import { useState, useMemo } from 'react';
import { usePengumumanStore } from '@/lib/pengumuman-store';
import { useMentorStore } from '@/lib/mentor-store';
import { useKelompokStore } from '@/lib/kelompok-store';
import { useAuthStore } from '@/lib/auth-store';
import { useToastStore } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { Megaphone, Search, Plus, Pencil, Trash2, Bell, Users, AlertCircle } from 'lucide-react';
import { AnnouncementTarget, Status } from '@/types';

const ITEMS_PER_PAGE = 10;

interface FormData {
  judul: string;
  isi: string;
  target: AnnouncementTarget;
  target_ids: string;
  status: Status;
}

const defaultForm: FormData = {
  judul: '',
  isi: '',
  target: 'SEMUA_MENTOR',
  target_ids: '',
  status: 'ACTIVE',
};

export default function AdminPengumumanPage() {
  const { pengumumanList, addPengumuman, updatePengumuman, deletePengumuman } = usePengumumanStore();
  const { mentorList } = useMentorStore();
  const { kelompokList } = useKelompokStore();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const [filterTarget, setFilterTarget] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [selectedKelompokIds, setSelectedKelompokIds] = useState<string[]>([]);
  const [selectedMentorId, setSelectedMentorId] = useState('');

  const filteredData = useMemo(() => {
    let data = [...pengumumanList];

    if (filterTarget) {
      data = data.filter((p) => p.target === filterTarget);
    }
    if (filterStatus) {
      data = data.filter((p) => p.status === filterStatus);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (p) =>
          p.judul.toLowerCase().includes(q) ||
          p.isi.toLowerCase().includes(q)
      );
    }

    return data.sort(
      (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );
  }, [pengumumanList, filterTarget, filterStatus, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const stats = useMemo(() => {
    const total = pengumumanList.length;
    const active = pengumumanList.filter((p) => p.status === 'ACTIVE').length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [pengumumanList]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!form.judul.trim()) newErrors.judul = 'Judul wajib diisi';
    if (!form.isi.trim()) newErrors.isi = 'Isi pengumuman wajib diisi';

    if (form.target === 'MENTOR_TERTENTU' && !selectedMentorId) {
      newErrors.target_ids = 'Pilih minimal satu mentor';
    }
    if (form.target === 'KELOMPOK_TERTENTU' && selectedKelompokIds.length === 0) {
      newErrors.target_ids = 'Pilih minimal satu kelompok';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    let targetIds = '';
    if (form.target === 'MENTOR_TERTENTU') {
      targetIds = selectedMentorId;
    } else if (form.target === 'KELOMPOK_TERTENTU') {
      targetIds = selectedKelompokIds.join(',');
    }

    const payload = {
      ...form,
      target_ids: targetIds,
      published_at: new Date().toISOString(),
      created_by: user?.user_id || '',
    };

    if (editId) {
      updatePengumuman(editId, payload);
      addToast('Pengumuman berhasil diperbarui.', 'success');
    } else {
      addPengumuman(payload);
      addToast('Pengumuman baru berhasil ditambahkan.', 'success');
    }

    setShowForm(false);
    setEditId(null);
    setForm(defaultForm);
    setErrors({});
    setSelectedKelompokIds([]);
    setSelectedMentorId('');
  };

  const handleEdit = (id: string) => {
    const p = pengumumanList.find((x) => x.pengumuman_id === id);
    if (!p) return;

    setForm({
      judul: p.judul,
      isi: p.isi,
      target: p.target,
      target_ids: p.target_ids,
      status: p.status,
    });

    if (p.target === 'MENTOR_TERTENTU') {
      setSelectedMentorId(p.target_ids);
    } else if (p.target === 'KELOMPOK_TERTENTU') {
      setSelectedKelompokIds(p.target_ids.split(',').map((id) => id.trim()));
    } else {
      setSelectedMentorId('');
      setSelectedKelompokIds([]);
    }

    setEditId(id);
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deletePengumuman(deleteId);
    addToast('Pengumuman berhasil dihapus.', 'success');
    setDeleteId(null);
  };

  const openAddForm = () => {
    setForm(defaultForm);
    setEditId(null);
    setShowForm(true);
    setErrors({});
    setSelectedKelompokIds([]);
    setSelectedMentorId('');
  };

  const getTargetLabel = (target: AnnouncementTarget) => {
    switch (target) {
      case 'SEMUA_MENTOR': return 'Semua Mentor';
      case 'MENTOR_TERTENTU': return 'Mentor Tertentu';
      case 'KELOMPOK_TERTENTU': return 'Kelompok Tertentu';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleKelompok = (kid: string) => {
    setSelectedKelompokIds((prev) =>
      prev.includes(kid) ? prev.filter((id) => id !== kid) : [...prev, kid]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Pengumuman</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola pengumuman untuk mentor program mentoring Islam
          </p>
        </div>
        <Button onClick={openAddForm}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Pengumuman
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Megaphone className="h-4 w-4" />
            Total Pengumuman
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Bell className="h-4 w-4" />
            Aktif
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <AlertCircle className="h-4 w-4" />
            Nonaktif
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Filter & Pencarian</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Target</label>
            <select
              value={filterTarget}
              onChange={(e) => { setFilterTarget(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua Target</option>
              <option value="SEMUA_MENTOR">Semua Mentor</option>
              <option value="MENTOR_TERTENTU">Mentor Tertentu</option>
              <option value="KELOMPOK_TERTENTU">Kelompok Tertentu</option>
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
              <option value="INACTIVE">Nonaktif</option>
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
                placeholder="Cari judul atau isi pengumuman..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {paginatedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <Megaphone className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Tidak Ada Data Pengumuman</h3>
          <p className="text-sm text-gray-500 mt-1">
            {filterTarget || filterStatus || searchQuery
              ? 'Tidak ada data yang cocok dengan filter.'
              : 'Belum ada pengumuman yang dibuat.'}
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Judul</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Published At</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((p, idx) => (
                    <tr key={p.pengumuman_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{p.judul}</p>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-xs">
                          {p.isi}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          {getTargetLabel(p.target)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(p.published_at)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(p.pengumuman_id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(p.pengumuman_id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditId(null);
          setErrors({});
          setSelectedKelompokIds([]);
          setSelectedMentorId('');
        }}
        title={editId ? 'Edit Pengumuman' : 'Tambah Pengumuman Baru'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Judul <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.judul}
              onChange={(e) => setForm({ ...form, judul: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.judul ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Masukkan judul pengumuman"
            />
            {errors.judul && <p className="text-xs text-red-500 mt-1">{errors.judul}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Isi Pengumuman <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.isi}
              onChange={(e) => setForm({ ...form, isi: e.target.value })}
              rows={5}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                errors.isi ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Masukkan isi pengumuman"
            />
            {errors.isi && <p className="text-xs text-red-500 mt-1">{errors.isi}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="target"
                  value="SEMUA_MENTOR"
                  checked={form.target === 'SEMUA_MENTOR'}
                  onChange={() => setForm({ ...form, target: 'SEMUA_MENTOR' })}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Semua Mentor</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="target"
                  value="MENTOR_TERTENTU"
                  checked={form.target === 'MENTOR_TERTENTU'}
                  onChange={() => setForm({ ...form, target: 'MENTOR_TERTENTU' })}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Mentor Tertentu</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="target"
                  value="KELOMPOK_TERTENTU"
                  checked={form.target === 'KELOMPOK_TERTENTU'}
                  onChange={() => setForm({ ...form, target: 'KELOMPOK_TERTENTU' })}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Kelompok Tertentu</span>
              </label>
            </div>
          </div>

          {form.target === 'MENTOR_TERTENTU' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pilih Mentor <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedMentorId}
                onChange={(e) => setSelectedMentorId(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.target_ids ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Mentor</option>
                {mentorList
                  .filter((m) => m.status === 'ACTIVE')
                  .map((m) => (
                    <option key={m.mentor_id} value={m.mentor_id}>
                      {m.nama} ({m.prodi})
                    </option>
                  ))}
              </select>
              {errors.target_ids && <p className="text-xs text-red-500 mt-1">{errors.target_ids}</p>}
            </div>
          )}

          {form.target === 'KELOMPOK_TERTENTU' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pilih Kelompok <span className="text-red-500">*</span>
              </label>
              <div className={`border rounded-lg p-3 max-h-48 overflow-y-auto ${
                errors.target_ids ? 'border-red-500' : 'border-gray-300'
              }`}>
                {kelompokList
                  .filter((k) => k.status === 'ACTIVE')
                  .map((k) => (
                    <label
                      key={k.kelompok_id}
                      className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedKelompokIds.includes(k.kelompok_id)}
                        onChange={() => toggleKelompok(k.kelompok_id)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {k.nama_kelompok} ({k.kode_kelompok})
                      </span>
                    </label>
                  ))}
              </div>
              {errors.target_ids && <p className="text-xs text-red-500 mt-1">{errors.target_ids}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div className="flex gap-4 pt-1">
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
                <span className="text-sm text-gray-700">Nonaktif</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setEditId(null);
                setErrors({});
                setSelectedKelompokIds([]);
                setSelectedMentorId('');
              }}
            >
              Batal
            </Button>
            <Button onClick={handleSubmit}>
              {editId ? 'Simpan Perubahan' : 'Tambah Pengumuman'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Pengumuman"
        message="Apakah Anda yakin ingin menghapus pengumuman ini? Data yang dihapus tidak dapat dikembalikan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
