/** The email a lawyer gets 3 days and 1 day before a deadline. */
import { escapeHtml, oneLine } from './invite-template.ts';

export interface DeadlineReminder {
    lawyerName: string;
    chamberName: string;
    title: string;
    caseRef: string;
    dueDate: string;
    daysLeft: number;
    /** Absolute link to the case. */
    caseUrl: string;
}

export function renderDeadlineReminder(r: DeadlineReminder) {
    const title = oneLine(r.title);
    const caseRef = oneLine(r.caseRef);
    const when = r.daysLeft === 1 ? 'tomorrow' : `in ${r.daysLeft} days`;
    const due = new Date(`${r.dueDate}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    const subject = `Due ${when}: ${title} (${caseRef})`;

    const text = [
        `Assalam-o-Alaikum ${oneLine(r.lawyerName)},`,
        '',
        `${title} is due ${when}, on ${due}.`,
        `Case: ${caseRef}`,
        '',
        `Open the case: ${r.caseUrl}`,
        '',
        `${oneLine(r.chamberName)} · Apna Waqeel`,
    ].join('\n');

    const html = `<!doctype html>
<html lang="en">
<body style="margin:0;padding:24px;background:#080808;font-family:Manrope,Segoe UI,Arial,sans-serif;color:#F5F5F2;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#111111;border:1px solid #272727;border-radius:22px;">
    <tr><td style="padding:32px;">
      <p style="margin:0 0 24px;font-size:18px;"><b>apna</b> waqeel</p>
      <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#CDFB50;">Due ${escapeHtml(when)}</p>
      <p style="margin:0 0 16px;font-size:20px;font-weight:700;line-height:1.35;">${escapeHtml(title)}</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.55;color:#D0D0CC;">${escapeHtml(due)}<br>${escapeHtml(caseRef)}</p>
      <p style="margin:0 0 24px;">
        <a href="${escapeHtml(r.caseUrl)}" style="display:inline-block;padding:14px 24px;border-radius:9999px;background:#CDFB50;color:#080808;font-weight:700;font-size:14px;letter-spacing:0.06em;text-transform:uppercase;text-decoration:none;">Open case</a>
      </p>
      <p style="margin:0;font-size:13px;color:#929292;">${escapeHtml(oneLine(r.chamberName))}</p>
    </td></tr>
  </table>
</body>
</html>`;

    return { subject, text, html };
}
