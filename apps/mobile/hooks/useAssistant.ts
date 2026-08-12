import { useCallback, useEffect, useState } from 'react';
import { askAssistantQuestion, fetchAssistantHistory, type AssistantMessageItem } from '@/services/assistantService';

export function useAssistant() {
  const [messages, setMessages] = useState<AssistantMessageItem[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      const history = await fetchAssistantHistory();
      setMessages(history);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const ask = async (inputQuery?: string) => {
    const queryText = (inputQuery ?? question).trim();
    if (!queryText || loading) return;

    setQuestion('');
    setLoading(true);

    // Optimistically add user question
    const tempUserMsg: AssistantMessageItem = {
      id: `temp_${Date.now()}`,
      role: 'USER',
      message: queryText,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await askAssistantQuestion(queryText);
      setMessages(res.messages);
    } catch {
      // Retain optimistic message if error
    } finally {
      setLoading(false);
    }
  };

  return {
    messages,
    question,
    setQuestion,
    loading,
    initialLoading,
    ask,
    refreshHistory: loadHistory,
  };
}
