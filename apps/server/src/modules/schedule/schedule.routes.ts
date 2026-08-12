import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { prisma } from '../../lib/prisma.js';
import { updateScheduleSchema } from './schedule.schemas.js';

export const scheduleRouter = Router();
scheduleRouter.use(authenticate);
scheduleRouter.get('/', async (request, response) => { const schedule = await prisma.userSchedule.findUnique({ where: { userId: request.auth!.sub } }); return response.json({ schedule }); });
scheduleRouter.put('/', async (request, response) => { const input = updateScheduleSchema.parse(request.body); const schedule = await prisma.userSchedule.upsert({ where: { userId: request.auth!.sub }, create: { userId: request.auth!.sub, ...input }, update: input }); return response.json({ schedule }); });
