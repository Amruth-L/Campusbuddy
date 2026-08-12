import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { useTheme } from '@/providers/ThemeProvider';

const slides = [
  ['Never forget Campus Life again.', 'A quiet personal assistant for your check-in, activity, and checkout routine.'],
  ["Get reminded when it's time to check in.", 'Open the official Campus Life app yourself, then confirm it here.'],
  ['Keep activity and photo tasks on track.', 'Receive periodic reminders based on the schedule you choose.'],
  ['Leave campus with confidence.', 'Get a clear checkout reminder before your day ends.'],
];

export default function Onboarding() {
  const [step, setStep] = useState(0); const theme = useTheme(); const [title, body] = slides[step]; const final = step === slides.length - 1;
  return <Screen scroll={false} style={styles.screen}><View style={styles.top}><View style={[styles.mark, { backgroundColor: theme.primary }]}><Text style={{ color: theme.background, fontSize: 30, fontWeight: '800' }}>C</Text></View><Text style={[styles.brand, { color: theme.text }]}>CampusLife Buddy</Text></View><View style={styles.copy}><Text style={[styles.title, { color: theme.text }]}>{title}</Text><Text style={[styles.body, { color: theme.secondary }]}>{body}</Text></View><View><View style={styles.dots}>{slides.map((_, index) => <View key={index} style={[styles.dot, { backgroundColor: index === step ? theme.primary : theme.border }]} />)}</View><Button label={final ? "Let's set up your schedule" : 'Continue'} onPress={() => final ? router.replace('/(auth)/register') : setStep(step + 1)} /><Button label="I already have an account" secondary onPress={() => router.replace('/(auth)/login')} style={styles.secondary} /></View></Screen>;
}
const styles = StyleSheet.create({ screen: { padding: 28, justifyContent: 'space-between' }, top: { alignItems: 'center', paddingTop: 36 }, mark: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' }, brand: { marginTop: 14, fontSize: 16, fontWeight: '700' }, copy: { gap: 16 }, title: { fontSize: 32, lineHeight: 39, fontWeight: '800', letterSpacing: -0.7 }, body: { fontSize: 17, lineHeight: 25 }, dots: { flexDirection: 'row', gap: 7, marginBottom: 24 }, dot: { width: 24, height: 4, borderRadius: 4 }, secondary: { marginTop: 10 } });
