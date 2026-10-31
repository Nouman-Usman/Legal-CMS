import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('./dash.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

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
        } else if (head.startsWith('@')) out.push(...rules(body));
        else out.push([head, body]);
        i = j;
    }
    return out;
}

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

const all = rules(css);

test('every dashboard rule is scoped to .l-dash', () => {
    assert.ok(all.length > 0);
    for (const [selector] of all) for (const part of selectors(selector)) assert.match(part, /^\.l-dash\b/, `unscoped: ${part}`);
});

test('the scope defines theme tokens and remaps shadcn variables', () => {
    const root = all.find(([selector]) => selector === '.l-dash');
    assert.ok(root, 'missing .l-dash root rule');
    for (const name of ['--l-lime', '--l-canvas', '--background', '--primary', '--primary-foreground', '--ring', '--popover', '--border']) {
        assert.match(root[1], new RegExp(`${name}:`), name);
    }
});

test('never resets the global palette and respects reduced motion', () => {
    assert.doesNotMatch(css, /--color-\*/);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
