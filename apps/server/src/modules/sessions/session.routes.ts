import { Router } from 'express';
import { CheckInStatus, CheckoutStatus, SessionStatus } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate.js';
import { prisma } from '../../lib/prisma.js';
import { getOrCreateTodaySession, refreshSessionStatus } from './session.service.js';

export const sessionRouter = Router();
sessionRouter.use(authenticate);
sessionRouter.get('/today', async (request, response) => { const session = await getOrCreateTodaySession(request.auth!.sub); return response.json({ session: session ? await refreshSessionStatus(session) : null }); });
sessionRouter.get('/', async (request, response) => { const sessions = await prisma.dailySession.findMany({ where: { userId: request.auth!.sub }, include: { reminders: { orderBy: { scheduledAt: 'asc' } } }, orderBy: { date: 'desc' }, take: 90 }); return response.json({ sessions }); });
sessionRouter.post('/:id/check-in', async (request, response) => { const session = await prisma.dailySession.findFirstOrThrow({ where: { id: request.params.id, userId: request.auth!.sub } }); const updated = await prisma.dailySession.update({ where: { id: session.id }, data: { checkInStatus: CheckInStatus.COMPLETED, checkInCompletedAt: new Date(), status: SessionStatus.ACTIVE } }); return response.json({ session: updated }); });
sessionRouter.post('/:id/checkout', async (request, response) => { const session = await prisma.dailySession.findFirstOrThrow({ where: { id: request.params.id, userId: request.auth!.sub } }); const now = new Date(); const totalMinutes = session.checkInCompletedAt ? Math.max(0, Math.round((now.getTime() - session.checkInCompletedAt.getTime()) / 60000)) : null; const status = session.checkInStatus === CheckInStatus.COMPLETED ? SessionStatus.COMPLETED : SessionStatus.PARTIALLY_COMPLETED; const updated = await prisma.dailySession.update({ where: { id: session.id }, data: { checkoutStatus: CheckoutStatus.COMPLETED, checkoutCompletedAt: now, totalMinutes, status } }); return response.json({ session: updated }); });
