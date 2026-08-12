import { Router } from 'express';
import { ActivityStatus, ReminderStatus, ReminderType } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate.js';
import { prisma } from '../../lib/prisma.js';
import { getOrCreateTodaySession, refreshSessionStatus } from '../sessions/session.service.js';
import { snoozeSchema } from './reminder.schemas.js';

export const reminderRouter = Router();
reminderRouter.use(authenticate);
reminderRouter.get('/today', async (request, response) => { const session = await getOrCreateTodaySession(request.auth!.sub); return response.json({ reminders: session ? (await refreshSessionStatus(session)).reminders : [] }); });
reminderRouter.post('/:id/complete', async (request, response) => { const reminder = await prisma.reminder.findFirstOrThrow({ where: { id: request.params.id, userId: request.auth!.sub } }); const completedAt = new Date(); const updated = await prisma.$transaction(async (tx) => { const result = await tx.reminder.update({ where: { id: reminder.id }, data: { status: ReminderStatus.COMPLETED, completedAt } }); if (reminder.type === ReminderType.ACTIVITY) await tx.activityConfirmation.upsert({ where: { reminderId: reminder.id }, create: { reminderId: reminder.id, sessionId: reminder.sessionId, userId: reminder.userId, completedAt, status: ActivityStatus.COMPLETED }, update: { completedAt, status: ActivityStatus.COMPLETED } }); return result; }); return response.json({ reminder: updated }); });
reminderRouter.post('/:id/photo', async (request, response) => {
  const { imageUrl } = request.body as { imageUrl?: string };
  if (!imageUrl) return response.status(400).json({ message: 'imageUrl is required' });
  const reminder = await prisma.reminder.findFirstOrThrow({ where: { id: request.params.id, userId: request.auth!.sub } });
  const completedAt = new Date();
  const result = await prisma.$transaction(async (tx) => {
    const updatedReminder = await tx.reminder.update({ where: { id: reminder.id }, data: { status: ReminderStatus.COMPLETED, completedAt } });
    const confirmation = await tx.activityConfirmation.upsert({
      where: { reminderId: reminder.id },
      create: { reminderId: reminder.id, sessionId: reminder.sessionId, userId: reminder.userId, completedAt, status: ActivityStatus.COMPLETED },
      update: { completedAt, status: ActivityStatus.COMPLETED },
    });
    const photo = await tx.activityPhoto.upsert({
      where: { activityConfirmationId: confirmation.id },
      create: { activityConfirmationId: confirmation.id, userId: reminder.userId, imageUrl },
      update: { imageUrl },
    });
    return { reminder: updatedReminder, confirmation, photo };
  });
  return response.json(result);
});
reminderRouter.post('/:id/snooze', async (request, response) => { const { minutes } = snoozeSchema.parse(request.body); const reminder = await prisma.reminder.findFirstOrThrow({ where: { id: request.params.id, userId: request.auth!.sub } }); const snoozedUntil = new Date(Date.now() + minutes * 60_000); const updated = await prisma.reminder.update({ where: { id: reminder.id }, data: { status: ReminderStatus.SNOOZED, snoozedUntil } }); return response.json({ reminder: updated, message: `I'll remind you again in ${minutes} minutes.` }); });

