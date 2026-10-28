import { useState, useEffect, useCallback } from 'react';
import {
  ClusterTopic,
  Flashcard,
  FlashcardRating,
  Situation,
  ErrorLogEntry,
  Cluster,
} from '../types';
import { practiceService } from '../services/practiceService';

export function usePractice(initialCluster: string = 'All') {
  const [cluster, setCluster] = useState<string>(initialCluster);
  const [dailyGoalData, setDailyGoalData] = useState(() =>
    practiceService.getDailyGoalData()
  );
  const [topics, setTopics] = useState<ClusterTopic[]>([]);
  const [dueFlashcards, setDueFlashcards] = useState<Flashcard[]>([]);
  const [situations, setSituations] = useState<Situation[]>([]);
  const [errorLog, setErrorLog] = useState<ErrorLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [tList, fList, sList, eList] = await Promise.all([
        practiceService.getClusterTopics(cluster),
        practiceService.getDueFlashcards(cluster),
        practiceService.getSituations(cluster),
        practiceService.getErrorLogEntries(cluster),
      ]);
      setTopics(tList);
      setDueFlashcards(fList);
      setSituations(sList);
      setErrorLog(eList);
      setDailyGoalData(practiceService.getDailyGoalData());
    } catch (err: any) {
      setError(err?.message || 'Failed to load practice data');
    } finally {
      setLoading(false);
    }
  }, [cluster]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Subscribe to changes in practiceService
  useEffect(() => {
    const unsub = practiceService.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, [loadData]);

  const updateDailyGoal = useCallback(async (newGoal: number) => {
    const updated = await practiceService.setDailyGoal(newGoal);
    setDailyGoalData(practiceService.getDailyGoalData());
    return updated;
  }, []);

  const rateFlashcard = useCallback(
    async (cardId: string, rating: FlashcardRating) => {
      const updated = await practiceService.rateFlashcard(cardId, rating);
      await loadData();
      return updated;
    },
    [loadData]
  );

  const recordAttemptOutcome = useCallback(
    async (
      itemId: string,
      itemType: 'flashcard' | 'situation' | 'template',
      itemCluster: Cluster,
      title: string,
      isCorrect: boolean,
      isAssisted: boolean,
      mistakeType?: string
    ) => {
      await practiceService.recordAttemptOutcome(
        itemId,
        itemType,
        itemCluster,
        title,
        isCorrect,
        isAssisted,
        mistakeType
      );
      await loadData();
    },
    [loadData]
  );

  return {
    cluster,
    setCluster,
    dailyGoalData,
    updateDailyGoal,
    topics,
    dueFlashcards,
    dueFlashcardsCount: dueFlashcards.length,
    situations,
    errorLog,
    errorLogCount: errorLog.length,
    rateFlashcard,
    recordAttemptOutcome,
    loading,
    error,
    refresh: loadData,
  };
}
