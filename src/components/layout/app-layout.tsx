'use client';

import { Sidebar } from './sidebar';
import { Header } from './header';
import { useAuthStore } from '@/lib/auth-store';
import { getDashboardPath } from '@/lib/routes';
import { hydrateAll } from '@/lib/hydrate';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loading } from '@/components/ui/loading';
import { ToastContainer } from '@/components/ui/toast';

export type AppRole = 'ADMIN' | 'MENTOR';

interface AppLayoutProps {
  children: React.ReactNode;
  role: AppRole;
}

const roleLabel: Record<AppRole, string> = {
  ADMIN: 'Admin / Panitia',
  MENTOR: 'Mentor',
};

export function AppLayout({ children, role }: AppLayoutProps) {
  const { isAuthenticated, initializeAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    initializeAuth();
    hydrateAll();
  }, [initializeAuth]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr) as { role?: string };
      // Guard role: role halaman harus sesuai dengan role user yang login
      if (user.role !== role) {
        router.push(user.role ? getDashboardPath(user.role) : '/login');
      }
    } catch {
      router.push('/login');
    }
  }, [isAuthenticated, role, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />
      <Sidebar role={role} title={roleLabel[role]} />
      <div className="lg:pl-72">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}