import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { useEffect } from 'react';
import { cancelCampusLifeNotifications } from '@/notifications/notification.service';

export default function RootLayout() {
  useEffect(() => () => { void cancelCampusLifeNotifications(); }, []);
  return (
    <ThemeProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}
