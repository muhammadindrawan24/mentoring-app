'use client';

import { Construction } from 'lucide-react';

export default function ProfilPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Construction className="h-16 w-16 text-yellow-500 mb-4" />
      <h1 className="text-2xl font-bold text-gray-900">Profil</h1>
      <p className="text-gray-500 mt-2">Halaman ini sedang dalam pengembangan.</p>
      <p className="text-sm text-gray-400 mt-1">Phase berikutnya akan mengimplementasikan fitur ini.</p>
    </div>
  );
}
