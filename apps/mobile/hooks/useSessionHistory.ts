import { useCallback, useEffect, useState } from 'react';
import type { DailySession, HistoryStats } from '@/types/session';
import { fetchSessionStats } from '@/services/historyService';

export function useSessionHistory() {
  const [filter, setFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [stats, setStats] = useState<HistoryStats>({
    totalHours: '0h 0m',
    totalMinutes: 0,
    completedDays: 0,
    checkoutRate: '0%',
    totalSessions: 0,
  });
  const [sessions, setSessions] = useState<DailySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (currentFilter: 'today' | 'week' | 'month' | 'all') => {
    try {
      const res = await fetchSessionStats(currentFilter);
      setStats(res.stats);
      setSessions(res.sessions);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadData(filter);
  }, [filter, loadData]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    loadData(filter);
  }, [filter, loadData]);

  return {
    filter,
    setFilter,
    stats,
    sessions,
    loading,
    refreshing,
    refresh,
  };
}
