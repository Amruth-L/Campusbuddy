import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';

export function Button({ label, onPress, secondary = false, style }: { label: string; onPress: () => void; secondary?: boolean; style?: ViewStyle }) {
  const theme = useTheme();
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.button, { backgroundColor: secondary ? theme.card : theme.primary, borderColor: theme.border }, style]}><Text style={[styles.text, { color: secondary ? theme.text : theme.background }]}>{label}</Text></Pressable>;
}
const styles = StyleSheet.create({ button: { minHeight: 50, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 }, text: { fontSize: 16, fontWeight: '700' } });
