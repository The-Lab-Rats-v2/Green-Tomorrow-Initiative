// =============================================
// AUTHENTICATION MODULE
// =============================================

import { supabase, TABLES, handleSupabaseError } from './supabase.js';

// =============================================
// USER REGISTRATION
// =============================================

export async function registerUser(fullName, email, password) {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    // When email confirmation is disabled, a session is available immediately and
    // the member can create their own profile under the RLS policy. Confirmed
    // sign-ups are handled by the database trigger in sql-schema.sql instead.
    if (authData.session) {
      const { error: profileError } = await supabase
        .from(TABLES.PROFILES)
        .upsert({
          auth_user_id: authData.user.id,
          full_name: fullName,
          email,
          role: 'member'
        }, { onConflict: 'auth_user_id' });

      if (profileError) throw profileError;
    }

    return authData;
  } catch (error) {
    throw await handleSupabaseError(error);
  }
}

// =============================================
// USER LOGIN
// =============================================

export async function loginUser(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error('Login failed');
    }

    return data.user;
  } catch (error) {
    throw await handleSupabaseError(error);
  }
}

// =============================================
// USER LOGOUT
// =============================================

export async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    throw await handleSupabaseError(error);
  }
}

// =============================================
// GET CURRENT USER
// =============================================

export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    if (!user) {
      return null;
    }

    // Fetch user profile
    let { data: profile, error: profileError } = await supabase
      .from(TABLES.PROFILES)
      .select('*')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    // Accounts created before the profile trigger was installed will not have a
    // profiles row. Recover it from the secure Auth user metadata on first use.
    if (!profile) {
      profile = await createMissingProfile(user);
    }

    return {
      ...user,
      profile
    };
  } catch (error) {
    throw await handleSupabaseError(error);
  }
}

async function createMissingProfile(user) {
  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Green Tomorrow member';
  const { data, error } = await supabase
    .from(TABLES.PROFILES)
    .upsert({
      auth_user_id: user.id,
      full_name: fullName,
      email: user.email,
      role: 'member'
    }, { onConflict: 'auth_user_id' })
    .select()
    .single();

  if (error) {
    console.error('Profile recovery failed:', error);
    throw new Error('Your member profile could not be created. Run sql-fix-profile-creation.sql in Supabase, then refresh this page.');
  }

  return data;
}

// =============================================
// CHECK IF USER IS AUTHENTICATED
// =============================================

export async function isAuthenticated() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    return false;
  }
}

// =============================================
// GET USER PROFILE
// =============================================

export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw await handleSupabaseError(error);
  }
}

// =============================================
// UPDATE USER PROFILE
// =============================================

export async function updateUserProfile(userId, updates) {
  try {
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw await handleSupabaseError(error);
  }
}

// =============================================
// CHECK IF USER IS ADMIN
// =============================================

export async function isAdmin() {
  try {
    const user = await getCurrentUser();

    if (!user || !user.profile) {
      return false;
    }

    return user.profile.role === 'admin';
  } catch (error) {
    return false;
  }
}

// =============================================
// WATCH AUTH STATE CHANGES
// =============================================

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}
