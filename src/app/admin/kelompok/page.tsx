'use client'

import { useState, useMemo } from 'react'
import { useKelompokStore } from '@/lib/kelompok-store'
import { useMentorStore } from '@/lib/mentor-store'
import { useMenteeStore } from '@/lib/mentee-store'
import { useToastStore } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Pagination } from '@/components/ui/pagination'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  FolderOpen,
  UserCheck,
  UserX,
} from 'lucide-react'

const ITEMS_PER_PAGE = 10

interface KelompokForm {
  kode_kelompok: string
  nama_kelompok: string
  mentor_id: string
  status: 'ACTIVE' | 'INACTIVE'
}

const initialForm: KelompokForm = {
  kode_kelompok: '',
  nama_kelompok: '',
  mentor_id: '',
  status: 'ACTIVE',
}

export default function AdminKelompokPage() {
  const { kelompokList, addKelompok, updateKelompok, deleteKelompok } =
    useKelompokStore()
  const { mentorList } = useMentorStore()
  const { menteeList } = useMenteeStore()
  const { addToast } = useToastStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<KelompokForm>(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const getMentorName = (mentorId: string) => {
    const mentor = mentorList.find((m) => m.mentor_id === mentorId)
    return mentor?.nama ?? '-'
  }

  const getAnggotaCount = (kelompokId: string) => {
    return menteeList.filter(
      (m) => m.kelompok_id === kelompokId && m.status === 'ACTIVE'
    ).length
  }

  const stats = useMemo(() => {
    const total = kelompokList.length
    const aktif = kelompokList.filter((k) => k.status === 'ACTIVE').length
    const tidakAktif = total - aktif
    const totalMenteeAktif = menteeList.filter(
      (m) => m.status === 'ACTIVE'
    ).length
    return { total, aktif, tidakAktif, totalMenteeAktif }
  }, [kelompokList, menteeList])

  const filteredData = useMemo(() => {
    let data = [...kelompokList]

    if (statusFilter !== 'all') {
      data = data.filter((k) => k.status === statusFilter.toUpperCase())
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      data = data.filter(
        (k) =>
          k.nama_kelompok.toLowerCase().includes(q) ||
          k.kode_kelompok.toLowerCase().includes(q) ||
          getMentorName(k.mentor_id).toLowerCase().includes(q)
      )
    }

    return data
  }, [kelompokList, statusFilter, searchQuery, mentorList])

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const openAddModal = () => {
    setEditingId(null)
    setForm(initialForm)
    setErrors({})
    setIsModalOpen(true)
  }

  const handleEdit = (kelompokId: string) => {
    const k = kelompokList.find((item) => item.kelompok_id === kelompokId)
    if (!k) return
    setEditingId(kelompokId)
    setForm({
      kode_kelompok: k.kode_kelompok,
      nama_kelompok: k.nama_kelompok,
      mentor_id: k.mentor_id,
      status: k.status,
    })
    setErrors({})
    setIsModalOpen(true)
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!form.kode_kelompok.trim()) {
      newErrors.kode_kelompok = 'Kode kelompok wajib diisi'
    } else {
      const isDuplicate = kelompokList.some(
        (k) =>
          k.kode_kelompok.toLowerCase() ===
            form.kode_kelompok.toLowerCase() &&
          k.kelompok_id !== editingId
      )
      if (isDuplicate) {
        newErrors.kode_kelompok = 'Kode kelompok sudah digunakan'
      }
    }

    if (!form.nama_kelompok.trim()) {
      newErrors.nama_kelompok = 'Nama kelompok wajib diisi'
    }

    if (!form.mentor_id) {
      newErrors.mentor_id = 'Mentor wajib dipilih'
    } else {
      const isMentorAssigned = kelompokList.some(
        (k) =>
          k.mentor_id === form.mentor_id && k.kelompok_id !== editingId
      )
      if (isMentorAssigned) {
        newErrors.mentor_id = 'Mentor sudah ditugaskan ke kelompok lain'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return

    setIsSubmitting(true)

    try {
      if (editingId) {
        updateKelompok(editingId, {
          kode_kelompok: form.kode_kelompok.trim(),
          nama_kelompok: form.nama_kelompok.trim(),
          mentor_id: form.mentor_id,
          status: form.status,
        })
        addToast('Kelompok berhasil diperbarui', 'success')
      } else {
        addKelompok({
          kode_kelompok: form.kode_kelompok.trim(),
          nama_kelompok: form.nama_kelompok.trim(),
          mentor_id: form.mentor_id,
          jumlah_anggota: 0,
          status: form.status,
        })
        addToast('Kelompok berhasil ditambahkan', 'success')
      }

      setIsModalOpen(false)
      setForm(initialForm)
      setEditingId(null)
    } catch {
      addToast('Terjadi kesalahan', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = () => {
    if (!deletingId) return
    deleteKelompok(deletingId)
    addToast('Kelompok berhasil dihapus', 'success')
    setIsDeleteOpen(false)
    setDeletingId(null)
  }

  const openDeleteDialog = (kelompokId: string) => {
    setDeletingId(kelompokId)
    setIsDeleteOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Kelola Kelompok
          </h1>
          <p className="text-sm text-gray-500">
            Manajemen data kelompok mentoring
          </p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Kelompok
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <FolderOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Kelompok</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.total}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Aktif</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.aktif}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <UserX className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tidak Aktif</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.tidakAktif}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Mentee Aktif</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalMenteeAktif}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama/kode kelompok atau mentor..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setCurrentPage(1)
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">Semua Status</option>
          <option value="ACTIVE">Aktif</option>
          <option value="INACTIVE">Tidak Aktif</option>
        </select>
      </div>

      <div className="rounded-lg border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Kode Kelompok</th>
                <th className="px-4 py-3">Nama Kelompok</th>
                <th className="px-4 py-3">Mentor</th>
                <th className="px-4 py-3 text-center">Jumlah Anggota</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Tidak ada data kelompok ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedData.map((kelompok, index) => (
                  <tr
                    key={kelompok.kelompok_id}
                    className="hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                      {kelompok.kode_kelompok}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {kelompok.nama_kelompok}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {getMentorName(kelompok.mentor_id)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center text-gray-700">
                      {getAnggotaCount(kelompok.kelompok_id)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={kelompok.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleEdit(kelompok.kelompok_id)
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            openDeleteDialog(kelompok.kelompok_id)
                          }
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="border-t px-4 py-3">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
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
          setErrors({})
        }}
        title={editingId ? 'Edit Kelompok' : 'Tambah Kelompok'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Kode Kelompok <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.kode_kelompok}
              onChange={(e) =>
                setForm({ ...form, kode_kelompok: e.target.value })
              }
              placeholder="Masukkan kode kelompok"
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                errors.kode_kelompok
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
            {errors.kode_kelompok && (
              <p className="mt-1 text-xs text-red-500">
                {errors.kode_kelompok}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nama Kelompok <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.nama_kelompok}
              onChange={(e) =>
                setForm({ ...form, nama_kelompok: e.target.value })
              }
              placeholder="Masukkan nama kelompok"
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                errors.nama_kelompok
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
            {errors.nama_kelompok && (
              <p className="mt-1 text-xs text-red-500">
                {errors.nama_kelompok}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Mentor <span className="text-red-500">*</span>
            </label>
            <select
              value={form.mentor_id}
              onChange={(e) =>
                setForm({ ...form, mentor_id: e.target.value })
              }
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                errors.mentor_id
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
            >
              <option value="">Pilih Mentor</option>
              {mentorList.map((mentor) => (
                <option
                  key={mentor.mentor_id}
                  value={mentor.mentor_id}
                >
                  {mentor.nama}
                </option>
              ))}
            </select>
            {errors.mentor_id && (
              <p className="mt-1 text-xs text-red-500">
                {errors.mentor_id}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Status <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="ACTIVE"
                  checked={form.status === 'ACTIVE'}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as 'ACTIVE' | 'INACTIVE',
                    })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Aktif</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="INACTIVE"
                  checked={form.status === 'INACTIVE'}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as 'ACTIVE' | 'INACTIVE',
                    })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Tidak Aktif
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false)
                setEditingId(null)
                setForm(initialForm)
                setErrors({})
              }}
            >
              Batal
            </Button>
            <Button onClick={handleSubmit} isLoading={isSubmitting}>
              {editingId ? 'Simpan Perubahan' : 'Tambah Kelompok'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false)
          setDeletingId(null)
        }}
        onConfirm={handleDelete}
        title="Hapus Kelompok"
        message="Apakah Anda yakin ingin menghapus kelompok ini? Data yang dihapus tidak dapat dikembalikan."
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  )
}
