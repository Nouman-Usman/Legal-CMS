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

    if (typeof filter.limit === 'number') {
      if (typeof filter.offset === 'number') {
        query = query.range(filter.offset, filter.offset + filter.limit - 1);
      } else {
        query = query.limit(filter.limit);
      }
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
    assigned_to: string;
    due_date?: string;
    priority?: string;
    status?: string;
  }
) {
  try {
    const { data, error } = await supabase
      .from('case_tasks')
      .insert({
        ...taskData,
        status: taskData.status || 'todo',
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
      .from('case_tasks')
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
      .from('case_tasks')
      .select('*, assigned_user:assigned_to(full_name)')
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
    // 1. Find or create a thread for Case Notes
    let threadId;

    // Check for existing thread
    const { data: threads } = await supabase
      .from('message_threads')
      .select('id')
      .eq('case_id', caseId)
      .eq('subject', 'Case Notes')
      .limit(1);

    if (threads && threads.length > 0) {
      threadId = threads[0].id;
    } else {
      // Create new thread
      const { data: newThread, error: threadError } = await supabase
        .from('message_threads')
        .insert({
          case_id: caseId,
          subject: 'Case Notes'
        })
        .select()
        .single();

      if (threadError) throw threadError;
      threadId = newThread.id;
    }

    // 2. Insert message
    const { data, error } = await supabase
      .from('messages')
      .insert({
        thread_id: threadId,
        sender_id: noteData.created_by,
        content: noteData.content
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
    // 1. Get thread ID
    const { data: thread } = await supabase
      .from('message_threads')
      .select('id')
      .eq('case_id', caseId)
      .eq('subject', 'Case Notes')
      .single();

    if (!thread) return { notes: [], error: null };

    // 2. Get messages
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, sender:sender_id(full_name)')
      .eq('thread_id', thread.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return { notes: messages, error: null };
  } catch (error) {
    return { notes: null, error };
  }
}
