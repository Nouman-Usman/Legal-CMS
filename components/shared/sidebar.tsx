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
    CalendarClock,
    Wallet,
    AlarmClock,
    SearchCheck,
    ScrollText,
    Search,
    PenTool,
    MessageSquare,
    FolderOpen,
    Zap,
    History,
    Bell,
    User as UserIcon,
    ArrowUpRight,
    Lock,
    UserPlus,
    Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogoMark } from '@/components/shared/logo-mark';
import { manrope } from '@/components/landing/fonts';
import '@/components/landing/landing.css';
import '@/components/dashboard/dash.css';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
    /** `column`: the desktop side column (collapsible). `drawer`: inside the mobile menu sheet. */
    variant?: 'column' | 'drawer';
    /** Called when a link is followed, so the mobile drawer can close. */
    onNavigate?: () => void;
}

export function Sidebar({ isCollapsed, onToggle, variant = 'column', onNavigate }: SidebarProps) {
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
                        { name: 'Daily Docket', href: '/dashboard/chambers-admin/docket', icon: CalendarClock },
                        { name: 'Cause List', href: '/dashboard/chambers-admin/cause-list', icon: ScrollText },
                        { name: 'Deadlines', href: '/dashboard/chambers-admin/deadlines', icon: AlarmClock },
                        { name: 'All Cases', href: '/dashboard/chambers-admin/cases', icon: Briefcase },
                        { name: 'All Lawyers', href: '/dashboard/chambers-admin/lawyers', icon: Gavel },
                        { name: 'Our Clients', href: '/dashboard/chambers-admin/clients', icon: Users },
                        { name: 'Intake', href: '/dashboard/chambers-admin/intake', icon: SearchCheck },
                        { name: 'Fees & Dues', href: '/dashboard/chambers-admin/fees', icon: Wallet },
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

        if (userRole === 'munshi') {
            return [
                {
                    label: 'Daily',
                    items: [
                        { name: 'Today', href: '/dashboard/munshi', icon: CalendarClock },
                        { name: 'Cause List', href: '/dashboard/munshi/cause-list', icon: ScrollText },
                        { name: 'Cases', href: '/dashboard/munshi/cases', icon: Briefcase },
                        { name: 'Deadlines', href: '/dashboard/munshi/deadlines', icon: AlarmClock },
                        { name: 'To Collect', href: '/dashboard/munshi/collect', icon: Wallet },
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
                        { name: 'Daily Docket', href: '/dashboard/lawyer/docket', icon: CalendarClock },
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
    const collapsed = variant === 'column' && isCollapsed;
    const initial = user?.full_name?.charAt(0) || userRole?.charAt(0).toUpperCase();

    return (
        <aside
            className={cn('landing l-dash l-side', manrope.variable, collapsed && 'is-collapsed', variant === 'drawer' && 'is-drawer')}
            aria-label="Dashboard"
        >
            <Link href="/" className="l-side__brand" aria-label="apna waqeel, home" onClick={onNavigate}>
                <LogoMark tone="lime" className="w-9 h-9" />
                {!collapsed && (
                    <span aria-hidden="true">
                        <b>apna</b> waqeel
                    </span>
                )}
            </Link>

            <nav className="l-side__nav" aria-label="Dashboard sections">
                {navGroups.map((group, gIdx) => (
                    <div key={gIdx} className="l-side__group">
                        {!collapsed && <span className="l-label">{group.label}</span>}
                        <ul>
                            {group.items.map((item) => {
                                const isActive = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/' && !['/dashboard/chambers-admin', '/dashboard/lawyer', '/dashboard/munshi', '/dashboard/client'].includes(item.href) && pathname.startsWith(item.href + '/'));
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className="l-side__link"
                                            aria-current={isActive ? 'page' : undefined}
                                            aria-label={collapsed ? item.name : undefined}
                                            onClick={onNavigate}
                                        >
                                            <item.icon aria-hidden="true" className="w-5 h-5 shrink-0" />
                                            {collapsed ? (
                                                <span className="l-side__tip" aria-hidden="true">
                                                    {item.name}
                                                </span>
                                            ) : (
                                                <span>{item.name}</span>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            <div className="l-side__foot">
                <div className="l-side__user">
                    <Avatar className="w-10 h-10 rounded-xl">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback className="l-side__avatar">{initial}</AvatarFallback>
                    </Avatar>
                    {!collapsed && (
                        <span className="l-side__who">
                            <span className="l-side__name">{user?.full_name || 'Anonymous Operator'}</span>
                            <span className="l-label">{userRole?.replace('_', ' ')}</span>
                        </span>
                    )}
                </div>

                {variant === 'column' && (
                    <button
                        type="button"
                        onClick={onToggle}
                        className="l-side__btn"
                        aria-label={isCollapsed ? 'Expand menu' : undefined}
                        aria-expanded={!isCollapsed}
                    >
                        {isCollapsed ? (
                            <ChevronRight aria-hidden="true" className="w-5 h-5" />
                        ) : (
                            <>
                                <ChevronLeft aria-hidden="true" className="w-5 h-5" />
                                <span>Collapse Menu</span>
                            </>
                        )}
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => signOut()}
                    className="l-side__btn l-side__btn--out"
                    aria-label={collapsed ? 'Sign Out' : undefined}
                >
                    <LogOut aria-hidden="true" className="w-5 h-5 shrink-0" />
                    {!collapsed && <span>Sign Out</span>}
                </button>
            </div>
        </aside>
    );
}
