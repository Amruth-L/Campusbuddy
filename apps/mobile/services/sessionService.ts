import type { DailySession, Reminder } from '@/types/session';
import { api } from './api';
import { addPendingAction, getCache, KEYS, setCache } from './offlineStore';

export async function fetchTodaySession(): Promise<DailySession | null> {
  try {
    const res = await api<{ session: DailySession | null }>('/sessions/today');
    if (res?.session) {
      await setCache(KEYS.TODAY_SESSION, res.session);
    }
    return res?.session ?? null;
  } catch {
    // Fallback to local cache
    return getCache<DailySession>(KEYS.TODAY_SESSION);
  }
}

export async function checkInSession(sessionId: string): Promise<DailySession | null> {
  try {
    const res = await api<{ session: DailySession }>(`/sessions/${sessionId}/check-in`, { method: 'POST' });
    if (res?.session) {
      await setCache(KEYS.TODAY_SESSION, res.session);
    }
    return res.session;
  } catch {
    // Queue offline action & update local cache
    await addPendingAction({ type: 'CHECK_IN', targetId: sessionId });
    const cached = await getCache<DailySession>(KEYS.TODAY_SESSION);
    if (cached) {
      cached.checkInStatus = 'COMPLETED';
      cached.checkInCompletedAt = new Date().toISOString();
      cached.status = 'ACTIVE';
      await setCache(KEYS.TODAY_SESSION, cached);
      return cached;
    }
    return null;
  }
}

export async function checkoutSession(sessionId: string): Promise<DailySession | null> {
  try {
    const res = await api<{ session: DailySession }>(`/sessions/${sessionId}/checkout`, { method: 'POST' });
    if (res?.session) {
      await setCache(KEYS.TODAY_SESSION, res.session);
    }
    return res.session;
  } catch {
    await addPendingAction({ type: 'CHECKOUT', targetId: sessionId });
    const cached = await getCache<DailySession>(KEYS.TODAY_SESSION);
    if (cached) {
      cached.checkoutStatus = 'COMPLETED';
      cached.checkoutCompletedAt = new Date().toISOString();
      cached.status = cached.checkInStatus === 'COMPLETED' ? 'COMPLETED' : 'PARTIALLY_COMPLETED';
      await setCache(KEYS.TODAY_SESSION, cached);
      return cached;
    }
    return null;
  }
}

export async function completeReminder(reminderId: string): Promise<Reminder | null> {
  try {
    const res = await api<{ reminder: Reminder }>(`/reminders/${reminderId}/complete`, { method: 'POST' });
    return res.reminder;
  } catch {
    await addPendingAction({ type: 'COMPLETE_REMINDER', targetId: reminderId });
    const cached = await getCache<DailySession>(KEYS.TODAY_SESSION);
    if (cached) {
      const rem = cached.reminders.find((r) => r.id === reminderId);
      if (rem) {
        rem.status = 'COMPLETED';
        rem.completedAt = new Date().toISOString();
        await setCache(KEYS.TODAY_SESSION, cached);
        return rem;
      }
    }
    return null;
  }
}

export async function attachPhotoToReminder(reminderId: string, imageUrl: string): Promise<Reminder | null> {
  try {
    const res = await api<{ reminder: Reminder }>(`/reminders/${reminderId}/photo`, {
      method: 'POST',
      body: JSON.stringify({ imageUrl }),
    });
    return res.reminder;
  } catch {
    await addPendingAction({ type: 'ATTACH_PHOTO', targetId: reminderId, payload: { imageUrl } });
    const cached = await getCache<DailySession>(KEYS.TODAY_SESSION);
    if (cached) {
      const rem = cached.reminders.find((r) => r.id === reminderId);
      if (rem) {
        rem.status = 'COMPLETED';
        rem.completedAt = new Date().toISOString();
        rem.confirmation = {
          id: `local_${Date.now()}`,
          reminderId,
          sessionId: cached.id,
          userId: cached.userId,
          completedAt: new Date().toISOString(),
          status: 'COMPLETED',
          photo: {
            id: `photo_${Date.now()}`,
            activityConfirmationId: `local_${Date.now()}`,
            userId: cached.userId,
            imageUrl,
            createdAt: new Date().toISOString(),
          },
        };
        await setCache(KEYS.TODAY_SESSION, cached);
        return rem;
      }
    }
    return null;
  }
}
