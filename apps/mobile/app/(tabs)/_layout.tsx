import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';

const icons: Record<string, keyof typeof Ionicons.glyphMap> = { index: 'home-outline', schedule: 'calendar-outline', history: 'time-outline', assistant: 'chatbubble-ellipses-outline', settings: 'settings-outline' };
export default function TabLayout() { const theme = useTheme(); return <Tabs screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: theme.primary, tabBarInactiveTintColor: theme.secondary, tabBarStyle: { backgroundColor: theme.background, borderTopColor: theme.border, height: 66, paddingTop: 7 }, tabBarLabelStyle: { fontSize: 11, fontWeight: '600' }, tabBarIcon: ({ color, size }) => <Ionicons name={icons[route.name] ?? 'ellipse-outline'} size={size} color={color} /> })}><Tabs.Screen name="index" options={{ title: 'Home' }} /><Tabs.Screen name="schedule" options={{ title: 'Schedule' }} /><Tabs.Screen name="history" options={{ title: 'History' }} /><Tabs.Screen name="assistant" options={{ title: 'Assistant' }} /><Tabs.Screen name="settings" options={{ title: 'Settings' }} /></Tabs>; }
