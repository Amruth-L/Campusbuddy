import { useCallback, useEffect, useState } from 'react';
import { api } from '@/services/api'; import { defaultSchedule, type Schedule } from '@/types/schedule';

export function useSchedule() { const [schedule, setSchedule] = useState<Schedule>(defaultSchedule); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { try { const result = await api<{ schedule: Schedule | null }>('/schedule'); if (result.schedule) setSchedule(result.schedule); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load today’s schedule.'); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const save = async (next: Schedule) => { const result = await api<{ schedule: Schedule }>('/schedule', { method: 'PUT', body: JSON.stringify(next) }); setSchedule(result.schedule); return result.schedule; };
  return { schedule, setSchedule, loading, error, reload: load, save };
}
