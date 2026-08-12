import { PropsWithChildren } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';

export function Screen({ children, scroll = true, style }: PropsWithChildren<{ scroll?: boolean; style?: ViewStyle }>) {
  const theme = useTheme();
  const content = scroll ? <ScrollView contentContainerStyle={[styles.content, style]}>{children}</ScrollView> : children;
  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>{content}</SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1 }, content: { flexGrow: 1, padding: 24 } });
