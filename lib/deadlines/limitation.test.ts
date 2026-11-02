import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addMonths, computeLimitation, dueBucket, LIMITATION_RULES, pkToday, reminderSlot } from './limitation.ts';

test('days run from the day after the order', () => {
    // 1 Oct 2026 (Thu) + 30 days = 31 Oct 2026 (Sat): open when only Sundays are closed.
    assert.deepEqual(computeLimitation({ startDate: '2026-10-01', period: 30, unit: 'days' }), {
        lastDate: '2026-10-31',
        periodEnds: '2026-10-31',
        excludedDays: 0,
    });
});

test('a last day on a closed day moves to the reopening day (s.4)', () => {
    // 2 Oct + 30 = 1 Nov 2026, a Sunday → Monday 2 Nov.
    const r = computeLimitation({ startDate: '2026-10-02', period: 30, unit: 'days' });
    assert.equal(r.lastDate, '2026-11-02');
    assert.equal(r.movedFrom, '2026-11-01');
    // Saturday closed too, and Monday a holiday → Tuesday.
    const r2 = computeLimitation({ startDate: '2026-10-01', period: 30, unit: 'days', closedWeekdays: [0, 6], holidays: ['2026-11-02'] });
    assert.equal(r2.lastDate, '2026-11-03');
});

test('time taken for certified copies is excluded (s.12(2))', () => {
    // Applied 5 Oct, ready 9 Oct → 5 days excluded.
    const r = computeLimitation({ startDate: '2026-10-01', period: 30, unit: 'days', copyApplied: '2026-10-05', copyReady: '2026-10-09' });
    assert.equal(r.excludedDays, 5);
    assert.equal(r.lastDate, '2026-11-05');
    // A copy "ready" before it was applied for is ignored.
    assert.equal(computeLimitation({ startDate: '2026-10-01', period: 30, unit: 'days', copyApplied: '2026-10-09', copyReady: '2026-10-05' }).excludedDays, 0);
});

test('months and years end on the corresponding date, clamped to month end', () => {
    assert.equal(addMonths('2026-01-31', 1), '2026-02-28');
    assert.equal(addMonths('2024-02-29', 12), '2025-02-28');
    assert.equal(computeLimitation({ startDate: '2026-03-10', period: 3, unit: 'years', closedWeekdays: [] }).lastDate, '2029-03-10');
});

test('due buckets and reminder slots', () => {
    assert.equal(dueBucket('2026-11-01', '2026-11-02'), 'overdue');
    assert.equal(dueBucket('2026-11-02', '2026-11-02'), 'today');
    assert.equal(dueBucket('2026-11-09', '2026-11-02'), 'week');
    assert.equal(dueBucket('2026-11-10', '2026-11-02'), 'later');
    assert.equal(reminderSlot('2026-11-05', '2026-11-02'), '3d');
    assert.equal(reminderSlot('2026-11-03', '2026-11-02'), '1d');
    assert.equal(reminderSlot('2026-11-04', '2026-11-02'), null);
});

test('Pakistan date, and every rule is usable', () => {
    // 20:00 UTC on 2 Nov is already 3 Nov in Karachi (UTC+5).
    assert.equal(pkToday(new Date('2026-11-02T20:00:00Z')), '2026-11-03');
    const ids = new Set(LIMITATION_RULES.map((r) => r.id));
    assert.equal(ids.size, LIMITATION_RULES.length);
    for (const r of LIMITATION_RULES) assert.ok(r.period > 0 && r.source && r.label, r.id);
});
