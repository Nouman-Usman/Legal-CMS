'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { Sidebar } from '@/components/shared/sidebar';
import { MobileBar } from '@/components/dashboard/mobile-bar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load sidebar state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null) {
      setSidebarCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save sidebar state to localStorage
  const handleToggle = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-neutral-50">
        <div className="lg:hidden">
          <MobileBar />
        </div>
        <div className="hidden lg:flex">
          <Sidebar isCollapsed={sidebarCollapsed} onToggle={handleToggle} />
        </div>
        <main className="flex-1 overflow-y-auto relative scroll-smooth">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
