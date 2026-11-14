'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import type { AppRole } from './app-layout';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UsersRound,
  CalendarDays,
  BookOpen,
  ClipboardCheck,
  ShieldCheck,
  Camera,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Megaphone,
  Star,
  Bell,
  User,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  children?: { label: string; href: string }[];
}

const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Mentee', href: '/admin/mentees', icon: <Users className="h-5 w-5" /> },
  { label: 'Mentor', href: '/admin/mentors', icon: <GraduationCap className="h-5 w-5" /> },
  { label: 'Kelompok', href: '/admin/kelompok', icon: <UsersRound className="h-5 w-5" /> },
  { label: 'Pertemuan', href: '/admin/pertemuan', icon: <CalendarDays className="h-5 w-5" /> },
  { label: 'Materi', href: '/admin/materi', icon: <BookOpen className="h-5 w-5" /> },
  { label: 'Absensi', href: '/admin/absensi', icon: <ClipboardCheck className="h-5 w-5" /> },
  { label: 'Verifikasi Izin', href: '/admin/verifikasi-izin', icon: <ShieldCheck className="h-5 w-5" /> },
  { label: 'Dokumentasi', href: '/admin/dokumentasi', icon: <Camera className="h-5 w-5" /> },
  { label: 'Catatan Mentoring', href: '/admin/catatan', icon: <FileText className="h-5 w-5" /> },
  { label: 'Evaluasi', href: '/admin/evaluasi', icon: <Star className="h-5 w-5" /> },
  { label: 'Pengumuman', href: '/admin/pengumuman', icon: <Megaphone className="h-5 w-5" /> },
  { label: 'Laporan', href: '/admin/laporan', icon: <BarChart3 className="h-5 w-5" /> },
  { label: 'Pengaturan', href: '/admin/pengaturan', icon: <Settings className="h-5 w-5" /> },
];

const mentorNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/mentor/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Kelompok Saya', href: '/mentor/kelompok-saya', icon: <UsersRound className="h-5 w-5" /> },
  { label: 'Mentee', href: '/mentor/mentees', icon: <Users className="h-5 w-5" /> },
  { label: 'Pertemuan', href: '/mentor/pertemuan', icon: <CalendarDays className="h-5 w-5" /> },
  { label: 'Materi', href: '/mentor/materi', icon: <BookOpen className="h-5 w-5" /> },
  { label: 'Absensi', href: '/mentor/absensi', icon: <ClipboardCheck className="h-5 w-5" /> },
  { label: 'Dokumentasi', href: '/mentor/dokumentasi', icon: <Camera className="h-5 w-5" /> },
  { label: 'Catatan Mentoring', href: '/mentor/catatan', icon: <FileText className="h-5 w-5" /> },
  { label: 'Evaluasi', href: '/mentor/evaluasi', icon: <Star className="h-5 w-5" /> },
  { label: 'Pengumuman', href: '/mentor/pengumuman', icon: <Bell className="h-5 w-5" /> },
  { label: 'Profil', href: '/mentor/profil', icon: <User className="h-5 w-5" /> },
];

interface SidebarProps {
  role: AppRole;
  title: string;
}

export function Sidebar({ role, title }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const navItems = role === 'ADMIN' ? adminNavItems : mentorNavItems;

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
      >
        <Menu className="h-5 w-5 text-gray-600" />
      </button>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">SIM Mentoring</h1>
              <p className="text-xs text-gray-500">Islam 2026</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1 rounded hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="px-3 py-2 border-b border-gray-100">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {title}
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto h-[calc(100vh-8rem)] py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => (
              <li key={item.label}>
                {item.children ? (
                  <>
                    <button
                      onClick={() => toggleExpand(item.label)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                        pathname.startsWith(item.href)
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      {item.icon}
                      <span className="flex-1 text-left">{item.label}</span>
                      {expandedItems.includes(item.label) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {expandedItems.includes(item.label) && (
                      <ul className="ml-6 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              onClick={() => setIsOpen(false)}
                              className={cn(
                                'block px-3 py-2 text-sm rounded-lg transition-colors',
                                pathname === child.href
                                  ? 'bg-blue-50 text-blue-700 font-medium'
                                  : 'text-gray-600 hover:bg-gray-50'
                              )}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                      pathname === item.href
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}