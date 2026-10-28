import {
  Flashcard,
  FlashcardRating,
  Situation,
  ErrorLogEntry,
  ClusterTopic,
  Cluster,
} from '../types';
import {
  mockClusterTopics,
  mockFlashcardsData,
  mockSituationsData,
  mockErrorLogData,
} from '../data/mock/practice';
import { toISODate } from '../utils/date';

let localTopics: ClusterTopic[] = [...mockClusterTopics];
let localFlashcards: Flashcard[] = [...mockFlashcardsData];
let localSituations: Situation[] = [...mockSituationsData];
let localErrorLog: ErrorLogEntry[] = [...mockErrorLogData];

let localDailyGoal = 5;
let localTodayUnassistedSolved = 3;
let localStreakDays = 4;

type PracticeListener = () => void;
const listeners = new Set<PracticeListener>();

function notify() {
  listeners.forEach((fn) => fn());
}

export const practiceService = {
  // Daily Goal & Streak
  getDailyGoalData(): { goal: number; solvedToday: number; streakDays: number } {
    return {
      goal: localDailyGoal,
      solvedToday: localTodayUnassistedSolved,
      streakDays: localStreakDays,
    };
  },

  async setDailyGoal(goal: number): Promise<number> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    localDailyGoal = Math.max(1, goal);
    notify();
    return localDailyGoal;
  },

  recordUnassistedSolve(): void {
    localTodayUnassistedSolved += 1;
    if (localTodayUnassistedSolved === 1) {
      localStreakDays += 1;
    }
    notify();
  },

  // Topics per cluster
  async getClusterTopics(cluster?: string): Promise<ClusterTopic[]> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    if (!cluster || cluster === 'All') {
      return [...localTopics];
    }
    return localTopics.filter((t) => t.cluster === cluster);
  },

  // Flashcards with SM-2 Spaced Repetition Scheduling
  async getFlashcards(cluster?: string): Promise<Flashcard[]> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    if (!cluster || cluster === 'All') {
      return [...localFlashcards];
    }
    return localFlashcards.filter((fc) => fc.cluster === cluster);
  },

  async getDueFlashcards(cluster?: string): Promise<Flashcard[]> {
    const list = await this.getFlashcards(cluster);
    return list.filter((fc) => fc.dueToday);
  },

  getDueFlashcardsCount(cluster?: string): number {
    const list = cluster && cluster !== 'All'
      ? localFlashcards.filter((fc) => fc.cluster === cluster)
      : localFlashcards;
    return list.filter((fc) => fc.dueToday).length;
  },

  async rateFlashcard(cardId: string, rating: FlashcardRating): Promise<Flashcard> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    const index = localFlashcards.findIndex((fc) => fc.id === cardId);
    if (index === -1) {
      throw new Error(`Flashcard not found: ${cardId}`);
    }

    const card = localFlashcards[index];
    let { ease, interval } = card;

    // SM-2 calculation
    if (rating === 'Again') {
      interval = 1;
      ease = Math.max(1.3, ease - 0.2);
    } else if (rating === 'Hard') {
      interval = Math.max(1, Math.round(interval * 1.2));
      ease = Math.max(1.3, ease - 0.15);
    } else if (rating === 'Good') {
      interval = interval === 1 ? 3 : Math.round(interval * ease);
    } else if (rating === 'Easy') {
      interval = interval === 1 ? 5 : Math.round(interval * ease * 1.3);
      ease = Math.min(3.0, ease + 0.15);
    }

    // Schedule next due date
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval);
    const dueDateStr = toISODate(nextDate);

    const updated: Flashcard = {
      ...card,
      ease,
      interval,
      dueDate: dueDateStr,
      dueToday: false, // completed for today's session
    };

    localFlashcards[index] = updated;
    notify();
    return updated;
  },

  // Situations
  async getSituations(cluster?: string): Promise<Situation[]> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    if (!cluster || cluster === 'All') {
      return [...localSituations];
    }
    return localSituations.filter((s) => s.cluster === cluster);
  },

  async getSituationById(id: string): Promise<Situation | null> {
    return localSituations.find((s) => s.id === id) || null;
  },

  // Error Log Management
  async getErrorLogEntries(cluster?: string): Promise<ErrorLogEntry[]> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    if (!cluster || cluster === 'All') {
      return [...localErrorLog];
    }
    return localErrorLog.filter((e) => e.cluster === cluster);
  },

  getErrorLogCount(cluster?: string): number {
    if (!cluster || cluster === 'All') {
      return localErrorLog.length;
    }
    return localErrorLog.filter((e) => e.cluster === cluster).length;
  },

  /**
   * Record attempt outcome:
   * Any wrong or hint-assisted attempt adds/keeps the item.
   * Remove it only when correctUnassistedDates has 2 entries on different calendar days.
   */
  async recordAttemptOutcome(
    itemId: string,
    itemType: 'flashcard' | 'situation' | 'template',
    cluster: Cluster,
    title: string,
    isCorrect: boolean,
    isAssisted: boolean,
    mistakeType?: string
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    const today = toISODate();
    const existingIndex = localErrorLog.findIndex((e) => e.itemId === itemId);

    if (!isCorrect || isAssisted) {
      // Failed or assisted attempt: keep in error log
      if (existingIndex !== -1) {
        localErrorLog[existingIndex] = {
          ...localErrorLog[existingIndex],
          mistakeType: mistakeType || localErrorLog[existingIndex].mistakeType,
          // Reset unassisted streak because it failed or was assisted
          correctUnassistedDates: [],
        };
      } else {
        localErrorLog.unshift({
          id: `err-${Date.now()}`,
          itemId,
          itemType,
          cluster,
          title,
          mistakeType: mistakeType || (isAssisted ? 'Assisted attempt' : 'Concept error'),
          correctUnassistedDates: [],
        });
      }
    } else {
      // Correct AND unassisted!
      this.recordUnassistedSolve();

      if (existingIndex !== -1) {
        const entry = localErrorLog[existingIndex];
        const dates = [...entry.correctUnassistedDates];
        if (!dates.includes(today)) {
          dates.push(today);
        }

        if (dates.length >= 2) {
          // Mastered on 2 separate calendar days! Remove from error log
          localErrorLog = localErrorLog.filter((e) => e.itemId !== itemId);
        } else {
          localErrorLog[existingIndex] = {
            ...entry,
            correctUnassistedDates: dates,
          };
        }
      }
    }

    notify();
  },

  subscribe(listener: PracticeListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
