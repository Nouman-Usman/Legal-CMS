'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { Sidebar } from '@/components/shared/sidebar';
import { TimerWidget } from '@/components/domain/time/timer-widget';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, userRole } = useAuth();
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

  /* 
   * loading check removed to let ProtectedRoute handle it consistently.
   * If we double check loading here, we might flash or block incorrectly. 
   */

  const showTimer = userRole === 'chamber_admin' || userRole === 'lawyer';

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <Sidebar isCollapsed={sidebarCollapsed} onToggle={handleToggle} />
        <main className="flex-1 overflow-auto relative">
          {children}
          {showTimer && <TimerWidget />}
        </main>
      </div>
    </ProtectedRoute>
  );
}
