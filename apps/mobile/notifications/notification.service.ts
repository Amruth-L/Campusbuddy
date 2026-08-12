import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';
import type { Schedule } from '@/types/schedule';

const notificationPrefix = 'campuslife:';
Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });
export async function notificationPermission() { return Notifications.getPermissionsAsync(); }
export async function requestNotificationPermission() { const current = await Notifications.getPermissionsAsync(); return current.granted ? current : Notifications.requestPermissionsAsync(); }
export async function openNotificationSettings() { return Linking.openSettings(); }
export async function cancelCampusLifeNotifications() { const scheduled = await Notifications.getAllScheduledNotificationsAsync(); await Promise.all(scheduled.filter((item) => String(item.content.data?.kind ?? '').startsWith(notificationPrefix)).map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier))); }
function weekdayFor(date: Date) { return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()] as keyof Schedule; }
function makeDate(day: Date, minutes: number) { const result = new Date(day); result.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0); return result; }
function minutes(time: string) { const [hour, minute] = time.split(':').map(Number); return hour * 60 + minute; }
async function schedule(date: Date, title: string, body: string, kind: string) { if (date <= new Date()) return; await Notifications.scheduleNotificationAsync({ content: { title, body, sound: 'default', data: { kind: `${notificationPrefix}${kind}` } }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date } }); }
export async function rescheduleCampusLifeNotifications(config: Schedule) {
  await cancelCampusLifeNotifications(); const permission = await notificationPermission(); if (!permission.granted) return { scheduled: 0, permissionDenied: true };
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('campuslife-reminders', { name: 'Campus Life reminders', importance: Notifications.AndroidImportance.HIGH, sound: 'default' });
  const today = new Date(); let scheduled = 0; const start = minutes(config.startTime); const end = minutes(config.endTime); const warning = end - config.checkoutWarningMinutes;
  for (let offset = 0; offset < 14; offset += 1) { const day = new Date(today); day.setDate(today.getDate() + offset); if (!config[weekdayFor(day)]) continue;
    await schedule(makeDate(day, start), 'Campus Life starts now', "Don't forget to check in using the official Campus Life app.", 'check-in'); scheduled += 1;
    for (let at = start + config.photoIntervalMinutes; at < warning; at += config.photoIntervalMinutes) { await schedule(makeDate(day, at), 'Campus Life activity reminder', "Have you completed today's activity or photo?", 'activity'); scheduled += 1; }
    if (config.checkoutWarningMinutes > 0) { await schedule(makeDate(day, warning), 'Campus Life ends soon', `Campus Life ends in ${config.checkoutWarningMinutes} minutes.`, 'checkout-warning'); scheduled += 1; }
    await schedule(makeDate(day, end), 'Are you leaving campus?', "Before leaving, make sure you've checked out from Campus Life.", 'checkout'); scheduled += 1;
  }
  return { scheduled, permissionDenied: false };
}
