import { api } from './api';
import { getCache, KEYS, setCache } from './offlineStore';

export interface AssistantMessageItem {
  id: string;
  role: 'USER' | 'ASSISTANT';
  message: string;
  createdAt: string;
}

export async function fetchAssistantHistory(): Promise<AssistantMessageItem[]> {
  try {
    const res = await api<{ messages: AssistantMessageItem[] }>('/assistant/history');
    if (res?.messages) {
      await setCache(KEYS.ASSISTANT_MESSAGES, res.messages);
    }
    return res?.messages ?? [];
  } catch {
    return (await getCache<AssistantMessageItem[]>(KEYS.ASSISTANT_MESSAGES)) ?? [];
  }
}

export async function askAssistantQuestion(question: string): Promise<{ answer: string; messages: AssistantMessageItem[] }> {
  try {
    const res = await api<{ answer: string; messages: AssistantMessageItem[] }>('/assistant/ask', {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
    if (res?.messages) {
      await setCache(KEYS.ASSISTANT_MESSAGES, res.messages);
    }
    return res;
  } catch {
    const cached = (await getCache<AssistantMessageItem[]>(KEYS.ASSISTANT_MESSAGES)) ?? [];
    const fallbackAnswer = 'Network connection offline. Local reminders and schedule remain active on your phone.';
    const updatedMessages: AssistantMessageItem[] = [
      ...cached,
      { id: `temp_${Date.now()}_user`, role: 'USER', message: question, createdAt: new Date().toISOString() },
      { id: `temp_${Date.now()}_ast`, role: 'ASSISTANT', message: fallbackAnswer, createdAt: new Date().toISOString() },
    ];
    await setCache(KEYS.ASSISTANT_MESSAGES, updatedMessages);
    return { answer: fallbackAnswer, messages: updatedMessages };
  }
}
