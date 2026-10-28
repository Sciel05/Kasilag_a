import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Plan, PlanType } from '../types';
import { planService } from '../services/planService';
import { settingsService, TypeColorMapping } from '../services/settingsService';
import { PaletteColorKey, typeColorPalette, TypeColorConfig } from '../theme';
import { toISODate } from '../utils/date';

export function usePlans(initialDate?: string) {
  const [todayDate, setTodayDate] = useState<string>(() => toISODate(new Date()));
  const [selectedDate, setSelectedDate] = useState<string>(() => initialDate || toISODate(new Date()));
  const [plans, setPlans] = useState<Plan[]>([]);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [deadline, setDeadline] = useState<{
    title: string;
    courseName: string;
    timeText: string;
    daysLeft: number;
    date: string;
  } | null>(null);
  const [typeColors, setTypeColors] = useState<TypeColorMapping>(() =>
    settingsService.getTypeColorsSync()
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const selectedDateRef = useRef(selectedDate);
  selectedDateRef.current = selectedDate;

  const loadData = useCallback(async (currentTodayIso: string = todayDate) => {
    try {
      setLoading(true);
      setError(null);
      const [dayPlans, fullList, nearest, colors] = await Promise.all([
        planService.getPlansByDate(selectedDateRef.current),
        planService.getAllPlans(),
        planService.getNearestDeadline(currentTodayIso),
        settingsService.getTypeColors(),
      ]);
      setPlans(dayPlans);
      setAllPlans(fullList);
      setDeadline(nearest);
      setTypeColors(colors);
    } catch (err: any) {
      setError(err?.message || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  }, [todayDate]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [selectedDate, loadData]);

  // AppState listener for device current date when returning to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const freshToday = toISODate(new Date());
        setTodayDate(freshToday);
        loadData(freshToday);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [loadData]);

  // Subscriptions to planService and settingsService
  useEffect(() => {
    const unsubPlans = planService.subscribe((updatedPlans) => {
      setAllPlans(updatedPlans);
      setPlans(updatedPlans.filter((p) => p.date === selectedDateRef.current));
      planService.getNearestDeadline(todayDate).then(setDeadline);
    });

    const unsubSettings = settingsService.subscribe((updatedColors) => {
      setTypeColors(updatedColors);
    });

    return () => {
      unsubPlans();
      unsubSettings();
    };
  }, [todayDate]);

  const selectDate = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const togglePlan = useCallback(async (planId: string) => {
    // Optimistic update
    setPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, completed: !p.completed } : p))
    );
    setAllPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, completed: !p.completed } : p))
    );

    try {
      await planService.togglePlanCompletion(planId);
    } catch (err: any) {
      // Rollback on failure
      setPlans((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, completed: !p.completed } : p))
      );
      setError('Failed to update task completion');
    }
  }, []);

  const addPlan = useCallback(
    async (newPlanData: Omit<Plan, 'id'>) => {
      const created = await planService.addPlan(newPlanData);
      setAllPlans((prev) => [...prev, created]);
      if (created.date === selectedDate) {
        setPlans((prev) => [...prev, created]);
      }
      const nearest = await planService.getNearestDeadline(todayDate);
      setDeadline(nearest);
      return created;
    },
    [selectedDate, todayDate]
  );

  const deletePlan = useCallback(
    async (planId: string) => {
      await planService.deletePlan(planId);
      setAllPlans((prev) => prev.filter((p) => p.id !== planId));
      setPlans((prev) => prev.filter((p) => p.id !== planId));
      const nearest = await planService.getNearestDeadline(todayDate);
      setDeadline(nearest);
    },
    [todayDate]
  );

  const updateTypeColor = useCallback(
    async (type: PlanType, colorKey: PaletteColorKey) => {
      const updated = await settingsService.setTypeColor(type, colorKey);
      setTypeColors(updated);
    },
    []
  );

  const getTypeTheme = useCallback(
    (type: PlanType): TypeColorConfig => {
      const colorKey = typeColors[type] || 'slate';
      return typeColorPalette[colorKey] || typeColorPalette.slate;
    },
    [typeColors]
  );

  /**
   * Helper to return up to 3 colored dots for a given date string
   */
  const getDayDots = useCallback(
    (dateStr: string): Array<{ key: string; color: string }> => {
      const dayPlans = allPlans.filter((p) => p.date === dateStr);
      return dayPlans.slice(0, 3).map((p) => ({
        key: p.id,
        color: getTypeTheme(p.type).dot,
      }));
    },
    [allPlans, getTypeTheme]
  );

  const reassignSubject = useCallback(
    async (oldSubjectName: string, newSubjectName: string = 'Other') => {
      const count = await planService.reassignSubject(oldSubjectName, newSubjectName);
      const [dayPlans, fullList] = await Promise.all([
        planService.getPlansByDate(selectedDateRef.current),
        planService.getAllPlans(),
      ]);
      setPlans(dayPlans);
      setAllPlans(fullList);
      return count;
    },
    []
  );

  const getSubjectPlanCount = useCallback((subjectName: string) => {
    return planService.getPlansCountForSubject(subjectName);
  }, []);

  return {
    todayDate,
    selectedDate,
    selectDate,
    plans,
    allPlans,
    deadline,
    typeColors,
    loading,
    error,
    togglePlan,
    addPlan,
    deletePlan,
    updateTypeColor,
    getTypeTheme,
    getDayDots,
    reassignSubject,
    getSubjectPlanCount,
    refresh: () => loadData(todayDate),
  };
}
