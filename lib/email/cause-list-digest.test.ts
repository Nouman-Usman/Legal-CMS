import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderCauseListDigest } from './cause-list-digest.ts';

test('digest lists each case and escapes listing text', () => {
    const r = renderCauseListDigest({
        recipientName: 'Ali',
        chamberName: 'TEST Chamber',
        date: '2026-11-03',
        items: [
            { caseRef: 'W.P. 101/26 · Bashir v. Punjab', court: 'Justice X · Court 7', seq: '12', note: 'Stay matter' },
            { caseRef: '<script>x</script>', court: 'Court 9', seq: null, note: null },
        ],
        toReview: 1,
        url: 'https://example.com/docket',
    });
    assert.equal(r.subject, 'Tuesday 3 November: 2 cases listed at the Lahore High Court');
    assert.match(r.text, /W\.P\. 101\/26 · Bashir v\. Punjab: Justice X · Court 7, Sr\. 12 \(Stay matter\)/);
    assert.match(r.text, /1 more listing need a look/);
    assert.ok(!r.html.includes('<script>x</script>'));
});
