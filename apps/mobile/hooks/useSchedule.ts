import { useCallback, useEffect, useState } from 'react';
import { api } from '@/services/api';
import { defaultSchedule, type Schedule } from '@/types/schedule';
import { getCache, setCache } from '@/services/offlineStore';

const SCHEDULE_CACHE_KEY = 'campuslife_user_schedule';

export function useSchedule() {
  const [schedule, setSchedule] = useState<Schedule>(defaultSchedule);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const cached = await getCache<Schedule>(SCHEDULE_CACHE_KEY);
      if (cached) {
        setSchedule(cached);
      }
      const result = await api<{ schedule: Schedule | null }>('/schedule');
      if (result?.schedule) {
        setSchedule(result.schedule);
        await setCache(SCHEDULE_CACHE_KEY, result.schedule);
      }
      setError(null);
    } catch {
      // Fall back to cached schedule or default
      const cached = await getCache<Schedule>(SCHEDULE_CACHE_KEY);
      if (cached) {
        setSchedule(cached);
      }
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (next: Schedule) => {
    // Always save locally immediately
    await setCache(SCHEDULE_CACHE_KEY, next);
    setSchedule(next);

    try {
      const result = await api<{ schedule: Schedule }>('/schedule', {
        method: 'PUT',
        body: JSON.stringify(next),
      });
      if (result?.schedule) {
        setSchedule(result.schedule);
        await setCache(SCHEDULE_CACHE_KEY, result.schedule);
        return result.schedule;
      }
    } catch {
      // Return locally saved schedule if API request fails
    }
    return next;
  };

  return { schedule, setSchedule, loading, error, reload: load, save };
}
