import { renderLawyerInvite } from '@/lib/email/invite-template';
import { sendMail } from '@/lib/server/mailer';
import { errorResponse, HttpError, onboardingUrl, requireChamberAdmin, supabaseAdmin } from '@/lib/server/chamber-admin';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Invite a lawyer to the caller's chamber. The caller must be the chamber's admin;
 * the chamber comes from their membership. Supabase creates the account and the
 * one-time link (generateLink sends nothing); Nodemailer sends the email.
 */
export async function POST(request: Request) {
    try {
        const { chamberId, chamberName } = await requireChamberAdmin();
        const body = await request.json().catch(() => ({}));
        const email = String(body.email ?? '').trim().toLowerCase();
        const fullName = String(body.full_name ?? '').trim();
        if (!EMAIL.test(email) || !fullName) throw new HttpError(400, 'A valid email and full name are required');

        const admin = supabaseAdmin();
        const { data: existing } = await admin.from('users').select('id, role').eq('email', email).maybeSingle();

        let userId: string;
        let link: string;
        if (existing) {
            // Never turn a client or admin account into a lawyer from here.
            if (existing.role !== 'lawyer') throw new HttpError(409, 'This email belongs to an account that is not a lawyer account');
            const { data: membership } = await admin
                .from('chamber_members')
                .select('chamber_id')
                .eq('user_id', existing.id)
                .neq('is_active', false)
                .limit(1)
                .maybeSingle();
            if (membership) {
                throw new HttpError(409, membership.chamber_id === chamberId ? 'This lawyer is already in your chamber' : 'This lawyer already belongs to another chamber');
            }
            const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo: onboardingUrl() } });
            if (error) throw error;
            userId = existing.id;
            link = data.properties.action_link;
        } else {
            // Creates the auth user; the handle_new_user trigger creates the users row (role lawyer).
            const { data, error } = await admin.auth.admin.generateLink({
                type: 'invite',
                email,
                options: { data: { full_name: fullName, role: 'lawyer' }, redirectTo: onboardingUrl() },
            });
            if (error) throw error;
            userId = data.user.id;
            link = data.properties.action_link;
        }

        const { error: memberError } = await admin
            .from('chamber_members')
            .upsert({ chamber_id: chamberId, user_id: userId, role: 'member', is_active: true }, { onConflict: 'chamber_id,user_id' });
        if (memberError) throw memberError;

        const { data: profile } = await admin.from('lawyers').select('id').eq('user_id', userId).maybeSingle();
        if (!profile) await admin.from('lawyers').insert({ user_id: userId });

        try {
            await sendMail({ to: email, ...renderLawyerInvite({ fullName, chamberName, link, kind: 'invite' }) });
        } catch (mailError) {
            console.error('Invite email failed:', mailError);
            throw new HttpError(502, 'The lawyer was added, but the invitation email could not be sent. Check the SMTP settings, then use Resend Invite.');
        }

        return Response.json({ success: true, user_id: userId });
    } catch (error) {
        return errorResponse(error);
    }
}
