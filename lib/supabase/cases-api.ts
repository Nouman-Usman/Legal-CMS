import { supabase } from '@/lib/supabase/client';

/**
 * Comprehensive Case API Helper Functions
 * Provides convenient methods for all case operations
 */

export interface CreateCaseInput {
  case_number: string;
  title: string;
  description?: string;
  client_id: string;
  assigned_to?: string;
  case_type?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'open' | 'pending' | 'closed' | 'archived';
  filing_date?: string;
  next_hearing_date?: string;
}

// ============= CASE FUNCTIONS =============

/**
 * Fetch all cases for a chamber
 */
export async function getCasesByChamberId(chamberId: string) {
  try {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('chamber_id', chamberId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Fetch a single case by ID
 */
export async function getCaseById(caseId: string) {
  try {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Create a new case
 */
export async function createCase(chamberId: string, input: CreateCaseInput) {
  try {
    const { data, error } = await supabase
      .from('cases')
      .insert([
        {
          ...input,
          chamber_id: chamberId,
          priority: input.priority || 'medium',
          status: input.status || 'open',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Update a case
 */
export async function updateCase(caseId: string, updates: Partial<CreateCaseInput>) {
  try {
    const { data, error } = await supabase
      .from('cases')
      .update(updates)
      .eq('id', caseId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Soft delete a case
 */
export async function deleteCase(caseId: string) {
  try {
    const { data, error } = await supabase
      .from('cases')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', caseId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Update case status
 */
export async function updateCaseStatus(
  caseId: string,
  status: 'open' | 'pending' | 'closed' | 'archived'
) {
  try {
    const { data, error } = await supabase
      .from('cases')
      .update({ status })
      .eq('id', caseId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Assign case to a lawyer
 */
export async function assignCaseToLawyer(caseId: string, lawyerId: string) {
  try {
    const { data, error } = await supabase
      .from('cases')
      .update({ assigned_to: lawyerId })
      .eq('id', caseId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Get cases assigned to a lawyer
 */
export async function getCasesByLawyer(lawyerId: string) {
  try {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('assigned_to', lawyerId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Get cases for a specific client
 */
export async function getCasesByClient(clientId: string) {
  try {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('client_id', clientId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Search cases
 */
export async function searchCases(
  chamberId: string,
  searchQuery: string,
  filters?: { status?: string; priority?: string }
) {
  try {
    let query = supabase
      .from('cases')
      .select('*')
      .eq('chamber_id', chamberId)
      .is('deleted_at', null);

    if (searchQuery) {
      query = query.or(
        `case_number.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
      );
    }

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.priority && filters.priority !== 'all') {
      query = query.eq('priority', filters.priority);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Get case statistics for a chamber
 */
export async function getCaseStats(chamberId: string) {
  try {
    const { data, error } = await supabase
      .from('cases')
      .select('status, priority')
      .eq('chamber_id', chamberId)
      .is('deleted_at', null);

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      open: data?.filter((c) => c.status === 'open').length || 0,
      pending: data?.filter((c) => c.status === 'pending').length || 0,
      closed: data?.filter((c) => c.status === 'closed').length || 0,
      archived: data?.filter((c) => c.status === 'archived').length || 0,
      critical: data?.filter((c) => c.priority === 'critical').length || 0,
      high: data?.filter((c) => c.priority === 'high').length || 0,
    };

    return { data: stats, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// ============= DOCUMENT FUNCTIONS =============

/**
 * Get documents for a case
 */
export async function getCaseDocuments(caseId: string) {
  try {
    const { data, error } = await supabase
      .from('case_documents')
      .select('*')
      .eq('case_id', caseId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Add document to case
 */
export async function addCaseDocument(
  caseId: string,
  userId: string,
  document: {
    document_name: string;
    document_url: string;
    document_type?: string;
    file_size?: number;
  }
) {
  try {
    const { data, error } = await supabase
      .from('case_documents')
      .insert([{ ...document, case_id: caseId, uploaded_by: userId }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Delete document
 */
export async function deleteCaseDocument(documentId: string) {
  try {
    const { data, error } = await supabase
      .from('case_documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// ============= TASK FUNCTIONS =============

/**
 * Get tasks for a case
 */
export async function getCaseTasks(caseId: string) {
  try {
    const { data, error } = await supabase
      .from('case_tasks')
      .select('*')
      .eq('case_id', caseId)
      .is('deleted_at', null)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Create task
 */
export async function createTask(caseId: string, task: any) {
  try {
    const { data, error } = await supabase
      .from('case_tasks')
      .insert([{ ...task, case_id: caseId, status: task.status || 'pending' }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Update task status
 */
export async function updateTaskStatus(
  taskId: string,
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
) {
  try {
    const updateData: any = { status };
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('case_tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// ============= MESSAGE FUNCTIONS =============

/**
 * Get messages for a case
 */
export async function getCaseMessages(caseId: string) {
  try {
    const { data, error } = await supabase
      .from('case_messages')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Send message on case
 */
export async function sendCaseMessage(caseId: string, userId: string, message: string) {
  try {
    const { data, error } = await supabase
      .from('case_messages')
      .insert([{ case_id: caseId, user_id: userId, message }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// ============= TIME ENTRY FUNCTIONS =============

/**
 * Get time entries for a case
 */
export async function getCaseTimeEntries(caseId: string) {
  try {
    const { data, error } = await supabase
      .from('case_time_entries')
      .select('*')
      .eq('case_id', caseId)
      .is('deleted_at', null)
      .order('entry_date', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Log time entry
 */
export async function addTimeEntry(
  caseId: string,
  lawyerId: string,
  entry: {
    description: string;
    hours: number;
    rate?: number;
    entry_date: string;
  }
) {
  try {
    const { data, error } = await supabase
      .from('case_time_entries')
      .insert([{ ...entry, case_id: caseId, lawyer_id: lawyerId }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Calculate billable hours for a case
 */
export async function calculateBillableHours(caseId: string) {
  try {
    const { data, error } = await supabase
      .from('case_time_entries')
      .select('hours, rate')
      .eq('case_id', caseId)
      .is('deleted_at', null);

    if (error) throw error;

    const stats = {
      totalHours: data?.reduce((sum, entry) => sum + entry.hours, 0) || 0,
      totalBillable:
        data?.reduce((sum, entry) => sum + (entry.hours * (entry.rate || 0)), 0) || 0,
      averageRate: data?.length
        ? data.reduce((sum, entry) => sum + (entry.rate || 0), 0) / data.length
        : 0,
    };

    return { data: stats, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// ============= ACTIVITY LOG FUNCTIONS =============

/**
 * Get activity log for a case
 */
export async function getCaseActivityLog(caseId: string) {
  try {
    const { data, error } = await supabase
      .from('case_activity_log')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Log activity
 */
export async function logActivity(
  caseId: string,
  userId: string,
  action: string,
  changes?: any
) {
  try {
    const { data, error } = await supabase
      .from('case_activity_log')
      .insert([{ case_id: caseId, user_id: userId, action, changes: changes || null }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
