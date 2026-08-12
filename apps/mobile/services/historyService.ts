import type { DailySession, HistoryStats } from '@/types/session';
import { api } from './api';
import { getCache, KEYS, setCache } from './offlineStore';

export interface HistoryResponse {
  stats: HistoryStats;
  sessions: DailySession[];
}

export async function fetchSessionStats(filter: 'today' | 'week' | 'month' | 'all' = 'all'): Promise<HistoryResponse> {
  try {
    const res = await api<HistoryResponse>(`/stats?filter=${filter}`);
    if (res?.stats) {
      await setCache(`${KEYS.HISTORY_STATS}_${filter}`, res);
    }
    return res;
  } catch {
    const cached = await getCache<HistoryResponse>(`${KEYS.HISTORY_STATS}_${filter}`);
    return (
      cached ?? {
        stats: { totalHours: '0h 0m', totalMinutes: 0, completedDays: 0, checkoutRate: '0%', totalSessions: 0 },
        sessions: [],
      }
    );
  }
}
