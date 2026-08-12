import { useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useTheme } from '@/providers/ThemeProvider';
import { useAssistant } from '@/hooks/useAssistant';

const QUICK_QUESTIONS = [
  'What do I need to do now?',
  'When is checkout?',
  "Show today's status",
  "Show this week's hours",
  'Did I complete yesterday?',
];

export default function Assistant() {
  const theme = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const { messages, question, setQuestion, loading, ask } = useAssistant();

  const handleSend = (text?: string) => {
    ask(text);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <Screen>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        <Text style={[styles.title, { color: theme.text }]}>Assistant</Text>
        <Text style={[styles.sub, { color: theme.secondary }]}>
          Answers based on your Campus Life schedule and confirmations.
        </Text>

        {/* Message Thread */}
        <View style={styles.thread}>
          {messages.map((m) => {
            const isUser = m.role === 'USER';
            return (
              <Card
                key={m.id}
                style={[
                  styles.msgCard,
                  isUser
                    ? { backgroundColor: theme.primary, alignSelf: 'flex-end' }
                    : { backgroundColor: theme.card, alignSelf: 'flex-start' },
                ]}
              >
                <Text
                  style={[
                    styles.msgRole,
                    { color: isUser ? theme.background : theme.secondary },
                  ]}
                >
                  {isUser ? 'YOU' : 'CAMPUSLIFE BUDDY'}
                </Text>
                <Text
                  style={[
                    styles.msgText,
                    { color: isUser ? theme.background : theme.text },
                  ]}
                >
                  {m.message}
                </Text>
              </Card>
            );
          })}

          {loading && (
            <Card style={[styles.msgCard, { backgroundColor: theme.card, alignSelf: 'flex-start' }]}>
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={theme.text} />
                <Text style={[styles.msgText, { color: theme.secondary, marginLeft: 8 }]}>
                  Thinking...
                </Text>
              </View>
            </Card>
          )}
        </View>

        {/* Quick Questions */}
        <Text style={[styles.heading, { color: theme.text }]}>QUICK QUESTIONS</Text>
        <View style={styles.quick}>
          {QUICK_QUESTIONS.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              onPress={() => handleSend(item)}
              style={[styles.quickButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <Text style={{ color: theme.text, fontWeight: '700' }}>{item}</Text>
            </Pressable>
          ))}
        </View>

        {/* Composer */}
        <View style={[styles.composer, { borderColor: theme.border }]}>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            onSubmitEditing={() => handleSend()}
            placeholder="Ask about Campus Life"
            placeholderTextColor={theme.secondary}
            style={[styles.input, { color: theme.text }]}
          />
          <Pressable onPress={() => handleSend()} disabled={loading || !question.trim()}>
            <Text style={[styles.send, { color: question.trim() ? theme.text : theme.secondary }]}>
              Send
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.7 },
  sub: { fontSize: 16, lineHeight: 22, marginTop: 7 },
  thread: { marginTop: 20, gap: 10 },
  msgCard: { maxWidth: '88%', padding: 14, borderRadius: 12 },
  msgRole: { fontSize: 10, letterSpacing: 0.7, fontWeight: '800', marginBottom: 4 },
  msgText: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  heading: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8, marginTop: 26, marginBottom: 10 },
  quick: { gap: 8 },
  quickButton: { minHeight: 48, borderWidth: 1, borderRadius: 10, padding: 13, justifyContent: 'center' },
  composer: { marginTop: 20, marginBottom: 30, minHeight: 54, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  input: { flex: 1, fontSize: 15 },
  send: { fontWeight: '800', marginLeft: 10 },
});
