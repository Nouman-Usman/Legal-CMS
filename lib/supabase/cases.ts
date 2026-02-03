import { supabase } from './client';

export async function createCase(
  caseData: {
    case_number: string;
    title: string;
    description: string;
    client_id: string;
    assigned_to?: string;
    status?: string;
    priority?: string;
    case_type?: string;
    filing_date?: string;
    hearing_date?: string;
    expected_closure_date?: string;
  }
) {
  try {
    const { data, error } = await supabase
      .from('cases')
      .insert({
        ...caseData,
        status: caseData.status || 'active',
        priority: caseData.priority || 'medium',
      })
      .select()
      .single();

    if (error) throw error;
    return { case: data, error: null };
  } catch (error) {
    return { case: null, error };
  }
}

export async function getCaseById(caseId: string) {
  try {
    const { data, error } = await supabase
      .from('cases')
      .select('*, assigned_lawyer:assigned_to(full_name, email), client:client_id(full_name, email)')
      .eq('id', caseId)
      .single();

    if (error) throw error;
    return { case: data, error: null };
  } catch (error) {
    return { case: null, error };
  }
}

export async function updateCase(caseId: string, updates: Record<string, any>) {
  try {
    const { data, error } = await supabase
      .from('cases')
      .update(updates)
      .eq('id', caseId)
      .select()
      .single();

    if (error) throw error;
    return { case: data, error: null };
  } catch (error) {
    return { case: null, error };
  }
}

export async function getCasesByFilter(filter: {
  assigned_to?: string;
  client_id?: string;
  status?: string;
  priority?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from('cases')
      .select('*');

    if (filter.assigned_to) {
      query = query.eq('assigned_to', filter.assigned_to);
    }
    if (filter.client_id) {
      query = query.eq('client_id', filter.client_id);
    }
    if (filter.status) {
      query = query.eq('status', filter.status);
    }
    if (filter.priority) {
      query = query.eq('priority', filter.priority);
    }

    query = query.order('updated_at', { ascending: false });

    if (filter.limit) {
      query = query.limit(filter.limit);
    }
    if (filter.offset) {
      query = query.offset(filter.offset);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { cases: data, error: null };
  } catch (error) {
    return { cases: null, error };
  }
}

export async function addCaseDocument(
  caseId: string,
  documentData: {
    name: string;
    type: string;
    url: string;
    uploaded_by: string;
  }
) {
  try {
    const { data, error } = await supabase
      .from('case_documents')
      .insert({
        case_id: caseId,
        ...documentData,
      })
      .select()
      .single();

    if (error) throw error;
    return { document: data, error: null };
  } catch (error) {
    return { document: null, error };
  }
}

export async function getCaseDocuments(caseId: string) {
  try {
    const { data, error } = await supabase
      .from('case_documents')
      .select('*')
      .eq('case_id', caseId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return { documents: data, error: null };
  } catch (error) {
    return { documents: null, error };
  }
}

export async function createTask(
  taskData: {
    case_id: string;
    title: string;
    description?: string;
    assigned_to: string;
    due_date?: string;
    priority?: string;
    status?: string;
  }
) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        status: taskData.status || 'pending',
        priority: taskData.priority || 'medium',
      })
      .select()
      .single();

    if (error) throw error;
    return { task: data, error: null };
  } catch (error) {
    return { task: null, error };
  }
}

export async function updateTask(taskId: string, updates: Record<string, any>) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return { task: data, error: null };
  } catch (error) {
    return { task: null, error };
  }
}

export async function getTasksByCase(caseId: string) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('case_id', caseId)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return { tasks: data, error: null };
  } catch (error) {
    return { tasks: null, error };
  }
}

export async function createCaseNote(
  caseId: string,
  noteData: {
    content: string;
    created_by: string;
    is_private?: boolean;
  }
) {
  try {
    const { data, error } = await supabase
      .from('case_notes')
      .insert({
        case_id: caseId,
        ...noteData,
        is_private: noteData.is_private || false,
      })
      .select()
      .single();

    if (error) throw error;
    return { note: data, error: null };
  } catch (error) {
    return { note: null, error };
  }
}

export async function getCaseNotes(caseId: string, userId?: string) {
  try {
    let query = supabase
      .from('case_notes')
      .select('*')
      .eq('case_id', caseId);

    // If userId is provided, exclude private notes not created by this user
    if (userId) {
      query = query.or(`is_private.eq.false,created_by.eq.${userId}`);
    } else {
      query = query.eq('is_private', false);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return { notes: data, error: null };
  } catch (error) {
    return { notes: null, error };
  }
}
