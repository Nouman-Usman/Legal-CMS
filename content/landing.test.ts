import { test } from 'node:test';
import assert from 'node:assert/strict';
import { landing } from './landing.ts';

function strings(value: unknown): string[] {
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.flatMap(strings);
    if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
    return [];
}

const copy = strings(landing);

test('content is not empty', () => {
    assert.ok(copy.length > 20);
});

test('no em-dashes', () => {
    for (const s of copy) assert.ok(!s.includes('—'), s);
});

test('no banned phrases', () => {
    const banned = /unlock|leverage|seamlessly|cutting-edge|revolutioni[sz]e|elevate|unleash|transform your business|empower your journey/i;
    for (const s of copy) assert.doesNotMatch(s, banned);
});

test('no percentages or stat-style numbers', () => {
    for (const s of copy) assert.doesNotMatch(s, /\d+\s?%|\d+k\+/i);
});

test('never links a lawyer signup or the mock lawyer directory', () => {
    for (const s of copy) {
        assert.ok(!s.includes('role=lawyer'), s);
        assert.ok(!s.includes('find-lawyers'), s);
    }
});

test('audience cards route each role correctly', () => {
    const cards = landing.audiences.cards;
    assert.deepEqual(
        cards.map((c) => c.id),
        ['chambers', 'lawyers', 'clients'],
    );
    const byId = Object.fromEntries(cards.map((c) => [c.id, c]));
    assert.equal(byId.chambers.cta.href, '/auth/signup?role=chamber_admin');
    assert.equal(byId.clients.cta.href, '/auth/signup?role=client');
    assert.equal(byId.lawyers.cta.href, '/auth/signup?role=chamber_admin');
    assert.equal(byId.lawyers.secondary?.href, '/auth/login');
    for (const card of cards) assert.equal(card.features.length, 4);
});
