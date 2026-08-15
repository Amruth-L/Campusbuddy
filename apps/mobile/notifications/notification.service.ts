import { Linking, Platform } from 'react-native';
import type { Schedule } from '@/types/schedule';

const notificationPrefix = 'campuslife:';

// expo-notifications is NOT supported in Expo Go (SDK 53+).
// We lazy-import it and catch gracefully so the rest of the app still works.
async function getNotifications() {
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

// Set up handler once on native
(async () => {
  if (Platform.OS === 'web') return;
  const Notifications = await getNotifications();
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
})();

export async function notificationPermission() {
  if (Platform.OS === 'web') return { granted: true } as any;
  const Notifications = await getNotifications();
  if (!Notifications) return { granted: false, canAskAgain: false } as any;
  return Notifications.getPermissionsAsync();
}

export async function requestNotificationPermission() {
  if (Platform.OS === 'web') return { granted: true } as any;
  const Notifications = await getNotifications();
  if (!Notifications) return { granted: false, canAskAgain: false } as any;
  const current = await Notifications.getPermissionsAsync();
  return current.granted ? current : Notifications.requestPermissionsAsync();
}

export async function openNotificationSettings() {
  if (Platform.OS === 'web') return;
  return Linking.openSettings();
}

export async function cancelCampusLifeNotifications() {
  if (Platform.OS === 'web') return;
  const Notifications = await getNotifications();
  if (!Notifications) return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((item) => String(item.content.data?.kind ?? '').startsWith(notificationPrefix))
        .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier))
    );
  } catch {
    // Ignore — Expo Go does not support this
  }
}

function weekdayFor(date: Date) {
  return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
    date.getDay()
  ] as keyof Schedule;
}

function makeDate(day: Date, minuteVal: number) {
  const result = new Date(day);
  result.setHours(Math.floor(minuteVal / 60), minuteVal % 60, 0, 0);
  return result;
}

function minutesFrom(time: string) {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

async function scheduleOne(
  Notifications: Awaited<ReturnType<typeof getNotifications>>,
  date: Date,
  title: string,
  body: string,
  kind: string
) {
  if (!Notifications || Platform.OS === 'web') return;
  if (date <= new Date()) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        data: { kind: `${notificationPrefix}${kind}` },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
      },
    });
  } catch {
    // Silently ignore — Expo Go does not support scheduling
  }
}

export async function rescheduleCampusLifeNotifications(config: Schedule) {
  if (Platform.OS === 'web') {
    return { scheduled: 0, permissionDenied: false };
  }

  const Notifications = await getNotifications();
  if (!Notifications) {
    return { scheduled: 0, permissionDenied: false };
  }

  await cancelCampusLifeNotifications();
  const permission = await notificationPermission();
  if (!permission.granted) return { scheduled: 0, permissionDenied: true };

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('campuslife-reminders', {
        name: 'Campus Life reminders',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
    } catch {
      // Ignore channel creation errors in Expo Go
    }
  }

  const today = new Date();
  let scheduled = 0;
  const start = minutesFrom(config.startTime);
  const end = minutesFrom(config.endTime);
  const warning = end - config.checkoutWarningMinutes;

  for (let offset = 0; offset < 14; offset += 1) {
    const day = new Date(today);
    day.setDate(today.getDate() + offset);
    if (!config[weekdayFor(day)]) continue;

    await scheduleOne(
      Notifications,
      makeDate(day, start),
      'Campus Life starts now',
      "Don't forget to check in using the official Campus Life app.",
      'check-in'
    );
    scheduled += 1;

    for (let at = start + config.photoIntervalMinutes; at < warning; at += config.photoIntervalMinutes) {
      await scheduleOne(
        Notifications,
        makeDate(day, at),
        'Campus Life activity reminder',
        "Have you completed today's activity or photo?",
        'activity'
      );
      scheduled += 1;
    }

    if (config.checkoutWarningMinutes > 0) {
      await scheduleOne(
        Notifications,
        makeDate(day, warning),
        'Campus Life ends soon',
        `Campus Life ends in ${config.checkoutWarningMinutes} minutes.`,
        'checkout-warning'
      );
      scheduled += 1;
    }

    await scheduleOne(
      Notifications,
      makeDate(day, end),
      'Are you leaving campus?',
      "Before leaving, make sure you've checked out from Campus Life.",
      'checkout'
    );
    scheduled += 1;
  }

  return { scheduled, permissionDenied: false };
}
