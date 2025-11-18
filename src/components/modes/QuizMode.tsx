import { useEffect, useState } from 'react';
import { AnnotationLayer } from '../annotation/AnnotationLayer';
import { bodyPartsData, getRandomBodyParts } from '../../data/bodyParts';
import { useStore } from '../../store/useStore';
import { searchHumanBodyImages } from '../../services/unsplashApi';
import { Brain, CheckCircle2, XCircle, RotateCw } from 'lucide-react';
import { BodyPart } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

export const QuizMode = () => {
  const {
    currentImage,
    setCurrentImage,
    quizScore,
    quizTotal,
    incrementScore,
    incrementTotal,
    resetQuiz,
    revealedParts,
    toggleRevealPart,
    hideAllParts
  } = useStore();

  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<BodyPart | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [quizParts, setQuizParts] = useState<BodyPart[]>([]);

  useEffect(() => {
    loadImage();
    startQuiz();
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

  const startQuiz = () => {
    resetQuiz();
    hideAllParts();
    const randomParts = getRandomBodyParts(10);
    setQuizParts(randomParts);
    setCurrentQuestion(randomParts[0]);
    setFeedback(null);
  };

  const handleAnswer = (selectedPart: BodyPart) => {
    if (!currentQuestion || feedback) return;

    incrementTotal();

    if (selectedPart.id === currentQuestion.id) {
      setFeedback('correct');
      incrementScore();
      toggleRevealPart(selectedPart.id);

      setTimeout(() => {
        moveToNextQuestion();
      }, 1500);
    } else {
      setFeedback('incorrect');
      setTimeout(() => {
        setFeedback(null);
      }, 1500);
    }
  };

  const moveToNextQuestion = () => {
    const currentIndex = quizParts.indexOf(currentQuestion!);
    if (currentIndex < quizParts.length - 1) {
      setCurrentQuestion(quizParts[currentIndex + 1]);
      setFeedback(null);
    } else {
      setCurrentQuestion(null);
    }
  };

  const accuracy = quizTotal > 0 ? Math.round((quizScore / quizTotal) * 100) : 0;
  const isQuizComplete = !currentQuestion && quizTotal > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Quiz Mode
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-sm">
              <span className="text-slate-600 dark:text-slate-400">Score: </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {quizScore} / {quizTotal}
              </span>
              <span className="ml-2 text-slate-600 dark:text-slate-400">
                ({accuracy}%)
              </span>
            </div>

            <button
              onClick={startQuiz}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-md"
            >
              <RotateCw className="w-4 h-4" />
              New Quiz
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
                <p className="text-slate-600 dark:text-slate-400">Loading quiz...</p>
              </div>
            </div>
          ) : isQuizComplete ? (
            <div className="h-full flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-12 max-w-md"
              >
                <div className="text-6xl mb-6">🎉</div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                  Quiz Complete!
                </h3>
                <p className="text-xl text-slate-600 dark:text-slate-400 mb-6">
                  Final Score: <span className="font-bold text-primary-600">{quizScore}</span> / {quizTotal}
                </p>
                <p className="text-3xl font-bold text-primary-600 mb-8">
                  {accuracy}% Accuracy
                </p>
                <button
                  onClick={startQuiz}
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-md font-medium"
                >
                  Try Again
                </button>
              </motion.div>
            </div>
          ) : currentImage && currentQuestion ? (
            <div className="h-full flex flex-col gap-4">
              {/* Question Card */}
              <motion.div
                key={currentQuestion.id}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6"
              >
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-2">
                  Click on:
                </p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                  {currentQuestion.spanish}
                </h3>
              </motion.div>

              {/* Image with Annotations */}
              <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden relative">
                <AnnotationLayer
                  bodyParts={bodyPartsData}
                  imageUrl={currentImage.urls.regular}
                  onMarkerClick={handleAnswer}
                />

                {/* Feedback Overlay */}
                <AnimatePresence>
                  {feedback && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className={`rounded-2xl p-8 ${
                          feedback === 'correct'
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        } text-white shadow-2xl`}
                      >
                        {feedback === 'correct' ? (
                          <div className="text-center">
                            <CheckCircle2 className="w-20 h-20 mx-auto mb-4" />
                            <p className="text-2xl font-bold">¡Correcto!</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <XCircle className="w-20 h-20 mx-auto mb-4" />
                            <p className="text-2xl font-bold">Try Again!</p>
                          </div>
                        )}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
