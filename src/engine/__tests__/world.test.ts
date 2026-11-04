import { describe, expect, it } from 'vitest';
import { SCENARIOS } from '../../data/scenarios';
import { createWorld, validateScenario } from '../scenario';
import { advanceTurn, type System } from '../world';
import type { Scenario } from '../types';

const scenario = SCENARIOS[0];

describe('scenario', () => {
  it('bundled scenario is valid', () => {
    expect(validateScenario(scenario)).toEqual([]);
  });

  it('catches broken references and over-full control', () => {
    const bad = structuredClone(scenario) as Scenario;
    bad.locations[6].control = { FRA: 0.8, SPC: 0.5 };
    bad.locations[7].parentId = 'nowhere';
    bad.factions[0].relations.XYZ = 10;
    const errors = validateScenario(bad);
    expect(errors.some((e) => e.includes('sum to'))).toBe(true);
    expect(errors.some((e) => e.includes('unknown parent'))).toBe(true);
    expect(errors.some((e) => e.includes('unknown faction XYZ'))).toBe(true);
    expect(() => createWorld(bad)).toThrow(/Invalid scenario/);
  });

  it('creates a world at the scenario start', () => {
    const w = createWorld(scenario);
    expect(w.time).toBe(scenario.start);
    expect(w.turn).toBe(0);
    expect(Object.keys(w.factions)).toHaveLength(scenario.factions.length);
  });
});

describe('advanceTurn', () => {
  it('is deterministic for the same world and step', () => {
    const w = createWorld(scenario);
    const a = advanceTurn(advanceTurn(w, '1w'), '1d');
    const b = advanceTurn(advanceTurn(w, '1w'), '1d');
    expect(a).toEqual(b);
  });

  it('does not mutate its input', () => {
    const w = createWorld(scenario);
    const before = JSON.stringify(w);
    advanceTurn(w, '1mo');
    expect(JSON.stringify(w)).toBe(before);
  });

  it('records the turn and moves the clock', () => {
    const w = advanceTurn(createWorld(scenario), '6h');
    expect(w.turn).toBe(1);
    expect(w.time).toBe('2031-03-03T11:00:00.000Z');
    expect(w.turns[0]).toMatchObject({ turn: 1, slices: 6 });
  });

  it('runs systems once per hourly slice and gives emitted events stable ids', () => {
    let calls = 0;
    const probe: System = {
      id: 'probe',
      run(ctx) {
        calls++;
        if (calls === 3) ctx.emit({ locationId: 'homestead', participants: ['SPC'], severity: 'notable', category: 'political', headline: 'Test', body: '' });
      }
    };
    const w = advanceTurn(createWorld(scenario), '6h', [probe]);
    expect(calls).toBe(6);
    const ev = w.events[w.events.length - 1];
    expect(ev.id).toBe('E-0002');
    expect(ev.time).toBe('2031-03-03T08:00:00.000Z');
    expect(w.turns[0].eventIds).toEqual(['E-0002']);
  });

  it('one month in one turn equals the same month in daily turns', () => {
    const w = createWorld(scenario);
    const monthly = advanceTurn(w, '1mo');
    let daily = w;
    for (let i = 0; i < 31; i++) daily = advanceTurn(daily, '1d');
    expect(daily.time).toBe(monthly.time);
    expect(daily.factions).toEqual(monthly.factions);
    expect(daily.rngState).toBe(monthly.rngState);
  });
});
