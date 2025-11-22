import { UnsplashImage } from '../types';

// For demo purposes, we'll use demo images
// In production, you would add your Unsplash API key
const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || '';

const FALLBACK_IMAGES: UnsplashImage[] = [
  {
    id: '1',
    urls: {
      raw: 'https://images.unsplash.com/photo-1530210124550-912dc1381cb8?w=1200',
      full: 'https://images.unsplash.com/photo-1530210124550-912dc1381cb8?w=1200',
      regular: 'https://images.unsplash.com/photo-1530210124550-912dc1381cb8?w=800',
      small: 'https://images.unsplash.com/photo-1530210124550-912dc1381cb8?w=400',
      thumb: 'https://images.unsplash.com/photo-1530210124550-912dc1381cb8?w=200'
    },
    alt_description: 'human anatomy model',
    user: {
      name: 'Unsplash',
      username: 'unsplash'
    },
    links: {
      html: 'https://unsplash.com'
    }
  }
];

export const searchHumanBodyImages = async (query: string = 'human anatomy'): Promise<UnsplashImage[]> => {
  try {
    // If we don't have a valid API key, return fallback images
    if (!UNSPLASH_ACCESS_KEY) {
      return FALLBACK_IMAGES;
    }

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&orientation=portrait`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Unsplash API error:', response.statusText);
      return FALLBACK_IMAGES;
    }

    const data = await response.json();

    return data.results?.map((photo: any) => ({
      id: photo.id,
      urls: photo.urls,
      alt_description: photo.alt_description,
      user: photo.user,
      links: photo.links
    })) || FALLBACK_IMAGES;
  } catch (error) {
    console.error('Error fetching images:', error);
    return FALLBACK_IMAGES;
  }
};

export const getRandomHumanImage = async (): Promise<UnsplashImage> => {
  const images = await searchHumanBodyImages();
  return images[Math.floor(Math.random() * images.length)];
};

// Pre-curated image queries for different body views
export const imageQueries = {
  full: 'human body anatomy front view',
  skeleton: 'human skeleton anatomy',
  muscles: 'human muscular system',
  organs: 'human internal organs',
  medical: 'medical anatomy illustration'
};
