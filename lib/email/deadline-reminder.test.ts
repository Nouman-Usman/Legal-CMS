import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderDeadlineReminder } from './deadline-reminder.ts';

const base = {
    lawyerName: 'Ali',
    chamberName: 'TEST Chamber',
    title: 'File reply',
    caseRef: 'W.P. 101/26',
    dueDate: '2026-11-05',
    daysLeft: 3,
    caseUrl: 'https://example.com/case/1',
};

test('subject says when, text carries the date and link', () => {
    const r = renderDeadlineReminder(base);
    assert.equal(r.subject, 'Due in 3 days: File reply (W.P. 101/26)');
    assert.match(r.text, /Thursday, 5 November 2026/);
    assert.match(r.text, /https:\/\/example.com\/case\/1/);
    assert.equal(renderDeadlineReminder({ ...base, daysLeft: 1 }).subject.startsWith('Due tomorrow'), true);
});

test('user text is escaped in HTML and kept on one line in the subject', () => {
    const r = renderDeadlineReminder({ ...base, title: '<b>x</b>\r\nBcc: evil@example.com' });
    assert.ok(!r.html.includes('<b>x</b>'));
    assert.ok(!/[\r\n]/.test(r.subject));
});
