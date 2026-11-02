/** Case document rules shared by the uploader and the storage policies. */

export const DOCUMENTS_BUCKET = 'case-documents';
export const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;

/** Extensions a chamber needs: PDFs, scans/photos of orders, Word/Excel, plain text. */
const ALLOWED_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'doc', 'docx', 'xls', 'xlsx', 'txt']);

/** The file picker's `accept` value. */
export const DOCUMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.doc,.docx,.xls,.xlsx,.txt,image/*,application/pdf';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function extensionOf(name: string) {
    const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
    return m ? m[1] : '';
}

/** Returns an error message, or null when the file can be uploaded. */
export function validateDocument(file: { name: string; type: string; size: number }): string | null {
    if (!file.size) return 'The file is empty.';
    if (file.size > MAX_DOCUMENT_BYTES) return 'Files can be up to 15 MB.';
    if (!ALLOWED_EXTENSIONS.has(extensionOf(file.name))) return 'This file type is not allowed. Use PDF, an image, Word, Excel or text.';
    return null;
}

/**
 * `<chamber>/<case>/<id>-<clean name>`. The first two segments are what the storage
 * policies check, so they must be real uuids; the file name keeps only safe ASCII.
 */
export function documentPath(chamberId: string, caseId: string, id: string, fileName: string) {
    if (!UUID.test(chamberId) || !UUID.test(caseId)) throw new Error('Invalid chamber or case id');
    const base = fileName.split(/[\\/]/).pop() ?? '';
    const ext = extensionOf(base);
    const stem = base
        .replace(/\.[^.]*$/, '')
        .replace(/[^A-Za-z0-9._-]+/g, '-')
        .replace(/^[-.]+|[-.]+$/g, '')
        .slice(0, 80);
    return `${chamberId}/${caseId}/${id}-${stem || 'document'}${ext ? `.${ext}` : ''}`;
}
