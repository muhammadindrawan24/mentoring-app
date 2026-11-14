'use client';

import { RealtimeClock } from '@/components/ui/realtime-clock';
import { useAuthStore } from '@/lib/auth-store';
import { User } from 'lucide-react';

export function Header() {
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="lg:ml-0 ml-12">
          <RealtimeClock />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{user?.nama}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-blue-600" />
          </div>
        </div>
      </div>
    </header>
  );
}
