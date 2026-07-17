// =============================================
// API MODULE - DATABASE CRUD OPERATIONS
// =============================================

import { supabase, TABLES, STORAGE_CONFIG, handleSupabaseError } from './supabase.js';
import { getCurrentUser } from './auth.js';

// =============================================
// EVENTS API
// =============================================

export async function getEvents(filters = {}) {
  try {
    let query = supabase
      .from(TABLES.EVENTS)
      .select('*')
      .order('date', { ascending: true });

    if (filters.upcoming) {
      query = query.gte('date', new Date().toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw await handleSupabaseError(error);
  }
}

export async function getEventById(eventId) {
  try {
    const { data, error } = await supabase
      .from(TABLES.EVENTS)
      .select('*, created_by(*)')
      .eq('id', eventId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw await handleSupabaseError(error);
  }
}

export async function createEvent(eventData) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.profile) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from(TABLES.EVENTS)
      .insert({
        ...eventData,
        created_by: user.profile.id
      })
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

export async function updateEvent(eventId, updates) {
  try {
    const { data, error } = await supabase
      .from(TABLES.EVENTS)
      .update(updates)
      .eq('id', eventId)
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

export async function deleteEvent(eventId) {
  try {
    const { error } = await supabase
      .from(TABLES.EVENTS)
      .delete()
      .eq('id', eventId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    throw await handleSupabaseError(error);
  }
}

// =============================================
// VOLUNTEER REGISTRATIONS API
// =============================================

export async function getVolunteerRegistrations(userId = null) {
  try {
    let query = supabase
      .from(TABLES.VOLUNTEER_REGISTRATIONS)
      .select('*, event:event_id(*), user:user_id(*)');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw await handleSupabaseError(error);
  }
}

export async function joinEvent(eventId) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.profile) {
      throw new Error('User not authenticated');
    }

    // Check for duplicate registration
    const { data: existing } = await supabase
      .from(TABLES.VOLUNTEER_REGISTRATIONS)
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.profile.id)
      .maybeSingle();

    if (existing) {
      throw new Error('Already registered for this event');
    }

    // Create registration
    const { data, error } = await supabase
      .from(TABLES.VOLUNTEER_REGISTRATIONS)
      .insert({
        event_id: eventId,
        user_id: user.profile.id,
        status: 'joined'
      })
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

export async function leaveEvent(eventId) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.profile) {
      throw new Error('User not authenticated');
    }

    // Get registration
    const { data: registration, error: fetchError } = await supabase
      .from(TABLES.VOLUNTEER_REGISTRATIONS)
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.profile.id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Delete registration
    const { error } = await supabase
      .from(TABLES.VOLUNTEER_REGISTRATIONS)
      .delete()
      .eq('id', registration.id);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    throw await handleSupabaseError(error);
  }
}

export async function getEventParticipantCount(eventId) {
  try {
    const { data, error } = await supabase.rpc('get_event_participant_count', {
      target_event_id: eventId
    });

    if (error) throw error;
    return Number(data || 0);
  } catch (error) {
    throw await handleSupabaseError(error);
  }
}

// =============================================
// DONATIONS API
// =============================================

export async function getDonations(userId = null) {
  try {
    let query = supabase
      .from(TABLES.DONATIONS)
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw await handleSupabaseError(error);
  }
}

export async function createDonation(amount, paymentReference = null) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.profile) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from(TABLES.DONATIONS)
      .insert({
        user_id: user.profile.id,
        amount: parseFloat(amount),
        payment_reference: paymentReference,
        status: 'completed'
      })
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
// GREEN CHALLENGE ENTRIES API
// =============================================

export async function getChallengeEntry(userId) {
  try {
    const { data, error } = await supabase
      .from(TABLES.GREEN_CHALLENGE_ENTRIES)
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  } catch (error) {
    throw await handleSupabaseError(error);
  }
}

export async function getAllChallengeEntries(filters = {}) {
  try {
    let query = supabase
      .from(TABLES.GREEN_CHALLENGE_ENTRIES)
      .select('*, user:user_id(*)')
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw await handleSupabaseError(error);
  }
}

export async function createChallengeEntry(entryData) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.profile) {
      throw new Error('User not authenticated');
    }

    // Check if user already has an entry
    const existing = await getChallengeEntry(user.profile.id);
    if (existing) {
      throw new Error('You have already submitted an entry');
    }

    const { data, error } = await supabase
      .from(TABLES.GREEN_CHALLENGE_ENTRIES)
      .insert({
        ...entryData,
        user_id: user.profile.id,
        status: 'pending'
      })
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

export async function updateChallengeEntry(entryId, updates) {
  try {
    const { data, error } = await supabase
      .from(TABLES.GREEN_CHALLENGE_ENTRIES)
      .update(updates)
      .eq('id', entryId)
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

export async function updateChallengeStatus(entryId, status) {
  try {
    return await updateChallengeEntry(entryId, { status });
  } catch (error) {
    throw await handleSupabaseError(error);
  }
}

// =============================================
// NEWS API
// =============================================

export async function getNews(limit = 10) {
  try {
    const { data, error } = await supabase
      .from(TABLES.NEWS)
      .select('*')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw await handleSupabaseError(error);
  }
}

export async function createNewsArticle(title, content, imageUrl = null) {
  try {
    const { data, error } = await supabase
      .from(TABLES.NEWS)
      .insert({
        title,
        content,
        image_url: imageUrl,
        published_at: new Date().toISOString()
      })
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

export async function deleteNewsArticle(articleId) {
  try {
    const { error } = await supabase
      .from(TABLES.NEWS)
      .delete()
      .eq('id', articleId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    throw await handleSupabaseError(error);
  }
}

// =============================================
// STORAGE - FILE UPLOADS
// =============================================

export async function uploadProposalFile(file) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.profile) {
      throw new Error('User not authenticated');
    }

    // Validate file
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!STORAGE_CONFIG.allowedExtensions.includes(ext)) {
      throw new Error('Invalid file type. Allowed: PDF, DOC, DOCX');
    }

    if (file.size > STORAGE_CONFIG.maxFileSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    // Generate unique filename
    const filename = `${user.profile.id}/${Date.now()}-${file.name}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from(STORAGE_CONFIG.proposalBucket)
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_CONFIG.proposalBucket)
      .getPublicUrl(filename);

    return {
      path: data.path,
      publicUrl: urlData.publicUrl
    };
  } catch (error) {
    throw await handleSupabaseError(error);
  }
}

export async function deleteProposalFile(filePath) {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_CONFIG.proposalBucket)
      .remove([filePath]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    throw await handleSupabaseError(error);
  }
}
