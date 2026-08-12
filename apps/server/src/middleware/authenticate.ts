import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../modules/auth/auth.service.js';

export function authenticate(request: Request, response: Response, next: NextFunction) {
  const token = request.header('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return response.status(401).json({ message: 'Authentication is required.' });
  try { request.auth = verifyToken(token); return next(); }
  catch { return response.status(401).json({ message: 'Your session is invalid or expired.' }); }
}
