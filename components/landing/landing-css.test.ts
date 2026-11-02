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

// Split a selector list on top-level commas only (not inside :is()/:not()).
function selectors(list: string): string[] {
    const out: string[] = [];
    let depth = 0;
    let start = 0;
    for (let i = 0; i < list.length; i++) {
        if (list[i] === '(') depth++;
        else if (list[i] === ')') depth--;
        else if (list[i] === ',' && depth === 0) {
            out.push(list.slice(start, i));
            start = i + 1;
        }
    }
    out.push(list.slice(start));
    return out.map((s) => s.trim());
}

test('every rule is scoped to the landing root', () => {
    assert.ok(all.length > 0);
    for (const [selector] of all) {
        for (const part of selectors(selector)) {
            assert.match(part, /^(\.has-motion )?\.landing\b/, `unscoped selector: ${part}`);
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

test('a focused deck card turns face-up', () => {
    const rule = all.find(([selector]) => selector.includes('.l-deck__card:focus-within'));
    assert.ok(rule, 'missing .l-deck__card:focus-within rule');
    assert.match(rule[1], /--f:\s*1/);
});

test('auth styles are scoped to the auth shell inside the landing theme', () => {
    const auth = readFileSync(new URL('../auth/auth.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const authRules = rules(auth);
    assert.ok(authRules.length > 0);
    for (const [selector] of authRules) {
        for (const part of selectors(selector)) {
            assert.match(part, /^\.landing\.l-auth\b/, `unscoped auth selector: ${part}`);
        }
    }
    assert.doesNotMatch(auth, /--color-\*/);
});
