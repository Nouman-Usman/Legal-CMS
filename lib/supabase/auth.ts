import { supabase } from './client';

export async function signUp(email: string, password: string, fullName: string, role: 'chamber_admin' | 'lawyer' | 'client') {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (authError) throw authError;

    return { user: authData.user, error: null };
  } catch (error: any) {
    return { user: null, error: error?.message ? error : { message: 'An unknown error occurred' } };
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log(data);
    if (error) throw error;
    return { session: data.session, error: null };
  } catch (error: any) {
    return { session: null, error: error?.message ? error : { message: 'An unknown error occurred' } };
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error?.message ? error : { message: 'An unknown error occurred' } };
  }
}

export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user, error: null };
  } catch (error: any) {
    return { user: null, error: error?.message ? error : { message: 'An unknown error occurred' } };
  }
}

export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { profile: data, error: null };
  } catch (error: any) {
    return { profile: null, error: error?.message ? error : { message: 'An unknown error occurred' } };
  }
}
