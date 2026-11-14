'use client';

import { useState, useMemo, useRef } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useMenteeStore } from '@/lib/mentee-store';
import { useMentorStore } from '@/lib/mentor-store';
import { useKelompokStore } from '@/lib/kelompok-store';
import { useToastStore } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { exportAllToExcel, importFromExcel, EXCEL_SHEET_NAMES } from '@/lib/excel';
import { clearAllSheets } from '@/lib/local-db';
import {
  Settings,
  User,
  Mail,
  Lock,
  Save,
  RotateCcw,
  Download,
  Upload,
  FileSpreadsheet,
  Activity,
  Building2,
  GraduationCap,
  Users,
  Eye,
  EyeOff,
  Pencil,
} from 'lucide-react';

const EXCEL_SHEET_LABEL = EXCEL_SHEET_NAMES.join(', ');

export default function PengaturanPage() {
  const { user } = useAuthStore();
  const { menteeList } = useMenteeStore();
  const { mentorList } = useMentorStore();
  const { kelompokList } = useKelompokStore();
  const addToast = useToastStore((s) => s.addToast);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nama: user?.nama || '',
    email: user?.email || '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [pendingImport, setPendingImport] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => ({
    totalUsers: mentorList.length + 1,
    totalMentee: menteeList.length,
    totalMentor: mentorList.length,
    totalKelompok: kelompokList.length,
  }), [menteeList, mentorList, kelompokList]);

  const handleEdit = () => {
    setFormData({
      nama: user?.nama || '',
      email: user?.email || '',
      password: '',
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    setFormData((prev) => ({ ...prev, password: '' }));
    addToast('Profil berhasil diperbarui', 'success');
  };

  const handleCancel = () => {
    setFormData({
      nama: user?.nama || '',
      email: user?.email || '',
      password: '',
    });
    setIsEditing(false);
  };

  const handleResetData = () => {
    clearAllSheets();
    setShowResetConfirm(false);
    addToast('Data berhasil direset. Memuat ulang halaman...', 'info');
    setTimeout(() => window.location.reload(), 600);
  };

  const handleExport = () => {
    try {
      exportAllToExcel();
      addToast('File Excel berhasil diunduh.', 'success');
    } catch {
      addToast('Gagal membuat file Excel.', 'error');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPendingImport(file);
  };

  const handleImport = async () => {
    if (!pendingImport) return;
    setIsImporting(true);
    try {
      const result = await importFromExcel(pendingImport);
      addToast(
        `${result.rows} baris dari ${result.sheets.length} sheet berhasil diimpor.`,
        'success'
      );
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Gagal mengimpor file Excel.',
        'error'
      );
    } finally {
      setIsImporting(false);
      setPendingImport(null);
    }
  };

  const handleLogAktivitas = () => {
    addToast('Log aktivitas sedang dimuat', 'info');
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Settings className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
            <p className="text-sm text-gray-500 mt-0.5">Kelola profil dan pengaturan aplikasi</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Profil Admin</h2>
          </div>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Pencil className="h-4 w-4 mr-1.5" />
              Edit
            </Button>
          )}
        </div>

        {!isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Nama</p>
                <p className="text-sm font-medium text-gray-900">{user?.nama || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">{user?.email || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Lock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Password</p>
                <p className="text-sm font-medium text-gray-900">••••••••</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Settings className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Role</p>
                <p className="text-sm font-medium text-gray-900">{user?.role || '-'}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
              <input
                type="text"
                value={formData.nama}
                onChange={(e) => setFormData((prev) => ({ ...prev, nama: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password Baru <span className="text-gray-400 font-normal">(opsional)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Masukkan password baru"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-1.5" />
                Simpan
              </Button>
              <Button variant="secondary" size="sm" onClick={handleCancel}>
                Batal
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-50 rounded-lg">
            <Building2 className="h-5 w-5 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Informasi Aplikasi</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Nama Aplikasi</p>
            <p className="text-sm font-medium text-gray-900">SIM Mentoring Islam</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Versi</p>
            <p className="text-sm font-medium text-gray-900">1.0.0</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Tahun Akademik</p>
            <p className="text-sm font-medium text-gray-900">2026/2027</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Jumlah Kelompok</p>
            <p className="text-sm font-medium text-gray-900">{stats.totalKelompok} kelompok</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Jumlah Mentee</p>
            <p className="text-sm font-medium text-gray-900">{stats.totalMentee} mentee</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Jumlah Mentor</p>
            <p className="text-sm font-medium text-gray-900">{stats.totalMentor} mentor</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Activity className="h-5 w-5 text-purple-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Statistik Sistem</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-xl text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
            <p className="text-xs text-gray-500 mt-1">Total Users</p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl text-center">
            <p className="text-2xl font-bold text-green-600">{stats.totalMentee}</p>
            <p className="text-xs text-gray-500 mt-1">Total Mentee</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.totalMentor}</p>
            <p className="text-xs text-gray-500 mt-1">Total Mentor</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.totalKelompok}</p>
            <p className="text-xs text-gray-500 mt-1">Total Kelompok</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Data &amp; Backup Excel</h2>
            <p className="text-sm text-gray-500">
              Data tersimpan di browser ini. Unduh file .xlsx untuk backup, atau impor untuk restore.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="md" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1.5" />
            Export ke Excel
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-1.5" />
            Import dari Excel
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Satu file berisi 12 sheet: {EXCEL_SHEET_LABEL}. Import akan mengganti data pada sheet yang ada di file.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-50 rounded-lg">
            <Settings className="h-5 w-5 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Aksi Cepat</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="danger" size="md" onClick={() => setShowResetConfirm(true)}>
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Reset Data
          </Button>
          <Button variant="outline" size="md" onClick={handleLogAktivitas}>
            <Activity className="h-4 w-4 mr-1.5" />
            Lihat Log Aktivitas
          </Button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetData}
        title="Reset Data"
        message="Apakah Anda yakin ingin mereset semua data? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Reset"
        cancelText="Batal"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={Boolean(pendingImport)}
        onClose={() => setPendingImport(null)}
        onConfirm={handleImport}
        title="Import Data Excel"
        message={`Import file "${pendingImport?.name ?? ''}"? Data pada sheet yang ada di file akan diganti.`}
        confirmText={isImporting ? 'Mengimpor...' : 'Ya, Import'}
        cancelText="Batal"
        variant="warning"
      />
    </div>
  );
}
