import { renderLawyerInvite } from '@/lib/email/invite-template';
import { sendMail } from '@/lib/server/mailer';
import { errorResponse, HttpError, onboardingUrl, requireChamberAdmin, requireMemberLawyer, supabaseAdmin } from '@/lib/server/chamber-admin';

/** Resend the invitation to a lawyer of the caller's chamber who has not finished onboarding. */
export async function POST(request: Request) {
    try {
        const { chamberId, chamberName } = await requireChamberAdmin();
        const body = await request.json().catch(() => ({}));
        const lawyerId = String(body.lawyer_id ?? '');
        if (!lawyerId) throw new HttpError(400, 'Lawyer ID is required');

        const { membershipId, isActive, user } = await requireMemberLawyer(chamberId, lawyerId);
        if (user.onboarding_completed) throw new HttpError(409, 'This lawyer has already joined');

        const admin = supabaseAdmin();
        // An unaccepted invite can be re-issued; if the account is already confirmed, fall back to a sign-in link.
        let result = await admin.auth.admin.generateLink({ type: 'invite', email: user.email, options: { redirectTo: onboardingUrl() } });
        if (result.error) {
            result = await admin.auth.admin.generateLink({ type: 'magiclink', email: user.email, options: { redirectTo: onboardingUrl() } });
        }
        if (result.error) throw result.error;

        if (!isActive) {
            const { error } = await admin.from('chamber_members').update({ is_active: true }).eq('id', membershipId);
            if (error) throw error;
        }

        try {
            await sendMail({
                to: user.email,
                ...renderLawyerInvite({ fullName: user.full_name || user.email, chamberName, link: result.data.properties.action_link, kind: 'reminder' }),
            });
        } catch (mailError) {
            console.error('Resend email failed:', mailError);
            throw new HttpError(502, 'The invitation email could not be sent. Check the SMTP settings.');
        }

        return Response.json({ success: true });
    } catch (error) {
        return errorResponse(error);
    }
}
