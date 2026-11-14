'use client'

import { useState, useMemo } from 'react'
import { BookOpen, Search, FileText, File, Film, Link2, Calendar, Download } from 'lucide-react'
import { useMateriStore } from '@/lib/materi-store'
import { usePertemuanStore } from '@/lib/pertemuan-store'
import { Pagination } from '@/components/ui/pagination'

type FileType = 'PDF' | 'PPT' | 'DOC' | 'XLS' | 'VIDEO' | 'LINK'

const ITEMS_PER_PAGE = 10

const FILE_TYPE_CONFIG: Record<FileType, { icon: React.ElementType; color: string; bgColor: string }> = {
  PDF: { icon: FileText, color: 'text-red-600', bgColor: 'bg-red-100' },
  PPT: { icon: File, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  DOC: { icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  XLS: { icon: File, color: 'text-green-600', bgColor: 'bg-green-100' },
  VIDEO: { icon: Film, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  LINK: { icon: Link2, color: 'text-teal-600', bgColor: 'bg-teal-100' },
}

export default function MentorMateriPage() {
  const { materiList } = useMateriStore()
  const { pertemuanList } = usePertemuanStore()

  const [selectedPertemuan, setSelectedPertemuan] = useState<string>('all')
  const [selectedFileType, setSelectedFileType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)

  const fileTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    materiList.forEach((m) => {
      counts[m.jenis_file] = (counts[m.jenis_file] || 0) + 1
    })
    return counts
  }, [materiList])

  const filteredMateri = useMemo(() => {
    return materiList.filter((m) => {
      if (selectedPertemuan !== 'all' && String(m.pertemuan_id) !== selectedPertemuan) return false
      if (selectedFileType !== 'all' && m.jenis_file !== selectedFileType) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          m.judul.toLowerCase().includes(q) ||
          m.deskripsi.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [materiList, selectedPertemuan, selectedFileType, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredMateri.length / ITEMS_PER_PAGE))
  const paginatedMateri = filteredMateri.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const uniqueFileTypes = useMemo(() => {
    const types = new Set(materiList.map((m) => m.jenis_file))
    return Array.from(types).sort() as FileType[]
  }, [materiList])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BookOpen className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Materi Mengajar</h1>
            <p className="text-sm text-gray-500">Lihat semua materi yang telah diunggah</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Total Materi</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{materiList.length}</div>
          </div>
          {uniqueFileTypes.map((type) => {
            const config = FILE_TYPE_CONFIG[type]
            const Icon = config.icon
            return (
              <div key={type} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Icon className={`w-4 h-4 ${config.color}`} />
                  {type}
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {fileTypeCounts[type] || 0}
                </div>
              </div>
            )
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari judul atau deskripsi..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Pertemuan Filter */}
            <select
              value={selectedPertemuan}
              onChange={(e) => {
                setSelectedPertemuan(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">Semua Pertemuan</option>
              {pertemuanList.map((p) => (
                <option key={p.pertemuan_id} value={p.pertemuan_id}>
                  P{String(p.pertemuan_ke).padStart(2, '0')} - {p.judul}
                </option>
              ))}
            </select>

            {/* File Type Filter */}
            <select
              value={selectedFileType}
              onChange={(e) => {
                setSelectedFileType(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">Semua Tipe File</option>
              {uniqueFileTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Materi Cards Grid */}
        {paginatedMateri.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Tidak ada materi yang ditemukan.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedMateri.map((materi) => {
                const config = FILE_TYPE_CONFIG[materi.jenis_file as FileType] || FILE_TYPE_CONFIG.LINK
                const Icon = config.icon

                const pertemuan = pertemuanList.find(
                  (p) => p.pertemuan_id === materi.pertemuan_id
                )

                return (
                  <div
                    key={materi.materi_id}
                    className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition flex flex-col h-full"
                  >
                    {/* File type icon & badge */}
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2.5 rounded-lg ${config.bgColor}`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${config.bgColor} ${config.color}`}
                      >
                        {materi.jenis_file}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                      {materi.judul}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-500 mb-4 line-clamp-3 flex-1">
                      {materi.deskripsi}
                    </p>

                    {/* Bottom info */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{pertemuan?.judul || `Pertemuan ${materi.pertemuan_id}`}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Download className="w-3.5 h-3.5" />
                        <span>
                          {new Date(materi.uploaded_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            <div className="flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
