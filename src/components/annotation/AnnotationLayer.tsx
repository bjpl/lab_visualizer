import { useStore } from '../../store/useStore';
import { AnnotationMarker } from './AnnotationMarker';
import { AnimatePresence } from 'framer-motion';

// Define BodyPart type inline since it's not exported from types
interface BodyPart {
  id: string;
  spanish: string;
  english: string;
  category: string;
  difficulty: string;
  coordinates: { x: number; y: number };
  position?: { x: number; y: number };
}

interface AnnotationLayerProps {
  bodyParts: BodyPart[];
  imageUrl: string;
  onMarkerClick?: (bodyPart: BodyPart) => void;
}

export const AnnotationLayer = ({
  bodyParts,
  imageUrl,
  onMarkerClick
}: AnnotationLayerProps) => {
  const { selectedBodyPart, setSelectedBodyPart, revealedParts, mode } = useStore();

  const handleMarkerClick = (bodyPart: BodyPart) => {
    setSelectedBodyPart(
      selectedBodyPart?.id === bodyPart.id ? null : bodyPart
    );
    onMarkerClick?.(bodyPart);
  };

  const isPartRevealed = (partId: string) => {
    if (mode === 'study') return true;
    return revealedParts.has(partId) || revealedParts.has('all');
  };

  return (
    <div className="relative w-full h-full">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={imageUrl}
          alt="Human body"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>

      {/* Annotation Markers */}
      <div className="absolute inset-0">
        <AnimatePresence>
          {bodyParts.map((bodyPart) => (
            <AnnotationMarker
              key={bodyPart.id}
              bodyPart={bodyPart}
              isActive={selectedBodyPart?.id === bodyPart.id}
              isRevealed={isPartRevealed(bodyPart.id)}
              onClick={() => handleMarkerClick(bodyPart)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Selected Part Info Panel */}
      {selectedBodyPart && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {selectedBodyPart.spanish}
              </h3>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-3">
                {selectedBodyPart.english}
              </p>
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium">
                  {selectedBodyPart.category}
                </span>
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                  {selectedBodyPart.difficulty}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedBodyPart(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
