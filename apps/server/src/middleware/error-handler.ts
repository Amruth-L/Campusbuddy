import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  void _next;
  if (error instanceof ZodError) return response.status(400).json({ message: 'Please check your input.', errors: error.flatten() });
  if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') return response.status(409).json({ message: 'An account with this email already exists.' });
  console.error('Unhandled API error', error);
  return response.status(500).json({ message: 'Something went wrong. Please try again.' });
}
