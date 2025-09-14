import { supabase } from './supabase';

export interface ProgressPhoto {
  id: string;
  user_id: string;
  photo_uri: string;
  photo_type: 'progress' | 'before' | 'after';
  taken_at: string;
  notes?: string;
  weight_kg?: number;
  body_fat_percentage?: number;
  is_private: boolean;
  allow_comparison: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProgressPhotoData {
  photo_uri: string;
  photo_type?: 'progress' | 'before' | 'after';
  taken_at?: string;
  notes?: string;
  weight_kg?: number;
  body_fat_percentage?: number;
  is_private?: boolean;
  allow_comparison?: boolean;
}

export interface UpdateProgressPhotoData {
  notes?: string;
  weight_kg?: number;
  body_fat_percentage?: number;
  is_private?: boolean;
  allow_comparison?: boolean;
}

/**
 * Fetch all progress photos for a user, ordered by taken_at (most recent first)
 */
export const fetchUserProgressPhotos = async (userId: string): Promise<ProgressPhoto[]> => {
  try {
    const { data, error } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('user_id', userId)
      .order('taken_at', { ascending: false });

    if (error) {
      console.error('Error fetching progress photos:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchUserProgressPhotos:', error);
    throw error;
  }
};

/**
 * Fetch the most recent progress photo for a user
 */
export const fetchLatestProgressPhoto = async (userId: string): Promise<ProgressPhoto | null> => {
  try {
    const { data, error } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('user_id', userId)
      .order('taken_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching latest progress photo:', error);
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Error in fetchLatestProgressPhoto:', error);
    throw error;
  }
};

/**
 * Create a new progress photo
 */
export const createProgressPhoto = async (
  userId: string, 
  photoData: CreateProgressPhotoData
): Promise<ProgressPhoto> => {
  try {
    const { data, error } = await supabase
      .from('progress_photos')
      .insert({
        user_id: userId,
        photo_uri: photoData.photo_uri,
        photo_type: photoData.photo_type || 'progress',
        taken_at: photoData.taken_at || new Date().toISOString(),
        notes: photoData.notes,
        weight_kg: photoData.weight_kg,
        body_fat_percentage: photoData.body_fat_percentage,
        is_private: photoData.is_private !== undefined ? photoData.is_private : true,
        allow_comparison: photoData.allow_comparison !== undefined ? photoData.allow_comparison : true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating progress photo:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createProgressPhoto:', error);
    throw error;
  }
};

/**
 * Update an existing progress photo
 */
export const updateProgressPhoto = async (
  photoId: string,
  updateData: UpdateProgressPhotoData
): Promise<ProgressPhoto> => {
  try {
    const { data, error } = await supabase
      .from('progress_photos')
      .update(updateData)
      .eq('id', photoId)
      .select()
      .single();

    if (error) {
      console.error('Error updating progress photo:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateProgressPhoto:', error);
    throw error;
  }
};

/**
 * Delete a progress photo
 */
export const deleteProgressPhoto = async (photoId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('progress_photos')
      .delete()
      .eq('id', photoId);

    if (error) {
      console.error('Error deleting progress photo:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteProgressPhoto:', error);
    throw error;
  }
};

/**
 * Get progress photos for comparison (before/after)
 */
export const getProgressPhotosForComparison = async (userId: string): Promise<{
  beforePhoto: ProgressPhoto | null;
  afterPhoto: ProgressPhoto | null;
  allPhotos: ProgressPhoto[];
}> => {
  try {
    const allPhotos = await fetchUserProgressPhotos(userId);
    
    // Find the earliest photo (before) and latest photo (after)
    const beforePhoto = allPhotos.length > 0 ? allPhotos[allPhotos.length - 1] : null;
    const afterPhoto = allPhotos.length > 0 ? allPhotos[0] : null;

    return {
      beforePhoto,
      afterPhoto,
      allPhotos,
    };
  } catch (error) {
    console.error('Error in getProgressPhotosForComparison:', error);
    throw error;
  }
};

/**
 * Get the count of progress photos for a user
 */
export const getProgressPhotoCount = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('progress_photos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('Error getting progress photo count:', error);
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getProgressPhotoCount:', error);
    throw error;
  }
};

/**
 * Format date for display
 */
export const formatPhotoDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return 'Today';
  } else if (diffDays === 2) {
    return 'Yesterday';
  } else if (diffDays <= 7) {
    return `${diffDays - 1} days ago`;
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
};

/**
 * Get progress photos grouped by month for timeline view
 */
export const getProgressPhotosByMonth = async (userId: string): Promise<{
  [month: string]: ProgressPhoto[];
}> => {
  try {
    const photos = await fetchUserProgressPhotos(userId);
    
    const groupedPhotos: { [month: string]: ProgressPhoto[] } = {};
    
    photos.forEach(photo => {
      const date = new Date(photo.taken_at);
      const monthKey = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      
      if (!groupedPhotos[monthKey]) {
        groupedPhotos[monthKey] = [];
      }
      groupedPhotos[monthKey].push(photo);
    });

    return groupedPhotos;
  } catch (error) {
    console.error('Error in getProgressPhotosByMonth:', error);
    throw error;
  }
};
