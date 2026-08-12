import type { JwtPayload } from '../modules/auth/auth.service.js';

declare global {
  namespace Express {
    interface Request { auth?: JwtPayload; }
  }
}
export {};
