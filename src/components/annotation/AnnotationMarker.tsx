import { motion } from 'framer-motion';
import { AnnotationMarkerProps } from '../../types';
import { useState } from 'react';

export const AnnotationMarker = ({
  bodyPart,
  isActive,
  isRevealed = true,
  onClick,
  onHover
}: AnnotationMarkerProps) => {
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseEnter = () => {
    setIsHovering(true);
    onHover?.(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    onHover?.(false);
  };

  const markerVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 20
      }
    },
    hover: {
      scale: 1.3,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 10
      }
    },
    active: {
      scale: 1.5,
      boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)'
    }
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.2, 1],
      opacity: [0.5, 0.8, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  return (
    <motion.div
      className="absolute"
      style={{
        left: `${bodyPart.coordinates.x}%`,
        top: `${bodyPart.coordinates.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: isActive || isHovering ? 50 : 10
      }}
      initial="hidden"
      animate="visible"
      variants={markerVariants}
    >
      {/* Pulse ring effect */}
      {!isRevealed && (
        <motion.div
          className="absolute inset-0 w-8 h-8 rounded-full bg-primary-500"
          style={{
            transform: 'translate(-50%, -50%)',
            left: '50%',
            top: '50%'
          }}
          variants={pulseVariants}
          animate="pulse"
        />
      )}

      {/* Main marker */}
      <motion.button
        className={`
          relative w-8 h-8 rounded-full cursor-pointer
          flex items-center justify-center
          transition-colors duration-200
          ${isActive
            ? 'bg-primary-600 ring-4 ring-primary-300'
            : isHovering
            ? 'bg-primary-500 ring-2 ring-primary-200'
            : 'bg-primary-400 hover:bg-primary-500'
          }
          shadow-lg
        `}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        whileHover="hover"
        whileTap={{ scale: 0.95 }}
        aria-label={`${bodyPart.spanish} - ${bodyPart.english}`}
      >
        <div className="w-2 h-2 bg-white rounded-full" />
      </motion.button>

      {/* Tooltip */}
      {(isHovering || isActive) && isRevealed && (
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 whitespace-nowrap z-50"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="bg-slate-900 dark:bg-slate-800 text-white px-4 py-3 rounded-lg shadow-xl border border-slate-700">
            <div className="text-sm font-semibold text-primary-300">
              {bodyPart.spanish}
            </div>
            <div className="text-xs text-slate-300 mt-1">
              {bodyPart.english}
            </div>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-800 rotate-45 border-l border-t border-slate-700" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
