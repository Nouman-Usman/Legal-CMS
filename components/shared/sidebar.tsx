'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import {
    LayoutDashboard,
    Briefcase,
    Users,
    UserSquare2,
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
    History,
    Bell,
    User as UserIcon,
    ArrowUpRight,
    Lock,
    UserPlus,
    Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const { signOut, userRole, user } = useAuth();

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
                    label: 'Main',
                    items: [
                        { name: 'Home', href: '/dashboard/chambers-admin', icon: Home },
                    ]
                },
                {
                    label: 'Management',
                    items: [
                        { name: 'All Cases', href: '/dashboard/chambers-admin/cases', icon: Briefcase },
                        { name: 'All Lawyers', href: '/dashboard/chambers-admin/lawyers', icon: Gavel },
                        { name: 'Our Clients', href: '/dashboard/chambers-admin/clients', icon: Users },
                    ]
                },
                {
                    label: 'Growth',
                    items: [
                        { name: 'Leads Pipeline', href: '/dashboard/chambers-admin/leads', icon: Zap },
                    ]
                },
                {
                    label: 'Administration',
                    items: [
                        { name: 'Calendar', href: '/dashboard/chambers-admin/calendar', icon: Calendar },
                        { name: 'Settings', href: '/dashboard/chambers-admin/settings', icon: Settings },
                    ]
                }
            ];
        }

        if (userRole === 'lawyer') {
            return [
                {
                    label: 'Main',
                    items: [
                        { name: 'Home', href: '/dashboard/lawyer', icon: Home },
                    ]
                },
                {
                    label: 'Operations',
                    items: [
                        { name: 'My Cases', href: '/dashboard/lawyer/cases', icon: Briefcase },
                        { name: 'My Tasks', href: '/dashboard/lawyer/tasks', icon: FileText },
                    ]
                },
                {
                    label: 'Tools',
                    items: [
                        { name: 'Case Research', href: '/dashboard/lawyer/research', icon: Search },
                        { name: 'Drafting Tool', href: '/dashboard/lawyer/drafting', icon: PenTool },
                    ]
                },
                {
                    label: 'Messaging',
                    items: [
                        { name: 'Messages', href: '/dashboard/lawyer/messages', icon: MessageSquare },
                        { name: 'My Calendar', href: '/dashboard/lawyer/calendar', icon: Calendar },
                    ]
                },
                {
                    label: 'Account',
                    items: [
                        { name: 'Profile Settings', href: '/dashboard/lawyer/profile', icon: UserIcon },
                    ]
                }
            ];
        }

        if (userRole === 'client') {
            return [
                {
                    label: 'Main',
                    items: [
                        { name: 'Home', href: '/dashboard/client', icon: Home },
                    ]
                },
                {
                    label: 'Client Dashboard',
                    items: [
                        { name: 'My Cases', href: '/dashboard/client/cases', icon: Briefcase },
                        { name: 'My Documents', href: '/dashboard/client/documents', icon: FolderOpen },
                    ]
                },
                {
                    label: 'Communication',
                    items: [
                        { name: 'Lawyer Messages', href: '/dashboard/client/messages', icon: MessageSquare },
                        { name: 'Find Lawyers', href: '/dashboard/client/find-lawyers', icon: Search },
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
                "flex flex-col h-screen bg-slate-950 text-slate-400 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] border-r border-white/5 relative z-50 shadow-2xl overflow-hidden",
                isCollapsed ? "w-24" : "w-80"
            )}
        >
            {/* Elite Background Accents */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Firmware Header */}
            <div className="flex items-center gap-4 px-6 h-28 shrink-0 relative">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition-opacity duration-500" />
                    <div className="relative w-12 h-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center shadow-2xl">
                        <Scale className="w-6 h-6 text-blue-400" />
                    </div>
                </div>
                {!isCollapsed && (
                    <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-500">
                        <span className="font-black text-xl text-white tracking-tighter uppercase leading-none italic">
                            Chambers <span className="text-blue-600">Admin</span>
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mt-1">Management Hub</span>
                    </div>
                )}
            </div>

            {/* Dynamic Navigation */}
            <div className="flex-1 overflow-y-auto py-4 px-4 space-y-10 no-scrollbar">
                {navGroups.map((group, gIdx) => (
                    <div key={gIdx} className="space-y-3">
                        {!isCollapsed && (
                            <div className="px-4 flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 italic whitespace-nowrap">
                                    {group.label}
                                </span>
                                <div className="h-px w-full bg-slate-900" />
                            </div>
                        )}
                        <div className="space-y-1.5">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/' && !['/dashboard/chambers-admin', '/dashboard/lawyer', '/dashboard/client'].includes(item.href) && pathname.startsWith(item.href + '/'));
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-4 px-4 h-14 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                                            isActive
                                                ? "bg-white/[0.03] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
                                                : "hover:bg-white/[0.02] hover:text-white"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                                            isActive
                                                ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20"
                                                : "bg-slate-900 text-slate-500 group-hover:text-slate-300 group-hover:scale-110"
                                        )}>
                                            <item.icon className="w-5 h-5" />
                                        </div>

                                        {!isCollapsed && (
                                            <div className="flex flex-col flex-1 animate-in fade-in slide-in-from-left-2 duration-300">
                                                <span className={cn(
                                                    "text-xs font-black uppercase tracking-widest",
                                                    isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                                                )}>{item.name}</span>
                                            </div>
                                        )}

                                        {isActive && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full shadow-[0_0_20px_rgba(37,99,235,0.8)]" />
                                        )}

                                        {/* Hover Tooltip for Collapsed State */}
                                        {isCollapsed && (
                                            <div className="absolute left-[calc(100%+1rem)] px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100] shadow-2xl border border-white/5 translate-x-1 group-hover:translate-x-0">
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

            {/* Profile & Firmware Commands */}
            <div className="p-6 space-y-6 relative shrink-0">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                {/* Tactical User Hub */}
                {!isCollapsed ? (
                    <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center gap-4 group transition-all hover:bg-white/[0.04]">
                        <div className="relative">
                            <Avatar className="w-12 h-12 rounded-2xl border-2 border-slate-900 group-hover:scale-105 transition-transform duration-300">
                                <AvatarImage src={user?.user_metadata?.avatar_url} />
                                <AvatarFallback className="bg-blue-600 text-white text-xs font-black italic">
                                    {user?.full_name?.charAt(0) || userRole?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-slate-950 animate-pulse" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-black text-white truncate uppercase italic tracking-tighter">
                                {user?.full_name || 'Anonymous Operator'}
                            </span>
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-500/80">
                                {userRole?.replace('_', ' ')}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center">
                        <Avatar className="w-12 h-12 rounded-2xl border-2 border-slate-900 hover:scale-110 transition-transform duration-300 cursor-pointer">
                            <AvatarFallback className="bg-blue-600 text-white text-xs font-black italic">
                                {user?.full_name?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    <button
                        onClick={onToggle}
                        className="flex w-full items-center justify-center gap-3 text-slate-500 hover:text-white hover:bg-white/5 h-14 rounded-2xl transition-all border border-transparent hover:border-white/5 group"
                    >
                        {isCollapsed ? <ChevronRight className="w-6 h-6" /> : (
                            <>
                                <ChevronLeft className="w-5 h-5 shrink-0 opacity-50 group-hover:opacity-100" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Collapse Menu</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={() => signOut()}
                        className="flex w-full items-center justify-center gap-3 text-rose-500 hover:text-white hover:bg-rose-500 h-14 rounded-2xl transition-all border border-rose-500/20 group relative overflow-hidden"
                    >
                        <LogOut className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
                        {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">Sign Out</span>}
                    </button>
                </div>
            </div>
        </aside>
    );
}

