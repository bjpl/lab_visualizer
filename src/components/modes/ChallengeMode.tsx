import { useEffect, useState } from 'react';
import { AnnotationLayer } from '../annotation/AnnotationLayer';
import { getRandomBodyParts } from '../../data/bodyParts';
import { useStore } from '../../store/useStore';
import { searchHumanBodyImages } from '../../services/unsplashApi';
import { Zap, Trophy } from 'lucide-react';
import { BodyPart } from '../../types';
import { motion } from 'framer-motion';

export const ChallengeMode = () => {
  const {
    currentImage,
    setCurrentImage,
    quizScore,
    resetQuiz,
    incrementScore,
    hideAllParts,
    toggleRevealPart
  } = useStore();

  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<BodyPart | null>(null);
  const [challengeParts, setChallengeParts] = useState<BodyPart[]>([]);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);

  useEffect(() => {
    loadImage();
  }, []);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
  }, [isActive, timeLeft]);

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

  const startChallenge = () => {
    resetQuiz();
    hideAllParts();
    setTimeLeft(60);
    setIsActive(true);
    setQuestionsAnswered(0);
    const parts = getRandomBodyParts(20);
    setChallengeParts(parts);
    setCurrentQuestion(parts[0]);
  };

  const handleAnswer = (selectedPart: BodyPart) => {
    if (!currentQuestion || !isActive) return;

    if (selectedPart.id === currentQuestion.id) {
      incrementScore();
      toggleRevealPart(selectedPart.id);

      const currentIndex = challengeParts.indexOf(currentQuestion);
      if (currentIndex < challengeParts.length - 1) {
        setCurrentQuestion(challengeParts[currentIndex + 1]);
        setQuestionsAnswered(questionsAnswered + 1);
      } else {
        // Cycle back with new questions
        const newParts = getRandomBodyParts(20);
        setChallengeParts(newParts);
        setCurrentQuestion(newParts[0]);
      }
    }
  };

  const timePercentage = (timeLeft / 60) * 100;
  const timeColor = timeLeft > 30 ? 'bg-green-500' : timeLeft > 10 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Challenge Mode
            </h2>
          </div>

          {!isActive ? (
            <button
              onClick={startChallenge}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white rounded-lg transition-all shadow-lg font-bold"
            >
              <Zap className="w-5 h-5" />
              Start Challenge
            </button>
          ) : (
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Score</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {quizScore}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Time</div>
                <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                  {timeLeft}s
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Timer Bar */}
        {isActive && (
          <div className="max-w-7xl mx-auto mt-4">
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${timeColor}`}
                initial={{ width: '100%' }}
                animate={{ width: `${timePercentage}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="h-full max-w-6xl mx-auto p-8">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">Loading challenge...</p>
              </div>
            </div>
          ) : !isActive && questionsAnswered === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-12 max-w-md">
                <Zap className="w-20 h-20 text-yellow-600 mx-auto mb-6" />
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                  60-Second Challenge
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                  How many body parts can you identify in 60 seconds? Beat your high score!
                </p>
                <button
                  onClick={startChallenge}
                  className="px-8 py-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white rounded-lg transition-all shadow-lg font-bold text-lg"
                >
                  Start Now
                </button>
              </div>
            </div>
          ) : timeLeft === 0 ? (
            <div className="h-full flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-12 max-w-md"
              >
                <Trophy className="w-20 h-20 text-yellow-600 mx-auto mb-6" />
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                  Time's Up!
                </h3>
                <p className="text-xl text-slate-600 dark:text-slate-400 mb-2">
                  Your Score:
                </p>
                <p className="text-6xl font-bold text-yellow-600 mb-8">
                  {quizScore}
                </p>
                <button
                  onClick={startChallenge}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white rounded-lg transition-all shadow-lg font-bold"
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
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl shadow-lg p-6"
              >
                <p className="text-lg text-white/80 mb-1">
                  Quick! Click on:
                </p>
                <h3 className="text-4xl font-bold text-white">
                  {currentQuestion.spanish}
                </h3>
              </motion.div>

              {/* Image */}
              <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
                <AnnotationLayer
                  bodyParts={challengeParts}
                  imageUrl={currentImage.urls.regular}
                  onMarkerClick={handleAnswer}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
