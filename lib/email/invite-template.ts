/** The email a chamber sends to invite a lawyer (plain text + simple HTML, Techfini colours). */

export interface LawyerInvite {
    fullName: string;
    chamberName: string;
    /** One-time sign-in link from Supabase (generateLink). */
    link: string;
    kind: 'invite' | 'reminder';
}

export const escapeHtml = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function assertSafeLink(link: string) {
    const url = new URL(link);
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) {
        throw new Error('Invite link must be https');
    }
}

export const oneLine = (value: string) => value.replace(/[\r\n]+/g, ' ').trim();

export function renderLawyerInvite(invite: LawyerInvite) {
    const { link, kind } = invite;
    const fullName = oneLine(invite.fullName);
    const chamberName = oneLine(invite.chamberName);
    assertSafeLink(link);
    const subject = `${kind === 'reminder' ? 'Reminder: you' : 'You'} are invited to join ${chamberName} on Apna Waqeel`;

    const text = [
        `Assalam-o-Alaikum ${fullName},`,
        '',
        `${chamberName} has invited you to join their chamber on Apna Waqeel, where the chamber keeps its cases, hearings and daily docket.`,
        '',
        'Open this link to set your password and finish your profile:',
        link,
        '',
        'The link works once and expires after 24 hours. If you were not expecting this, you can ignore this email.',
    ].join('\n');

    const name = escapeHtml(fullName);
    const chamber = escapeHtml(chamberName);
    const href = escapeHtml(link);
    const html = `<!doctype html>
<html lang="en">
<body style="margin:0;padding:24px;background:#080808;font-family:Manrope,Segoe UI,Arial,sans-serif;color:#F5F5F2;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#111111;border:1px solid #272727;border-radius:22px;">
    <tr><td style="padding:32px;">
      <p style="margin:0 0 24px;font-size:18px;"><b>apna</b> waqeel</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.55;">Assalam-o-Alaikum ${name},</p>
      <p style="margin:0 0 24px;font-size:16px;line-height:1.55;color:#D0D0CC;">${chamber} has invited you to join their chamber on Apna Waqeel, where the chamber keeps its cases, hearings and daily docket.</p>
      <p style="margin:0 0 24px;">
        <a href="${href}" style="display:inline-block;padding:14px 24px;border-radius:9999px;background:#CDFB50;color:#080808;font-weight:700;font-size:14px;letter-spacing:0.06em;text-transform:uppercase;text-decoration:none;">Join ${chamber}</a>
      </p>
      <p style="margin:0;font-size:13px;line-height:1.55;color:#929292;">The link works once and expires after 24 hours. If you were not expecting this, you can ignore this email.</p>
    </td></tr>
  </table>
</body>
</html>`;

    return { subject, text, html };
}
