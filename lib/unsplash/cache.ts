import { createClient } from '@/lib/supabase/server';
import { Image, AnnotatedImage } from '@/types/database';

/**
 * Check if we have cached images for a color
 */
export async function getCachedImages(
  colorId: string,
  limit: number = 10
): Promise<AnnotatedImage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('images')
    .select(`
      *,
      annotation:annotations(*)
    `)
    .eq('primary_color_id', colorId)
    .eq('status', 'approved')
    .limit(limit);

  if (error) {
    console.error('Error fetching cached images:', error);
    return [];
  }

  return data.map(img => ({
    ...img,
    annotation: Array.isArray(img.annotation) && img.annotation.length > 0
      ? img.annotation[0]
      : undefined,
  })) as AnnotatedImage[];
}

/**
 * Save image to database
 */
export async function saveImageToDatabase(
  unsplashData: any,
  colorId: string
): Promise<Image | null> {
  const supabase = await createClient();

  const imageData = {
    unsplash_id: unsplashData.id,
    url: unsplashData.urls.regular,
    thumbnail_url: unsplashData.urls.small,
    photographer: unsplashData.user.name,
    photographer_url: unsplashData.user.links.html,
    primary_color_id: colorId,
    download_location: unsplashData.links.download_location,
    status: 'pending' as const,
    metadata: {
      description: unsplashData.description,
      alt_description: unsplashData.alt_description,
      likes: unsplashData.likes,
      color: unsplashData.color,
    },
  };

  const { data, error } = await supabase
    .from('images')
    .insert(imageData)
    .select()
    .single();

  if (error) {
    // If it's a duplicate, try to fetch the existing one
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('images')
        .select()
        .eq('unsplash_id', unsplashData.id)
        .single();
      return existing;
    }
    console.error('Error saving image:', error);
    return null;
  }

  return data;
}

/**
 * Queue image for annotation
 */
export async function queueImageForAnnotation(
  imageId: string,
  targetColors: string[]
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('annotation_queue')
    .insert({
      image_id: imageId,
      target_colors: targetColors,
      status: 'pending',
    });

  if (error) {
    console.error('Error queuing annotation:', error);
    return false;
  }

  return true;
}

/**
 * Get images that need annotation
 */
export async function getPendingAnnotations(limit: number = 5) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('annotation_queue')
    .select(`
      *,
      image:images(*)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching pending annotations:', error);
    return [];
  }

  return data;
}

/**
 * Mark annotation as complete
 */
export async function markAnnotationComplete(queueId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('annotation_queue')
    .update({
      status: 'completed',
      processed_at: new Date().toISOString(),
    })
    .eq('id', queueId);

  if (error) {
    console.error('Error marking annotation complete:', error);
    return false;
  }

  return true;
}

/**
 * Mark annotation as failed
 */
export async function markAnnotationFailed(
  queueId: string,
  errorMessage: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('annotation_queue')
    .update({
      status: 'failed',
      error_message: errorMessage,
      attempts: supabase.rpc('increment', { row_id: queueId }),
      processed_at: new Date().toISOString(),
    })
    .eq('id', queueId);

  if (error) {
    console.error('Error marking annotation failed:', error);
    return false;
  }

  return true;
}
