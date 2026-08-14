import type { DailySession, Reminder } from '@/types/session';
import { api } from './api';
import { addPendingAction, getCache, KEYS, setCache } from './offlineStore';

function createDefaultSession(): DailySession {
  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  const startAt = new Date(now);
  startAt.setHours(9, 15, 0, 0);
  const endAt = new Date(now);
  endAt.setHours(16, 45, 0, 0);
  const actAt = new Date(now);
  actAt.setHours(13, 0, 0, 0);

  return {
    id: `local_session_${todayStr}`,
    userId: 'local_user',
    date: todayStr,
    scheduledStart: '09:15',
    scheduledEnd: '16:45',
    status: 'UPCOMING',
    checkInStatus: 'PENDING',
    checkoutStatus: 'PENDING',
    reminders: [
      {
        id: `rem_checkin_${todayStr}`,
        sessionId: `local_session_${todayStr}`,
        userId: 'local_user',
        type: 'CHECK_IN',
        scheduledAt: startAt.toISOString(),
        status: 'UPCOMING',
      },
      {
        id: `rem_act_${todayStr}`,
        sessionId: `local_session_${todayStr}`,
        userId: 'local_user',
        type: 'ACTIVITY',
        scheduledAt: actAt.toISOString(),
        status: 'PENDING',
      },
      {
        id: `rem_checkout_${todayStr}`,
        sessionId: `local_session_${todayStr}`,
        userId: 'local_user',
        type: 'CHECKOUT',
        scheduledAt: endAt.toISOString(),
        status: 'UPCOMING',
      },
    ],
  };
}

export async function fetchTodaySession(): Promise<DailySession | null> {
  try {
    const res = await api<{ session: DailySession | null }>('/sessions/today');
    if (res?.session) {
      await setCache(KEYS.TODAY_SESSION, res.session);
      return res.session;
    }
  } catch {
    // API unavailable or unauthenticated -> check local cache
  }
  const cached = await getCache<DailySession>(KEYS.TODAY_SESSION);
  if (cached) return cached;

  const defaultSess = createDefaultSession();
  await setCache(KEYS.TODAY_SESSION, defaultSess);
  return defaultSess;
}

export async function checkInSession(sessionId: string): Promise<DailySession | null> {
  try {
    const res = await api<{ session: DailySession }>(`/sessions/${sessionId}/check-in`, { method: 'POST' });
    if (res?.session) {
      await setCache(KEYS.TODAY_SESSION, res.session);
      return res.session;
    }
  } catch {
    // Offline / fallback handling
  }
  await addPendingAction({ type: 'CHECK_IN', targetId: sessionId });
  let cached = await getCache<DailySession>(KEYS.TODAY_SESSION);
  if (!cached) {
    cached = createDefaultSession();
  }
  cached.checkInStatus = 'COMPLETED';
  cached.checkInCompletedAt = new Date().toISOString();
  cached.status = 'ACTIVE';
  const checkInRem = cached.reminders.find((r) => r.type === 'CHECK_IN');
  if (checkInRem) checkInRem.status = 'COMPLETED';
  await setCache(KEYS.TODAY_SESSION, cached);
  return cached;
}

export async function checkoutSession(sessionId: string): Promise<DailySession | null> {
  try {
    const res = await api<{ session: DailySession }>(`/sessions/${sessionId}/checkout`, { method: 'POST' });
    if (res?.session) {
      await setCache(KEYS.TODAY_SESSION, res.session);
      return res.session;
    }
  } catch {
    // Fallback
  }
  await addPendingAction({ type: 'CHECKOUT', targetId: sessionId });
  let cached = await getCache<DailySession>(KEYS.TODAY_SESSION);
  if (!cached) cached = createDefaultSession();
  cached.checkoutStatus = 'COMPLETED';
  cached.checkoutCompletedAt = new Date().toISOString();
  cached.status = cached.checkInStatus === 'COMPLETED' ? 'COMPLETED' : 'PARTIALLY_COMPLETED';
  const checkoutRem = cached.reminders.find((r) => r.type === 'CHECKOUT');
  if (checkoutRem) checkoutRem.status = 'COMPLETED';
  await setCache(KEYS.TODAY_SESSION, cached);
  return cached;
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
