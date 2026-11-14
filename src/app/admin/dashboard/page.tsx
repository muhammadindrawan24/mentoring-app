'use client';

import { useMemo } from 'react';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { MeetingStatus } from '@/components/ui/meeting-status';
import { useMenteeStore } from '@/lib/mentee-store';
import { useMentorStore } from '@/lib/mentor-store';
import { useKelompokStore } from '@/lib/kelompok-store';
import { usePertemuanStore } from '@/lib/pertemuan-store';
import { useAbsensiStore } from '@/lib/absensi-store';
import { useBuktiIzinStore } from '@/lib/bukti-izin-store';
import {
  Users,
  GraduationCap,
  UsersRound,
  CalendarDays,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { menteeList } = useMenteeStore();
  const { mentorList } = useMentorStore();
  const { kelompokList } = useKelompokStore();
  const { pertemuanList } = usePertemuanStore();
  const { absensiList } = useAbsensiStore();
  const { buktiIzinList } = useBuktiIzinStore();

  const stats = useMemo(() => {
    const activeMentees = menteeList.filter((m) => m.status === 'ACTIVE');
    const totalMentee = activeMentees.length;
    const totalMentor = mentorList.filter((m) => m.status === 'ACTIVE').length;
    const totalKelompok = kelompokList.filter((k) => k.status === 'ACTIVE').length;
    const totalPertemuan = pertemuanList.length;
    const menteeTanpaKelompok = activeMentees.filter((m) => !m.kelompok_id).length;

    // Kehadiran dihitung dari rekap absensi mentee aktif (HADIR + IZIN + SAKIT)
    const activeMenteeIds = new Set(activeMentees.map((m) => m.mentee_id));
    const rekap = absensiList.filter((a) => activeMenteeIds.has(a.mentee_id));
    const hadir = rekap.filter((a) => a.status !== 'ALFA').length;
    const persentaseKehadiran = rekap.length === 0 ? 0 : Math.round((hadir / rekap.length) * 100);

    const izinMenunggu = buktiIzinList.filter((b) => b.status_verifikasi === 'MENUNGGU').length;

    return {
      totalMentee,
      totalMentor,
      totalKelompok,
      totalPertemuan,
      menteeTanpaKelompok,
      persentaseKehadiran,
      izinMenunggu,
    };
  }, [menteeList, mentorList, kelompokList, pertemuanList, absensiList, buktiIzinList]);

  const upcomingMeetings = pertemuanList
    .filter((p) => p.status === 'UPCOMING')
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
    .slice(0, 3);

  const lowAttendanceGroups = useMemo(() => {
    return kelompokList
      .map((k) => {
        const rows = absensiList.filter((a) => a.kelompok_id === k.kelompok_id);
        const hadir = rows.filter((a) => a.status !== 'ALFA').length;
        return {
          nama: k.nama_kelompok,
          persentase: rows.length === 0 ? 0 : Math.round((hadir / rows.length) * 100),
        };
      })
      .filter((g) => g.persentase < 80)
      .sort((a, b) => a.persentase - b.persentase)
      .slice(0, 5);
  }, [kelompokList, absensiList]);

  const pendingPermissions = useMemo(() => {
    return buktiIzinList
      .filter((b) => b.status_verifikasi === 'MENUNGGU')
      .map((b) => {
        const mentee = menteeList.find((m) => m.mentee_id === b.mentee_id);
        const pertemuan = pertemuanList.find((p) => p.pertemuan_id === b.pertemuan_id);
        const kelompok = kelompokList.find((k) => k.kelompok_id === b.kelompok_id);
        return {
          key: b.bukti_izin_id,
          nama: mentee?.nama || '-',
          kelompok: kelompok?.kode_kelompok || '-',
          pertemuan: pertemuan
            ? `Pertemuan ${String(pertemuan.pertemuan_ke).padStart(2, '0')}`
            : '-',
          alasan: b.alasan,
        };
      })
      .slice(0, 3);
  }, [buktiIzinList, menteeList, pertemuanList, kelompokList]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-sm text-gray-500 mt-1">Selamat datang di panel administrasi</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Mentee"
          value={stats.totalMentee}
          icon={<Users className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Total Mentor"
          value={stats.totalMentor}
          icon={<GraduationCap className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Total Kelompok"
          value={stats.totalKelompok}
          icon={<UsersRound className="h-6 w-6" />}
          color="purple"
        />
        <StatCard
          title="Kehadiran"
          value={`${stats.persentaseKehadiran}%`}
          icon={<TrendingUp className="h-6 w-6" />}
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Mentee Tanpa Kelompok"
          value={stats.menteeTanpaKelompok}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="yellow"
        />
        <StatCard
          title="Izin Menunggu"
          value={stats.izinMenunggu}
          icon={<ShieldCheck className="h-6 w-6" />}
          color="red"
        />
        <StatCard
          title="Total Pertemuan"
          value={stats.totalPertemuan}
          icon={<CalendarDays className="h-6 w-6" />}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pertemuan Mendatang</h2>
            <Link href="/admin/pertemuan" className="text-sm text-blue-600 hover:text-blue-700">
              Lihat Semua
            </Link>
          </div>
          {upcomingMeetings.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Belum ada pertemuan mendatang</p>
          ) : (
            <div className="space-y-4">
              {upcomingMeetings.map((p) => (
                <div key={p.pertemuan_id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        Pertemuan {String(p.pertemuan_ke).padStart(2, '0')}
                      </p>
                      <p className="text-sm text-gray-600">{p.judul}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {p.tanggal} | {p.jam_mulai}–{p.jam_selesai} WIB
                      </p>
                    </div>
                    <MeetingStatus pertemuan={p} showCountdown={false} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Izin Menunggu Verifikasi</h2>
            <Link href="/admin/verifikasi-izin" className="text-sm text-blue-600 hover:text-blue-700">
              Lihat Semua
            </Link>
          </div>
          {pendingPermissions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Tidak ada izin menunggu</p>
          ) : (
            <div className="space-y-3">
              {pendingPermissions.map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                  <div>
                    <p className="font-medium text-gray-900">{item.nama}</p>
                    <p className="text-xs text-gray-500">
                      {item.kelompok} | {item.pertemuan}
                    </p>
                    <p className="text-xs text-gray-500">{item.alasan}</p>
                  </div>
                  <StatusBadge status="MENUNGGU" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Kehadiran Kelompok Rendah</h2>
          {lowAttendanceGroups.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Belum ada data kehadiran kelompok</p>
          ) : (
            <div className="space-y-3">
              {lowAttendanceGroups.map((item) => (
                <div key={item.nama} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-red-500" />
                    <span className="font-medium text-gray-900">{item.nama}</span>
                  </div>
                  <span className="text-sm font-bold text-red-600">{item.persentase}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Kelompok</h2>
          {kelompokList.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Belum ada kelompok</p>
          ) : (
            <div className="space-y-3">
              {kelompokList.slice(0, 5).map((k) => {
                const mentor = mentorList.find((m) => m.mentor_id === k.mentor_id);
                return (
                  <div key={k.kelompok_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{k.nama_kelompok}</p>
                      <p className="text-xs text-gray-500">{mentor?.nama || '-'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{k.jumlah_anggota} anggota</p>
                      <StatusBadge status={k.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
