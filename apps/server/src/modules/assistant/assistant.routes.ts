import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/authenticate.js';
import { askAssistant, getAssistantHistory } from './assistant.service.js';

const askSchema = z.object({
  question: z.string().min(1).max(500),
});

export const assistantRouter = Router();
assistantRouter.use(authenticate);

assistantRouter.get('/history', async (request, response) => {
  const messages = await getAssistantHistory(request.auth!.sub);
  return response.json({ messages });
});

assistantRouter.post('/ask', async (request, response) => {
  const { question } = askSchema.parse(request.body);
  const answer = await askAssistant(request.auth!.sub, question);
  const messages = await getAssistantHistory(request.auth!.sub);
  return response.json({ answer, messages });
});
