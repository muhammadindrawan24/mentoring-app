'use client'

import { useState, useMemo } from 'react'
import { Calendar, Search, Plus, Pencil, Trash2, Clock, PlayCircle, CheckCircle } from 'lucide-react'
import { usePertemuanStore } from '@/lib/pertemuan-store'
import { useToastStore } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Pagination } from '@/components/ui/pagination'
import { StatusBadge } from '@/components/ui/status-badge'
import { MeetingStatus } from '@/types'

const ITEMS_PER_PAGE = 10

interface PertemuanForm {
  pertemuan_ke: string
  judul: string
  tema: string
  deskripsi: string
  tanggal: string
  jam_mulai: string
  jam_selesai: string
  status: MeetingStatus
}

const initialForm: PertemuanForm = {
  pertemuan_ke: '',
  judul: '',
  tema: '',
  deskripsi: '',
  tanggal: '',
  jam_mulai: '',
  jam_selesai: '',
  status: 'DRAFT',
}

const statusOptions: { label: string; value: MeetingStatus | 'SEMUA' }[] = [
  { label: 'Semua', value: 'SEMUA' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Upcoming', value: 'UPCOMING' },
  { label: 'Ongoing', value: 'ONGOING' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
]

const statusColors: Record<MeetingStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  UPCOMING: 'bg-blue-100 text-blue-700',
  ONGOING: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

export default function AdminPertemuanPage() {
  const { pertemuanList, addPertemuan, updatePertemuan, deletePertemuan } = usePertemuanStore()
  const { addToast } = useToastStore()

  const [statusFilter, setStatusFilter] = useState<MeetingStatus | 'SEMUA'>('SEMUA')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PertemuanForm>(initialForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const generateId = (): string => {
    const maxNum = pertemuanList.reduce((max, p) => {
      const num = parseInt(p.pertemuan_id.replace('P', ''), 10)
      return num > max ? num : max
    }, 0)
    return `P${String(maxNum + 1).padStart(3, '0')}`
  }

  const filtered = useMemo(() => {
    let result = [...pertemuanList]

    if (statusFilter !== 'SEMUA') {
      result = result.filter((p) => p.status === statusFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.judul.toLowerCase().includes(q) ||
          p.tema.toLowerCase().includes(q)
      )
    }

    result.sort((a, b) => a.pertemuan_ke - b.pertemuan_ke)

    return result
  }, [pertemuanList, statusFilter, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const stats = useMemo(() => {
    const total = pertemuanList.length
    const upcoming = pertemuanList.filter((p) => p.status === 'UPCOMING').length
    const ongoing = pertemuanList.filter((p) => p.status === 'ONGOING').length
    const completed = pertemuanList.filter((p) => p.status === 'COMPLETED').length
    return { total, upcoming, ongoing, completed }
  }, [pertemuanList])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const validate = (): boolean => {
    const errors: Record<string, string> = {}

    if (!form.pertemuan_ke.trim()) {
      errors.pertemuan_ke = 'Pertemuan ke harus diisi'
    } else if (
      !editingId &&
      pertemuanList.some((p) => p.pertemuan_ke === parseInt(form.pertemuan_ke))
    ) {
      errors.pertemuan_ke = 'Nomor pertemuan sudah ada'
    }

    if (!form.judul.trim()) errors.judul = 'Judul harus diisi'
    if (!form.tema.trim()) errors.tema = 'Tema harus diisi'
    if (!form.tanggal.trim()) errors.tanggal = 'Tanggal harus diisi'
    if (!form.jam_mulai.trim()) errors.jam_mulai = 'Jam mulai harus diisi'
    if (!form.jam_selesai.trim()) errors.jam_selesai = 'Jam selesai harus diisi'

    if (form.jam_mulai && form.jam_selesai && form.jam_mulai >= form.jam_selesai) {
      errors.jam_selesai = 'Jam selesai harus setelah jam mulai'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleOpenAdd = () => {
    setEditingId(null)
    setForm({ ...initialForm })
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleOpenEdit = (pertemuanId: string) => {
    const p = pertemuanList.find((item) => item.pertemuan_id === pertemuanId)
    if (!p) return

    setEditingId(pertemuanId)
    setForm({
      pertemuan_ke: String(p.pertemuan_ke),
      judul: p.judul,
      tema: p.tema,
      deskripsi: p.deskripsi,
      tanggal: p.tanggal,
      jam_mulai: p.jam_mulai,
      jam_selesai: p.jam_selesai,
      status: p.status,
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleSubmit = () => {
    if (!validate()) return

    const now = new Date().toISOString()

    if (editingId) {
      updatePertemuan(editingId, {
        pertemuan_ke: parseInt(form.pertemuan_ke),
        judul: form.judul.trim(),
        tema: form.tema.trim(),
        deskripsi: form.deskripsi.trim(),
        tanggal: form.tanggal,
        jam_mulai: form.jam_mulai,
        jam_selesai: form.jam_selesai,
        status: form.status,
      })
      addToast('Pertemuan berhasil diperbarui', 'success')
    } else {
      addPertemuan({
        pertemuan_ke: parseInt(form.pertemuan_ke),
        judul: form.judul.trim(),
        tema: form.tema.trim(),
        deskripsi: form.deskripsi.trim(),
        tanggal: form.tanggal,
        jam_mulai: form.jam_mulai,
        jam_selesai: form.jam_selesai,
        status: form.status,
      })
      addToast('Pertemuan berhasil ditambahkan', 'success')
    }

    setIsModalOpen(false)
    setEditingId(null)
    setForm(initialForm)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deletePertemuan(deleteTarget)
    addToast('Pertemuan berhasil dihapus', 'success')
    setIsDeleteOpen(false)
    setDeleteTarget(null)

    const newTotal = Math.ceil((filtered.length - 1) / ITEMS_PER_PAGE)
    if (currentPage > newTotal && newTotal > 0) {
      setCurrentPage(newTotal)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const getStatusIcon = (status: MeetingStatus) => {
    switch (status) {
      case 'ONGOING':
        return <PlayCircle className="w-3 h-3 mr-1" />
      case 'COMPLETED':
        return <CheckCircle className="w-3 h-3 mr-1" />
      case 'UPCOMING':
        return <Clock className="w-3 h-3 mr-1" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Pertemuan</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola data pertemuan mentoring</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Pertemuan</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 rounded-lg">
              <Clock className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">{stats.upcoming}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-100 rounded-lg">
              <PlayCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ongoing</p>
              <p className="text-2xl font-bold text-gray-900">{stats.ongoing}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari judul atau tema..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as MeetingStatus | 'SEMUA')
                setCurrentPage(1)
              }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Button onClick={handleOpenAdd} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Tambah
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">No</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Pertemuan Ke</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Judul</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Tema</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Tanggal</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Jam</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-center px-5 py-3 font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    Tidak ada data pertemuan ditemukan
                  </td>
                </tr>
              ) : (
                paginated.map((p, idx) => (
                  <tr
                    key={p.pertemuan_id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3 text-gray-500">
                      {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-900">{p.pertemuan_ke}</td>
                    <td className="px-5 py-3 text-gray-900 max-w-[200px] truncate">{p.judul}</td>
                    <td className="px-5 py-3 text-gray-700 max-w-[150px] truncate">{p.tema}</td>
                    <td className="px-5 py-3 text-gray-700">{formatDate(p.tanggal)}</td>
                    <td className="px-5 py-3 text-gray-700">
                      {p.jam_mulai} - {p.jam_selesai}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status]}`}
                      >
                        {getStatusIcon(p.status)}
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(p.pertemuan_id)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget(p.pertemuan_id)
                            setIsDeleteOpen(true)
                          }}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingId(null)
          setForm(initialForm)
          setFormErrors({})
        }}
        title={editingId ? 'Edit Pertemuan' : 'Tambah Pertemuan'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pertemuan Ke <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={form.pertemuan_ke}
              onChange={(e) => setForm({ ...form, pertemuan_ke: e.target.value })}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.pertemuan_ke ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Masukkan nomor pertemuan"
            />
            {formErrors.pertemuan_ke && (
              <p className="text-xs text-red-500 mt-1">{formErrors.pertemuan_ke}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Judul <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.judul}
              onChange={(e) => setForm({ ...form, judul: e.target.value })}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.judul ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Masukkan judul pertemuan"
            />
            {formErrors.judul && (
              <p className="text-xs text-red-500 mt-1">{formErrors.judul}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tema <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.tema}
              onChange={(e) => setForm({ ...form, tema: e.target.value })}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.tema ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Masukkan tema pertemuan"
            />
            {formErrors.tema && (
              <p className="text-xs text-red-500 mt-1">{formErrors.tema}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi
            </label>
            <textarea
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Masukkan deskripsi pertemuan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.tanggal}
              onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.tanggal ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {formErrors.tanggal && (
              <p className="text-xs text-red-500 mt-1">{formErrors.tanggal}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jam Mulai <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={form.jam_mulai}
                onChange={(e) => setForm({ ...form, jam_mulai: e.target.value })}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.jam_mulai ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.jam_mulai && (
                <p className="text-xs text-red-500 mt-1">{formErrors.jam_mulai}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jam Selesai <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={form.jam_selesai}
                onChange={(e) => setForm({ ...form, jam_selesai: e.target.value })}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.jam_selesai ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.jam_selesai && (
                <p className="text-xs text-red-500 mt-1">{formErrors.jam_selesai}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as MeetingStatus })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="DRAFT">Draft</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false)
                setEditingId(null)
                setForm(initialForm)
                setFormErrors({})
              }}
            >
              Batal
            </Button>
            <Button onClick={handleSubmit}>
              {editingId ? 'Simpan Perubahan' : 'Tambah Pertemuan'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false)
          setDeleteTarget(null)
        }}
        onConfirm={handleDelete}
        title="Hapus Pertemuan"
        message="Apakah Anda yakin ingin menghapus pertemuan ini? Tindakan ini tidak dapat dibatalkan."
      />
    </div>
  )
}
