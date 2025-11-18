import { UserProgress } from '@/types/database';

/**
 * Calculate next review date using spaced repetition algorithm
 * Based on SM-2 (SuperMemo 2) algorithm
 */
export function calculateNextReview(
  progress: UserProgress,
  wasCorrect: boolean
): Date {
  const now = new Date();
  const { mastery_level, correct_count, incorrect_count } = progress;

  // Calculate interval in days based on mastery level
  let intervalDays: number;

  if (!wasCorrect) {
    // Reset to 1 day if incorrect
    intervalDays = 1;
  } else {
    // Increase interval based on mastery
    if (mastery_level < 30) {
      intervalDays = 1; // Daily review for low mastery
    } else if (mastery_level < 50) {
      intervalDays = 3; // Every 3 days
    } else if (mastery_level < 70) {
      intervalDays = 7; // Weekly
    } else if (mastery_level < 85) {
      intervalDays = 14; // Bi-weekly
    } else {
      intervalDays = 30; // Monthly for high mastery
    }

    // Adjust based on performance ratio
    const totalAttempts = correct_count + incorrect_count;
    if (totalAttempts > 0) {
      const successRate = correct_count / totalAttempts;
      if (successRate > 0.9) {
        intervalDays *= 1.5; // Increase interval for high success
      } else if (successRate < 0.6) {
        intervalDays *= 0.7; // Decrease interval for low success
      }
    }
  }

  // Calculate next review date
  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + Math.floor(intervalDays));

  return nextReview;
}

/**
 * Calculate mastery change based on performance
 */
export function calculateMasteryChange(
  currentMastery: number,
  wasCorrect: boolean,
  isFirstAttempt: boolean = false
): number {
  if (wasCorrect) {
    // Increase mastery, but with diminishing returns at high levels
    if (currentMastery < 50) {
      return isFirstAttempt ? 8 : 5;
    } else if (currentMastery < 70) {
      return isFirstAttempt ? 6 : 4;
    } else if (currentMastery < 90) {
      return isFirstAttempt ? 4 : 2;
    } else {
      return isFirstAttempt ? 2 : 1;
    }
  } else {
    // Decrease mastery, but not below 0
    if (currentMastery > 70) {
      return -5;
    } else if (currentMastery > 40) {
      return -4;
    } else {
      return -3;
    }
  }
}

/**
 * Calculate priority for review (higher = more urgent)
 */
export function calculateReviewPriority(progress: UserProgress): number {
  const now = new Date();
  const nextReview = progress.next_review ? new Date(progress.next_review) : now;
  const lastReviewed = progress.last_reviewed ? new Date(progress.last_reviewed) : new Date(0);

  // Days overdue (negative if not yet due)
  const daysOverdue = (now.getTime() - nextReview.getTime()) / (1000 * 60 * 60 * 24);

  // Days since last review
  const daysSinceReview = (now.getTime() - lastReviewed.getTime()) / (1000 * 60 * 60 * 24);

  // Mastery factor (prioritize items with lower mastery)
  const masteryFactor = (100 - progress.mastery_level) / 100;

  // Performance factor (prioritize items with more errors)
  const totalAttempts = progress.correct_count + progress.incorrect_count;
  const errorRate = totalAttempts > 0
    ? progress.incorrect_count / totalAttempts
    : 0.5;

  // Combine factors
  let priority = 0;

  // Overdue items get highest priority
  if (daysOverdue > 0) {
    priority += daysOverdue * 10;
  }

  // Items not reviewed recently get medium priority
  priority += daysSinceReview * masteryFactor * 5;

  // Items with high error rate get additional priority
  priority += errorRate * 20;

  // Items with low mastery get additional priority
  priority += masteryFactor * 15;

  return priority;
}

/**
 * Select colors for review using spaced repetition
 */
export function selectColorsForReview(
  allProgress: UserProgress[],
  maxCount: number = 5
): UserProgress[] {
  const now = new Date();

  // Calculate priority for each item
  const withPriority = allProgress.map(progress => ({
    progress,
    priority: calculateReviewPriority(progress),
    isDue: progress.next_review
      ? new Date(progress.next_review) <= now
      : true,
  }));

  // Sort by priority (descending)
  withPriority.sort((a, b) => b.priority - a.priority);

  // Take top items up to maxCount
  return withPriority.slice(0, maxCount).map(item => item.progress);
}

/**
 * Calculate overall mastery for a level
 */
export function calculateLevelMastery(
  progressItems: UserProgress[]
): number {
  if (progressItems.length === 0) return 0;

  const totalMastery = progressItems.reduce(
    (sum, item) => sum + item.mastery_level,
    0
  );

  return Math.round(totalMastery / progressItems.length);
}

/**
 * Determine if user is ready for next level
 */
export function isReadyForNextLevel(
  basicProgress: UserProgress[],
  threshold: number = 70
): boolean {
  const basicMastery = calculateLevelMastery(basicProgress);
  return basicMastery >= threshold;
}

/**
 * Get weak colors that need more practice
 */
export function getWeakColors(
  allProgress: UserProgress[],
  threshold: number = 50,
  limit: number = 5
): UserProgress[] {
  return allProgress
    .filter(p => p.mastery_level < threshold)
    .sort((a, b) => a.mastery_level - b.mastery_level)
    .slice(0, limit);
}

/**
 * Calculate learning streak (consecutive days)
 */
export function calculateStreak(sessions: Array<{ started_at: string }>): number {
  if (sessions.length === 0) return 0;

  const sortedSessions = [...sessions].sort((a, b) =>
    new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const session of sortedSessions) {
    const sessionDate = new Date(session.started_at);
    sessionDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor(
      (currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === streak) {
      streak++;
    } else if (daysDiff > streak) {
      break;
    }
  }

  return streak;
}
