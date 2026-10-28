import { Plan } from '../../types';
import { toISODate, formatTime24To12 } from '../../utils/date';

/**
 * Helper to get an ISO date offset from a base date by dayOffset
 */
function getDateOffset(base: Date, dayOffset: number): string {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + dayOffset);
  return toISODate(d);
}

export function generateMockPlans(baseDate: Date = new Date()): Plan[] {
  const d0 = getDateOffset(baseDate, 0); // today
  const d1 = getDateOffset(baseDate, 1); // today + 1
  const d2 = getDateOffset(baseDate, 2); // today + 2
  const d3 = getDateOffset(baseDate, 3); // today + 3
  const d4 = getDateOffset(baseDate, 4); // today + 4
  const d5 = getDateOffset(baseDate, 5); // today + 5
  const d6 = getDateOffset(baseDate, 6); // today + 6

  return [
    // Today
    {
      id: 'plan-1',
      userId: 'user-1',
      date: d0,
      time: '9:00 AM · 5 min',
      startTime: '09:00',
      durationMinutes: 5,
      title: 'Quick recall',
      subtitle: 'Beam reactions · 5 min · no hints',
      type: 'study',
      completed: false,
      linkRoute: 'Practice',
    },
    {
      id: 'plan-2',
      userId: 'user-1',
      date: d0,
      time: '10:00 AM · 15 min',
      startTime: '10:00',
      durationMinutes: 15,
      title: 'Solve · Torsion',
      subtitle: 'Step-by-step · 15 min · for upcoming quiz',
      type: 'study',
      completed: false,
      linkRoute: 'Solve',
      templateId: 'torsion_hollow',
      courseId: 'deformable',
      courseName: 'Mechanics of Deformable Bodies',
    },
    {
      id: 'plan-3',
      userId: 'user-1',
      date: d0,
      time: '2:00 PM · 15 min',
      startTime: '14:00',
      durationMinutes: 15,
      title: 'Board situation drill',
      subtitle: '1 situation · 3 questions · timed',
      type: 'exam',
      completed: false,
      linkRoute: 'Practice',
    },

    // Today + 1
    {
      id: 'plan-4',
      userId: 'user-1',
      date: d1,
      time: '10:00 AM · 20 min',
      startTime: '10:00',
      durationMinutes: 20,
      title: 'Review Mohr’s Circle derivations',
      subtitle: 'Principal stresses & max shear plane',
      type: 'study',
      completed: false,
      courseId: 'deformable',
      courseName: 'Mechanics of Deformable Bodies',
    },
    {
      id: 'plan-5',
      userId: 'user-1',
      date: d1,
      time: '4:00 PM · 10 min',
      startTime: '16:00',
      durationMinutes: 10,
      title: 'Geotech soil phase quick formula check',
      subtitle: 'Void ratio and porosity relations',
      type: 'study',
      completed: false,
      linkRoute: 'Practice',
    },

    // Today + 2
    {
      id: 'plan-6',
      userId: 'user-1',
      date: d2,
      time: '1:00 PM · 30 min',
      startTime: '13:00',
      durationMinutes: 30,
      title: 'Torsion problem set: Solid vs Hollow shafts',
      subtitle: 'Weight reduction comparison drill',
      type: 'study',
      completed: false,
      linkRoute: 'Solve',
      templateId: 'torsion_hollow',
    },
    {
      id: 'plan-7',
      userId: 'user-1',
      date: d2,
      time: '3:30 PM · 10 min',
      startTime: '15:30',
      durationMinutes: 10,
      title: 'Formulas recall: Polar moments & J',
      subtitle: 'Build from tiles · 4 formulas',
      type: 'study',
      completed: false,
      linkRoute: 'Practice',
    },

    // Today + 3 (Nearest deadline day!)
    {
      id: 'plan-8',
      userId: 'user-1',
      date: d3,
      time: '10:30 AM · 1 hr 0 min',
      startTime: '10:30',
      durationMinutes: 60,
      title: 'Torsion quiz',
      subtitle: 'Mechanics of Deformable Bodies · Room 304',
      type: 'exam',
      completed: false,
      courseId: 'deformable',
      courseName: 'Mechanics of Deformable Bodies',
    },
    {
      id: 'plan-9',
      userId: 'user-1',
      date: d3,
      time: '2:00 PM · 25 min',
      startTime: '14:00',
      durationMinutes: 25,
      title: 'Hydraulics Bernoulli energy equation',
      subtitle: 'Pipe flow with head loss',
      type: 'study',
      completed: false,
      linkRoute: 'Practice',
    },

    // Today + 4
    {
      id: 'plan-10',
      userId: 'user-1',
      date: d4,
      time: '11:00 AM · 30 min',
      startTime: '11:00',
      durationMinutes: 30,
      title: 'Structural Theory Influence Lines',
      subtitle: 'Moving load analysis on simple beams',
      type: 'study',
      completed: false,
      courseId: 'structural',
      courseName: 'Structural Theory',
    },

    // Today + 5
    {
      id: 'plan-11',
      userId: 'user-1',
      date: d5,
      time: '9:00 AM · 1 hr 0 min',
      startTime: '09:00',
      durationMinutes: 60,
      title: 'PSAD Full Chapter Mock Exam',
      subtitle: 'Comprehensive 15-question situation drill',
      type: 'exam',
      completed: false,
      linkRoute: 'Practice',
    },

    // Today + 6
    {
      id: 'plan-12',
      userId: 'user-1',
      date: d6,
      time: '5:00 PM · 15 min',
      startTime: '17:00',
      durationMinutes: 15,
      title: 'Weekly spaced review & formula recap',
      subtitle: 'Reflect on common mistakes and errors',
      type: 'other',
      completed: false,
    },
  ];
}

export const mockPlans: Plan[] = generateMockPlans();
