import type { ISOTime } from './types';

export type TimeStep = '1h' | '6h' | '1d' | '1w' | '1mo';

export const TIME_STEPS: { id: TimeStep; label: string }[] = [
  { id: '1h', label: '1 hour' },
  { id: '6h', label: '6 hours' },
  { id: '1d', label: '1 day' },
  { id: '1w', label: '1 week' },
  { id: '1mo', label: '1 month' }
];

const HOUR = 3_600_000;
const STEP_HOURS: Record<Exclude<TimeStep, '1mo'>, number> = { '1h': 1, '6h': 6, '1d': 24, '1w': 168 };

/** End time of a turn of the given length. Months are calendar months (UTC). */
export function addStep(time: ISOTime, step: TimeStep): ISOTime {
  const d = new Date(time);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid time: ${time}`);
  if (step === '1mo') {
    const day = d.getUTCDate();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + 1);
    // Clamp to the last day of the target month (e.g. 31 Jan → 28/29 Feb).
    const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(day, last));
    return d.toISOString();
  }
  return new Date(d.getTime() + STEP_HOURS[step] * HOUR).toISOString();
}

/**
 * Splits [from, to) into slices of at most `sliceHours`, so long turns are
 * processed chronologically and causes always precede effects.
 */
export function slices(from: ISOTime, to: ISOTime, sliceHours = 1): { start: ISOTime; end: ISOTime }[] {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  if (!(b > a)) return [];
  const size = sliceHours * HOUR;
  const out: { start: ISOTime; end: ISOTime }[] = [];
  for (let t = a; t < b; t += size) {
    out.push({ start: new Date(t).toISOString(), end: new Date(Math.min(t + size, b)).toISOString() });
  }
  return out;
}

export function hoursBetween(from: ISOTime, to: ISOTime): number {
  return (new Date(to).getTime() - new Date(from).getTime()) / HOUR;
}

/** Display time in South Florida local time. */
export function formatLocal(time: ISOTime, withWeekday = true): string {
  const d = new Date(time);
  const date = d.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    weekday: withWeekday ? 'short' : undefined,
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const clock = d.toLocaleTimeString('en-GB', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit' });
  return `${date} · ${clock}`;
}
