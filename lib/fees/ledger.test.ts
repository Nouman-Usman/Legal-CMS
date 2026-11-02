import { test } from 'node:test';
import assert from 'node:assert/strict';
import { duesReminderText, formatMoney, receiptText, summarize, type LedgerEntry } from './ledger.ts';

const e = (kind: LedgerEntry['kind'], amount: number, voided = false): LedgerEntry => ({
    id: `${kind}-${amount}`,
    kind,
    amount,
    entry_date: '2026-11-02',
    voided_at: voided ? '2026-11-02T10:00:00Z' : null,
});

test('formats rupees with grouping, no decimals for whole amounts', () => {
    assert.equal(formatMoney(15000), 'Rs 15,000');
    assert.equal(formatMoney(1234567.5), 'Rs 1,234,567.50');
    assert.equal(formatMoney(2500, 'USD'), 'USD 2,500');
});

test('summary: charges minus payments and waivers, voided entries ignored', () => {
    const s = summarize([e('fee', 20000), e('appearance', 5000), e('expense', 750), e('payment', 15000), e('payment', 1000, true), e('waiver', 750)]);
    assert.deepEqual(s, { charged: 25750, paid: 15000, waived: 750, balance: 10000 });
});

test('empty ledger is all zero', () => {
    assert.deepEqual(summarize([]), { charged: 0, paid: 0, waived: 0, balance: 0 });
});

test('receipt text for WhatsApp', () => {
    const text = receiptText({
        chamberName: "Nouman's Chamber",
        receiptNo: 'RCPT-2026-0001',
        clientName: 'Muhammad Ali',
        caseRef: 'W.P. 101/26 – Ali v. Province of Punjab',
        amount: 15000,
        method: 'cash',
        date: '2026-11-02',
        balance: 10000,
    });
    assert.match(text, /^Nouman's Chamber\nReceipt RCPT-2026-0001/);
    assert.match(text, /Received from: Muhammad Ali/);
    assert.match(text, /Amount: Rs 15,000 \(Cash\)/);
    assert.match(text, /Date: 2 Nov 2026/);
    assert.match(text, /Balance due: Rs 10,000/);
});

test('receipt says fully paid at zero balance', () => {
    const text = receiptText({ chamberName: 'C', receiptNo: 'R', clientName: 'A', caseRef: 'X', amount: 1, method: 'raast', date: '2026-11-02', balance: 0 });
    assert.match(text, /Fully paid/);
});

test('dues reminder mentions the balance politely', () => {
    const text = duesReminderText({ clientName: 'Muhammad Ali', caseRef: 'W.P. 101/26', balance: 10000, chamberName: "Nouman's Chamber" });
    assert.match(text, /^Assalam-o-Alaikum Muhammad Ali,/);
    assert.match(text, /Rs 10,000/);
    assert.match(text, /Nouman's Chamber$/);
});
