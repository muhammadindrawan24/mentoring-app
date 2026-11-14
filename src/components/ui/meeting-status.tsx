'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Pertemuan } from '@/types';

interface MeetingStatusProps {
  pertemuan: Pertemuan;
  showCountdown?: boolean;
}

function getMeetingState(pertemuan: Pertemuan): 'upcoming' | 'ongoing' | 'completed' {
  const now = new Date();
  const [year, month, day] = pertemuan.tanggal.split('-').map(Number);
  const [startHour, startMin] = pertemuan.jam_mulai.split(':').map(Number);
  const [endHour, endMin] = pertemuan.jam_selesai.split(':').map(Number);

  const startTime = new Date(year, month - 1, day, startHour, startMin);
  const endTime = new Date(year, month - 1, day, endHour, endMin);

  if (now < startTime) return 'upcoming';
  if (now >= startTime && now <= endTime) return 'ongoing';
  return 'completed';
}

function getCountdown(pertemuan: Pertemuan): string {
  const now = new Date();
  const [year, month, day] = pertemuan.tanggal.split('-').map(Number);
  const [startHour, startMin] = pertemuan.jam_mulai.split(':').map(Number);
  const startTime = new Date(year, month - 1, day, startHour, startMin);
  const diff = startTime.getTime() - now.getTime();

  if (diff <= 0) return '00:00:00';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function MeetingStatus({ pertemuan, showCountdown = true }: MeetingStatusProps) {
  const [state, setState] = useState<'upcoming' | 'ongoing' | 'completed'>('upcoming');
  const [countdown, setCountdown] = useState('00:00:00');

  useEffect(() => {
    const update = () => {
      setState(getMeetingState(pertemuan));
      setCountdown(getCountdown(pertemuan));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [pertemuan]);

  if (state === 'ongoing') {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
        <div className="flex-shrink-0">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </div>
        <span className="font-semibold text-red-700">MENTORING SEDANG BERLANGSUNG</span>
      </div>
    );
  }

  if (state === 'completed') {
    return (
      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
        <span className="text-green-600 text-lg">&#10003;</span>
        <span className="font-semibold text-green-700">Pertemuan Selesai</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
      <span className="text-yellow-600 text-lg">&#128336;</span>
      <div>
        <span className="font-semibold text-yellow-700">Akan Datang</span>
        {showCountdown && (
          <span className="ml-2 text-yellow-800 font-mono">
            Pertemuan dimulai dalam: <strong>{countdown}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
