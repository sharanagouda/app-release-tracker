'use client';

import Sidebar from './Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden gap-0">
      <Sidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50">
        {children}
      </main>
    </div>
  );
}

