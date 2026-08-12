import { useCallback, useEffect, useState } from 'react';
import type { DailySession, Reminder } from '@/types/session';
import {
  attachPhotoToReminder,
  checkInSession,
  checkoutSession,
  completeReminder,
  fetchTodaySession,
} from '@/services/sessionService';
import { syncPendingActions } from '@/services/syncService';

export function useTodaySession() {
  const [session, setSession] = useState<DailySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadSession = useCallback(async () => {
    try {
      const data = await fetchTodaySession();
      setSession(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setSyncing(true);
    try {
      await syncPendingActions();
      const data = await fetchTodaySession();
      setSession(data);
    } finally {
      setRefreshing(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
    // Re-check sync on mount
    syncPendingActions().then(() => loadSession());
  }, [loadSession]);

  const handleCheckIn = async () => {
    if (!session) return;
    const updated = await checkInSession(session.id);
    if (updated) setSession(updated);
  };

  const handleCheckout = async () => {
    if (!session) return;
    const updated = await checkoutSession(session.id);
    if (updated) setSession(updated);
  };

  const handleCompleteReminder = async (reminderId: string) => {
    const updatedReminder = await completeReminder(reminderId);
    if (updatedReminder && session) {
      setSession({
        ...session,
        reminders: session.reminders.map((r) => (r.id === reminderId ? { ...r, ...updatedReminder } : r)),
      });
    }
  };

  const handleAttachPhoto = async (reminderId: string, imageUrl: string) => {
    const updatedReminder = await attachPhotoToReminder(reminderId, imageUrl);
    if (updatedReminder && session) {
      setSession({
        ...session,
        reminders: session.reminders.map((r) => (r.id === reminderId ? { ...r, ...updatedReminder } : r)),
      });
    }
  };

  // Find next actionable reminder
  const nextReminder: Reminder | undefined = session?.reminders.find(
    (r) => r.status === 'UPCOMING' || r.status === 'PENDING'
  );

  return {
    session,
    loading,
    refreshing,
    syncing,
    nextReminder,
    refresh,
    handleCheckIn,
    handleCheckout,
    handleCompleteReminder,
    handleAttachPhoto,
  };
}
