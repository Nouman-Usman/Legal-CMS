import { test } from 'node:test';
import assert from 'node:assert/strict';
import { easeInOutCubic, scrollDuration } from './scroll.ts';

test('easing starts at 0, ends at 1 and is symmetric at the midpoint', () => {
    assert.equal(easeInOutCubic(0), 0);
    assert.equal(easeInOutCubic(1), 1);
    assert.equal(easeInOutCubic(0.5), 0.5);
    assert.ok(easeInOutCubic(0.25) < 0.25, 'slow start');
    assert.ok(easeInOutCubic(0.75) > 0.75, 'slow finish');
});

test('scroll duration grows with distance within 600-1600ms', () => {
    assert.equal(scrollDuration(0), 600);
    assert.equal(scrollDuration(2000), 1000);
    assert.equal(scrollDuration(-2000), 1000);
    assert.equal(scrollDuration(100000), 1600);
});
