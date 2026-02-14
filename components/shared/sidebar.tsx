'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import {
    LayoutDashboard,
    Briefcase,
    Users,
    Calendar,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    ShieldCheck,
    FileText,
    Gavel,
    Search,
    PenTool,
    MessageSquare,
    FolderOpen,
    Zap,
    Scale,
    User as UserIcon,
    Home,
    Search as SearchIcon,
    Command
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const { signOut, userRole, user } = useAuth();

    // Helper to determine if a route is active
    const isRouteActive = (href: string) => {
        if (pathname === href) return true;
        // Prevent partial matching for root dashboard paths
        if (href === '/' || href === '/dashboard' ||
            ['/dashboard/chambers-admin', '/dashboard/lawyer', '/dashboard/client'].includes(href)) {
            return false;
        }

        return pathname.startsWith(href + '/');
    };

    const getNavGroups = () => {
        const common = {
            label: 'Main',
            items: [
                { name: 'Home', href: '/', icon: Home },
                { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
            ]
        };

        if (userRole === 'chamber_admin') {
            return [
                {
                    label: 'Overview',
                    items: [
                        { name: 'Dashboard', href: '/dashboard/chambers-admin', icon: LayoutDashboard },
                        { name: 'Leads Pipeline', href: '/dashboard/chambers-admin/leads', icon: Zap },
                    ]
                },
                {
                    label: 'Management',
                    items: [
                        { name: 'Cases', href: '/dashboard/chambers-admin/cases', icon: Briefcase },
                        { name: 'Lawyers', href: '/dashboard/chambers-admin/lawyers', icon: Gavel },
                        { name: 'Clients', href: '/dashboard/chambers-admin/clients', icon: Users },
                    ]
                },
                {
                    label: 'Operations',
                    items: [
                        { name: 'Messages', href: '/dashboard/chambers-admin/messages', icon: MessageSquare },
                        { name: 'Calendar', href: '/dashboard/chambers-admin/calendar', icon: Calendar },
                    ]
                },
                {
                    label: 'System',
                    items: [
                        { name: 'Settings', href: '/dashboard/chambers-admin/settings', icon: Settings },
                        { name: 'Audit Logs', href: '/dashboard/chambers-admin/audit-logs', icon: ShieldCheck },
                    ]
                }
            ];
        }

        if (userRole === 'lawyer') {
            return [
                {
                    label: 'Overview',
                    items: [
                        { name: 'Dashboard', href: '/dashboard/lawyer', icon: LayoutDashboard },
                        { name: 'Calendar', href: '/dashboard/lawyer/calendar', icon: Calendar },
                    ]
                },
                {
                    label: 'Caseload',
                    items: [
                        { name: 'My Cases', href: '/dashboard/lawyer/cases', icon: Briefcase },
                        { name: 'Tasks', href: '/dashboard/lawyer/tasks', icon: FileText },
                    ]
                },
                {
                    label: 'Tools',
                    items: [
                        { name: 'Research', href: '/dashboard/lawyer/research', icon: Search },
                        { name: 'Drafting', href: '/dashboard/lawyer/drafting', icon: PenTool },
                        { name: 'Messages', href: '/dashboard/lawyer/messages', icon: MessageSquare },
                    ]
                },
                {
                    label: 'Settings',
                    items: [
                        { name: 'Profile', href: '/dashboard/lawyer/profile', icon: UserIcon },
                    ]
                }
            ];
        }

        if (userRole === 'client') {
            return [
                {
                    label: 'Overview',
                    items: [
                        { name: 'Dashboard', href: '/dashboard/client', icon: LayoutDashboard },
                        { name: 'Find Lawyers', href: '/dashboard/client/find-lawyers', icon: Search },
                    ]
                },
                {
                    label: 'Matters',
                    items: [
                        { name: 'My Cases', href: '/dashboard/client/cases', icon: Briefcase },
                        { name: 'Documents', href: '/dashboard/client/documents', icon: FolderOpen },
                        { name: 'Messages', href: '/dashboard/client/messages', icon: MessageSquare },
                    ]
                }
            ];
        }

        return [common];
    };

    const navGroups = getNavGroups();

    return (
        <aside
            className={cn(
                "flex flex-col h-screen bg-[#09090b] text-slate-400 border-r border-white/[0.08] transition-all duration-300 relative z-50",
                isCollapsed ? "w-[80px]" : "w-[260px]"
            )}
        >
            {/* Header / Brand */}
            <div className="flex flex-col gap-4 p-4 shrink-0">
                <div className="flex items-center gap-3 h-10 overflow-hidden">
                    <div className="flex items-center justify-center shrink-0 w-10 h-10 bg-white text-black rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                        <Scale className="w-5 h-5" strokeWidth={2.5} />
                    </div>

                    <div className={cn(
                        "flex flex-col transition-all duration-300 origin-left min-w-0",
                        isCollapsed ? "opacity-0 w-0 translate-x-4" : "opacity-100 w-auto"
                    )}>
                        <span className="font-semibold text-white tracking-tight text-[15px] whitespace-nowrap">
                            Apna Waqeel
                        </span>
                        <span className="text-[10px] uppercase font-medium text-slate-500 tracking-wider">
                            Workspace
                        </span>
                    </div>
                </div>

                {!isCollapsed && (
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full h-9 bg-white/[0.03] border border-white/[0.08] rounded-lg pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/[0.15] transition-colors"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 border border-white/[0.08] rounded px-1.5 py-0.5 bg-white/[0.02]">
                            <Command className="w-3 h-3 text-slate-600" />
                            <span className="text-[10px] text-slate-600 font-medium">K</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 no-scrollbar">
                {navGroups.map((group, gIdx) => (
                    <div key={gIdx} className="space-y-1">
                        {!isCollapsed && (
                            <div className="px-3 mb-2 flex items-center justify-between group/label">
                                <h3 className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">
                                    {group.label}
                                </h3>
                            </div>
                        )}

                        <div className="space-y-0.5">
                            {group.items.map((item) => {
                                const isActive = isRouteActive(item.href);

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="group relative block"
                                    >
                                        <div className={cn(
                                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                                            isActive
                                                ? "bg-white/[0.08] text-white font-medium"
                                                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
                                        )}>
                                            <item.icon className={cn(
                                                "h-4.5 w-4.5 shrink-0 transition-colors",
                                                isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"
                                            )} strokeWidth={1.5} />

                                            <span className={cn(
                                                "transition-all duration-300 overflow-hidden whitespace-nowrap",
                                                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                                            )}>
                                                {item.name}
                                            </span>
                                        </div>

                                        {/* Tooltip for collapsed state */}
                                        {isCollapsed && (
                                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-[#09090b] text-white text-xs font-medium rounded-md shadow-xl border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                                                {item.name}
                                            </div>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer / Profile */}
            <div className="p-3 border-t border-white/[0.08] bg-[#09090b]">
                <div className={cn(
                    "relative flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-white/[0.04] group cursor-pointer border border-transparent hover:border-white/[0.05]",
                    isCollapsed ? "justify-center" : ""
                )}>
                    <Avatar className="h-9 w-9 shrink-0 border border-white/10">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-white/10 text-slate-300 text-xs font-medium">
                            {user?.full_name?.charAt(0) || userRole?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    {!isCollapsed && (
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[13px] font-medium text-white truncate">
                                {user?.full_name || 'User'}
                            </span>
                            <span className="text-[11px] text-slate-500 truncate capitalize">
                                {userRole?.replace('_', ' ')}
                            </span>
                        </div>
                    )}

                    {!isCollapsed && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Settings className="w-4 h-4 text-slate-500" />
                        </div>
                    )}
                </div>

                <div className="mt-2 grid grid-cols-2 gap-1">
                    <button
                        onClick={onToggle}
                        className={cn(
                            "flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all border border-transparent hover:border-white/[0.05]",
                            isCollapsed ? "col-span-2" : ""
                        )}
                        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </button>

                    {!isCollapsed && (
                        <button
                            onClick={() => signOut()}
                            className="flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/10"
                            title="Sign Out"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {isCollapsed && (
                    <button
                        onClick={() => signOut()}
                        className="mt-1 w-full flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        title="Sign Out"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                )}
            </div>
        </aside>
    );
}
