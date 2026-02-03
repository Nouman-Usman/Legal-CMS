import { supabase } from './client';

export async function getCalendarEvents(chamberId: string, startDate: Date, endDate: Date) {
    try {
        // 1. Fetch Hearings
        const { data: hearings, error: hearingsError } = await supabase
            .from('hearings')
            .select('*, cases!inner(chamber_id, title, case_number)')
            .eq('cases.chamber_id', chamberId)
            .gte('hearing_date', startDate.toISOString())
            .lte('hearing_date', endDate.toISOString());

        if (hearingsError) throw hearingsError;

        // 2. Fetch Tasks with due dates
        const { data: tasks, error: tasksError } = await supabase
            .from('case_tasks')
            .select('*, cases!inner(chamber_id, title, case_number)')
            .eq('cases.chamber_id', chamberId)
            .gte('due_date', startDate.toISOString())
            .lte('due_date', endDate.toISOString());

        if (tasksError) throw tasksError;

        // Format them for the calendar view
        const events = [
            ...(hearings || []).map(h => ({
                id: h.id,
                title: `Hearing: ${h.cases.case_number}`,
                description: h.court_name ? `${h.court_name} - ${h.judge_name || ''}` : h.cases.title,
                date: h.hearing_date,
                type: 'hearing',
                caseId: h.case_id,
                caseNumber: h.cases.case_number
            })),
            ...(tasks || []).map(t => ({
                id: t.id,
                title: `Task: ${t.title}`,
                description: t.cases.title,
                date: t.due_date,
                type: 'task',
                priority: t.priority,
                caseId: t.case_id,
                caseNumber: t.cases.case_number
            }))
        ];

        return { events, error: null };
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        return { events: [], error };
    }
}

export async function getLawyerCalendarEvents(lawyerId: string, chamberId: string, startDate: Date, endDate: Date) {
    try {
        // 1. Fetch Hearings for cases assigned to this lawyer
        const { data: hearings, error: hearingsError } = await supabase
            .from('hearings')
            .select('*, cases!inner(chamber_id, title, case_number, assigned_to)')
            .eq('cases.chamber_id', chamberId)
            .eq('cases.assigned_to', lawyerId)
            .gte('hearing_date', startDate.toISOString())
            .lte('hearing_date', endDate.toISOString());

        if (hearingsError) throw hearingsError;

        // 2. Fetch Tasks assigned directly to the lawyer
        const { data: tasks, error: tasksError } = await supabase
            .from('case_tasks')
            .select('*, cases!inner(chamber_id, title, case_number)')
            .eq('cases.chamber_id', chamberId)
            .eq('assigned_to', lawyerId)
            .gte('due_date', startDate.toISOString())
            .lte('due_date', endDate.toISOString());

        if (tasksError) throw tasksError;

        // Format them for the calendar view
        const events = [
            ...(hearings || []).map(h => ({
                id: h.id,
                title: `Hearing: ${h.cases.case_number}`,
                description: h.court_name ? `${h.court_name} - ${h.judge_name || ''}` : h.cases.title,
                date: h.hearing_date,
                type: 'hearing',
                caseId: h.case_id,
                caseNumber: h.cases.case_number
            })),
            ...(tasks || []).map(t => ({
                id: t.id,
                title: `Task: ${t.title}`,
                description: t.cases.title,
                date: t.due_date,
                type: 'task',
                priority: t.priority,
                caseId: t.case_id,
                caseNumber: t.cases.case_number
            }))
        ];

        return { events, error: null };
    } catch (error) {
        console.error('Error fetching lawyer calendar events:', error);
        return { events: [], error };
    }
}
