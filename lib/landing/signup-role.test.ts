import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSignupRole } from './signup-role.ts';

test('accepts the two roles signup offers', () => {
    assert.equal(parseSignupRole('chamber_admin'), 'chamber_admin');
    assert.equal(parseSignupRole('client'), 'client');
});

test('ignores lawyer, unknown, mis-cased, padded and missing values', () => {
    for (const value of ['lawyer', 'admin', 'CLIENT', '', 'client ', null, undefined]) {
        assert.equal(parseSignupRole(value), null, String(value));
    }
});
