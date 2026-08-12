import { z } from 'zod';

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a 24-hour time such as 09:15.');
export const updateScheduleSchema = z.object({
  startTime: timeSchema,
  endTime: timeSchema,
  photoIntervalMinutes: z.number().int().min(15).max(240),
  checkoutWarningMinutes: z.number().int().min(0).max(120),
  timezone: z.string().min(1).refine((value) => { try { Intl.DateTimeFormat(undefined, { timeZone: value }); return true; } catch { return false; } }, 'Use a valid IANA timezone.'),
  monday: z.boolean(), tuesday: z.boolean(), wednesday: z.boolean(), thursday: z.boolean(), friday: z.boolean(), saturday: z.boolean(), sunday: z.boolean(),
}).refine((value) => value.endTime > value.startTime, { message: 'End time must be after start time.', path: ['endTime'] }).refine((value) => value.checkoutWarningMinutes < ((Number(value.endTime.slice(0, 2)) * 60 + Number(value.endTime.slice(3))) - (Number(value.startTime.slice(0, 2)) * 60 + Number(value.startTime.slice(3)))), { message: 'Checkout warning must occur during the scheduled day.', path: ['checkoutWarningMinutes'] });
