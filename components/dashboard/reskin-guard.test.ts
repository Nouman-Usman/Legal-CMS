import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { REBUILT } from './rebuilt.ts';

// Classes from the old light/italic dashboard that must not survive a rebuild.
const BANNED = /\b(italic|font-black|bg-white|(bg|text|border|from|to|via)-(slate|blue|indigo|red|green|emerald|rose|amber|gray)-\d{2,3})\b/;

test('rebuilt files carry none of the old dashboard classes', () => {
    assert.ok(REBUILT.length > 0);
    for (const path of REBUILT) {
        const source = readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
        const hit = source.match(BANNED);
        assert.equal(hit, null, `${path} still has "${hit?.[0]}"`);
    }
});
