'use client'

import { useState, useMemo } from 'react'
import { useBuktiIzinStore } from '@/lib/bukti-izin-store'
import { useMenteeStore } from '@/lib/mentee-store'
import { usePertemuanStore } from '@/lib/pertemuan-store'
import { useKelompokStore } from '@/lib/kelompok-store'
import { useAuthStore } from '@/lib/auth-store'
import { useToastStore } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Pagination } from '@/components/ui/pagination'
import { StatusBadge } from '@/components/ui/status-badge'
import { VerificationStatus } from '@/types'
import {
  Search,
  Check,
  X,
  Eye,
  Clock,
  FileText,
  FileCheck,
  FileX,
} from 'lucide-react'

const ITEMS_PER_PAGE = 10

export default function VerifikasiIzinPage() {
  const { buktiIzinList, updateBuktiIzin } = useBuktiIzinStore()
  const { menteeList } = useMenteeStore()
  const { pertemuanList } = usePertemuanStore()
  const { kelompokList } = useKelompokStore()
  const { user } = useAuthStore()
  const { addToast } = useToastStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [pertemuanFilter, setPertemuanFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const [detailItem, setDetailItem] = useState<string | null>(null)
  const [catatanVerifikasi, setCatatanVerifikasi] = useState('')

  const [isApproveOpen, setIsApproveOpen] = useState(false)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)

  const getMenteeName = (menteeId: string) => {
    const mentee = menteeList.find((m) => m.mentee_id === menteeId)
    return mentee?.nama ?? '-'
  }

  const getMenteeNIM = (menteeId: string) => {
    const mentee = menteeList.find((m) => m.mentee_id === menteeId)
    return mentee?.NIM ?? '-'
  }

  const getKelompokName = (kelompokId: string) => {
    const kelompok = kelompokList.find((k) => k.kelompok_id === kelompokId)
    return kelompok?.nama_kelompok ?? '-'
  }

  const getPertemuanInfo = (pertemuanId: string) => {
    const pertemuan = pertemuanList.find((p) => p.pertemuan_id === pertemuanId)
    if (!pertemuan) return '-'
    return `Pertemuan ${pertemuan.pertemuan_ke}`
  }

  const stats = useMemo(() => {
    const total = buktiIzinList.length
    const menunggu = buktiIzinList.filter(
      (b) => b.status_verifikasi === 'MENUNGGU'
    ).length
    const disetujui = buktiIzinList.filter(
      (b) => b.status_verifikasi === 'DISETUJUI'
    ).length
    const ditolak = buktiIzinList.filter(
      (b) => b.status_verifikasi === 'DITOLAK'
    ).length
    return { total, menunggu, disetujui, ditolak }
  }, [buktiIzinList])

  const filteredData = useMemo(() => {
    let data = [...buktiIzinList]

    if (statusFilter !== 'all') {
      data = data.filter(
        (b) => b.status_verifikasi === (statusFilter.toUpperCase() as VerificationStatus)
      )
    }

    if (pertemuanFilter !== 'all') {
      data = data.filter((b) => b.pertemuan_id === pertemuanFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      data = data.filter(
        (b) =>
          getMenteeName(b.mentee_id).toLowerCase().includes(q) ||
          getMenteeNIM(b.mentee_id).includes(q)
      )
    }

    return data.sort(
      (a, b) =>
        new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    )
  }, [
    buktiIzinList,
    statusFilter,
    pertemuanFilter,
    searchQuery,
    menteeList,
  ])

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const openDetail = (buktiIzinId: string) => {
    setDetailItem(buktiIzinId)
    setCatatanVerifikasi('')
  }

  const openApproveDialog = (buktiIzinId: string) => {
    setActionId(buktiIzinId)
    setCatatanVerifikasi('')
    setIsApproveOpen(true)
  }

  const openRejectDialog = (buktiIzinId: string) => {
    setActionId(buktiIzinId)
    setCatatanVerifikasi('')
    setIsRejectOpen(true)
  }

  const handleApprove = () => {
    if (!actionId) return
    const now = new Date().toISOString()
    updateBuktiIzin(actionId, {
      status_verifikasi: 'DISETUJUI',
      verified_by: user?.user_id ?? '',
      verified_at: now,
      catatan_verifikasi: catatanVerifikasi.trim(),
    })
    addToast('Pengajuan izin berhasil disetujui', 'success')
    setIsApproveOpen(false)
    setActionId(null)
    setCatatanVerifikasi('')
  }

  const handleReject = () => {
    if (!actionId) return
    const now = new Date().toISOString()
    updateBuktiIzin(actionId, {
      status_verifikasi: 'DITOLAK',
      verified_by: user?.user_id ?? '',
      verified_at: now,
      catatan_verifikasi: catatanVerifikasi.trim(),
    })
    addToast('Pengajuan izin berhasil ditolak', 'success')
    setIsRejectOpen(false)
    setActionId(null)
    setCatatanVerifikasi('')
  }

  const detailItemData = detailItem
    ? buktiIzinList.find((b) => b.bukti_izin_id === detailItem)
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Verifikasi Izin</h1>
        <p className="text-sm text-gray-500">
          Kelola dan verifikasi pengajuan izin dari mentee
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Pengajuan</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.total}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Menunggu</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.menunggu}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <FileCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Disetujui</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.disetujui}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <FileX className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ditolak</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.ditolak}
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
            placeholder="Cari nama atau NIM mentee..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={pertemuanFilter}
          onChange={(e) => {
            setPertemuanFilter(e.target.value)
            setCurrentPage(1)
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">Semua Pertemuan</option>
          {pertemuanList.map((p) => (
            <option key={p.pertemuan_id} value={p.pertemuan_id}>
              Pertemuan {p.pertemuan_ke} - {p.judul}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setCurrentPage(1)
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">Semua Status</option>
          <option value="MENUNGGU">Menunggu</option>
          <option value="DISETUJUI">Disetujui</option>
          <option value="DITOLAK">Ditolak</option>
        </select>
      </div>

      <div className="rounded-lg border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Mentee</th>
                <th className="px-4 py-3">Kelompok</th>
                <th className="px-4 py-3">Pertemuan</th>
                <th className="px-4 py-3">Alasan</th>
                <th className="px-4 py-3">Bukti</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Tidak ada data pengajuan izin ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedData.map((bukti, index) => (
                  <tr
                    key={bukti.bukti_izin_id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => openDetail(bukti.bukti_izin_id)}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {new Date(bukti.uploaded_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {getMenteeName(bukti.mentee_id)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getMenteeNIM(bukti.mentee_id)}
                        </p>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {getKelompokName(bukti.kelompok_id)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {getPertemuanInfo(bukti.pertemuan_id)}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-gray-700">
                      {bukti.alasan}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <a
                        href={bukti.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <Eye className="h-4 w-4" />
                        Lihat
                      </a>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={bukti.status_verifikasi} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div
                        className="flex items-center justify-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {bukti.status_verifikasi === 'MENUNGGU' ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                openApproveDialog(bukti.bukti_izin_id)
                              }
                              title="Setujui"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                openRejectDialog(bukti.bukti_izin_id)
                              }
                              title="Tolak"
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetail(bukti.bukti_izin_id)}
                            title="Lihat Detail"
                          >
                            <Eye className="h-4 w-4 text-gray-500" />
                          </Button>
                        )}
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
        isOpen={detailItem !== null}
        onClose={() => {
          setDetailItem(null)
          setCatatanVerifikasi('')
        }}
        title="Detail Pengajuan Izin"
        size="md"
      >
        {detailItemData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Nama Mentee
                </label>
                <p className="text-sm font-medium text-gray-900">
                  {getMenteeName(detailItemData.mentee_id)}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  NIM
                </label>
                <p className="text-sm text-gray-700">
                  {getMenteeNIM(detailItemData.mentee_id)}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Kelompok
                </label>
                <p className="text-sm text-gray-700">
                  {getKelompokName(detailItemData.kelompok_id)}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Pertemuan
                </label>
                <p className="text-sm text-gray-700">
                  {getPertemuanInfo(detailItemData.pertemuan_id)}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Tanggal Pengajuan
                </label>
                <p className="text-sm text-gray-700">
                  {new Date(detailItemData.uploaded_at).toLocaleDateString(
                    'id-ID',
                    {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }
                  )}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Status
                </label>
                <StatusBadge status={detailItemData.status_verifikasi} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Alasan
              </label>
              <p className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                {detailItemData.alasan}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Bukti
              </label>
              <a
                href={detailItemData.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                <FileText className="h-4 w-4" />
                Lihat Bukti
              </a>
            </div>

            {detailItemData.status_verifikasi !== 'MENUNGGU' && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-500">
                  Informasi Verifikasi
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-700">
                  <div>
                    <span className="text-gray-500">Diverifikasi oleh: </span>
                    {detailItemData.verified_by || '-'}
                  </div>
                  <div>
                    <span className="text-gray-500">Tanggal: </span>
                    {detailItemData.verified_at
                      ? new Date(detailItemData.verified_at).toLocaleDateString(
                          'id-ID',
                          {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          }
                        )
                      : '-'}
                  </div>
                </div>
                {detailItemData.catatan_verifikasi && (
                  <div className="mt-2 text-sm text-gray-700">
                    <span className="text-gray-500">Catatan: </span>
                    {detailItemData.catatan_verifikasi}
                  </div>
                )}
              </div>
            )}

            {detailItemData.status_verifikasi === 'MENUNGGU' && (
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetailItem(null)
                    setCatatanVerifikasi('')
                  }}
                >
                  Tutup
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    setDetailItem(null)
                    openRejectDialog(detailItemData.bukti_izin_id)
                  }}
                >
                  <X className="mr-1 h-4 w-4" />
                  Tolak
                </Button>
                <Button
                  onClick={() => {
                    setDetailItem(null)
                    openApproveDialog(detailItemData.bukti_izin_id)
                  }}
                >
                  <Check className="mr-1 h-4 w-4" />
                  Setujui
                </Button>
              </div>
            )}

            {detailItemData.status_verifikasi !== 'MENUNGGU' && (
              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetailItem(null)
                    setCatatanVerifikasi('')
                  }}
                >
                  Tutup
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isApproveOpen}
        onClose={() => {
          setIsApproveOpen(false)
          setActionId(null)
          setCatatanVerifikasi('')
        }}
        title="Setujui Pengajuan Izin"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Apakah Anda yakin ingin menyetujui pengajuan izin ini?
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Catatan Verifikasi (Opsional)
            </label>
            <textarea
              value={catatanVerifikasi}
              onChange={(e) => setCatatanVerifikasi(e.target.value)}
              placeholder="Masukkan catatan verifikasi..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsApproveOpen(false)
                setActionId(null)
                setCatatanVerifikasi('')
              }}
            >
              Batal
            </Button>
            <Button onClick={handleApprove}>
              <Check className="mr-1 h-4 w-4" />
              Setujui
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isRejectOpen}
        onClose={() => {
          setIsRejectOpen(false)
          setActionId(null)
          setCatatanVerifikasi('')
        }}
        title="Tolak Pengajuan Izin"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Apakah Anda yakin ingin menolak pengajuan izin ini?
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Catatan Verifikasi (Opsional)
            </label>
            <textarea
              value={catatanVerifikasi}
              onChange={(e) => setCatatanVerifikasi(e.target.value)}
              placeholder="Masukkan alasan penolakan..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectOpen(false)
                setActionId(null)
                setCatatanVerifikasi('')
              }}
            >
              Batal
            </Button>
            <Button variant="danger" onClick={handleReject}>
              <X className="mr-1 h-4 w-4" />
              Tolak
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
