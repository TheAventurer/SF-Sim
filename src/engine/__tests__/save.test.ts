import { describe, expect, it } from 'vitest';
import { SCENARIOS } from '../../data/scenarios';
import { createWorld } from '../scenario';
import { advanceTurn } from '../world';
import { deserializeWorld, serializeWorld } from '../save';

describe('save / load', () => {
  it('round-trips a world exactly', () => {
    const w = advanceTurn(createWorld(SCENARIOS[0]), '1w');
    const loaded = deserializeWorld(serializeWorld(w, 'test')).world;
    expect(loaded).toEqual(w);
  });

  it('a loaded save continues identically', () => {
    const w = advanceTurn(createWorld(SCENARIOS[0]), '1d');
    const loaded = deserializeWorld(serializeWorld(w)).world;
    expect(advanceTurn(loaded, '1w')).toEqual(advanceTurn(w, '1w'));
  });

  it('rejects files that are not saves', () => {
    expect(() => deserializeWorld('nope')).toThrow(/not valid JSON/);
    expect(() => deserializeWorld('{"format":"other"}')).toThrow(/Not an SF-Sim save/);
    expect(() => deserializeWorld('{"format":"sf-sim-save","version":99}')).toThrow(/Unsupported save version/);
    expect(() => deserializeWorld('{"format":"sf-sim-save","version":1,"world":{}}')).toThrow(/missing world data/);
  });
});
