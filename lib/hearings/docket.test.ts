import { test } from 'node:test';
import assert from 'node:assert/strict';
import { docketToWhatsApp, findClashes, groupByCourt, type DocketRow } from './docket.ts';

const row = (over: Partial<DocketRow>): DocketRow => ({
    id: 'h1',
    caseId: 'c1',
    caseNumber: 'W.P. 1234/26',
    caseTitle: 'Ali v. State',
    court: 'Lahore High Court',
    purpose: 'Arguments',
    causeListNo: '14',
    lawyerId: 'l1',
    lawyerName: 'Ahmed',
    status: 'scheduled',
    ...over,
});

test('groups rows by court, courts sorted, unknown court last', () => {
    const groups = groupByCourt([row({ id: 'a', court: 'Sessions Court' }), row({ id: 'b', court: null }), row({ id: 'c', court: 'Civil Court' })]);
    assert.deepEqual(
        groups.map((g) => g.court),
        ['Civil Court', 'Sessions Court', 'Court not set'],
    );
});

test('a lawyer listed in two different courts on one day is a clash', () => {
    const clashes = findClashes([row({ id: 'a', court: 'LHC' }), row({ id: 'b', court: 'Civil Court' }), row({ id: 'c', lawyerId: 'l2', court: 'LHC' })]);
    assert.deepEqual([...clashes].sort(), ['a', 'b']);
});

test('same lawyer in the same court twice is not a clash; unassigned rows never clash', () => {
    assert.equal(findClashes([row({ id: 'a' }), row({ id: 'b' })]).size, 0);
    assert.equal(findClashes([row({ id: 'a', lawyerId: null, court: 'X' }), row({ id: 'b', lawyerId: null, court: 'Y' })]).size, 0);
});

test('WhatsApp text lists each court with serial, case, purpose and lawyer', () => {
    const text = docketToWhatsApp([row({}), row({ id: 'b', court: 'Civil Court', causeListNo: null, lawyerName: null, purpose: null })], new Date('2026-11-03T00:00:00'));
    assert.match(text, /^\*Docket: Tue, 3 Nov 2026\*/);
    assert.match(text, /\*Lahore High Court\*\n14\. W\.P\. 1234\/26 Ali v\. State: Arguments \(Ahmed\)/);
    assert.match(text, /\*Civil Court\*\n- W\.P\. 1234\/26 Ali v\. State \(unassigned\)/);
});

test('empty docket says so', () => {
    assert.match(docketToWhatsApp([], new Date('2026-11-03T00:00:00')), /No hearings\./);
});
