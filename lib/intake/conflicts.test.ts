import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRecords, matchName, nameTokens, runConflictCheck, titleSides } from './conflicts.ts';

test('names normalise spelling variants, honorifics and company words', () => {
    assert.deepEqual(nameTokens('Mr. Mohammad Ahmed Khan'), ['muhammad', 'ahmad', 'khan']);
    assert.deepEqual(nameTokens('ABC Textiles (Pvt.) Ltd.'), ['abc', 'textiles']);
    assert.deepEqual(nameTokens('Ali s/o Bashir'), ['ali', 'bashir']);
});

test('match strength', () => {
    assert.equal(matchName('Muhammad Ali Khan', 'Khan, Mohammed Ali'), 'exact');
    assert.equal(matchName('ABC Textiles Private Limited', 'ABC Textiles (Pvt) Ltd'), 'exact');
    assert.equal(matchName('Ali Raza', 'Syed Ali Raza Shah'), 'likely');
    assert.equal(matchName('Shahid Mehmood', 'Shahid Mahmood'), 'likely');
    assert.equal(matchName('Raza', 'Ali Raza'), 'possible');
    // Common names alone are noise.
    assert.equal(matchName('Muhammad', 'Muhammad Bilal'), null);
    assert.equal(matchName('Muhammad Khan', 'Muhammad Bilal Khan'), null);
    assert.equal(matchName('Ali Raza', 'Bilal Ahmad'), null);
});

test('title sides', () => {
    assert.deepEqual(titleSides('Ali v. Province of Punjab'), ['Ali', 'Province of Punjab']);
    assert.deepEqual(titleSides('State vs Bashir Ahmad'), ['State', 'Bashir Ahmad']);
    assert.deepEqual(titleSides('Bail application'), []);
});

const data = {
    clients: [{ full_name: 'Bashir Ahmed', phone: '0300 1234567' }],
    cases: [
        { id: 'c1', case_number: 'W.P. 1/26', title: 'Bashir Ahmad v. Kamran Akmal', client_name: 'Bashir Ahmed', client_phone: '03001234567' },
        { id: 'c2', case_number: 'C.S. 9/26', title: 'Nadia Shah v. Imran Qureshi', client_name: null, client_phone: null },
    ],
    parties: [{ case_id: 'c1', name: 'Zubair Textiles (Pvt) Ltd', role: 'opposing' as const }],
    leads: [{ name: 'Farah Naz', phone: null }],
};

test('records know which side of the title the client is on', () => {
    const records = buildRecords(data);
    const c1Title = records.filter((r) => r.caseId === 'c1' && r.source === 'Case title');
    assert.deepEqual(c1Title.map((r) => [r.name, r.role]), [['Kamran Akmal', 'opposing']]);
    // Unknown client: both sides need review.
    assert.equal(records.filter((r) => r.caseId === 'c2' && r.role === 'title').length, 2);
});

test('acting against an existing client is a conflict, and so is a new client we act against', () => {
    const records = buildRecords(data);
    const hits = runConflictCheck({ clientName: 'Kamran Akmal', opposing: ['Bashir Ahmad'] }, records);
    const conflicts = hits.filter((h) => h.severity === 'conflict');
    assert.ok(conflicts.some((h) => h.searched === 'client' && h.record.name === 'Kamran Akmal'));
    assert.ok(conflicts.some((h) => h.searched === 'opposing' && h.record.role === 'client'));
    assert.equal(hits[0].severity, 'conflict');
});

test('phone matches, leads and clean checks', () => {
    const records = buildRecords(data);
    const byPhone = runConflictCheck({ clientName: 'Someone Else', clientPhone: '+92 300 1234567', opposing: [] }, records);
    assert.ok(byPhone.some((h) => h.strength === 'exact' && h.reason.includes('same phone')));
    const lead = runConflictCheck({ clientName: 'Usman Tariq', opposing: ['Farah Naz'] }, records);
    assert.deepEqual(lead.map((h) => h.severity), ['review']);
    assert.deepEqual(runConflictCheck({ clientName: 'Usman Tariq', opposing: ['Hamid Mir'] }, records), []);
    // Company names match regardless of (Pvt) Ltd.
    assert.ok(runConflictCheck({ clientName: 'Zubair Textiles Private Limited', opposing: [] }, records).some((h) => h.severity === 'conflict'));
});
