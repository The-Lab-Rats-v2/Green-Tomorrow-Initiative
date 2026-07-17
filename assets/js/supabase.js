// =============================================
// SUPABASE CONFIGURATION
// =============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

// Initialize Supabase client
   const SUPABASE_URL = 'https://dtveimgtouemaoucetxw.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0dmVpbWd0b3VlbWFvdWNldHh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxOTQ1NzgsImV4cCI6MjA5OTc3MDU3OH0.QHHVo9NGtSv2d6LCps9zK8EOuQtD4XSDiVPA_E7jS8M';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =============================================
// STORAGE CONFIGURATION
// =============================================

export const STORAGE_CONFIG = {
  proposalBucket: 'competition-proposals',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedExtensions: ['.pdf', '.doc', '.docx']
};

// =============================================
// TABLE NAMES
// =============================================

export const TABLES = {
  PROFILES: 'profiles',
  EVENTS: 'events',
  VOLUNTEER_REGISTRATIONS: 'volunteer_registrations',
  DONATIONS: 'donations',
  GREEN_CHALLENGE_ENTRIES: 'green_challenge_entries',
  NEWS: 'news'
};

// =============================================
// ERROR HANDLING
// =============================================

export class SupabaseError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'SupabaseError';
    this.originalError = originalError;
  }
}

export async function handleSupabaseError(error) {
  console.error('Supabase Error:', error);
  
  if (error.status === 401 || error.status === 403) {
    // Authentication/authorization error
    throw new SupabaseError('Unauthorized access', error);
  }
  
  if (error.status === 409) {
    // Conflict error (duplicate entry, etc.)
    throw new SupabaseError('This entry already exists', error);
  }
  
  if (error.status === 404) {
    // Not found
    throw new SupabaseError('Record not found', error);
  }
  
  throw new SupabaseError(error.message || 'An error occurred', error);
}

// =============================================
// INITIALIZE RLS CONTEXT
// =============================================

// Check if user is authenticated on page load
export async function initializeAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
