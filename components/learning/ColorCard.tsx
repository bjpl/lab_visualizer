'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ColorCard as ColorCardType } from '@/types/api';
import { getContrastingTextColor } from '@/lib/utils/colors';
import { Bookmark, Volume2, ChevronLeft, ChevronRight } from 'lucide-react';

interface ColorCardProps {
  card: ColorCardType;
  onComplete: (mastery: number) => void;
  onBookmark?: (imageId: string) => void;
}

export function ColorCard({ card, onComplete, onBookmark }: ColorCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);

  const currentImage = card.images[currentImageIndex];
  const textColor = getContrastingTextColor(card.colorHex);

  const handleNext = () => {
    if (currentImageIndex < card.images.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  };

  const playPronunciation = () => {
    // Text-to-speech for Spanish
    const utterance = new SpeechSynthesisUtterance(card.colorName);
    utterance.lang = 'es-ES';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden max-w-2xl mx-auto">
        <CardHeader
          className="p-6"
          style={{ backgroundColor: card.colorHex, color: textColor }}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl font-bold">
              {card.colorName}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={playPronunciation}
                style={{ color: textColor }}
                className="hover:bg-white/20"
              >
                <Volume2 className="w-5 h-5" />
              </Button>
              {onBookmark && currentImage && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onBookmark(currentImage.id)}
                  style={{ color: textColor }}
                  className="hover:bg-white/20"
                >
                  <Bookmark className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
          <Progress value={card.currentMastery} className="mt-4" />
          <p className="text-sm mt-2 opacity-90">
            Dominio: {card.currentMastery}%
          </p>
        </CardHeader>

        <CardContent className="p-0">
          {currentImage && (
            <div className="relative aspect-video bg-gray-100">
              <Image
                src={currentImage.url}
                alt={`Example of ${card.colorName}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 672px"
                priority
              />

              {/* Navigation arrows */}
              {card.images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={handlePrevious}
                    disabled={currentImageIndex === 0}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={handleNext}
                    disabled={currentImageIndex === card.images.length - 1}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </>
              )}

              {/* Image counter */}
              <div className="absolute bottom-2 right-2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {card.images.length}
              </div>

              {/* Photographer credit */}
              {currentImage.photographer && (
                <div className="absolute bottom-2 left-2 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
                  📷 {currentImage.photographer}
                </div>
              )}
            </div>
          )}

          <div className="p-6">
            {currentImage?.annotation && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Descripción:</h4>
                  <p className="text-gray-700">
                    {currentImage.annotation.description_basic}
                  </p>
                </div>

                {currentImage.annotation.phrases &&
                  currentImage.annotation.phrases.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Frases de ejemplo:</h4>
                      <ul className="space-y-2">
                        {currentImage.annotation.phrases.slice(0, 3).map((phrase, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2"
                          >
                            <span className="text-primary mt-1">•</span>
                            <span className="text-gray-700">{phrase}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTranslation(!showTranslation)}
                  className="mt-4"
                >
                  {showTranslation ? 'Hide' : 'Show'} English Translation
                </Button>

                {showTranslation && currentImage.annotation.description_expanded && (
                  <p className="text-sm text-gray-600 italic mt-2">
                    {currentImage.annotation.description_expanded}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-6 pt-0 gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onComplete(card.currentMastery - 3)}
          >
            Necesito más práctica
          </Button>
          <Button
            className="flex-1"
            onClick={() => onComplete(card.currentMastery + 5)}
          >
            ¡Lo tengo!
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
