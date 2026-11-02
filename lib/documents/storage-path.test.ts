import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_DOCUMENT_BYTES, documentPath, validateDocument } from './storage-path.ts';

const chamber = '82fe5b72-7691-4f17-84a7-29bf75c0ed0e';
const kase = '2e07ce29-6442-4dac-84f6-338e8c2da1ec';

test('path is chamber/case/id-name with a cleaned file name', () => {
    assert.equal(documentPath(chamber, kase, 'abc123', 'Order Sheet 03-11.pdf'), `${chamber}/${kase}/abc123-Order-Sheet-03-11.pdf`);
});

test('path strips directories, traversal and odd characters', () => {
    const p = documentPath(chamber, kase, 'id1', '../../etc/passwd?.pdf');
    assert.equal(p, `${chamber}/${kase}/id1-passwd.pdf`);
    assert.equal(documentPath(chamber, kase, 'id2', 'درخواست.pdf'), `${chamber}/${kase}/id2-document.pdf`);
});

test('path rejects ids that are not uuids', () => {
    assert.throws(() => documentPath('../x', kase, 'id', 'a.pdf'));
    assert.throws(() => documentPath(chamber, 'nope', 'id', 'a.pdf'));
});

test('accepts common legal document types', () => {
    for (const [name, type] of [
        ['a.pdf', 'application/pdf'],
        ['b.jpg', 'image/jpeg'],
        ['c.png', 'image/png'],
        ['d.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        ['e.heic', ''],
    ]) {
        assert.equal(validateDocument({ name, type, size: 1000 }), null, name);
    }
});

test('rejects empty, oversized and disallowed files', () => {
    assert.match(validateDocument({ name: 'a.pdf', type: 'application/pdf', size: 0 }) ?? '', /empty/i);
    assert.match(validateDocument({ name: 'a.pdf', type: 'application/pdf', size: MAX_DOCUMENT_BYTES + 1 }) ?? '', /15 MB/);
    assert.match(validateDocument({ name: 'run.exe', type: 'application/x-msdownload', size: 10 }) ?? '', /type/i);
    assert.match(validateDocument({ name: 'page.html', type: 'text/html', size: 10 }) ?? '', /type/i);
});
