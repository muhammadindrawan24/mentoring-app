'use client';

import { AppLayout } from '@/components/layout/app-layout';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout role="ADMIN">{children}</AppLayout>;
}
