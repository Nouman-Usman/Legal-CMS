import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clamp, middleCoverage, progressOf } from './motion.ts';

test('clamp keeps a value inside the range', () => {
    assert.equal(clamp(5, 0, 1), 1);
    assert.equal(clamp(-1, 0, 1), 0);
});

test('pin progress runs 0 to 1 across a tall runway', () => {
    assert.equal(progressOf({ top: 0, height: 2000 }, 'pin', 1000), 0);
    assert.equal(progressOf({ top: -500, height: 2000 }, 'pin', 1000), 0.5);
    assert.equal(progressOf({ top: -5000, height: 2000 }, 'pin', 1000), 1);
});

test('enter progress starts at the fold and ends 35% up the screen', () => {
    assert.equal(progressOf({ top: 1000, height: 400 }, 'enter', 1000), 0);
    assert.equal(progressOf({ top: 350, height: 400 }, 'enter', 1000), 1);
});

test('middle coverage is 1 when the band is covered and 0 when it is not', () => {
    assert.equal(middleCoverage({ top: 0, bottom: 1000 }, 1000), 1);
    assert.equal(middleCoverage({ top: 800, bottom: 1600 }, 1000), 0);
});
