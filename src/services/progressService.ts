import { ProgressMetrics } from '../types';
import { mockAttempts } from '../data/mock/attempts';
import { mockCourses, mockFlashcards } from '../data/mock/courses';

export const progressService = {
  /**
   * Returns 0–100 = % of that course's flashcards whose current review interval is >= 7 days.
   * Single source of truth used in Study + Progress.
   */
  getCourseMastery(courseId: string): number {
    const courseCards = mockFlashcards.filter((fc) => fc.courseId === courseId);
    if (courseCards.length === 0) {
      return 50;
    }
    const matureCards = courseCards.filter((fc) => fc.reviewIntervalDays >= 7).length;
    return Math.round((matureCards / courseCards.length) * 100);
  },

  async getCourseMasteryAsync(courseId: string): Promise<number> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    return this.getCourseMastery(courseId);
  },

  async getProgressMetrics(): Promise<ProgressMetrics> {
    await new Promise((resolve) => setTimeout(resolve, 60));

    // Flatten all step attempts from all attempts
    const allStepAttempts = mockAttempts.flatMap((a) => a.stepAttempts);

    if (allStepAttempts.length === 0) {
      return {
        unassistedAccuracyPct: 0,
        learningInsight: 'Start solving problems to generate learning insights.',
        courseReadiness: mockCourses.map((c) => ({
          courseId: c.id,
          courseName: c.name,
          boardSubject: c.boardSubject,
          pct: this.getCourseMastery(c.id),
        })),
        formulaMastery: { recall: 0, choose: 0, apply: 0 },
        topMistake: {
          label: 'None',
          details: 'No mistakes recorded yet.',
          count: 0,
        },
      };
    }

    // 1. Calculate unassisted accuracy (solved on first try with 0 hints)
    const unassistedSteps = allStepAttempts.filter(
      (sa) => sa.isCorrect && sa.hintsUsed === 0 && sa.tries === 1
    ).length;
    const unassistedAccuracyPct = Math.round((unassistedSteps / allStepAttempts.length) * 100);

    // 2. Count mistake occurrences to find top mistake
    const mistakeCounts: Record<string, number> = {};
    for (const sa of allStepAttempts) {
      if (sa.mistakeLabel) {
        mistakeCounts[sa.mistakeLabel] = (mistakeCounts[sa.mistakeLabel] || 0) + 1;
      }
    }

    let topMistakeLabel = 'Used π/16 instead of π/32 for hollow shaft';
    let topMistakeCount = 0;
    for (const [label, count] of Object.entries(mistakeCounts)) {
      if (count > topMistakeCount) {
        topMistakeCount = count;
        topMistakeLabel = label;
      }
    }

    // 3. Dynamic course readiness based on unified getCourseMastery
    const courseReadiness = mockCourses.map((c) => ({
      courseId: c.id,
      courseName: c.name,
      boardSubject: c.boardSubject,
      pct: this.getCourseMastery(c.id),
    }));

    // 4. Formula mastery counts
    const correctApplyCount = allStepAttempts.filter((sa) => sa.isCorrect).length;
    const formulaMastery = {
      recall: 24,
      choose: 18,
      apply: correctApplyCount > 0 ? correctApplyCount * 4 : 12,
    };

    const learningInsight =
      topMistakeCount > 0
        ? `Your method on torque and power relations is solid. Most errors occur in polar moment of inertia (${topMistakeLabel}).`
        : 'Keep practicing consistently to maintain high retention.';

    return {
      unassistedAccuracyPct,
      learningInsight,
      courseReadiness,
      formulaMastery,
      topMistake: {
        label: topMistakeLabel,
        details: `Detected in ${topMistakeCount || 2} recent shaft torsion attempts`,
        count: topMistakeCount || 2,
      },
    };
  },
};
