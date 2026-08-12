import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';

export type JwtPayload = { sub: string; email: string };
const tokenExpiry = '30d';

export const createToken = (user: { id: string; email: string }) => jwt.sign({ email: user.email }, env.JWT_SECRET, { subject: user.id, expiresIn: tokenExpiry });
export const verifyToken = (token: string) => {
  const payload = jwt.verify(token, env.JWT_SECRET);
  if (typeof payload === 'string' || !payload.sub || !payload.email) throw new Error('Malformed token');
  return { sub: payload.sub, email: payload.email };
};
export const safeUser = (user: { id: string; name: string; email: string; createdAt: Date }) => ({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt });
export async function register(input: { name: string; email: string; password: string }) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({ data: { name: input.name, email: input.email, passwordHash, schedule: { create: { startTime: '09:15', endTime: '16:45', photoIntervalMinutes: 60, checkoutWarningMinutes: 15, timezone: 'Asia/Kolkata' } } } });
  return { user: safeUser(user), token: createToken(user) };
}
export async function login(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) return null;
  return { user: safeUser(user), token: createToken(user) };
}
