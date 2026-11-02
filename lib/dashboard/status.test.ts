import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statusTone } from './status.ts';

test('live statuses are lime', () => {
    for (const s of ['active', 'open', 'converted', 'completed', 'decided']) assert.equal(statusTone(s), 'lime', s);
});

test('waiting statuses are violet', () => {
    for (const s of ['pending', 'new', 'contacted', 'consultation', 'invited', 'scheduled']) assert.equal(statusTone(s), 'violet', s);
});

test('failed statuses are danger', () => {
    for (const s of ['lost', 'cancelled', 'suspended']) assert.equal(statusTone(s), 'danger', s);
});

test('everything else, including missing values, is neutral', () => {
    for (const s of ['closed', 'inactive', 'archived', 'whatever', '', null, undefined]) assert.equal(statusTone(s), 'neutral', String(s));
});

test('matching ignores case and surrounding spaces', () => {
    assert.equal(statusTone(' Active '), 'lime');
    assert.equal(statusTone('PENDING'), 'violet');
});
