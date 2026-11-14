'use client';

import { useState, useMemo } from 'react';
import { useAbsensiStore } from '@/lib/absensi-store';
import { useMenteeStore } from '@/lib/mentee-store';
import { usePertemuanStore } from '@/lib/pertemuan-store';
import { useKelompokStore } from '@/lib/kelompok-store';
import { useToastStore } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { exportToCSV } from '@/lib/utils';
import { AttendanceStatus } from '@/types';
import {
  CheckSquare,
  Search,
  Plus,
  Pencil,
  Trash2,
  UserCheck,
  Clock,
  Filter,
  Download,
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

interface AbsensiFormData {
  pertemuan_id: string;
  kelompok_id: string;
  mentee_id: string;
  status: AttendanceStatus;
  keterangan: string;
}

const defaultForm: AbsensiFormData = {
  pertemuan_id: '',
  kelompok_id: '',
  mentee_id: '',
  status: 'HADIR',
  keterangan: '',
};

const STATUS_OPTIONS: { label: string; value: AttendanceStatus }[] = [
  { label: 'Hadir', value: 'HADIR' },
  { label: 'Izin', value: 'IZIN' },
  { label: 'Sakit', value: 'SAKIT' },
  { label: 'Alfa', value: 'ALFA' },
];

const STATUS_FILTER_OPTIONS: { label: string; value: AttendanceStatus | '' }[] = [
  { label: 'Semua Status', value: '' },
  { label: 'Hadir', value: 'HADIR' },
  { label: 'Izin', value: 'IZIN' },
  { label: 'Sakit', value: 'SAKIT' },
  { label: 'Alfa', value: 'ALFA' },
];

export default function AdminAbsensiPage() {
  const { absensiList, addAbsensi, updateAbsensi, deleteAbsensi } = useAbsensiStore();
  const { menteeList } = useMenteeStore();
  const { pertemuanList } = usePertemuanStore();
  const { kelompokList } = useKelompokStore();
  const { addToast } = useToastStore();

  const [filterPertemuan, setFilterPertemuan] = useState('');
  const [filterKelompok, setFilterKelompok] = useState('');
  const [filterStatus, setFilterStatus] = useState<AttendanceStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<AbsensiFormData>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof AbsensiFormData, string>>>({});

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    let data = [...absensiList];

    if (filterPertemuan) {
      data = data.filter((a) => a.pertemuan_id === filterPertemuan);
    }
    if (filterKelompok) {
      data = data.filter((a) => a.kelompok_id === filterKelompok);
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
  }, [absensiList, filterPertemuan, filterKelompok, filterStatus, searchQuery, menteeList]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const stats = useMemo(() => {
    const total = absensiList.length;
    const hadir = absensiList.filter((a) => a.status === 'HADIR').length;
    const izin = absensiList.filter((a) => a.status === 'IZIN').length;
    const sakit = absensiList.filter((a) => a.status === 'SAKIT').length;
    const alfa = absensiList.filter((a) => a.status === 'ALFA').length;
    return { total, hadir, izin, sakit, alfa };
  }, [absensiList]);

  const filteredMentees = useMemo(() => {
    if (!form.kelompok_id) return menteeList;
    return menteeList.filter((m) => m.kelompok_id === form.kelompok_id);
  }, [form.kelompok_id, menteeList]);

  const getMentee = (menteeId: string) => menteeList.find((m) => m.mentee_id === menteeId);
  const getPertemuan = (pertemuanId: string) => pertemuanList.find((p) => p.pertemuan_id === pertemuanId);
  const getKelompok = (kelompokId: string) => kelompokList.find((k) => k.kelompok_id === kelompokId);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof AbsensiFormData, string>> = {};

    if (!form.pertemuan_id) newErrors.pertemuan_id = 'Pertemuan wajib dipilih';
    if (!form.kelompok_id) newErrors.kelompok_id = 'Kelompok wajib dipilih';
    if (!form.mentee_id) newErrors.mentee_id = 'Mentee wajib dipilih';
    if (!form.status) newErrors.status = 'Status wajib dipilih';

    if (form.pertemuan_id && form.kelompok_id && form.mentee_id && !editId) {
      const exists = absensiList.some(
        (a) =>
          a.pertemuan_id === form.pertemuan_id &&
          a.kelompok_id === form.kelompok_id &&
          a.mentee_id === form.mentee_id
      );
      if (exists) {
        newErrors.mentee_id = 'Absensi untuk mentee ini di pertemuan ini sudah ada';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const now = new Date();
    const tanggal = now.toISOString().split('T')[0];
    const waktu = now.toISOString();

    if (editId) {
      updateAbsensi(editId, {
        pertemuan_id: form.pertemuan_id,
        kelompok_id: form.kelompok_id,
        mentee_id: form.mentee_id,
        status: form.status,
        keterangan: form.keterangan,
      });
      addToast('Data absensi berhasil diperbarui.', 'success');
    } else {
      const mentee = getMentee(form.mentee_id);
      const kelompok = getKelompok(form.kelompok_id);
      addAbsensi({
        pertemuan_id: form.pertemuan_id,
        kelompok_id: form.kelompok_id,
        mentee_id: form.mentee_id,
        mentor_id: kelompok?.mentor_id || '',
        status: form.status,
        keterangan: form.keterangan,
        bukti_izin_url: '',
        bukti_izin_file_id: '',
        waktu_input: waktu,
        tanggal_input: tanggal,
        status_verifikasi: form.status === 'IZIN' ? 'MENUNGGU' : 'DISETUJUI',
      });
      addToast('Absensi baru berhasil ditambahkan.', 'success');
    }

    setShowForm(false);
    setEditId(null);
    setForm(defaultForm);
    setErrors({});
  };

  const handleEdit = (absensiId: string) => {
    const a = absensiList.find((x) => x.absensi_id === absensiId);
    if (!a) return;
    setForm({
      pertemuan_id: a.pertemuan_id,
      kelompok_id: a.kelompok_id,
      mentee_id: a.mentee_id,
      status: a.status,
      keterangan: a.keterangan,
    });
    setEditId(absensiId);
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteAbsensi(deleteId);
    addToast('Data absensi berhasil dihapus.', 'success');
    setDeleteId(null);

    const newTotal = Math.ceil((filteredData.length - 1) / ITEMS_PER_PAGE);
    if (currentPage > newTotal && newTotal > 0) {
      setCurrentPage(newTotal);
    }
  };

  const handleExportCSV = () => {
    const headers = ['No', 'Pertemuan', 'Mentee', 'NIM', 'Kelompok', 'Status', 'Keterangan', 'Tanggal'];
    const rows = filteredData.map((a, idx) => {
      const mentee = getMentee(a.mentee_id);
      const pertemuan = getPertemuan(a.pertemuan_id);
      const kelompok = getKelompok(a.kelompok_id);
      return [
        idx + 1,
        pertemuan ? `Pertemuan ${pertemuan.pertemuan_ke}` : a.pertemuan_id,
        mentee ? mentee.nama : a.mentee_id,
        mentee ? mentee.NIM : '-',
        kelompok ? kelompok.nama_kelompok : '-',
        a.status,
        a.keterangan || '-',
        a.tanggal_input,
      ];
    });
    exportToCSV(headers, rows, 'absensi');
  };

  const openAddForm = () => {
    setForm(defaultForm);
    setEditId(null);
    setShowForm(true);
    setErrors({});
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Absensi</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola data kehadiran mentee program mentoring
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={openAddForm}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Absensi
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <CheckSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Absensi</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-100 rounded-lg">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Hadir</p>
              <p className="text-2xl font-bold text-green-600">{stats.hadir}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Izin</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.izin}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-100 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Sakit</p>
              <p className="text-2xl font-bold text-orange-600">{stats.sakit}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 rounded-lg">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Alfa</p>
              <p className="text-2xl font-bold text-red-600">{stats.alfa}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Filter & Pencarian</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                  Pertemuan {p.pertemuan_ke} - {p.judul}
                </option>
              ))}
            </select>
          </div>
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
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as AttendanceStatus | '');
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
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
                placeholder="Cari nama atau NIM mentee..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {paginatedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <CheckSquare className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Tidak Ada Data Absensi</h3>
          <p className="text-sm text-gray-500 mt-1">
            {filterPertemuan || filterKelompok || filterStatus || searchQuery
              ? 'Tidak ada data yang cocok dengan filter.'
              : 'Belum ada data absensi yang tercatat.'}
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mentee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelompok</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Input</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((a, idx) => {
                    const mentee = getMentee(a.mentee_id);
                    const pertemuan = getPertemuan(a.pertemuan_id);
                    const kelompok = getKelompok(a.kelompok_id);
                    return (
                      <tr key={a.absensi_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">
                            {pertemuan ? `Pertemuan ${pertemuan.pertemuan_ke}` : a.pertemuan_id}
                          </p>
                          <p className="text-xs text-gray-500">
                            {pertemuan ? pertemuan.judul : '-'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">
                            {mentee ? mentee.nama : a.mentee_id}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            {mentee ? mentee.NIM : '-'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">
                            {kelompok ? kelompok.nama_kelompok : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={a.status} />
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-600 max-w-[200px] truncate">
                            {a.keterangan || '-'}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(a.tanggal_input)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEdit(a.absensi_id)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteId(a.absensi_id)}
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
              Menampilkan {paginatedData.length} dari {filteredData.length} data absensi
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
          setForm(defaultForm);
          setErrors({});
        }}
        title={editId ? 'Edit Absensi' : 'Tambah Absensi Baru'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              {errors.pertemuan_id && (
                <p className="text-xs text-red-500 mt-1">{errors.pertemuan_id}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kelompok <span className="text-red-500">*</span>
              </label>
              <select
                value={form.kelompok_id}
                onChange={(e) =>
                  setForm({ ...form, kelompok_id: e.target.value, mentee_id: '' })
                }
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
              {errors.kelompok_id && (
                <p className="text-xs text-red-500 mt-1">{errors.kelompok_id}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mentee <span className="text-red-500">*</span>
              </label>
              <select
                value={form.mentee_id}
                onChange={(e) => setForm({ ...form, mentee_id: e.target.value })}
                disabled={!form.kelompok_id}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.mentee_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">
                  {form.kelompok_id
                    ? filteredMentees.length === 0
                      ? 'Tidak ada mentee di kelompok ini'
                      : 'Pilih Mentee'
                    : 'Pilih kelompok terlebih dahulu'}
                </option>
                {filteredMentees.map((m) => (
                  <option key={m.mentee_id} value={m.mentee_id}>
                    {m.nama} ({m.NIM})
                  </option>
                ))}
              </select>
              {errors.mentee_id && (
                <p className="text-xs text-red-500 mt-1">{errors.mentee_id}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Kehadiran <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-4">
              {STATUS_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="absensi-status"
                    value={opt.value}
                    checked={form.status === opt.value}
                    onChange={() => setForm({ ...form, status: opt.value })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.status && (
              <p className="text-xs text-red-500 mt-1">{errors.status}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keterangan
            </label>
            <textarea
              value={form.keterangan}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Masukkan keterangan (opsional)"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setEditId(null);
                setForm(defaultForm);
                setErrors({});
              }}
            >
              Batal
            </Button>
            <Button onClick={handleSubmit}>
              {editId ? 'Simpan Perubahan' : 'Tambah Absensi'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Absensi"
        message="Apakah Anda yakin ingin menghapus data absensi ini? Data yang dihapus tidak dapat dikembalikan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
