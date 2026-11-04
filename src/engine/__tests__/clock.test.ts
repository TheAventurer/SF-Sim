import { describe, expect, it } from 'vitest';
import { addStep, hoursBetween, slices } from '../clock';

const T0 = '2031-03-03T05:00:00.000Z';

describe('clock', () => {
  it('adds fixed steps', () => {
    expect(addStep(T0, '1h')).toBe('2031-03-03T06:00:00.000Z');
    expect(addStep(T0, '6h')).toBe('2031-03-03T11:00:00.000Z');
    expect(addStep(T0, '1d')).toBe('2031-03-04T05:00:00.000Z');
    expect(addStep(T0, '1w')).toBe('2031-03-10T05:00:00.000Z');
  });

  it('adds calendar months and clamps short months', () => {
    expect(addStep(T0, '1mo')).toBe('2031-04-03T05:00:00.000Z');
    expect(addStep('2031-01-31T12:00:00.000Z', '1mo')).toBe('2031-02-28T12:00:00.000Z');
  });

  it('splits a turn into hourly slices', () => {
    const s = slices(T0, addStep(T0, '1d'));
    expect(s).toHaveLength(24);
    expect(s[0].start).toBe(T0);
    expect(s[23].end).toBe('2031-03-04T05:00:00.000Z');
    expect(hoursBetween(T0, addStep(T0, '1mo'))).toBe(31 * 24);
  });

  it('rejects invalid times', () => {
    expect(() => addStep('not a date', '1h')).toThrow();
  });
});
