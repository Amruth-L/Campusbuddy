import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { prisma } from '../../lib/prisma.js';
import { loginSchema, registerSchema } from './auth.schemas.js';
import * as auth from './auth.service.js';

export const authRouter = Router();
authRouter.post('/register', async (request, response) => response.status(201).json(await auth.register(registerSchema.parse(request.body))));
authRouter.post('/login', async (request, response) => { const result = await auth.login(loginSchema.parse(request.body)); return result ? response.json(result) : response.status(401).json({ message: 'Incorrect email or password.' }); });
authRouter.get('/me', authenticate, async (request, response) => { const user = await prisma.user.findUniqueOrThrow({ where: { id: request.auth!.sub } }); return response.json({ user: auth.safeUser(user) }); });
authRouter.post('/logout', authenticate, (_request, response) => response.status(204).send());
