import { errorResponse, HttpError, requireChamberAdmin, requireMemberLawyer, supabaseAdmin } from '@/lib/server/chamber-admin';

type Params = { params: Promise<{ id: string }> };

/**
 * Remove a lawyer from the caller's chamber: their membership is deactivated. Their
 * account is kept (it is theirs, and their hearing history stays attributable);
 * Resend Invite brings them back.
 */
export async function DELETE(_request: Request, { params }: Params) {
    try {
        const { chamberId, adminId } = await requireChamberAdmin();
        const { id } = await params;
        if (id === adminId) throw new HttpError(400, 'You cannot remove yourself');
        const { membershipId } = await requireMemberLawyer(chamberId, id);

        const { error } = await supabaseAdmin().from('chamber_members').update({ is_active: false }).eq('id', membershipId);
        if (error) throw error;
        return Response.json({ success: true });
    } catch (error) {
        return errorResponse(error);
    }
}

/** Set a lawyer active or inactive in the caller's chamber. */
export async function PATCH(request: Request, { params }: Params) {
    try {
        const { chamberId, adminId } = await requireChamberAdmin();
        const { id } = await params;
        const body = await request.json().catch(() => ({}));
        if (body.status !== 'active' && body.status !== 'inactive') throw new HttpError(400, 'Status must be active or inactive');
        if (id === adminId) throw new HttpError(400, 'You cannot change your own status');
        const { membershipId } = await requireMemberLawyer(chamberId, id);

        const { error } = await supabaseAdmin().from('chamber_members').update({ is_active: body.status === 'active' }).eq('id', membershipId);
        if (error) throw error;
        return Response.json({ success: true });
    } catch (error) {
        return errorResponse(error);
    }
}
