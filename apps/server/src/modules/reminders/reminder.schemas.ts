import { z } from 'zod';
export const snoozeSchema = z.object({ minutes: z.union([z.literal(15), z.literal(30), z.literal(60)]) });
