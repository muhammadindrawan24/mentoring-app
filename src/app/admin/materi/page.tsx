'use client';

import { useState, useMemo } from 'react';
import { useMateriStore } from '@/lib/materi-store';
import { usePertemuanStore } from '@/lib/pertemuan-store';
import { useAuthStore } from '@/lib/auth-store';
import { useToastStore } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Pagination } from '@/components/ui/pagination';
import { FileType } from '@/types';
import {
  BookOpen,
  Search,
  Plus,
  Pencil,
  Trash2,
  FileText,
  File,
  Film,
  Link2,
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const FILE_TYPE_OPTIONS: FileType[] = ['PDF', 'PPT', 'DOC', 'XLS', 'VIDEO', 'LINK'];

const FILE_TYPE_COLORS: Record<FileType, { bg: string; text: string }> = {
  PDF: { bg: 'bg-red-100', text: 'text-red-700' },
  PPT: { bg: 'bg-orange-100', text: 'text-orange-700' },
  DOC: { bg: 'bg-blue-100', text: 'text-blue-700' },
  XLS: { bg: 'bg-green-100', text: 'text-green-700' },
  VIDEO: { bg: 'bg-purple-100', text: 'text-purple-700' },
  LINK: { bg: 'bg-teal-100', text: 'text-teal-700' },
};

const FILE_TYPE_ICONS: Record<FileType, React.ReactNode> = {
  PDF: <FileText className="h-3.5 w-3.5" />,
  PPT: <FileText className="h-3.5 w-3.5" />,
  DOC: <File className="h-3.5 w-3.5" />,
  XLS: <File className="h-3.5 w-3.5" />,
  VIDEO: <Film className="h-3.5 w-3.5" />,
  LINK: <Link2 className="h-3.5 w-3.5" />,
};

interface FormData {
  pertemuan_id: string;
  judul: string;
  deskripsi: string;
  jenis_file: FileType;
  file_url: string;
}

const defaultForm: FormData = {
  pertemuan_id: '',
  judul: '',
  deskripsi: '',
  jenis_file: 'PDF',
  file_url: '',
};

export default function AdminMateriPage() {
  const { materiList, addMateri, updateMateri, deleteMateri } = useMateriStore();
  const { pertemuanList } = usePertemuanStore();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const [filterPertemuan, setFilterPertemuan] = useState('');
  const [filterFileType, setFilterFileType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    let data = [...materiList];

    if (filterPertemuan) {
      data = data.filter((m) => m.pertemuan_id === filterPertemuan);
    }
    if (filterFileType) {
      data = data.filter((m) => m.jenis_file === filterFileType);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (m) =>
          m.judul.toLowerCase().includes(q) ||
          m.deskripsi.toLowerCase().includes(q)
      );
    }

    return data;
  }, [materiList, filterPertemuan, filterFileType, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const stats = useMemo(() => {
    const total = materiList.length;
    const pdf = materiList.filter((m) => m.jenis_file === 'PDF').length;
    const ppt = materiList.filter((m) => m.jenis_file === 'PPT').length;
    const other = materiList.filter((m) => !['PDF', 'PPT'].includes(m.jenis_file)).length;
    return { total, pdf, ppt, other };
  }, [materiList]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!form.pertemuan_id) newErrors.pertemuan_id = 'Pertemuan wajib dipilih';
    if (!form.judul.trim()) newErrors.judul = 'Judul wajib diisi';
    if (!form.deskripsi.trim()) newErrors.deskripsi = 'Deskripsi wajib diisi';
    if (!form.jenis_file) newErrors.jenis_file = 'Jenis file wajib dipilih';
    if (!form.file_url.trim()) newErrors.file_url = 'File URL wajib diisi';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    if (editId) {
      updateMateri(editId, {
        pertemuan_id: form.pertemuan_id,
        judul: form.judul,
        deskripsi: form.deskripsi,
        jenis_file: form.jenis_file,
        file_url: form.file_url,
      });
      addToast('Materi berhasil diperbarui.', 'success');
    } else {
      addMateri({
        pertemuan_id: form.pertemuan_id,
        judul: form.judul,
        deskripsi: form.deskripsi,
        file_id: `FILE${Date.now()}`,
        file_url: form.file_url,
        jenis_file: form.jenis_file,
        uploaded_by: user?.user_id || '',
      });
      addToast('Materi baru berhasil ditambahkan.', 'success');
    }

    setShowForm(false);
    setEditId(null);
    setForm(defaultForm);
    setErrors({});
  };

  const handleEdit = (materi_id: string) => {
    const m = materiList.find((x) => x.materi_id === materi_id);
    if (!m) return;
    setForm({
      pertemuan_id: m.pertemuan_id,
      judul: m.judul,
      deskripsi: m.deskripsi,
      jenis_file: m.jenis_file,
      file_url: m.file_url,
    });
    setEditId(materi_id);
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMateri(deleteId);
    addToast('Materi berhasil dihapus.', 'success');
    setDeleteId(null);
  };

  const openAddForm = () => {
    setForm(defaultForm);
    setEditId(null);
    setShowForm(true);
    setErrors({});
  };

  const getPertemuanLabel = (pertemuanId: string) => {
    const p = pertemuanList.find((x) => x.pertemuan_id === pertemuanId);
    if (!p) return '-';
    return `Pertemuan ${p.pertemuan_ke} - ${p.judul}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Materi</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola materi pembelajaran program mentoring Islam
          </p>
        </div>
        <Button onClick={openAddForm}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Materi
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <BookOpen className="h-4 w-4" />
            Total Materi
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <FileText className="h-4 w-4" />
            PDF
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.pdf}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <FileText className="h-4 w-4" />
            PPT
          </div>
          <p className="text-2xl font-bold text-orange-600">{stats.ppt}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Film className="h-4 w-4" />
            Video / Lainnya
          </div>
          <p className="text-2xl font-bold text-purple-600">{stats.other}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-5 w-5 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Filter & Pencarian</h2>
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
                  Pertemuan {p.pertemuan_ke} - {p.judul}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Jenis File</label>
            <select
              value={filterFileType}
              onChange={(e) => { setFilterFileType(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua Jenis File</option>
              {FILE_TYPE_OPTIONS.map((ft) => (
                <option key={ft} value={ft}>{ft}</option>
              ))}
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
                placeholder="Cari judul atau deskripsi materi..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {paginatedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <BookOpen className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Tidak Ada Data Materi</h3>
          <p className="text-sm text-gray-500 mt-1">
            {filterPertemuan || filterFileType || searchQuery
              ? 'Tidak ada data yang cocok dengan filter.'
              : 'Belum ada materi yang diunggah.'}
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pertemuan</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Judul</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Jenis File</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded At</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((m, idx) => {
                    const colors = FILE_TYPE_COLORS[m.jenis_file];
                    return (
                      <tr key={m.materi_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">
                            {getPertemuanLabel(m.pertemuan_id)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{m.judul}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-600 max-w-xs truncate">{m.deskripsi}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
                          >
                            {FILE_TYPE_ICONS[m.jenis_file]}
                            {m.jenis_file}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(m.uploaded_at)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEdit(m.materi_id)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteId(m.materi_id)}
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
              Menampilkan {paginatedData.length} dari {filteredData.length} materi
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
        title={editId ? 'Edit Materi' : 'Tambah Materi Baru'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pertemuan <span className="text-red-500">*</span>
            </label>
            <select
              value={form.pertemuan_id}
              onChange={(e) => setForm({ ...form, pertemuan_id: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.pertemuan_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Pilih Pertemuan</option>
              {pertemuanList.map((p) => (
                <option key={p.pertemuan_id} value={p.pertemuan_id}>
                  Pertemuan {p.pertemuan_ke} - {p.judul}
                </option>
              ))}
            </select>
            {errors.pertemuan_id && <p className="text-xs text-red-500 mt-1">{errors.pertemuan_id}</p>}
          </div>

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
              placeholder="Masukkan judul materi"
            />
            {errors.judul && <p className="text-xs text-red-500 mt-1">{errors.judul}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                errors.deskripsi ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Masukkan deskripsi materi"
            />
            {errors.deskripsi && <p className="text-xs text-red-500 mt-1">{errors.deskripsi}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jenis File <span className="text-red-500">*</span>
              </label>
              <select
                value={form.jenis_file}
                onChange={(e) => setForm({ ...form, jenis_file: e.target.value as FileType })}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.jenis_file ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {FILE_TYPE_OPTIONS.map((ft) => (
                  <option key={ft} value={ft}>{ft}</option>
                ))}
              </select>
              {errors.jenis_file && <p className="text-xs text-red-500 mt-1">{errors.jenis_file}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.file_url}
                onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.file_url ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://example.com/file.pdf"
              />
              {errors.file_url && <p className="text-xs text-red-500 mt-1">{errors.file_url}</p>}
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
              {editId ? 'Simpan Perubahan' : 'Tambah Materi'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Materi"
        message="Apakah Anda yakin ingin menghapus materi ini? Data yang dihapus tidak dapat dikembalikan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
