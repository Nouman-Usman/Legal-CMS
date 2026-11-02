import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/chamber-admin';
import { sendMail } from '@/lib/server/mailer';
import { renderDeadlineReminder } from '@/lib/email/deadline-reminder';
import { addDays, pkToday, reminderSlot } from '@/lib/deadlines/limitation';

export const dynamic = 'force-dynamic';

/** Only the scheduler may call this: `Authorization: Bearer $CRON_SECRET` (Vercel Cron sends it). */
function authorised(request: Request) {
    const secret = process.env.CRON_SECRET;
    if (!secret) return false;
    const got = Buffer.from(request.headers.get('authorization') ?? '');
    const want = Buffer.from(`Bearer ${secret}`);
    return got.length === want.length && timingSafeEqual(got, want);
}

/**
 * Daily: email the responsible lawyer 3 days and 1 day before each open deadline.
 * Unassigned deadlines go to the chamber's admins. Each reminder is sent once.
 */
export async function GET(request: Request) {
    if (!authorised(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = supabaseAdmin();
    const today = pkToday();
    const { data: due, error } = await db
        .from('case_deadlines')
        .select(
            'id, chamber_id, case_id, title, due_date, reminded_3d_at, reminded_1d_at, assigned_to, assignee:assigned_to(email, full_name), case:case_id(case_number, title), chamber:chamber_id(name)',
        )
        .eq('status', 'open')
        .in('due_date', [addDays(today, 1), addDays(today, 3)]);
    if (error) return NextResponse.json({ error: 'Could not load deadlines' }, { status: 500 });

    type Member = { user_id: string; role: string; users: { email: string; full_name: string | null } | null };
    const members = new Map<string, Member[]>();
    const membersOf = async (chamberId: string) => {
        if (!members.has(chamberId)) {
            const { data } = await db.from('chamber_members').select('user_id, role, users:user_id(email, full_name)').eq('chamber_id', chamberId).neq('is_active', false);
            members.set(chamberId, (data ?? []) as unknown as Member[]);
        }
        return members.get(chamberId)!;
    };

    const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    let sent = 0;
    let failed = 0;
    for (const d of (due ?? []) as any[]) {
        const slot = reminderSlot(d.due_date, today);
        if (!slot || (slot === '3d' ? d.reminded_3d_at : d.reminded_1d_at)) continue;

        // Only active members of the case's chamber: the assignee, else the admins.
        const active = await membersOf(d.chamber_id);
        const assignee = active.find((m) => m.user_id === d.assigned_to && m.users?.email);
        const recipients = (assignee ? [assignee] : active.filter((m) => m.role === 'admin' && m.users?.email)).map((m) => m.users!);
        if (!recipients.length) continue;

        try {
            for (const to of recipients) {
                const mail = renderDeadlineReminder({
                    lawyerName: to.full_name || 'Advocate',
                    chamberName: d.chamber?.name || 'Your chamber',
                    title: d.title,
                    caseRef: [d.case?.case_number, d.case?.title].filter(Boolean).join(' · '),
                    dueDate: d.due_date,
                    daysLeft: slot === '3d' ? 3 : 1,
                    caseUrl: `${site}/dashboard/chambers-admin/cases/${d.case_id}`,
                });
                await sendMail({ to: to.email, ...mail });
            }
            await db
                .from('case_deadlines')
                .update(slot === '3d' ? { reminded_3d_at: new Date().toISOString() } : { reminded_1d_at: new Date().toISOString() })
                .eq('id', d.id);
            sent++;
        } catch (e) {
            console.error('deadline reminder failed', d.id, e);
            failed++;
        }
    }

    return NextResponse.json({ today, sent, failed });
}
