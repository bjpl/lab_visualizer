import { useEffect, useState } from 'react';
import { AnnotationLayer } from '../annotation/AnnotationLayer';
import { bodyPartsData } from '../../data/bodyParts';
import { useStore } from '../../store/useStore';
import { searchHumanBodyImages } from '../../services/unsplashApi';
import { BookOpen, Eye, EyeOff } from 'lucide-react';

export const StudyMode = () => {
  const { currentImage, setCurrentImage, revealAllParts, hideAllParts, revealedParts } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadImage();
    revealAllParts();
  }, []);

  const loadImage = async () => {
    setIsLoading(true);
    try {
      const images = await searchHumanBodyImages();
      setCurrentImage(images[0]);
    } catch (error) {
      console.error('Failed to load image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = ['all', 'head', 'torso', 'arms', 'legs', 'hands', 'feet'];

  const filteredBodyParts = selectedCategory === 'all'
    ? bodyPartsData
    : bodyPartsData.filter(part => part.category === selectedCategory);

  const allRevealed = revealedParts.has('all');

  return (
    <div className="h-full flex flex-col">
      {/* Header Controls */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Study Mode
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>

            {/* Toggle Labels */}
            <button
              onClick={() => allRevealed ? hideAllParts() : revealAllParts()}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-md"
            >
              {allRevealed ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Hide Labels
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Show Labels
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="h-full max-w-6xl mx-auto p-8">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">Loading image...</p>
              </div>
            </div>
          ) : currentImage ? (
            <div className="h-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
              <AnnotationLayer
                bodyParts={filteredBodyParts}
                imageUrl={currentImage.urls.regular}
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-slate-600 dark:text-slate-400">No image available</p>
            </div>
          )}
        </div>
      </div>

      {/* Info Footer */}
      <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4">
        <div className="max-w-7xl mx-auto text-center text-sm text-slate-600 dark:text-slate-400">
          Showing {filteredBodyParts.length} body parts • Click on markers to learn more
        </div>
      </div>
    </div>
  );
};
