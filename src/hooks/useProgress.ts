import { useState, useEffect, useCallback } from 'react';
import { ProgressMetrics } from '../types';
import { progressService } from '../services/progressService';

export function useProgress() {
  const [metrics, setMetrics] = useState<ProgressMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await progressService.getProgressMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load progress metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  return {
    metrics,
    loading,
    error,
    refresh: loadMetrics,
  };
}
