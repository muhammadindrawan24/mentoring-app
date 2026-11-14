'use client';

import { useEffect, useState } from 'react';

export function RealtimeClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) {
    return (
      <div className="text-sm text-gray-500">
        <div className="h-5 bg-gray-200 rounded animate-pulse w-48"></div>
      </div>
    );
  }

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Jakarta',
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Jakarta',
    hour12: false,
  };

  const dateStr = time.toLocaleDateString('id-ID', options);
  const timeStr = time.toLocaleTimeString('id-ID', timeOptions);

  return (
    <div className="text-sm text-gray-600">
      <div className="font-medium">{dateStr}</div>
      <div className="text-lg font-bold text-blue-600">{timeStr} WIB</div>
    </div>
  );
}
