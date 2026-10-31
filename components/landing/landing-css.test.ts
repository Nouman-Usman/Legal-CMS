import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('./landing.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

// Every style rule as [selector, body]; @media/@supports wrappers are unwrapped, @keyframes skipped.
function rules(source: string): Array<[string, string]> {
    const out: Array<[string, string]> = [];
    let i = 0;
    while (i < source.length) {
        const open = source.indexOf('{', i);
        if (open === -1) break;
        const head = source.slice(i, open).trim();
        let depth = 1;
        let j = open + 1;
        while (depth > 0 && j < source.length) {
            if (source[j] === '{') depth++;
            else if (source[j] === '}') depth--;
            j++;
        }
        const body = source.slice(open + 1, j - 1);
        if (head.startsWith('@keyframes')) {
            // skip
        } else if (head.startsWith('@')) {
            out.push(...rules(body));
        } else {
            out.push([head, body]);
        }
        i = j;
    }
    return out;
}

const all = rules(css);

test('every rule is scoped to the landing root', () => {
    assert.ok(all.length > 0);
    for (const [selector] of all) {
        for (const part of selector.split(',')) {
            assert.match(part.trim(), /^(\.has-motion )?\.landing\b/, `unscoped selector: ${part.trim()}`);
        }
    }
});

test('never resets the global colour palette', () => {
    assert.doesNotMatch(css, /--color-\*/);
    assert.doesNotMatch(css, /:\s*initial/);
});

test('viewport-height runways only exist with motion on', () => {
    for (const [selector, body] of all) {
        if (/(^|[\s;])height:\s*[^;]*\d(s|d|l)?vh/.test(body)) {
            assert.match(selector, /^\.has-motion /, `vh height outside .has-motion: ${selector}`);
        }
    }
});

test('has a reduced-motion block', () => {
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
