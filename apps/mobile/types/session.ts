export type SessionStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'MISSED';
export type CheckInStatus = 'PENDING' | 'COMPLETED';
export type CheckoutStatus = 'PENDING' | 'COMPLETED';
export type ReminderType = 'CHECK_IN' | 'ACTIVITY' | 'CHECKOUT_WARNING' | 'CHECKOUT' | 'STAYING';
export type ReminderStatus = 'UPCOMING' | 'PENDING' | 'COMPLETED' | 'SKIPPED' | 'MISSED' | 'SNOOZED';

export interface ActivityPhoto {
  id: string;
  activityConfirmationId: string;
  userId: string;
  imageUrl: string;
  createdAt: string;
}

export interface ActivityConfirmation {
  id: string;
  reminderId: string;
  sessionId: string;
  userId: string;
  completedAt: string;
  status: string;
  photo?: ActivityPhoto | null;
}

export interface Reminder {
  id: string;
  sessionId: string;
  userId: string;
  type: ReminderType;
  scheduledAt: string;
  status: ReminderStatus;
  completedAt?: string | null;
  snoozedUntil?: string | null;
  confirmation?: ActivityConfirmation | null;
}

export interface DailySession {
  id: string;
  userId: string;
  date: string;
  scheduledStart: string;
  scheduledEnd: string;
  checkInStatus: CheckInStatus;
  checkInCompletedAt?: string | null;
  checkoutStatus: CheckoutStatus;
  checkoutCompletedAt?: string | null;
  totalMinutes?: number | null;
  status: SessionStatus;
  reminders: Reminder[];
}

export interface HistoryStats {
  totalHours: string;
  totalMinutes: number;
  completedDays: number;
  checkoutRate: string;
  totalSessions: number;
}
