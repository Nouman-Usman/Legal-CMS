import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderLawyerInvite } from './invite-template.ts';

const base = { fullName: 'Ayesha Khan', chamberName: 'Khan & Associates', link: 'https://example.supabase.co/auth/v1/verify?token=abc&type=invite', kind: 'invite' as const };

test('subject names the chamber; text has the link', () => {
    const mail = renderLawyerInvite(base);
    assert.equal(mail.subject, 'You are invited to join Khan & Associates on Apna Waqeel');
    assert.match(mail.text, /https:\/\/example\.supabase\.co\/auth\/v1\/verify\?token=abc&type=invite/);
    assert.match(mail.text, /^Assalam-o-Alaikum Ayesha Khan,/);
});

test('names are HTML-escaped and the link is attribute-safe', () => {
    const mail = renderLawyerInvite({ ...base, fullName: '<img src=x onerror=alert(1)>', chamberName: 'A "B" & C' });
    assert.ok(!mail.html.includes('<img src=x'), 'raw tag must not appear');
    assert.match(mail.html, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.match(mail.html, /A &quot;B&quot; &amp; C/);
    assert.match(mail.html, /href="https:\/\/example\.supabase\.co\/auth\/v1\/verify\?token=abc&amp;type=invite"/);
});

test('reminder wording for a resent invite', () => {
    const mail = renderLawyerInvite({ ...base, kind: 'reminder' });
    assert.match(mail.subject, /^Reminder:/);
});

test('rejects non-https links except localhost', () => {
    assert.throws(() => renderLawyerInvite({ ...base, link: 'javascript:alert(1)' }));
    assert.doesNotThrow(() => renderLawyerInvite({ ...base, link: 'http://localhost:3000/auth/onboarding' }));
});

test('line breaks in names cannot reach the subject header', () => {
    const mail = renderLawyerInvite({ ...base, chamberName: 'Evil\r\nBcc: victim@example.com' });
    assert.ok(!/[\r\n]/.test(mail.subject), mail.subject);
});
