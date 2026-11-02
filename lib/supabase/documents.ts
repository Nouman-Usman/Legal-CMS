import { supabase } from './client';
import { DOCUMENTS_BUCKET, documentPath, validateDocument } from '@/lib/documents/storage-path';

export interface CaseDocument {
    id: string;
    name: string;
    type: string | null;
    size: number | null;
    storage_path: string | null;
    url: string | null;
    uploaded_by: string | null;
    created_at: string;
    uploader?: { full_name: string | null } | null;
}

export async function getCaseDocuments(caseId: string) {
    const { data, error } = await supabase
        .from('case_documents')
        .select('id, name, type, size, storage_path, url, uploaded_by, created_at, uploader:uploaded_by(full_name)')
        .eq('case_id', caseId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
    return { documents: (data ?? []) as unknown as CaseDocument[], error };
}

/** Upload to the private bucket, then record it. Removes the object again if the record fails. */
export async function uploadCaseDocument({ chamberId, caseId, userId, file }: { chamberId: string; caseId: string; userId: string; file: File }) {
    const problem = validateDocument(file);
    if (problem) return { error: new Error(problem) };

    const path = documentPath(chamberId, caseId, crypto.randomUUID(), file.name);
    const { error: uploadError } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
    if (uploadError) return { error: uploadError };

    const { error: rowError } = await supabase.from('case_documents').insert({
        case_id: caseId,
        name: file.name,
        type: file.type || null,
        size: file.size,
        storage_path: path,
        uploaded_by: userId,
    });
    if (rowError) {
        await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
        return { error: rowError };
    }
    return { error: null };
}

/** A short-lived link (60 s) to view or download a document. */
export async function getDocumentUrl(doc: CaseDocument, download = false) {
    if (!doc.storage_path) return { url: null, error: new Error('This document was never uploaded to storage.') };
    const { data, error } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .createSignedUrl(doc.storage_path, 60, download ? { download: doc.name } : undefined);
    return { url: data?.signedUrl ?? null, error };
}

/** Remove the file, then hide the record (kept for the audit trail). */
export async function deleteCaseDocument(doc: CaseDocument) {
    if (doc.storage_path) {
        const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).remove([doc.storage_path]);
        if (error) return { error };
    }
    const { error } = await supabase.from('case_documents').update({ deleted_at: new Date().toISOString() }).eq('id', doc.id);
    return { error };
}
