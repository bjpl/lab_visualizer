import { createApi } from 'unsplash-js';

export const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY!,
});

/**
 * Search for images by color and query
 */
export async function searchImagesByColor(
  colorName: string,
  level: 'basic' | 'expanded',
  perPage: number = 10
) {
  const query = buildSearchQuery(colorName, level);

  try {
    const result = await unsplash.search.getPhotos({
      query,
      perPage,
      orientation: 'landscape',
      orderBy: 'relevant',
    });

    if (result.errors) {
      console.error('Unsplash API errors:', result.errors);
      throw new Error(result.errors[0]);
    }

    return result.response;
  } catch (error) {
    console.error('Error searching Unsplash:', error);
    throw error;
  }
}

/**
 * Get a specific photo by ID
 */
export async function getPhotoById(photoId: string) {
  try {
    const result = await unsplash.photos.get({ photoId });

    if (result.errors) {
      throw new Error(result.errors[0]);
    }

    return result.response;
  } catch (error) {
    console.error('Error fetching photo:', error);
    throw error;
  }
}

/**
 * Track photo download (required by Unsplash API guidelines)
 */
export async function trackDownload(downloadLocation: string) {
  try {
    await fetch(downloadLocation);
  } catch (error) {
    console.error('Error tracking download:', error);
  }
}

/**
 * Build search query based on color and level
 */
function buildSearchQuery(colorName: string, level: 'basic' | 'expanded'): string {
  // Map Spanish colors to English for better Unsplash results
  const colorMap: Record<string, string> = {
    'rojo': 'red',
    'azul': 'blue',
    'amarillo': 'yellow',
    'verde': 'green',
    'naranja': 'orange',
    'morado': 'purple',
    'rosa': 'pink',
    'negro': 'black',
    'blanco': 'white',
    'gris': 'gray',
    'marrón': 'brown',
    'celeste': 'sky blue',
    'turquesa': 'turquoise',
    'coral': 'coral',
    'lavanda': 'lavender',
    'beige': 'beige',
  };

  const englishColor = colorMap[colorName.toLowerCase()] || colorName;

  if (level === 'basic') {
    return `${englishColor} vibrant clear simple`;
  } else {
    return `${englishColor} beautiful artistic detailed`;
  }
}

/**
 * Get random photo from a collection
 */
export async function getRandomPhoto(query: string, count: number = 1) {
  try {
    const result = await unsplash.photos.getRandom({
      query,
      count,
      orientation: 'landscape',
    });

    if (result.errors) {
      throw new Error(result.errors[0]);
    }

    return Array.isArray(result.response) ? result.response : [result.response];
  } catch (error) {
    console.error('Error fetching random photo:', error);
    throw error;
  }
}
