import { CheckInStatus, CheckoutStatus, ReminderStatus, ReminderType, SessionStatus, type DailySession, type UserSchedule } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { dateKeyAsUtc, localDate, localDateTimeToUtc, minutesToTime, timeToMinutes } from '../../utils/date-time.js';

const selectedDay: Record<string, keyof Pick<UserSchedule, 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'>> = { Mon: 'monday', Tue: 'tuesday', Wed: 'wednesday', Thu: 'thursday', Fri: 'friday', Sat: 'saturday', Sun: 'sunday' };
export function isCollegeDay(schedule: UserSchedule, now = new Date()) { return Boolean(schedule[selectedDay[localDate(now, schedule.timezone).weekday]]); }
function reminderInputs(sessionId: string, userId: string, date: string, schedule: UserSchedule) {
  const start = timeToMinutes(schedule.startTime); const end = timeToMinutes(schedule.endTime); const warning = end - schedule.checkoutWarningMinutes;
  const items: Array<{ type: ReminderType; scheduledAt: Date }> = [{ type: ReminderType.CHECK_IN, scheduledAt: localDateTimeToUtc(date, schedule.startTime, schedule.timezone) }];
  for (let minute = start + schedule.photoIntervalMinutes; minute < warning; minute += schedule.photoIntervalMinutes) items.push({ type: ReminderType.ACTIVITY, scheduledAt: localDateTimeToUtc(date, minutesToTime(minute), schedule.timezone) });
  if (schedule.checkoutWarningMinutes > 0) items.push({ type: ReminderType.CHECKOUT_WARNING, scheduledAt: localDateTimeToUtc(date, minutesToTime(warning), schedule.timezone) });
  items.push({ type: ReminderType.CHECKOUT, scheduledAt: localDateTimeToUtc(date, schedule.endTime, schedule.timezone) });
  return items.map((item) => ({ ...item, sessionId, userId }));
}
export async function getOrCreateTodaySession(userId: string, now = new Date()) {
  const schedule = await prisma.userSchedule.findUniqueOrThrow({ where: { userId } });
  if (!isCollegeDay(schedule, now)) return null;
  const { date } = localDate(now, schedule.timezone); const key = dateKeyAsUtc(date);
  const existing = await prisma.dailySession.findUnique({ where: { userId_date: { userId, date: key } }, include: { reminders: { orderBy: { scheduledAt: 'asc' } } } });
  if (existing) return existing;
  const session = await prisma.dailySession.create({ data: { userId, date: key, scheduledStart: schedule.startTime, scheduledEnd: schedule.endTime, status: SessionStatus.UPCOMING } });
  await prisma.reminder.createMany({ data: reminderInputs(session.id, userId, date, schedule) });
  return prisma.dailySession.findUniqueOrThrow({ where: { id: session.id }, include: { reminders: { orderBy: { scheduledAt: 'asc' } } } });
}
export async function refreshSessionStatus(session: DailySession) {
  const now = new Date(); const allReminders = await prisma.reminder.findMany({ where: { sessionId: session.id } });
  const passed = allReminders.filter((item) => item.scheduledAt <= now && (item.status === ReminderStatus.UPCOMING || item.status === ReminderStatus.PENDING));
  if (passed.length) await prisma.reminder.updateMany({ where: { id: { in: passed.map((item) => item.id) } }, data: { status: ReminderStatus.MISSED } });
  const current = await prisma.dailySession.findUniqueOrThrow({ where: { id: session.id } });
  const checkoutReminder = allReminders.find((item) => item.type === ReminderType.CHECKOUT);
  const ended = checkoutReminder ? checkoutReminder.scheduledAt <= now : false;
  const status = current.checkoutStatus === CheckoutStatus.COMPLETED && current.checkInStatus === CheckInStatus.COMPLETED ? SessionStatus.COMPLETED : ended ? SessionStatus.PARTIALLY_COMPLETED : SessionStatus.ACTIVE;
  return prisma.dailySession.update({ where: { id: session.id }, data: { status }, include: { reminders: { orderBy: { scheduledAt: 'asc' } } } });
}
