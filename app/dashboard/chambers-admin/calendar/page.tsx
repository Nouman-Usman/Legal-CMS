'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { getCalendarEvents } from '@/lib/supabase/calendar';
import { createClient } from '@/lib/supabase/client';
import { EventModal } from '@/components/shared/event-modal';
import { DeleteConfirmDialog } from '@/components/shared/delete-confirm-dialog';
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
    MoreVertical,
    Edit2,
    Trash2,
    Download
} from 'lucide-react';
import { DashPage, EmptyState, PageHeader, Panel, SearchInput, StatTile } from '@/components/dashboard/ui';
import Link from 'next/link';

export default function CalendarPage() {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [filterType, setFilterType] = useState<'all' | 'hearing' | 'task'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

            const matchesSearch = searchQuery === '' || 
                e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                e.caseNumber?.toLowerCase().includes(searchQuery.toLowerCase());

            return isSameDay && isSameType && matchesSearch;
        });
    };

    const selectedEvents = useMemo(() => {
        if (!selectedDate) return [];
        return getDayEvents(selectedDate);
    }, [selectedDate, events, filterType, searchQuery]);

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

    const [connecting, setConnecting] = useState(false);
    const supabase = createClient();

    const handleOpenCreateModal = () => {
        setSelectedEvent(null);
        setShowEventModal(true);
    };

    const handleOpenEditModal = (event: any) => {
        setSelectedEvent(event);
        setShowEventModal(true);
    };

    const handleDeleteEvent = async () => {
        if (!selectedEvent) return;

        try {
            const response = await fetch('/api/calendar/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedEvent.id,
                    type: selectedEvent.type
                })
            });

            if (!response.ok) {
                throw new Error('Failed to delete event');
            }

            setShowDeleteConfirm(false);
            setSelectedEvent(null);
            loadEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    };

    const handleEventSuccess = () => {
        loadEvents();
    };

    const handleExportCalendar = async (format: 'ics' | 'csv') => {
        if (!user?.chamber_id) return;

        try {
            const startDate = calendarDays[0].date.toISOString().split('T')[0];
            const endDate = calendarDays[calendarDays.length - 1].date.toISOString().split('T')[0];

            const response = await fetch('/api/calendar/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chamberId: user.chamber_id,
                    startDate,
                    endDate,
                    format
                })
            });

            if (!response.ok) {
                throw new Error('Failed to export calendar');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `calendar-${new Date().toISOString().split('T')[0]}.${format === 'ics' ? 'ics' : 'csv'}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error exporting calendar:', error);
        }
    };

    const handleConnectGoogle = async () => {
        setConnecting(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/dashboard/chambers-admin/calendar`,
                    scopes: 'https://www.googleapis.com/auth/calendar',
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });

            if (error) {
                console.error('Error connecting to Google:', error);
            }
        } catch (err) {
            console.error('Connection error:', err);
        } finally {
            setConnecting(false);
        }
    };

    const shiftMonth = (delta: number) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));

    return (
        <ProtectedRoute requiredRole="chamber_admin">
            <DashPage>
                <PageHeader
                    eyebrow="Chambers Management System"
                    title="Legal Calendar"
                    actions={
                        <>
                            <SearchInput label="Search events" placeholder="Search events..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            <button type="button" onClick={handleOpenCreateModal} className="l-btn l-btn--primary l-btn--compact">
                                <Plus aria-hidden="true" className="w-4 h-4" /> Schedule Event
                            </button>
                        </>
                    }
                />

                <div className="l-stats">
                    <StatTile label="Month Overview" value={stats.total} icon={CalendarIcon} />
                    <StatTile label="Court Hearings" value={stats.hearings} icon={Scale} />
                    <StatTile label="Case Tasks" value={stats.tasks} icon={CheckCircle2} />
                    <StatTile label="Priority Alerts" value={stats.urgent} icon={Bell} />
                </div>

                <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Event type">
                    <span className="l-label mr-1">Filters:</span>
                    {['all', 'hearing', 'task'].map((type) => (
                        <button key={type} type="button" onClick={() => setFilterType(type as any)} aria-pressed={filterType === type} className="l-filter">
                            {type}
                        </button>
                    ))}
                </div>

                <div className="l-grid l-grid--main">
                    <section className="l-panel" aria-labelledby="cal-month">
                        <div className="l-panel__head flex-wrap">
                            <h2 id="cal-month" className="l-panel__title">
                                {currentDate.toLocaleString('default', { month: 'long' })} <span className="l-muted">{currentDate.getFullYear()}</span>
                            </h2>
                            <div className="flex flex-wrap items-center gap-2">
                                <button type="button" className="l-icon-btn" aria-label="Previous month" onClick={() => shiftMonth(-1)}>
                                    <ChevronLeft aria-hidden="true" className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    className="l-btn l-btn--outline l-btn--compact"
                                    onClick={() => {
                                        const now = new Date();
                                        setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
                                        setSelectedDate(now);
                                    }}
                                >
                                    Today
                                </button>
                                <button type="button" className="l-icon-btn" aria-label="Next month" onClick={() => shiftMonth(1)}>
                                    <ChevronRight aria-hidden="true" className="w-4 h-4" />
                                </button>
                                <button type="button" className="l-btn l-btn--outline l-btn--compact" onClick={() => handleExportCalendar('ics')}>
                                    <Download aria-hidden="true" className="w-4 h-4" /> iCal
                                </button>
                                <button type="button" className="l-btn l-btn--outline l-btn--compact" onClick={() => handleExportCalendar('csv')}>
                                    <Download aria-hidden="true" className="w-4 h-4" /> CSV
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 px-5 pt-4 text-xs l-muted">
                            <span className="inline-flex items-center gap-1.5"><span className="l-dot l-dot--hearing" aria-hidden="true" /> Hearings</span>
                            <span className="inline-flex items-center gap-1.5"><span className="l-dot l-dot--task" aria-hidden="true" /> Active Tasks</span>
                        </div>

                        <div className="l-cal" role="grid" aria-labelledby="cal-month">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                                <div key={d} className="l-cal__dow" role="columnheader">
                                    {d}
                                </div>
                            ))}
                            {calendarDays.map((dayObj, i) => {
                                const dayEvents = getDayEvents(dayObj.date);
                                const isSelected = !!selectedDate && dayObj.date.toDateString() === selectedDate.toDateString();
                                const isToday = dayObj.date.toDateString() === new Date().toDateString();
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        role="gridcell"
                                        onClick={() => setSelectedDate(dayObj.date)}
                                        aria-selected={isSelected}
                                        aria-current={isToday ? 'date' : undefined}
                                        aria-label={`${dayObj.date.toDateString()}, ${dayEvents.length} events`}
                                        className="l-cal__day"
                                        data-outside={!dayObj.currentMonth}
                                    >
                                        <span className="l-cal__num">{dayObj.day}</span>
                                        {dayEvents.length > 0 && (
                                            <span className="l-cal__dots" aria-hidden="true">
                                                {dayEvents.slice(0, 3).map((e: any) => (
                                                    <span key={e.id} className={`l-dot ${e.type === 'hearing' ? 'l-dot--hearing' : 'l-dot--task'}`} />
                                                ))}
                                            </span>
                                        )}
                                        <span className="l-cal__events" aria-hidden="true">
                                            {dayEvents.slice(0, 3).map((event: any) => (
                                                <span key={event.id} className="l-cal__event" data-type={event.type}>
                                                    {event.title}
                                                </span>
                                            ))}
                                            {dayEvents.length > 3 && <span className="text-xs l-muted">+ {dayEvents.length - 3} Schedule</span>}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <div className="l-grid">
                        <Panel title="Agenda Overview">
                            <div className="flex flex-col gap-4">
                                <div>
                                    <p className="m-0 l-dash-title">
                                        {selectedDate?.toLocaleDateString('default', { day: 'numeric' })}{' '}
                                        <span className="l-muted">{selectedDate?.toLocaleDateString('default', { month: 'long' })}</span>
                                    </p>
                                    <p className="m-0 mt-1 text-sm l-muted">{selectedEvents.length} schedules found for this day.</p>
                                </div>

                                {loading ? (
                                    <div className="l-empty" role="status">
                                        <Loader2 aria-hidden="true" className="w-6 h-6 animate-spin" />
                                        <span className="l-label">Refreshing...</span>
                                    </div>
                                ) : selectedEvents.length > 0 ? (
                                    <ul className="flex flex-col gap-3 m-0 p-0 list-none">
                                        {selectedEvents.map((event: any) => (
                                            <li key={event.id} className="l-agenda" data-type={event.type}>
                                                <div className="flex items-start justify-between gap-3">
                                                    <Link href={`/dashboard/chambers-admin/cases/${event.caseId}`} className="flex flex-col gap-1 min-w-0">
                                                        <span className="l-label">
                                                            {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <span className="font-semibold">{event.title}</span>
                                                    </Link>
                                                    <div className="flex gap-1 shrink-0">
                                                        <button type="button" className="l-icon-btn" onClick={() => handleOpenEditModal(event)} aria-label={`Edit ${event.title}`}>
                                                            <Edit2 aria-hidden="true" className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="l-icon-btn"
                                                            onClick={() => {
                                                                setSelectedEvent(event);
                                                                setShowDeleteConfirm(true);
                                                            }}
                                                            aria-label={`Delete ${event.title}`}
                                                        >
                                                            <Trash2 aria-hidden="true" className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <dl className="flex flex-col gap-1 m-0 text-sm">
                                                    <div className="flex gap-2">
                                                        <dt className="l-muted inline-flex items-center gap-1.5">
                                                            <Briefcase aria-hidden="true" className="w-3.5 h-3.5" /> Case Ref.
                                                        </dt>
                                                        <dd className="m-0">{event.caseNumber}</dd>
                                                    </div>
                                                    {event.description && (
                                                        <div className="flex gap-2">
                                                            <dt className="l-muted inline-flex items-center gap-1.5">
                                                                <MapPin aria-hidden="true" className="w-3.5 h-3.5" /> Location / Venue
                                                            </dt>
                                                            <dd className="m-0">{event.description}</dd>
                                                        </div>
                                                    )}
                                                </dl>
                                                <Link href={`/dashboard/chambers-admin/cases/${event.caseId}`} className="l-link text-sm self-start">
                                                    View Case
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <EmptyState icon={CheckCircle2} title="Productive Day!" hint="There are no hearings or tasks scheduled for this date." />
                                )}
                            </div>
                        </Panel>

                        <Panel title="Google Calendar">
                            <div className="flex flex-col gap-4">
                                <p className="m-0 text-sm l-muted">Sync your case hearings directly to your personal schedule.</p>
                                <button type="button" className="l-btn l-btn--outline l-btn--compact self-start" onClick={handleConnectGoogle} disabled={connecting}>
                                    {connecting ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : 'Connect Now'}
                                </button>
                            </div>
                        </Panel>
                    </div>
                </div>
            </DashPage>

            <EventModal
                isOpen={showEventModal}
                onClose={() => setShowEventModal(false)}
                onSuccess={handleEventSuccess}
                event={selectedEvent}
                mode={selectedEvent ? 'edit' : 'create'}
            />

            <DeleteConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteEvent}
                title="Delete Event"
                description={`Are you sure you want to delete "${selectedEvent?.title}"? This action cannot be undone.`}
            />
        </ProtectedRoute>
    );
}
