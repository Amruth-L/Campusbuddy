import { MessageRole, ReminderStatus, SessionStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { getOrCreateTodaySession } from '../sessions/session.service.js';

export async function askAssistant(userId: string, question: string) {
  const text = question.trim();
  const lower = text.toLowerCase();

  const schedule = await prisma.userSchedule.findUnique({ where: { userId } });
  const todaySession = await getOrCreateTodaySession(userId);

  // Calculate week stats
  const now = new Date();
  const startOfWeek = new Date(now);
  const dayOfWeek = now.getDay();
  const diffToMon = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  startOfWeek.setDate(now.getDate() + diffToMon);
  startOfWeek.setHours(0, 0, 0, 0);

  const weekSessions = await prisma.dailySession.findMany({
    where: {
      userId,
      date: { gte: startOfWeek },
    },
  });

  const weekTotalMinutes = weekSessions.reduce((acc, s) => acc + (s.totalMinutes ?? 0), 0);
  const weekHours = Math.floor(weekTotalMinutes / 60);
  const weekMins = weekTotalMinutes % 60;
  const weekTimeString = weekHours > 0 ? `${weekHours}h ${weekMins}m` : `${weekMins}m`;

  let responseText = '';

  if (!schedule) {
    responseText = 'Please configure your Campus Life schedule first in the Schedule tab.';
  } else if (lower.includes('checkout') || lower.includes('check out')) {
    responseText = `Your scheduled checkout time is ${schedule.endTime}. You will receive a checkout warning ${schedule.checkoutWarningMinutes} minutes before scheduled checkout time.`;
  } else if (lower.includes('week') || lower.includes('hours')) {
    const completedCount = weekSessions.filter((s) => s.status === SessionStatus.COMPLETED).length;
    responseText = `You have accumulated ${weekTimeString} across ${completedCount} completed day(s) this week.`;
  } else if (lower.includes('yesterday')) {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const yesterdaySession = await prisma.dailySession.findFirst({
      where: {
        userId,
        date: yesterday,
      },
      include: { reminders: true },
    });

    if (!yesterdaySession) {
      responseText = 'No Campus Life session was recorded for yesterday.';
    } else {
      const isCompleted = yesterdaySession.status === SessionStatus.COMPLETED;
      const checkInDone = yesterdaySession.checkInCompletedAt ? 'completed' : 'missed';
      const checkoutDone = yesterdaySession.checkoutCompletedAt ? 'completed' : 'missed';
      responseText = `Yesterday's session was ${yesterdaySession.status.toLowerCase()} (${yesterdaySession.totalMinutes ?? 0} mins). Check-in was ${checkInDone} and checkout was ${checkoutDone}.`;
    }
  } else if (lower.includes('today') || lower.includes('status')) {
    if (!todaySession) {
      responseText = 'Today is not a scheduled Campus Life day based on your schedule settings.';
    } else {
      const completedReminders = todaySession.reminders.filter((r) => r.status === ReminderStatus.COMPLETED).length;
      const totalReminders = todaySession.reminders.length;
      responseText = `Today's session is currently ${todaySession.status.toLowerCase()}. You have completed ${completedReminders} of ${totalReminders} scheduled reminders. Scheduled hours: ${schedule.startTime} to ${schedule.endTime}.`;
    }
  } else if (lower.includes('now') || lower.includes('next') || lower.includes('do')) {
    if (!todaySession) {
      responseText = 'No Campus Life actions required today. Enjoy your day!';
    } else if (todaySession.status === SessionStatus.UPCOMING) {
      responseText = `Your Campus Life session starts at ${schedule.startTime}. Your first action will be to check in using the official Campus Life app.`;
    } else if (todaySession.status === SessionStatus.COMPLETED) {
      responseText = 'You have completed all required actions and checked out for today!';
    } else {
      const nextPending = todaySession.reminders.find(
        (r) => r.status === ReminderStatus.PENDING || r.status === ReminderStatus.UPCOMING
      );
      if (nextPending) {
        const timeStr = new Date(nextPending.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        responseText = `Your next action is "${nextPending.type.replace('_', ' ').toLowerCase()}" scheduled for ${timeStr}.`;
      } else {
        responseText = `Your session is ${todaySession.status.toLowerCase()}. Remember to complete your checkout at ${schedule.endTime}.`;
      }
    }
  } else {
    // Default overview
    if (todaySession) {
      const pendingCount = todaySession.reminders.filter(
        (r) => r.status === ReminderStatus.UPCOMING || r.status === ReminderStatus.PENDING
      ).length;
      responseText = `Your Campus Life schedule today is ${schedule.startTime} – ${schedule.endTime}. Current session status: ${todaySession.status.toLowerCase()} with ${pendingCount} pending reminder(s).`;
    } else {
      responseText = `You have completed ${weekTimeString} of Campus Life activities this week. Next scheduled day starts at ${schedule.startTime}.`;
    }
  }

  // Save to DB
  await prisma.assistantMessage.createMany({
    data: [
      { userId, role: MessageRole.USER, message: text },
      { userId, role: MessageRole.ASSISTANT, message: responseText },
    ],
  });

  return responseText;
}

export async function getAssistantHistory(userId: string) {
  return prisma.assistantMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });
}
