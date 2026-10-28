import { Plan } from '../types';
import { generateMockPlans } from '../data/mock/plans';
import {
  toISODate,
  getDaysDifference,
  formatTime24To12,
  formatShortMonthDay,
  parseISODate,
} from '../utils/date';

// In-memory store for session persistence
let localPlans: Plan[] = generateMockPlans();

type PlanListener = (plans: Plan[]) => void;
const listeners = new Set<PlanListener>();

function notify() {
  const current = [...localPlans];
  listeners.forEach((fn) => fn(current));
}

export const planService = {
  /**
   * Reset or re-align mock plans to a new today date
   */
  realignMockPlans(baseDate: Date = new Date()): void {
    localPlans = generateMockPlans(baseDate);
    notify();
  },

  async getPlansByDate(date: string): Promise<Plan[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return localPlans.filter((p) => p.date === date);
  },

  async getAllPlans(): Promise<Plan[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return [...localPlans];
  },

  getAllPlansSync(): Plan[] {
    return [...localPlans];
  },

  async togglePlanCompletion(planId: string): Promise<Plan> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    const index = localPlans.findIndex((p) => p.id === planId);
    if (index === -1) {
      throw new Error(`Plan not found: ${planId}`);
    }
    const updated = {
      ...localPlans[index],
      completed: !localPlans[index].completed,
    };
    localPlans[index] = updated;
    notify();
    return updated;
  },

  /**
   * Compute nearest deadline from today (quiz/exam or deadline)
   * Returns null if no upcoming deadline
   */
  async getNearestDeadline(todayIso: string = toISODate()): Promise<{
    title: string;
    courseName: string;
    timeText: string;
    daysLeft: number;
    date: string;
  } | null> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    const upcomingDeadlines = localPlans
      .filter((p) => (p.type === 'exam' || p.type === 'deadline') && p.date >= todayIso)
      .sort((a, b) => {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }
        return (a.startTime || '00:00').localeCompare(b.startTime || '00:00');
      });

    if (upcomingDeadlines.length === 0) {
      return null;
    }

    const nearest = upcomingDeadlines[0];
    const daysLeft = Math.max(0, getDaysDifference(nearest.date, todayIso));

    const dateObj = parseISODate(nearest.date);
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dateObj.getDay()];
    const shortMonthDay = formatShortMonthDay(nearest.date);
    const timeFormatted = nearest.startTime ? formatTime24To12(nearest.startTime) : nearest.time;

    return {
      title: nearest.title,
      courseName: nearest.courseName || 'General',
      timeText: `${dayName}, ${shortMonthDay} · ${timeFormatted}`,
      daysLeft,
      date: nearest.date,
    };
  },

  async addPlan(newPlanData: Omit<Plan, 'id'>): Promise<Plan> {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const newPlan: Plan = {
      ...newPlanData,
      id: `plan-${Date.now()}`,
    };
    localPlans.push(newPlan);
    notify();
    return newPlan;
  },

  async deletePlan(planId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    localPlans = localPlans.filter((p) => p.id !== planId);
    notify();
  },

  /**
   * Reassign all plans with oldSubjectName to newSubjectName (default 'Other')
   */
  async reassignSubject(oldSubjectName: string, newSubjectName: string = 'Other'): Promise<number> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const target = oldSubjectName.trim().toLowerCase();
    let count = 0;
    localPlans = localPlans.map((p) => {
      if (p.courseName && p.courseName.trim().toLowerCase() === target) {
        count++;
        return {
          ...p,
          courseName: newSubjectName,
          courseId: undefined,
          subtitle: p.subtitle
            ? p.subtitle.replace(oldSubjectName, newSubjectName)
            : `${p.time} · ${newSubjectName}`,
        };
      }
      return p;
    });
    if (count > 0) {
      notify();
    }
    return count;
  },

  getPlansCountForSubject(subjectName: string): number {
    const target = subjectName.trim().toLowerCase();
    return localPlans.filter(
      (p) => p.courseName && p.courseName.trim().toLowerCase() === target
    ).length;
  },

  subscribe(listener: PlanListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
