import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { caseRef, lhcMobile, lhcQueryUrl, listingKey, matchListing, parseLhcCauseList, type ChamberCase } from './lhc.ts';

const html = readFileSync(new URL('./fixtures/lhc-sample.html', import.meta.url), 'utf8');

test('parses court headers and rows, with connected matters and list colours', () => {
    const { formatOk, total, listings } = parseLhcCauseList(html);
    assert.equal(formatOk, true);
    assert.equal(total, 4);
    assert.equal(listings.length, 4);
    assert.deepEqual(
        { date: listings[0].listDate, bench: listings[0].bench, judge: listings[0].judge, room: listings[0].courtRoom, seq: listings[0].seq, type: listings[0].listType },
        { date: '2026-11-03', bench: 'Single Bench', judge: 'Mr. Justice Test Judge One', room: 'Old Building - Court 7', seq: '12', type: 'regular' },
    );
    // "and" rows are heard with the matter above.
    assert.equal(listings[1].connected, true);
    assert.equal(listings[1].seq, '12');
    assert.equal(listings[2].judge, 'Mr. Justice Test Judge Two & Mr. Justice Test Judge Three');
    assert.equal(listings[2].listType, 'stay');
    assert.equal(listings[3].listType, 'part_heard');
});

test('an empty list is fine; a changed page is not', () => {
    const empty = 'Legend <div> Total Cases <b>(0)</b></div> Last Updated On: <BR>Principal Seat - 30-10-2026';
    assert.deepEqual(parseLhcCauseList(empty), { formatOk: true, total: 0, listings: [] });
    assert.equal(parseLhcCauseList('<html><body>Service unavailable</body></html>').formatOk, false);
});

test('case numbers', () => {
    assert.deepEqual(caseRef('W.P. 101/26'), { num: 101, yy: 26 });
    assert.deepEqual(caseRef('CM/1/3175/26'), { num: 3175, yy: 26 });
    assert.deepEqual(caseRef('Writ Petition No. 101 of 2026'), { num: 101, yy: 26 });
    assert.deepEqual(caseRef('TEST C.S. 55/2025'), { num: 55, yy: 25 });
    assert.equal(caseRef('Bail application'), null);
});

const cases: ChamberCase[] = [
    { id: 'wp', case_number: 'W.P. 101/26', title: 'Bashir Ahmed v. Govt of Punjab', client_name: 'Bashir Ahmed' },
    { id: 'cr', case_number: 'C.R. 101/26', title: 'Kamran v. Zubair', client_name: 'Kamran Akmal' },
    { id: 'rev', case_number: 'C.R. 56/25', title: 'Nadia Shah v. Imran Qureshi', client_name: 'Nadia Shah' },
];

test('matching: number + parties is automatic; anything less is suggested', () => {
    const [wp, cm, rev, other] = parseLhcCauseList(html).listings;
    // Two cases are 101/26; the parties pick the writ petition.
    assert.deepEqual(matchListing(wp, cases), { caseId: 'wp', status: 'auto', note: 'Case number and parties match' });
    assert.equal(matchListing(cm, cases).caseId, 'wp');
    // Number typo in the diary (56 vs 55): parties still find it, but a person confirms.
    assert.deepEqual(matchListing(rev, cases), { caseId: 'rev', status: 'suggested', note: 'Parties match; case number differs' });
    assert.equal(matchListing(other, cases).status, 'unmatched');
});

test('query URL, mobile format and listing key', () => {
    const url = new URL(lhcQueryUrl({ lawyerCode: 'L-123', location: 'ucrijaz' }));
    assert.equal(url.searchParams.get('lawyerCode'), 'L-123');
    assert.equal(url.searchParams.get('location'), 'ucrijaz');
    assert.equal(url.searchParams.get('weekDay'), '');
    assert.equal(lhcMobile('+92 300 1234567'), '300-1234567');
    assert.equal(lhcMobile('0300-1234567'), '300-1234567');
    assert.equal(lhcMobile('042 1234567'), null);
    const [a, b] = parseLhcCauseList(html).listings;
    assert.notEqual(listingKey(a), listingKey(b));
});
