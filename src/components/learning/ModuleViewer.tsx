/**
 * ModuleViewer Component
 * Main component for displaying learning module content
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useLearningModule } from '@/hooks/use-learning';
import type { ModuleContentData } from '@/types/learning';
import { sanitizeForReact } from '@/lib/security/xss-sanitizer';

interface ModuleViewerProps {
  moduleId: string;
  onComplete?: () => void;
  onProgress?: (percent: number) => void;
}

export function ModuleViewer({ moduleId, onComplete, onProgress }: ModuleViewerProps) {
  const { module, progress, loading, error, updateProgress, markComplete } = useLearningModule(moduleId);
  const [timeSpent, setTimeSpent] = useState(0);

  // Track time spent
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Save progress periodically
  useEffect(() => {
    if (timeSpent > 0 && timeSpent % 30 === 0) { // Every 30 seconds
      updateProgress({ timeSpent: 30 }).catch(console.error);
    }
  }, [timeSpent, updateProgress]);

  const handleComplete = async () => {
    try {
      await markComplete();
      onComplete?.();
    } catch (err) {
      console.error('Failed to mark complete:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-semibold">Error loading module</h3>
        <p className="text-red-600 mt-2">{error || 'Module not found'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{module.title}</h1>
            {module.description && (
              <p className="mt-2 text-gray-600">{module.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              module.difficulty <= 2 ? 'bg-green-100 text-green-800' :
              module.difficulty <= 3 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              Difficulty: {module.difficulty}/5
            </span>
          </div>
        </div>

        {/* Progress bar */}
        {progress && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{progress.progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <ContentRenderer content={module.contentData} onProgress={onProgress} />
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 text-gray-700 hover:text-gray-900"
        >
          &larr; Back
        </button>
        {!progress?.completed && (
          <button
            onClick={handleComplete}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Mark as Complete
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Content Renderer - Displays different content types
 */
function ContentRenderer({ content, onProgress }: { content: ModuleContentData; onProgress?: (percent: number) => void }) {
  switch (content.type) {
    case 'video':
      return <VideoContent content={content} onProgress={onProgress} />;
    case 'guide':
      return <GuideContent content={content} />;
    case 'tutorial':
      return <TutorialContent content={content} onProgress={onProgress} />;
    case 'quiz':
      return <QuizContent content={content} onProgress={onProgress} />;
    default:
      return <div>Unsupported content type</div>;
  }
}

/**
 * Video Content Component
 */
function VideoContent({ content, onProgress }: { content: Extract<ModuleContentData, { type: 'video' }>; onProgress?: (percent: number) => void }) {
  return (
    <div>
      <video
        controls
        className="w-full rounded-lg"
        src={content.videoUrl}
        onTimeUpdate={(e) => {
          const video = e.currentTarget;
          const percent = (video.currentTime / video.duration) * 100;
          onProgress?.(percent);
        }}
      >
        Your browser does not support video playback.
      </video>

      {content.chapters && content.chapters.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Chapters</h3>
          <ul className="space-y-1">
            {content.chapters.map((chapter, idx) => (
              <li key={idx} className="text-sm text-gray-600">
                <span className="font-medium">{Math.floor(chapter.time / 60)}:{String(chapter.time % 60).padStart(2, '0')}</span> - {chapter.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Guide Content Component
 */
function GuideContent({ content }: { content: Extract<ModuleContentData, { type: 'guide' }> }) {
  return (
    <div className="prose max-w-none">
      {content.sections.sort((a, b) => a.order - b.order).map((section) => (
        <div key={section.id} className="mb-8">
          <h2>{section.title}</h2>
          {/* XSS Protection: Sanitize HTML content before rendering */}
          <div dangerouslySetInnerHTML={sanitizeForReact(section.content)} />
          {section.images && section.images.map((img, idx) => (
            <img key={idx} src={img} alt={`${section.title} image ${idx + 1}`} className="rounded-lg my-4" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Tutorial Content Component
 */
function TutorialContent({ content, onProgress }: { content: Extract<ModuleContentData, { type: 'tutorial' }>; onProgress?: (percent: number) => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = content.steps.sort((a, b) => a.order - b.order);

  useEffect(() => {
    onProgress?.((currentStep / steps.length) * 100);
  }, [currentStep, steps.length, onProgress]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-gray-600">Step {currentStep + 1} of {steps.length}</span>
        <div className="flex space-x-2">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 w-12 rounded-full ${idx <= currentStep ? 'bg-blue-600' : 'bg-gray-200'}`}
            />
          ))}
        </div>
      </div>

      <div className="p-6 bg-gray-50 rounded-lg">
        <h3 className="text-xl font-semibold mb-2">{steps[currentStep].title}</h3>
        <p className="text-gray-700">{steps[currentStep].instruction}</p>
      </div>

      <div className="mt-4 flex justify-between">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

/**
 * Quiz Content Component
 */
function QuizContent({ content, onProgress }: { content: Extract<ModuleContentData, { type: 'quiz' }>; onProgress?: (percent: number) => void }) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const questions = content.questions.sort((a, b) => a.order - b.order);

  const handleSubmit = () => {
    const score = questions.reduce((acc, q) => {
      const userAnswer = answers[q.id];
      const correct = Array.isArray(q.correctAnswer)
        ? Array.isArray(userAnswer) && JSON.stringify([...userAnswer].sort()) === JSON.stringify([...q.correctAnswer].sort())
        : userAnswer === q.correctAnswer;
      return acc + (correct ? q.points : 0);
    }, 0);

    const totalPoints = questions.reduce((acc, q) => acc + q.points, 0);
    const percent = (score / totalPoints) * 100;

    onProgress?.(percent);
    setSubmitted(true);
  };

  return (
    <div className="space-y-6">
      {questions.map((question, idx) => (
        <div key={question.id} className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">
            {idx + 1}. {question.question} ({question.points} pts)
          </h4>
          {question.type === 'multiple-choice' && question.options && (
            <div className="space-y-2">
              {question.options.map((option) => (
                <label key={option} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={question.id}
                    value={option}
                    checked={answers[question.id] === option}
                    onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                    disabled={submitted}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          )}
          {submitted && question.explanation && (
            <p className="mt-2 text-sm text-gray-600">{question.explanation}</p>
          )}
        </div>
      ))}

      {!submitted && (
        <button
          onClick={handleSubmit}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Submit Quiz
        </button>
      )}
    </div>
  );
}
