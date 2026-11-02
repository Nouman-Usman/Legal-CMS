import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildClientUpdate, normalizePkPhone, whatsappLink } from './client-update.ts';

test('normalises the ways Pakistani mobiles are written', () => {
    for (const raw of ['+92 300 1234567', '0300-1234567', '923001234567', '00923001234567', '3001234567', ' (0300) 123 4567 ']) {
        assert.equal(normalizePkPhone(raw), '923001234567', raw);
    }
});

test('keeps other international numbers, rejects junk', () => {
    assert.equal(normalizePkPhone('+44 7700 900123'), '447700900123');
    assert.equal(normalizePkPhone(''), null);
    assert.equal(normalizePkPhone(null), null);
    assert.equal(normalizePkPhone('12345'), null);
    assert.equal(normalizePkPhone('call me'), null);
});

test('wa.me link carries the encoded text', () => {
    assert.equal(whatsappLink('923001234567', 'Next date: 3 Nov & 4 Nov'), 'https://wa.me/923001234567?text=Next%20date%3A%203%20Nov%20%26%204%20Nov');
});

const base = {
    clientName: 'Muhammad Ali',
    caseNumber: 'W.P. 101/26',
    caseTitle: 'Ali v. Province of Punjab',
    court: 'Lahore High Court',
    status: 'adjourned' as const,
    nextDate: new Date('2026-11-03T09:00:00'),
    nextPurpose: 'Arguments',
    chamberName: "Nouman's Chamber",
};

test('English adjournment message has case, outcome, next date, purpose and sign-off', () => {
    const text = buildClientUpdate({ ...base, lang: 'en' });
    assert.match(text, /^Assalam-o-Alaikum Muhammad Ali,/);
    assert.match(text, /W\.P\. 101\/26/);
    assert.match(text, /adjourned/i);
    assert.match(text, /Next date: Tue, 3 Nov 2026, for Arguments/);
    assert.match(text, /Nouman's Chamber$/);
});

test('Urdu message is in Urdu with the same date', () => {
    const text = buildClientUpdate({ ...base, lang: 'ur' });
    assert.match(text, /السلام علیکم/);
    assert.match(text, /اگلی تاریخ/);
    assert.match(text, /Tue, 3 Nov 2026/);
});

test('both languages: English then Urdu', () => {
    const text = buildClientUpdate({ ...base, lang: 'both' });
    assert.ok(text.indexOf('Assalam-o-Alaikum') < text.indexOf('السلام علیکم'));
});

test('a decided case has no next date line', () => {
    const text = buildClientUpdate({ ...base, status: 'decided', nextDate: null, lang: 'en' });
    assert.doesNotMatch(text, /Next date/);
    assert.match(text, /decided/i);
});

test('optional note is included when given', () => {
    assert.match(buildClientUpdate({ ...base, note: 'Please bring the original agreement.', lang: 'en' }), /Please bring the original agreement\./);
});
