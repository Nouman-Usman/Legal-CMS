/** Evening email: tomorrow's LHC listings for the chamber's cases. */
import { escapeHtml, oneLine } from './invite-template.ts';

export interface DigestItem {
    caseRef: string;
    court: string;
    seq: string | null;
    note: string | null;
}

export function renderCauseListDigest(d: { recipientName: string; chamberName: string; date: string; items: DigestItem[]; toReview: number; url: string }) {
    const day = new Date(`${d.date}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
    const n = d.items.length;
    const subject = `${day}: ${n} case${n === 1 ? '' : 's'} listed at the Lahore High Court`;
    const lines = d.items.map((i) => `• ${oneLine(i.caseRef)}: ${oneLine(i.court)}${i.seq ? `, Sr. ${i.seq}` : ''}${i.note ? ` (${oneLine(i.note)})` : ''}`);

    const text = [
        `Assalam-o-Alaikum ${oneLine(d.recipientName)},`,
        '',
        `${oneLine(d.chamberName)} has ${n} case${n === 1 ? '' : 's'} on the LHC cause list for ${day}:`,
        '',
        ...lines,
        '',
        ...(d.toReview ? [`${d.toReview} more listing${d.toReview === 1 ? '' : 's'} need a look in Cause List.`, ''] : []),
        `Docket: ${d.url}`,
        '',
        'From the LHC cause list. Confirm with the official list before court.',
    ].join('\n');

    const rows = d.items
        .map(
            (i) => `<tr><td style="padding:10px 0;border-top:1px solid #272727;"><b>${escapeHtml(oneLine(i.caseRef))}</b><br><span style="color:#D0D0CC;">${escapeHtml(oneLine(i.court))}${i.seq ? ` · Sr. ${escapeHtml(i.seq)}` : ''}${i.note ? ` · ${escapeHtml(oneLine(i.note))}` : ''}</span></td></tr>`,
        )
        .join('');
    const html = `<!doctype html>
<html lang="en">
<body style="margin:0;padding:24px;background:#080808;font-family:Manrope,Segoe UI,Arial,sans-serif;color:#F5F5F2;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#111111;border:1px solid #272727;border-radius:22px;">
    <tr><td style="padding:32px;">
      <p style="margin:0 0 24px;font-size:18px;"><b>apna</b> waqeel</p>
      <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#CDFB50;">Lahore High Court · ${escapeHtml(day)}</p>
      <p style="margin:0 0 16px;font-size:20px;font-weight:700;">${n} case${n === 1 ? '' : 's'} listed</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;line-height:1.5;">${rows}</table>
      ${d.toReview ? `<p style="margin:16px 0 0;font-size:14px;color:#BD6CF7;">${d.toReview} more listing${d.toReview === 1 ? '' : 's'} need a look in Cause List.</p>` : ''}
      <p style="margin:24px 0;"><a href="${escapeHtml(d.url)}" style="display:inline-block;padding:14px 24px;border-radius:9999px;background:#CDFB50;color:#080808;font-weight:700;font-size:14px;letter-spacing:0.06em;text-transform:uppercase;text-decoration:none;">Open docket</a></p>
      <p style="margin:0;font-size:13px;color:#929292;">From the LHC cause list. Confirm with the official list before court.</p>
    </td></tr>
  </table>
</body>
</html>`;
    return { subject, text, html };
}
