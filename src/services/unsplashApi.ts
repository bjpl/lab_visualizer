import { createApi } from 'unsplash-js';
import { UnsplashImage } from '../types';

// For demo purposes, we'll use demo images
// In production, you would add your Unsplash API key
const unsplash = createApi({
  accessKey: import.meta.env.VITE_UNSPLASH_ACCESS_KEY || 'DEMO_KEY'
});

const FALLBACK_IMAGES = [
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
    if (!import.meta.env.VITE_UNSPLASH_ACCESS_KEY || import.meta.env.VITE_UNSPLASH_ACCESS_KEY === 'DEMO_KEY') {
      return FALLBACK_IMAGES;
    }

    const result = await unsplash.search.getPhotos({
      query,
      perPage: 10,
      orientation: 'portrait'
    });

    if (result.errors) {
      console.error('Unsplash API error:', result.errors);
      return FALLBACK_IMAGES;
    }

    return result.response?.results.map(photo => ({
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
