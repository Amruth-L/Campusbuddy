import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PendingAction {
  id: string;
  type: 'CHECK_IN' | 'CHECKOUT' | 'COMPLETE_REMINDER' | 'ATTACH_PHOTO' | 'SNOOZE_REMINDER';
  targetId: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

const PREFIX = 'campuslife_cache_';

export const KEYS = {
  TODAY_SESSION: `${PREFIX}today_session`,
  HISTORY_STATS: `${PREFIX}history_stats`,
  ASSISTANT_MESSAGES: `${PREFIX}assistant_messages`,
  PENDING_ACTIONS: `${PREFIX}pending_actions`,
};

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function setCache<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage write errors
  }
}

export async function getPendingActions(): Promise<PendingAction[]> {
  const actions = await getCache<PendingAction[]>(KEYS.PENDING_ACTIONS);
  return actions ?? [];
}

export async function addPendingAction(action: Omit<PendingAction, 'id' | 'createdAt'>): Promise<void> {
  const actions = await getPendingActions();
  const newAction: PendingAction = {
    ...action,
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  actions.push(newAction);
  await setCache(KEYS.PENDING_ACTIONS, actions);
}

export async function clearPendingActions(): Promise<void> {
  await setCache(KEYS.PENDING_ACTIONS, []);
}
