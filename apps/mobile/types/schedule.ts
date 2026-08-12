export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type Schedule = {
  startTime: string; endTime: string; photoIntervalMinutes: number; checkoutWarningMinutes: number; timezone: string;
} & Record<DayKey, boolean>;

export const defaultSchedule: Schedule = { startTime: '09:15', endTime: '16:45', photoIntervalMinutes: 60, checkoutWarningMinutes: 15, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata', monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false };
