import { Router } from 'express';
import { SessionStatus } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate.js';
import { prisma } from '../../lib/prisma.js';

export const statsRouter = Router();
statsRouter.use(authenticate);

statsRouter.get('/', async (request, response) => {
  const userId = request.auth!.sub;
  const filter = String(request.query.filter ?? 'all').toLowerCase();

  const now = new Date();
  let startDate: Date | undefined;

  if (filter === 'today') {
    startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
  } else if (filter === 'week') {
    startDate = new Date(now);
    const day = now.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    startDate.setDate(now.getDate() + diff);
    startDate.setHours(0, 0, 0, 0);
  } else if (filter === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const whereClause = {
    userId,
    ...(startDate ? { date: { gte: startDate } } : {}),
  };

  const sessions = await prisma.dailySession.findMany({
    where: whereClause,
    include: {
      reminders: {
        include: {
          confirmation: {
            include: {
              photo: true,
            },
          },
        },
        orderBy: { scheduledAt: 'asc' },
      },
    },
    orderBy: { date: 'desc' },
    take: 100,
  });

  const totalMinutes = sessions.reduce((acc, s) => acc + (s.totalMinutes ?? 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const totalHoursString = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const completedDays = sessions.filter((s) => s.status === SessionStatus.COMPLETED).length;
  const checkedOutDays = sessions.filter((s) => s.checkoutCompletedAt !== null).length;
  const checkoutRate = sessions.length > 0 ? Math.round((checkedOutDays / sessions.length) * 100) : 0;

  return response.json({
    stats: {
      totalHours: totalHoursString,
      totalMinutes,
      completedDays,
      checkoutRate: `${checkoutRate}%`,
      totalSessions: sessions.length,
    },
    sessions,
  });
});
