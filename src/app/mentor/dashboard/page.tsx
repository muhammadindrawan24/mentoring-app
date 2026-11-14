'use client';

import { useMemo } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { Pertemuan } from '@/types';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { MeetingStatus } from '@/components/ui/meeting-status';
import { RealtimeClock } from '@/components/ui/realtime-clock';
import { useMenteeStore } from '@/lib/mentee-store';
import { useKelompokStore } from '@/lib/kelompok-store';
import { usePertemuanStore } from '@/lib/pertemuan-store';
import { useAbsensiStore } from '@/lib/absensi-store';
import { usePengumumanStore } from '@/lib/pengumuman-store';
import {
  Users,
  UsersRound,
  TrendingUp,
  AlertTriangle,
  Bell,
  FileText,
  ClipboardCheck,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function MentorDashboardPage() {
  const { user, mentorProfile } = useAuthStore();
  const { menteeList } = useMenteeStore();
  const { kelompokList } = useKelompokStore();
  const { pertemuanList } = usePertemuanStore();
  const { absensiList } = useAbsensiStore();
  const { pengumumanList } = usePengumumanStore();

  const myMentees = useMemo(
    () => menteeList.filter((m) => m.kelompok_id === mentorProfile?.kelompok_id),
    [menteeList, mentorProfile]
  );

  const stats = useMemo(() => {
    if (!mentorProfile) {
      return {
        namaKelompok: '-',
        kodeKelompok: '-',
        jumlahMentee: 0,
        persentaseKehadiran: 0,
        pertemuanSaatIni: null as Pertemuan | null,
        pertemuanBerikutnya: null as Pertemuan | null,
        menteeAbsensiRendah: 0,
      };
    }

    const myGroup = kelompokList.find((k) => k.kelompok_id === mentorProfile.kelompok_id);
    const now = new Date();

    const pertemuanSaatIni =
      pertemuanList.find((p) => {
        const [year, month, day] = p.tanggal.split('-').map(Number);
        const [sh, sm] = p.jam_mulai.split(':').map(Number);
        const [eh, em] = p.jam_selesai.split(':').map(Number);
        const start = new Date(year, month - 1, day, sh, sm);
        const end = new Date(year, month - 1, day, eh, em);
        return now >= start && now <= end;
      }) || null;

    const pertemuanBerikutnya =
      pertemuanList.find((p) => {
        const [year, month, day] = p.tanggal.split('-').map(Number);
        const [sh, sm] = p.jam_mulai.split(':').map(Number);
        const start = new Date(year, month - 1, day, sh, sm);
        return now < start;
      }) || null;

    // Rekap kehadiran per mentee milik kelompok ini
    const rekapPerMentee = new Map<string, { total: number; hadir: number }>();
    for (const a of absensiList) {
      if (!myMentees.some((m) => m.mentee_id === a.mentee_id)) continue;
      const entry = rekapPerMentee.get(a.mentee_id) || { total: 0, hadir: 0 };
      entry.total += 1;
      if (a.status !== 'ALFA') entry.hadir += 1;
      rekapPerMentee.set(a.mentee_id, entry);
    }

    let total = 0;
    let hadir = 0;
    let menteeAbsensiRendah = 0;
    for (const entry of rekapPerMentee.values()) {
      total += entry.total;
      hadir += entry.hadir;
      if (entry.total > 0 && entry.hadir / entry.total < 0.75) {
        menteeAbsensiRendah += 1;
      }
    }

    return {
      namaKelompok: myGroup?.nama_kelompok || '-',
      kodeKelompok: myGroup?.kode_kelompok || '-',
      jumlahMentee: myMentees.length,
      persentaseKehadiran: total === 0 ? 0 : Math.round((hadir / total) * 100),
      pertemuanSaatIni,
      pertemuanBerikutnya,
      menteeAbsensiRendah,
    };
  }, [mentorProfile, kelompokList, pertemuanList, absensiList, myMentees]);

  const myPengumuman = useMemo(
    () =>
      pengumumanList
        .filter((p) => p.status === 'ACTIVE')
        .sort((a, b) => (b.published_at || '').localeCompare(a.published_at || ''))
        .slice(0, 2),
    [pengumumanList]
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <p className="text-blue-100 text-sm">Assalamu&apos;alaikum,</p>
        <h1 className="text-2xl font-bold mt-1">{user?.nama || 'Mentor'}</h1>
        <div className="mt-3">
          <RealtimeClock />
        </div>
      </div>

      {stats.pertemuanSaatIni && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-shrink-0">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
            <span className="font-bold text-red-700">Pertemuan Sedang Berlangsung</span>
          </div>
          <div className="ml-5">
            <p className="font-semibold text-gray-900">
              Pertemuan {String(stats.pertemuanSaatIni.pertemuan_ke).padStart(2, '0')}
            </p>
            <p className="text-sm text-gray-600">{stats.pertemuanSaatIni.judul}</p>
            <p className="text-xs text-gray-500">
              {stats.pertemuanSaatIni.jam_mulai}–{stats.pertemuanSaatIni.jam_selesai} WIB
            </p>
          </div>
          <Link href="/mentor/absensi" className="mt-4 inline-block">
            <Button size="lg">
              <ClipboardCheck className="h-5 w-5 mr-2" />
              Buka Absensi
            </Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Kelompok Saya"
          value={stats.namaKelompok}
          icon={<UsersRound className="h-6 w-6" />}
          color="blue"
          subtitle={stats.kodeKelompok}
        />
        <StatCard
          title="Jumlah Mentee"
          value={stats.jumlahMentee}
          icon={<Users className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Kehadiran"
          value={`${stats.persentaseKehadiran}%`}
          icon={<TrendingUp className="h-6 w-6" />}
          color="indigo"
        />
        <StatCard
          title="Mentee Absensi Rendah"
          value={stats.menteeAbsensiRendah}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {!stats.pertemuanSaatIni && stats.pertemuanBerikutnya && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pertemuan Berikutnya</h2>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">
                Pertemuan {String(stats.pertemuanBerikutnya.pertemuan_ke).padStart(2, '0')}
              </p>
              <p className="text-sm text-gray-600">{stats.pertemuanBerikutnya.judul}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.pertemuanBerikutnya.tanggal} | {stats.pertemuanBerikutnya.jam_mulai}–{stats.pertemuanBerikutnya.jam_selesai} WIB
              </p>
              <div className="mt-3">
                <MeetingStatus pertemuan={stats.pertemuanBerikutnya} showCountdown />
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pengumuman Baru</h2>
            <Link href="/mentor/pengumuman" className="text-sm text-blue-600 hover:text-blue-700">
              Lihat Semua
            </Link>
          </div>
          {myPengumuman.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Belum ada pengumuman</p>
          ) : (
            <div className="space-y-3">
              {myPengumuman.map((p) => (
                <div key={p.pengumuman_id} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-gray-900 text-sm">{p.judul}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {(p.published_at || p.created_at).slice(0, 10)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Daftar Mentee</h2>
          <Link href="/mentor/mentees" className="text-sm text-blue-600 hover:text-blue-700">
            Lihat Semua
          </Link>
        </div>
        <div className="overflow-x-auto">
          {myMentees.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Belum ada mentee di kelompok Anda</p>
          ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIM</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prodi</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {myMentees
                .slice(0, 5)
                .map((m) => (
                  <tr key={m.mentee_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{m.NIM}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{m.nama}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{m.prodi}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.status} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/mentor/absensi">
          <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
            <ClipboardCheck className="h-8 w-8 text-blue-600 mb-2" />
            <p className="font-medium text-gray-900">Absensi</p>
            <p className="text-xs text-gray-500">Isi kehadiran mentee</p>
          </div>
        </Link>
        <Link href="/mentor/dokumentasi">
          <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
            <FileText className="h-8 w-8 text-green-600 mb-2" />
            <p className="font-medium text-gray-900">Dokumentasi</p>
            <p className="text-xs text-gray-500">Upload foto pertemuan</p>
          </div>
        </Link>
        <Link href="/mentor/catatan">
          <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
            <FileText className="h-8 w-8 text-purple-600 mb-2" />
            <p className="font-medium text-gray-900">Catatan</p>
            <p className="text-xs text-gray-500">Isi laporan pertemuan</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
