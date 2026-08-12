import { api } from './api';
import { clearPendingActions, getPendingActions } from './offlineStore';

export async function syncPendingActions(): Promise<{ syncedCount: number; errors: number }> {
  const actions = await getPendingActions();
  if (!actions.length) return { syncedCount: 0, errors: 0 };

  let syncedCount = 0;
  let errors = 0;
  const remainingActions = [];

  for (const action of actions) {
    try {
      if (action.type === 'CHECK_IN') {
        await api(`/sessions/${action.targetId}/check-in`, { method: 'POST' });
      } else if (action.type === 'CHECKOUT') {
        await api(`/sessions/${action.targetId}/checkout`, { method: 'POST' });
      } else if (action.type === 'COMPLETE_REMINDER') {
        await api(`/reminders/${action.targetId}/complete`, { method: 'POST' });
      } else if (action.type === 'ATTACH_PHOTO') {
        await api(`/reminders/${action.targetId}/photo`, {
          method: 'POST',
          body: JSON.stringify(action.payload),
        });
      } else if (action.type === 'SNOOZE_REMINDER') {
        await api(`/reminders/${action.targetId}/snooze`, {
          method: 'POST',
          body: JSON.stringify(action.payload),
        });
      }
      syncedCount += 1;
    } catch {
      errors += 1;
      remainingActions.push(action);
    }
  }

  if (syncedCount > 0) {
    await clearPendingActions();
  }

  return { syncedCount, errors };
}
