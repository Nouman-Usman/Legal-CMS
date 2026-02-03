'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { getCalendarEvents } from '@/lib/supabase/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    Plus,
    Loader2,
    AlertCircle,
    Briefcase,
    CheckCircle2,
    Filter,
    Search,
    Grid3X3,
    List,
    Scale,
    Gavel,
    Bell,
    MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function CalendarPage() {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [filterType, setFilterType] = useState<'all' | 'hearing' | 'task'>('all');

    // Calculate calendar days
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const prevMonthDays = new Date(year, month, 0).getDate();

        const days = [];

        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            days.push({
                day: prevMonthDays - i,
                month: month - 1,
                year,
                currentMonth: false,
                date: new Date(year, month - 1, prevMonthDays - i)
            });
        }

        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                day: i,
                month,
                year,
                currentMonth: true,
                date: new Date(year, month, i)
            });
        }

        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                day: i,
                month: month + 1,
                year,
                currentMonth: false,
                date: new Date(year, month + 1, i)
            });
        }

        return days;
    }, [currentDate]);

    const loadEvents = async () => {
        if (!user?.chamber_id) return;

        const startDate = calendarDays[0].date;
        const endDate = calendarDays[calendarDays.length - 1].date;

        setLoading(true);
        const { events: fetchedEvents } = await getCalendarEvents(user.chamber_id, startDate, endDate);
        setEvents(fetchedEvents || []);
        setLoading(false);
    };

    useEffect(() => {
        loadEvents();
    }, [currentDate, user?.chamber_id]);

    const getDayEvents = (date: Date) => {
        return events.filter(e => {
            const eventDate = new Date(e.date);
            const isSameDay =
                eventDate.getDate() === date.getDate() &&
                eventDate.getMonth() === date.getMonth() &&
                eventDate.getFullYear() === date.getFullYear();

            const isSameType = filterType === 'all' || e.type === filterType;

            return isSameDay && isSameType;
        });
    };

    const selectedEvents = useMemo(() => {
        if (!selectedDate) return [];
        return getDayEvents(selectedDate);
    }, [selectedDate, events, filterType]);

    const stats = useMemo(() => {
        const monthEvents = events.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
        });

        return {
            total: monthEvents.length,
            hearings: monthEvents.filter(e => e.type === 'hearing').length,
            tasks: monthEvents.filter(e => e.type === 'task').length,
            urgent: monthEvents.filter(e => e.priority === 'high' || e.priority === 'critical').length
        };
    }, [events, currentDate]);

    return (
        <ProtectedRoute requiredRole="chamber_admin">
            <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
                {/* Advanced Header Bar */}
                <header className="flex items-center justify-between px-8 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 z-10">
                    <div className="flex items-center gap-6">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                <CalendarIcon className="w-6 h-6 text-indigo-600" />
                                Legal Calendar
                            </h1>
                            <p className="text-xs font-medium text-slate-400 mt-0.5 uppercase tracking-widest">Chambers Management System</p>
                        </div>

                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />

                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            <Button
                                variant={view === 'grid' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setView('grid')}
                                className="rounded-lg h-8 gap-2"
                            >
                                <Grid3X3 className="w-4 h-4" />
                                Grid
                            </Button>
                            <Button
                                variant={view === 'list' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setView('list')}
                                className="rounded-lg h-8 gap-2"
                            >
                                <List className="w-4 h-4" />
                                Timeline
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search events..."
                                className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 w-64 transition-all"
                            />
                        </div>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 rounded-xl gap-2 h-10 px-5 transition-all active:scale-95">
                            <Plus className="w-4 h-4" />
                            <span className="font-bold">Schedule Event</span>
                        </Button>
                    </div>
                </header>

                {/* Dynamic Stats Strip */}
                <div className="flex items-center gap-8 px-8 py-3 bg-indigo-50/30 dark:bg-indigo-900/10 border-b border-indigo-100/50 dark:border-indigo-900/30 shrink-0">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <Filter className="w-3 h-3" />
                        Quick Stats:
                    </div>
                    {[
                        { label: 'Month Overiew', value: stats.total, color: 'text-indigo-600', icon: CalendarIcon },
                        { label: 'Court Hearings', value: stats.hearings, color: 'text-amber-600', icon: Scale },
                        { label: 'Case Tasks', value: stats.tasks, color: 'text-emerald-600', icon: CheckCircle2 },
                        { label: 'Priority Alerts', value: stats.urgent, color: 'text-rose-600', icon: Bell },
                    ].map((stat, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className={cn("p-1.5 rounded-lg bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800", stat.color)}>
                                <stat.icon className="w-3 h-3" />
                            </div>
                            <span className="text-sm font-bold">{stat.value}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{stat.label}</span>
                        </div>
                    ))}

                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Filters:</span>
                        <div className="flex gap-1">
                            {['all', 'hearing', 'task'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type as any)}
                                    className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border",
                                        filterType === type
                                            ? "bg-white dark:bg-slate-800 border-indigo-200 text-indigo-600 shadow-sm"
                                            : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    )}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <main className="flex-1 flex overflow-hidden">
                    {/* Calendar Grid Container */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Calendar Controls */}
                        <div className="flex items-center justify-between px-8 py-5 bg-white dark:bg-slate-900/50 shrink-0">
                            <div className="flex items-center gap-4">
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                                    {currentDate.toLocaleString('default', { month: 'long' })}
                                    <span className="ml-2 font-normal text-slate-300 dark:text-slate-700">{currentDate.getFullYear()}</span>
                                </h2>
                                <div className="flex items-center gap-1.5 ml-4">
                                    <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="h-8 w-8 rounded-lg">
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" onClick={() => {
                                        const now = new Date();
                                        setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
                                        setSelectedDate(now);
                                    }} className="h-8 px-4 text-xs font-bold rounded-lg uppercase tracking-widest">
                                        Today
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="h-8 w-8 rounded-lg">
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                    <div className="w-2 h-2 rounded-full bg-amber-400" /> Hearings
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" /> Active Tasks
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                    <div className="w-2 h-2 rounded-full bg-indigo-600" /> Firm Events
                                </div>
                            </div>
                        </div>

                        {/* Scrolling Grid */}
                        <div className="flex-1 overflow-y-auto px-8 pb-8">
                            <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
                                <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                        <div key={d} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[2px]">
                                            {d}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 auto-rows-fr">
                                    {calendarDays.map((dayObj, i) => {
                                        const dayEvents = getDayEvents(dayObj.date);
                                        const isSelected = selectedDate && dayObj.date.toDateString() === selectedDate.toDateString();
                                        const isToday = dayObj.date.toDateString() === new Date().toDateString();

                                        return (
                                            <div
                                                key={i}
                                                onClick={() => setSelectedDate(dayObj.date)}
                                                className={cn(
                                                    "min-h-[140px] p-3 border-r border-b border-slate-50 dark:border-slate-800 transition-all cursor-pointer relative",
                                                    !dayObj.currentMonth && "bg-slate-50/20 dark:bg-slate-900/10 opacity-30",
                                                    isSelected && "bg-indigo-50/30 dark:bg-indigo-900/10 z-10",
                                                    "hover:bg-slate-50/80 dark:hover:bg-slate-800/20"
                                                )}
                                            >
                                                {/* Selection Highlight */}
                                                {isSelected && <div className="absolute inset-0 border-2 border-indigo-500/50 rounded-lg pointer-events-none" />}

                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={cn(
                                                        "flex items-center justify-center w-8 h-8 text-sm font-black rounded-xl transition-all",
                                                        isToday
                                                            ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 ring-4 ring-indigo-500/10"
                                                            : "text-slate-500 dark:text-slate-500 group-hover:text-indigo-600"
                                                    )}>
                                                        {dayObj.day}
                                                    </span>

                                                    {dayEvents.length > 0 && (
                                                        <div className="flex -space-x-1.5 overflow-hidden">
                                                            {dayEvents.slice(0, 3).map((_, idx) => (
                                                                <div key={idx} className="w-1.5 h-1.5 rounded-full bg-indigo-400 ring-2 ring-white dark:ring-slate-900" />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-1.5 overflow-hidden">
                                                    {dayEvents.slice(0, 3).map((event: any) => (
                                                        <div
                                                            key={event.id}
                                                            className={cn(
                                                                "group/event px-2 py-1.5 text-[9px] font-bold rounded-lg truncate transition-all duration-200 uppercase tracking-tight",
                                                                event.type === 'hearing'
                                                                    ? "bg-amber-100/40 text-amber-700 border border-amber-200/50 hover:bg-amber-100 hover:scale-[1.02]"
                                                                    : "bg-indigo-100/40 text-indigo-700 border border-indigo-200/50 hover:bg-indigo-100 hover:scale-[1.02]"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-1">
                                                                {event.type === 'hearing' ? <Gavel className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                                                                {event.title}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {dayEvents.length > 3 && (
                                                        <div className="text-[9px] font-black text-indigo-400/60 pl-1 uppercase tracking-tighter">
                                                            + {dayEvents.length - 3} Schedule
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Premium Agenda Sidebar */}
                    <aside className="w-96 shrink-0 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col z-20 overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 shrink-0">
                            <div className="flex items-center justify-between mb-2">
                                <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border-none px-3 font-black text-[10px] uppercase tracking-widest">
                                    Agenda Overview
                                </Badge>
                                <button className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-4">
                                {selectedDate?.toLocaleDateString('default', { day: 'numeric' })}
                                <span className="text-indigo-600">.</span>
                                <span className="text-slate-300 dark:text-slate-700 ml-1 font-medium">{selectedDate?.toLocaleDateString('default', { month: 'long' })}</span>
                            </h3>
                            <p className="text-slate-500 text-sm mt-1">{selectedEvents.length} schedules found for this day.</p>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-24 gap-4">
                                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Refreshing...</p>
                                </div>
                            ) : selectedEvents.length > 0 ? (
                                selectedEvents.map((event: any) => (
                                    <Link key={event.id} href={`/dashboard/chambers-admin/cases/${event.caseId}`} className="block">
                                        <div className="group relative p-5 bg-slate-50 dark:bg-slate-800/30 rounded-[24px] border border-transparent hover:border-indigo-500/30 hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 overflow-hidden">
                                            {/* Status bar */}
                                            <div className={cn(
                                                "absolute left-0 top-0 bottom-0 w-1.5 transition-all",
                                                event.type === 'hearing' ? "bg-amber-400" : "bg-indigo-600"
                                            )} />

                                            <div className="flex flex-col gap-4">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                            {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <h4 className="font-bold text-slate-900 dark:text-white mt-1 group-hover:text-indigo-600 transition-colors">{event.title}</h4>
                                                    </div>
                                                    <div className={cn(
                                                        "p-2 rounded-xl transition-all",
                                                        event.type === 'hearing' ? "bg-amber-500/10 text-amber-600" : "bg-indigo-500/10 text-indigo-600"
                                                    )}>
                                                        {event.type === 'hearing' ? <Gavel className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                                    </div>
                                                </div>

                                                <div className="h-px bg-slate-200/50 dark:bg-slate-700/50 w-full" />

                                                <div className="space-y-2.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center">
                                                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Case Ref.</span>
                                                            <span className="text-xs font-black text-slate-700 dark:text-slate-300">{event.caseNumber}</span>
                                                        </div>
                                                    </div>

                                                    {event.description && (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center">
                                                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Location / Venue</span>
                                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate w-48">{event.description}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="flex -space-x-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white dark:border-slate-800" />
                                                        <div className="w-6 h-6 rounded-full bg-slate-300 border-2 border-white dark:border-slate-800" />
                                                    </div>
                                                    <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                        View Case <ChevronRight className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                        <CheckCircle2 className="w-12 h-12 text-slate-300" />
                                    </div>
                                    <h5 className="text-xl font-bold text-slate-900 dark:text-white">Productive Day!</h5>
                                    <p className="text-sm text-slate-500 mt-2 px-10 leading-relaxed font-medium">There are no hearings or tasks scheduled for this date.</p>
                                    <Button variant="outline" className="mt-8 rounded-xl font-bold text-xs uppercase tracking-widest border-2">Add First Note</Button>
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t border-slate-100 dark:border-slate-800 shrink-0">
                            <Card className="border-none shadow-none bg-indigo-600 rounded-[28px] text-white relative overflow-hidden group/card">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover/card:scale-150 duration-700" />
                                <CardContent className="p-6 relative z-10">
                                    <h4 className="font-black text-lg mb-1">Calendar Sync</h4>
                                    <p className="text-indigo-100 text-xs font-medium leading-relaxed opacity-80 mb-4">Export these schedules directly to your mobile device.</p>
                                    <Button className="w-full bg-white text-indigo-600 font-black text-[10px] uppercase tracking-[2px] hover:bg-white hover:scale-105 transition-all shadow-xl">
                                        Connect Outlook
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </aside>
                </main>
            </div>
        </ProtectedRoute>
    );
}
