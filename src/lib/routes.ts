export function getDashboardPath(role?: string) {
  if (role === 'ADMIN') return '/admin/dashboard';
  return '/mentor/dashboard';
}
