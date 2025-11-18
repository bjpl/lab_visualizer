import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: annotations, error } = await supabase
      .from('annotations')
      .select(`
        id,
        description_basic,
        description_expanded,
        phrases,
        confidence_score,
        created_at,
        image:images (
          id,
          url,
          photographer
        ),
        color:colors (
          id,
          name_es,
          name_en,
          hex_code
        )
      `)
      .eq('validated', false)
      .order('created_at', { ascending: true })
      .limit(20);

    if (error) {
      console.error('Error fetching pending annotations:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Transform data to flatten nested objects
    const transformedData = annotations?.map(annotation => ({
      id: annotation.id,
      description_basic: annotation.description_basic,
      description_expanded: annotation.description_expanded,
      phrases: annotation.phrases,
      confidence_score: annotation.confidence_score,
      created_at: annotation.created_at,
      image: Array.isArray(annotation.image) ? annotation.image[0] : annotation.image,
      color: Array.isArray(annotation.color) ? annotation.color[0] : annotation.color,
    }));

    return NextResponse.json({
      success: true,
      data: transformedData || [],
    });
  } catch (error) {
    console.error('Error in pending annotations API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
