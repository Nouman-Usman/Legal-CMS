import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CalendarEvent {
    id: string;
    title: string;
    date: string;
    description?: string;
    type: 'hearing' | 'task';
    caseNumber?: string;
}

function convertToICS(events: CalendarEvent[]): string {
    let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Apna Waqeel//Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Legal Calendar
X-WR-TIMEZONE:UTC
BEGIN:VTIMEZONE
TZID:UTC
BEGIN:STANDARD
DTSTART:19700101T000000
TZOFFSETFROM:+0000
TZOFFSETTO:+0000
END:STANDARD
END:VTIMEZONE
`;

    events.forEach((event) => {
        const eventDate = new Date(event.date);
        const dtstart = formatDateTimeForICS(eventDate);
        const dtend = new Date(eventDate.getTime() + 60 * 60 * 1000); // 1 hour duration
        const uid = `${event.id}@apnawaqeel.local`;
        const summary = event.title;
        const description = event.description || event.type;

        ics += `BEGIN:VEVENT
UID:${uid}
DTSTART:${dtstart}
DTEND:${formatDateTimeForICS(dtend)}
SUMMARY:${escapeICSString(summary)}
DESCRIPTION:${escapeICSString(description)}
LOCATION:${escapeICSString(event.description || '')}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
`;
    });

    ics += `END:VCALENDAR`;
    return ics;
}

function formatDateTimeForICS(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function escapeICSString(str: string): string {
    if (!str) return '';
    return str
        .replace(/\\/g, '\\\\')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;')
        .replace(/\n/g, '\\n');
}

function convertToCSV(events: CalendarEvent[]): string {
    let csv = 'Title,Date,Time,Type,Case Number,Description\n';

    events.forEach((event) => {
        const eventDate = new Date(event.date);
        const date = eventDate.toLocaleDateString();
        const time = eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const title = `"${event.title.replace(/"/g, '""')}"`;
        const caseNumber = event.caseNumber || '';
        const description = `"${(event.description || '').replace(/"/g, '""')}"`;

        csv += `${title},${date},${time},${event.type},${caseNumber},${description}\n`;
    });

    return csv;
}

export async function POST(request: NextRequest) {
    try {
        const { chamberId, startDate, endDate, format = 'ics' } = await request.json();

        if (!chamberId) {
            return NextResponse.json(
                { error: 'Chamber ID is required' },
                { status: 400 }
            );
        }

        // Fetch hearings
        const { data: hearings, error: hearingsError } = await supabase
            .from('hearings')
            .select('*, cases!inner(chamber_id, title, case_number)')
            .eq('cases.chamber_id', chamberId)
            .gte('hearing_date', startDate)
            .lte('hearing_date', endDate);

        if (hearingsError) throw hearingsError;

        // Fetch tasks
        const { data: tasks, error: tasksError } = await supabase
            .from('case_tasks')
            .select('*, cases!inner(chamber_id, title, case_number)')
            .eq('cases.chamber_id', chamberId)
            .gte('due_date', startDate)
            .lte('due_date', endDate);

        if (tasksError) throw tasksError;

        // Format events
        const events: CalendarEvent[] = [
            ...(hearings || []).map(h => ({
                id: h.id,
                title: `Hearing: ${h.cases.case_number}`,
                description: h.court_name ? `${h.court_name} - ${h.judge_name || ''}` : h.cases.title,
                date: h.hearing_date,
                type: 'hearing' as const,
                caseNumber: h.cases.case_number
            })),
            ...(tasks || []).map(t => ({
                id: t.id,
                title: `Task: ${t.title}`,
                description: t.cases.title,
                date: t.due_date,
                type: 'task' as const,
                caseNumber: t.cases.case_number
            }))
        ];

        let content: string;
        let contentType: string;
        let filename: string;

        if (format === 'csv') {
            content = convertToCSV(events);
            contentType = 'text/csv;charset=utf-8';
            filename = `calendar-${new Date().toISOString().split('T')[0]}.csv`;
        } else {
            content = convertToICS(events);
            contentType = 'text/calendar;charset=utf-8';
            filename = `calendar-${new Date().toISOString().split('T')[0]}.ics`;
        }

        return new NextResponse(content, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${filename}"`,
            }
        });
    } catch (error: any) {
        console.error('Error exporting calendar:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to export calendar' },
            { status: 500 }
        );
    }
}
