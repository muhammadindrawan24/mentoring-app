'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Pagination } from '@/components/ui/pagination'
import { useAbsensiStore } from '@/lib/absensi-store'
import { useEvaluasiStore } from '@/lib/evaluasi-store'
import { usePertemuanStore } from '@/lib/pertemuan-store'
import { useMenteeStore } from '@/lib/mentee-store'
import { useKelompokStore } from '@/lib/kelompok-store'
import { useMentorStore } from '@/lib/mentor-store'
import { useDokumentasiStore } from '@/lib/dokumentasi-store'
import { useToastStore } from '@/components/ui/toast'
import { exportToCSV } from '@/lib/utils'
import {
  FileText,
  Download,
  Printer,
  BarChart3,
  Users,
  Calendar,
  TrendingUp,
  Award,
} from 'lucide-react'

type DevCategory = 'SANGAT_BAIK' | 'BAIK' | 'CUKUP' | 'PERLU_PENDAMPINGAN'

type TabType = 'absensi' | 'evaluasi' | 'pertemuan'

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'absensi', label: 'Absensi', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'evaluasi', label: 'Evaluasi', icon: <Award className="w-4 h-4" /> },
  { id: 'pertemuan', label: 'Pertemuan', icon: <Calendar className="w-4 h-4" /> },
]

const scoreMap: Record<DevCategory, number> = {
  SANGAT_BAIK: 4,
  BAIK: 3,
  CUKUP: 2,
  PERLU_PENDAMPINGAN: 1,
}

export default function LaporanPage() {
  const [activeTab, setActiveTab] = useState<TabType>('absensi')

  const absensiList = useAbsensiStore((s) => s.absensiList)
  const evaluasiList = useEvaluasiStore((s) => s.evaluasiList)
  const pertemuanList = usePertemuanStore((s) => s.pertemuanList)
  const menteeList = useMenteeStore((s) => s.menteeList)
  const kelompokList = useKelompokStore((s) => s.kelompokList)
  const mentorList = useMentorStore((s) => s.mentorList)
  const dokumentasiList = useDokumentasiStore((s) => s.dokumentasiList)
  const addToast = useToastStore((s) => s.addToast)

  const totalPertemuan = pertemuanList.length
  const totalMenteeAktif = menteeList.filter((m) => m.status === 'ACTIVE').length
  const totalMentorAktif = mentorList.filter((m) => m.status === 'ACTIVE').length

  const rataRataKehadiran = useMemo(() => {
    if (absensiList.length === 0) return 0
    const totalHadir = absensiList.filter((a) => a.status === 'HADIR').length
    return Math.round((totalHadir / absensiList.length) * 100)
  }, [absensiList])

  const absensiData = useMemo(() => {
    return kelompokList.map((kelompok) => {
      const absensiKelompok = absensiList.filter(
        (a) => a.kelompok_id === kelompok.kelompok_id
      )
      const totalPertemuan = absensiKelompok.length
      const hadir = absensiKelompok.filter((a) => a.status === 'HADIR').length
      const izin = absensiKelompok.filter((a) => a.status === 'IZIN').length
      const sakit = absensiKelompok.filter((a) => a.status === 'SAKIT').length
      const alfa = absensiKelompok.filter((a) => a.status === 'ALFA').length
      const persentase = totalPertemuan > 0
        ? Math.round((hadir / absensiKelompok.length) * 100)
        : 0

      return {
        kelompokId: kelompok.kelompok_id,
        namaKelompok: kelompok.nama_kelompok,
        totalPertemuan,
        rataHadir: totalPertemuan > 0 ? Math.round(hadir / totalPertemuan) : 0,
        rataIzin: totalPertemuan > 0 ? Math.round(izin / totalPertemuan) : 0,
        rataSakit: totalPertemuan > 0 ? Math.round(sakit / totalPertemuan) : 0,
        rataAlfa: totalPertemuan > 0 ? Math.round(alfa / totalPertemuan) : 0,
        persentase,
      }
    }).sort((a, b) => b.persentase - a.persentase)
  }, [absensiList, kelompokList])

  const evaluasiData = useMemo(() => {
    return menteeList
      .filter((mentee) => {
        return evaluasiList.some((e) => e.mentee_id === mentee.mentee_id)
      })
      .map((mentee) => {
        const evals = evaluasiList.filter((e) => e.mentee_id === mentee.mentee_id)
        const jumlahPenilaian = evals.length
        let totalSkor = 0
        evals.forEach((e) => {
          totalSkor += scoreMap[e.kehadiran]
          totalSkor += scoreMap[e.keaktifan]
          totalSkor += scoreMap[e.pemahaman]
          totalSkor += scoreMap[e.partisipasi]
          totalSkor += scoreMap[e.komitmen]
        })
        const rataSkor = jumlahPenilaian > 0
          ? Math.round((totalSkor / (jumlahPenilaian * 5)) * 100) / 100
          : 0
        const kelompok = kelompokList.find((k) => k.kelompok_id === mentee.kelompok_id)

        return {
          menteeId: mentee.mentee_id,
          nama: mentee.nama,
          nim: mentee.NIM,
          namaKelompok: kelompok?.nama_kelompok ?? '-',
          jumlahPenilaian,
          rataSkor,
        }
      })
      .sort((a, b) => b.rataSkor - a.rataSkor)
  }, [menteeList, evaluasiList, kelompokList])

  const pertemuanData = useMemo(() => {
    return pertemuanList.map((pertemuan) => {
      const docCount = dokumentasiList.filter(
        (d) => d.pertemuan_id === pertemuan.pertemuan_id
      ).length
      return {
        id: pertemuan.pertemuan_id,
        nomor: pertemuan.pertemuan_ke,
        judul: pertemuan.judul,
        tanggal: new Date(pertemuan.tanggal).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        status: pertemuan.status,
        jumlahDokumentasi: docCount,
      }
    }).sort((a, b) => a.nomor - b.nomor)
  }, [pertemuanList, dokumentasiList])

  const handleExportAbsensi = () => {
    const headers = ['Kelompok', 'Total Pertemuan', 'Rata-rata Hadir', 'Rata-rata Izin', 'Rata-rata Sakit', 'Rata-rata Alfa', 'Persentase Kehadiran'];
    const rows = absensiData.map((item) => [
      item.namaKelompok,
      item.totalPertemuan,
      item.rataHadir,
      item.rataIzin,
      item.rataSakit,
      item.rataAlfa,
      item.persentase + '%',
    ]);
    exportToCSV(headers, rows, 'laporan-absensi');
  }

  const handleExportEvaluasi = () => {
    const headers = ['Mentee', 'NIM', 'Kelompok', 'Jumlah Penilaian', 'Rata-rata Skor'];
    const rows = evaluasiData.map((item) => [
      item.nama,
      item.nim,
      item.namaKelompok,
      item.jumlahPenilaian,
      item.rataSkor,
    ]);
    exportToCSV(headers, rows, 'laporan-evaluasi');
  }

  const handleExportPertemuan = () => {
    const headers = ['No', 'Pertemuan Ke', 'Judul', 'Tanggal', 'Status', 'Jumlah Dokumentasi'];
    const rows = pertemuanData.map((item, index) => [
      index + 1,
      item.nomor,
      item.judul,
      item.tanggal,
      item.status,
      item.jumlahDokumentasi,
    ]);
    exportToCSV(headers, rows, 'laporan-pertemuan');
  }

  const handleExport = () => {
    if (activeTab === 'absensi') handleExportAbsensi();
    else if (activeTab === 'evaluasi') handleExportEvaluasi();
    else if (activeTab === 'pertemuan') handleExportPertemuan();
  }

  const getScoreColor = (skor: number) => {
    if (skor >= 3.5) return 'text-green-600'
    if (skor >= 2.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
          <p className="text-sm text-gray-500">
            Ringkasan dan laporan program mentoring Islam
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Printer className="w-4 h-4 mr-2" />
            Cetak
          </Button>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Pertemuan</p>
              <p className="text-2xl font-bold text-gray-900">{totalPertemuan}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Mentee Aktif</p>
              <p className="text-2xl font-bold text-gray-900">{totalMenteeAktif}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Mentor Aktif</p>
              <p className="text-2xl font-bold text-gray-900">{totalMentorAktif}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Rata-rata Kehadiran</p>
              <p className="text-2xl font-bold text-gray-900">{rataRataKehadiran}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border">
        <div className="border-b">
          <div className="flex gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'absensi' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Laporan Absensi per Kelompok
                </h3>
                <Button variant="outline" size="sm" onClick={handleExportAbsensi}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                        Kelompok
                      </th>
                      <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">
                        Total Pertemuan
                      </th>
                      <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">
                        Rata-rata Hadir
                      </th>
                      <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">
                        Rata-rata Izin
                      </th>
                      <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">
                        Rata-rata Sakit
                      </th>
                      <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">
                        Rata-rata Alfa
                      </th>
                      <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">
                        Persentase Kehadiran
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {absensiData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-500">
                          Belum ada data absensi
                        </td>
                      </tr>
                    ) : (
                      absensiData.map((item) => (
                        <tr key={item.kelompokId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {item.namaKelompok}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                            {item.totalPertemuan}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                            {item.rataHadir}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                            {item.rataIzin}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                            {item.rataSakit}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                            {item.rataAlfa}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                item.persentase >= 80
                                  ? 'bg-green-100 text-green-800'
                                  : item.persentase >= 60
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {item.persentase}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'evaluasi' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Laporan Evaluasi Mentee
                </h3>
                <Button variant="outline" size="sm" onClick={handleExportEvaluasi}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                        Mentee
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                        NIM
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                        Kelompok
                      </th>
                      <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">
                        Jumlah Penilaian
                      </th>
                      <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">
                        Rata-rata Skor
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {evaluasiData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-500">
                          Belum ada data evaluasi
                        </td>
                      </tr>
                    ) : (
                      evaluasiData.map((item) => (
                        <tr key={item.menteeId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {item.nama}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.nim}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.namaKelompok}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                            {item.jumlahPenilaian}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`text-sm font-semibold ${getScoreColor(
                                item.rataSkor
                              )}`}
                            >
                              {item.rataSkor.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'pertemuan' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Daftar Pertemuan
                </h3>
                <Button variant="outline" size="sm" onClick={handleExportPertemuan}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">
                        No
                      </th>
                      <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">
                        Pertemuan Ke
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                        Judul
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                        Tanggal
                      </th>
                      <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">
                        Status
                      </th>
                      <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">
                        Jumlah Dokumentasi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pertemuanData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-500">
                          Belum ada data pertemuan
                        </td>
                      </tr>
                    ) : (
                      pertemuanData.map((item, index) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                            {item.nomor}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {item.judul}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.tanggal}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                            {item.jumlahDokumentasi}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}