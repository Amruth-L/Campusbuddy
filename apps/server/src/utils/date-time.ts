const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

function formatter(timezone: string) {
  const existing = dateFormatterCache.get(timezone);
  if (existing) return existing;
  const created = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  dateFormatterCache.set(timezone, created);
  return created;
}

export type LocalDate = { date: string; weekday: string };
export function localDate(date: Date, timezone: string): LocalDate {
  const parts = Object.fromEntries(formatter(timezone).formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, weekday: parts.weekday };
}

export function localDateTimeToUtc(date: string, time: string, timezone: string) {
  const [year, month, day] = date.split('-').map(Number); const [hour, minute] = time.split(':').map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let candidate = new Date(target);
  for (let i = 0; i < 2; i += 1) {
    const parts = Object.fromEntries(formatter(timezone).formatToParts(candidate).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
    const displayed = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
    candidate = new Date(candidate.getTime() + target - displayed);
  }
  return candidate;
}

export const timeToMinutes = (time: string) => { const [hour, minute] = time.split(':').map(Number); return hour * 60 + minute; };
export const minutesToTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
export const dateKeyAsUtc = (date: string) => new Date(`${date}T00:00:00.000Z`);
