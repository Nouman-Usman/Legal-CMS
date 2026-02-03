'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { NotificationsPanel } from './notifications-panel';
import { LogOut, LayoutDashboard, Users, FileText, MessageSquare, CheckSquare2, Settings, ChevronLeft, ChevronRight, Scale, Search } from 'lucide-react';

const navItems = {
  chamber_admin: [
    { href: '/dashboard/chambers-admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/chambers-admin/lawyers', label: 'Lawyers', icon: Users },
    { href: '/dashboard/chambers-admin/cases', label: 'Cases', icon: FileText },
    { href: '/dashboard/chambers-admin/settings', label: 'Settings', icon: Settings },
  ],
  lawyer: [
    { href: '/dashboard/lawyer', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/lawyer/cases', label: 'My Cases', icon: FileText },
    { href: '/dashboard/lawyer/messages', label: 'Messages', icon: MessageSquare },
    { href: '/dashboard/lawyer/tasks', label: 'Tasks', icon: CheckSquare2 },
  ],
  client: [
    { href: '/dashboard/client', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/client/cases', label: 'My Cases', icon: FileText },
    { href: '/dashboard/client/messages', label: 'Messages', icon: MessageSquare },
    { href: '/dashboard/client/find-lawyers', label: 'Find Lawyers', icon: Search },
  ],
};

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, userRole, signOut } = useAuth();

  const items = userRole ? navItems[userRole] : [];

  return (
    <div
      className={`border-r border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50 to-slate-50/50 dark:from-slate-950 dark:to-slate-950/50 flex flex-col h-screen transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header Logo */}
      <div className="px-4 py-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center gap-3">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <h1 className="font-bold text-base text-slate-900 dark:text-white">Apna Waqeel</h1>
          </div>
        )}
        {!isCollapsed && <NotificationsPanel />}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Notifications - Hidden when collapsed */}
      {isCollapsed && (
        <div className="px-3 py-4 flex justify-center border-b border-slate-200 dark:border-slate-800">
          <NotificationsPanel />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="block">
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={`w-full h-10 font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                } ${isCollapsed ? 'px-2 justify-center' : 'justify-start px-3'}`}
                title={isCollapsed ? item.label : ''}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && <span className="ml-3 text-sm">{item.label}</span>}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Sign Out */}
      <div className="px-3 py-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        {!isCollapsed && (
          <div className="px-3 py-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <p className="font-medium text-sm text-slate-900 dark:text-white truncate">{user?.full_name || 'User'}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-1">{user?.email}</p>
          </div>
        )}
        <Button
          variant="outline"
          className={`w-full h-10 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800 transition-colors duration-200 ${
            isCollapsed ? 'px-2 justify-center' : 'justify-start px-3'
          }`}
          onClick={signOut}
          title={isCollapsed ? 'Sign Out' : ''}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span className="ml-3 text-sm font-medium">Sign Out</span>}
        </Button>
      </div>
    </div>
  );
}
