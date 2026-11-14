'use client'

import { useState, useMemo } from 'react'
import { Camera, Search, Plus, Pencil, Trash2, Image } from 'lucide-react'
import { useDokumentasiStore } from '@/lib/dokumentasi-store'
import { usePertemuanStore } from '@/lib/pertemuan-store'
import { useKelompokStore } from '@/lib/kelompok-store'
import { useMentorStore } from '@/lib/mentor-store'
import { useToastStore } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Pagination } from '@/components/ui/pagination'

const ITEMS_PER_PAGE = 10

interface DokumentasiForm {
  pertemuan_id: string
  kelompok_id: string
  mentor_id: string
  keterangan: string
  file_url: string
}

const initialForm: DokumentasiForm = {
  pertemuan_id: '',
  kelompok_id: '',
  mentor_id: '',
  keterangan: '',
  file_url: '',
}

export default function AdminDokumentasiPage() {
  const { dokumentasiList, addDokumentasi, updateDokumentasi, deleteDokumentasi } =
    useDokumentasiStore()
  const { pertemuanList } = usePertemuanStore()
  const { kelompokList } = useKelompokStore()
  const { mentorList } = useMentorStore()
  const { addToast } = useToastStore()

  const [pertemuanFilter, setPertemuanFilter] = useState('ALL')
  const [kelompokFilter, setKelompokFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<DokumentasiForm>(initialForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const getPertemuanLabel = (id: string) => {
    const p = pertemuanList.find((x) => x.pertemuan_id === id)
    return p ? `Ke-${p.pertemuan_ke} — ${p.judul}` : id
  }

  const getKelompokLabel = (id: string) => {
    const k = kelompokList.find((x) => x.kelompok_id === id)
    return k ? k.nama_kelompok : id
  }

  const getMentorLabel = (id: string) => {
    const m = mentorList.find((x) => x.mentor_id === id)
    return m ? m.nama : id
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const filtered = useMemo(() => {
    let result = [...dokumentasiList]

    if (pertemuanFilter !== 'ALL') {
      result = result.filter((d) => d.pertemuan_id === pertemuanFilter)
    }

    if (kelompokFilter !== 'ALL') {
      result = result.filter((d) => d.kelompok_id === kelompokFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((d) => d.keterangan.toLowerCase().includes(q))
    }

    return result
  }, [dokumentasiList, pertemuanFilter, kelompokFilter, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const stats = useMemo(() => {
    const total = dokumentasiList.length
    const pertemuanWithDok = new Set(dokumentasiList.map((d) => d.pertemuan_id)).size
    return { total, pertemuanWithDok }
  }, [dokumentasiList])

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    if (!form.pertemuan_id) errors.pertemuan_id = 'Pertemuan harus dipilih'
    if (!form.kelompok_id) errors.kelompok_id = 'Kelompok harus dipilih'
    if (!form.mentor_id) errors.mentor_id = 'Mentor harus dipilih'
    if (!form.keterangan.trim()) errors.keterangan = 'Keterangan harus diisi'
    if (!form.file_url.trim()) errors.file_url = 'File URL harus diisi'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleOpenAdd = () => {
    setEditingId(null)
    setForm({ ...initialForm })
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleOpenEdit = (id: string) => {
    const doc = dokumentasiList.find((d) => d.bukti_id === id)
    if (!doc) return
    setEditingId(id)
    setForm({
      pertemuan_id: doc.pertemuan_id,
      kelompok_id: doc.kelompok_id,
      mentor_id: doc.mentor_id,
      keterangan: doc.keterangan,
      file_url: doc.file_url,
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleSubmit = () => {
    if (!validate()) return

    if (editingId) {
      updateDokumentasi(editingId, {
        pertemuan_id: form.pertemuan_id,
        kelompok_id: form.kelompok_id,
        mentor_id: form.mentor_id,
        keterangan: form.keterangan.trim(),
        file_url: form.file_url.trim(),
      })
      addToast('Dokumentasi berhasil diperbarui', 'success')
    } else {
      addDokumentasi({
        pertemuan_id: form.pertemuan_id,
        kelompok_id: form.kelompok_id,
        mentor_id: form.mentor_id,
        file_id: `FILE_DOK_${Date.now()}`,
        keterangan: form.keterangan.trim(),
        file_url: form.file_url.trim(),
        uploaded_at: new Date().toISOString(),
      })
      addToast('Dokumentasi berhasil ditambahkan', 'success')
    }

    setIsModalOpen(false)
    setEditingId(null)
    setForm(initialForm)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteDokumentasi(deleteTarget)
    addToast('Dokumentasi berhasil dihapus', 'success')
    setIsDeleteOpen(false)
    setDeleteTarget(null)

    const newTotal = Math.ceil((filtered.length - 1) / ITEMS_PER_PAGE)
    if (currentPage > newTotal && newTotal > 0) {
      setCurrentPage(newTotal)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Dokumentasi</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola dokumentasi foto pertemuan mentoring</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <Camera className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Dokumentasi</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-100 rounded-lg">
              <Image className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pertemuan Terdokumentasi</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pertemuanWithDok}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <select
              value={pertemuanFilter}
              onChange={(e) => {
                setPertemuanFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">Semua Pertemuan</option>
              {pertemuanList.map((p) => (
                <option key={p.pertemuan_id} value={p.pertemuan_id}>
                  Ke-{p.pertemuan_ke} — {p.judul}
                </option>
              ))}
            </select>
            <select
              value={kelompokFilter}
              onChange={(e) => {
                setKelompokFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">Semua Kelompok</option>
              {kelompokList.map((k) => (
                <option key={k.kelompok_id} value={k.kelompok_id}>
                  {k.nama_kelompok}
                </option>
              ))}
            </select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari keterangan..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
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
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Pertemuan</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Kelompok</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Mentor</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Keterangan</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Tanggal Upload</th>
                <th className="text-center px-5 py-3 font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    Tidak ada data dokumentasi ditemukan
                  </td>
                </tr>
              ) : (
                paginated.map((d, idx) => (
                  <tr
                    key={d.bukti_id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3 text-gray-500">
                      {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                    </td>
                    <td className="px-5 py-3 text-gray-900 max-w-[200px] truncate">
                      {getPertemuanLabel(d.pertemuan_id)}
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      {getKelompokLabel(d.kelompok_id)}
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      {getMentorLabel(d.mentor_id)}
                    </td>
                    <td className="px-5 py-3 text-gray-700 max-w-[180px] truncate">
                      {d.keterangan}
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      {formatDate(d.uploaded_at)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(d.bukti_id)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget(d.bukti_id)
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
          setFormErrors({})
        }}
        title={editingId ? 'Edit Dokumentasi' : 'Tambah Dokumentasi'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pertemuan <span className="text-red-500">*</span>
            </label>
            <select
              value={form.pertemuan_id}
              onChange={(e) => setForm({ ...form, pertemuan_id: e.target.value })}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.pertemuan_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Pilih Pertemuan</option>
              {pertemuanList.map((p) => (
                <option key={p.pertemuan_id} value={p.pertemuan_id}>
                  Ke-{p.pertemuan_ke} — {p.judul}
                </option>
              ))}
            </select>
            {formErrors.pertemuan_id && (
              <p className="text-xs text-red-500 mt-1">{formErrors.pertemuan_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kelompok <span className="text-red-500">*</span>
            </label>
            <select
              value={form.kelompok_id}
              onChange={(e) => setForm({ ...form, kelompok_id: e.target.value })}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.kelompok_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Pilih Kelompok</option>
              {kelompokList.map((k) => (
                <option key={k.kelompok_id} value={k.kelompok_id}>
                  {k.nama_kelompok}
                </option>
              ))}
            </select>
            {formErrors.kelompok_id && (
              <p className="text-xs text-red-500 mt-1">{formErrors.kelompok_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mentor <span className="text-red-500">*</span>
            </label>
            <select
              value={form.mentor_id}
              onChange={(e) => setForm({ ...form, mentor_id: e.target.value })}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.mentor_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Pilih Mentor</option>
              {mentorList.map((m) => (
                <option key={m.mentor_id} value={m.mentor_id}>
                  {m.nama}
                </option>
              ))}
            </select>
            {formErrors.mentor_id && (
              <p className="text-xs text-red-500 mt-1">{formErrors.mentor_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keterangan <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.keterangan}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
              rows={3}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                formErrors.keterangan ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Masukkan keterangan dokumentasi"
            />
            {formErrors.keterangan && (
              <p className="text-xs text-red-500 mt-1">{formErrors.keterangan}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File URL <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.file_url}
              onChange={(e) => setForm({ ...form, file_url: e.target.value })}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.file_url ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="https://example.com/uploads/foto.jpg"
            />
            {formErrors.file_url && (
              <p className="text-xs text-red-500 mt-1">{formErrors.file_url}</p>
            )}
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
              {editingId ? 'Simpan Perubahan' : 'Tambah Dokumentasi'}
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
        title="Hapus Dokumentasi"
        message="Apakah Anda yakin ingin menghapus dokumentasi ini? Tindakan ini tidak dapat dibatalkan."
      />
    </div>
  )
}
