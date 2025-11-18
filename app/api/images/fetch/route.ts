import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchImagesByColor } from '@/lib/unsplash/client';
import { getCachedImages, saveImageToDatabase, queueImageForAnnotation } from '@/lib/unsplash/cache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { colorId, level, count = 10, refresh = false } = body;

    // Validation
    if (!colorId || !level) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Check cache first (unless refresh is requested)
    if (!refresh) {
      const cachedImages = await getCachedImages(colorId, count);
      if (cachedImages.length >= count) {
        return NextResponse.json({
          success: true,
          data: {
            images: cachedImages,
            cached: true,
          },
        });
      }
    }

    // Get color info
    const supabase = await createClient();
    const { data: color, error: colorError } = await supabase
      .from('colors')
      .select('*')
      .eq('id', colorId)
      .single();

    if (colorError || !color) {
      return NextResponse.json(
        { success: false, error: 'Color not found' },
        { status: 404 }
      );
    }

    // Fetch from Unsplash
    const unsplashResult = await searchImagesByColor(color.name_es, level, count);

    if (!unsplashResult || !unsplashResult.results) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch images from Unsplash' },
        { status: 500 }
      );
    }

    // Save images to database and queue for annotation
    const savedImages = await Promise.all(
      unsplashResult.results.map(async (photo) => {
        const savedImage = await saveImageToDatabase(photo, colorId);
        if (savedImage) {
          // Queue for annotation
          await queueImageForAnnotation(savedImage.id, [colorId]);
        }
        return savedImage;
      })
    );

    const validImages = savedImages.filter(img => img !== null);

    return NextResponse.json({
      success: true,
      data: {
        images: validImages,
        cached: false,
      },
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
