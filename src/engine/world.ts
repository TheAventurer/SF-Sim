import { addStep, slices, type TimeStep } from './clock';
import { Rng } from './rng';
import type { EventCategory, FactionId, ISOTime, LocationId, Severity, StateChange, TurnRecord, WorldEvent, WorldState } from './types';

/** What a system sees while one time slice is processed. It may mutate `world` (a private draft). */
export interface SliceContext {
  world: WorldState;
  rng: Rng;
  start: ISOTime;
  end: ISOTime;
  emit(e: {
    locationId: LocationId;
    participants: FactionId[];
    severity: Severity;
    category: EventCategory;
    headline: string;
    body: string;
    causes?: string[];
    changes?: StateChange[];
  }): WorldEvent;
}

/**
 * A simulation system runs once per slice, in a fixed order. Later milestones add
 * logistics, faction intentions, conflict resolution, diplomacy and more.
 */
export interface System {
  id: string;
  run(ctx: SliceContext): void;
}

/** Local midnight in South Florida (EST, UTC−5; DST ignored for now). */
const isLocalMidnight = (t: ISOTime) => {
  const d = new Date(t);
  return d.getUTCHours() === 5 && d.getUTCMinutes() === 0;
};

/** Placeholder baseline: every day, each faction burns a little supply. */
export const dailySupplyDrain: System = {
  id: 'daily-supply-drain',
  run(ctx) {
    if (!isLocalMidnight(ctx.end)) return;
    for (const f of Object.values(ctx.world.factions)) {
      const drain = Math.round(ctx.rng.range(0, 1.5) * 10) / 10;
      f.stats.supply = Math.max(0, Math.round((f.stats.supply - drain) * 10) / 10);
    }
  }
};

export const DEFAULT_SYSTEMS: System[] = [dailySupplyDrain];

/**
 * Advances the world by one turn. Pure: returns a new world and leaves the input untouched.
 * The same world + step + systems always produces the same result.
 */
export function advanceTurn(world: WorldState, step: TimeStep, systems: System[] = DEFAULT_SYSTEMS): WorldState {
  const draft = structuredClone(world);
  const rng = new Rng(draft.rngState);
  const from = draft.time;
  const to = addStep(from, step);
  const emitted: string[] = [];
  const parts = slices(from, to, 1);

  for (const slice of parts) {
    const ctx: SliceContext = {
      world: draft,
      rng,
      start: slice.start,
      end: slice.end,
      emit(e) {
        const ev: WorldEvent = {
          id: `E-${String(draft.nextEventNo++).padStart(4, '0')}`,
          time: slice.end,
          causes: [],
          changes: [],
          ...e
        };
        draft.events.push(ev);
        emitted.push(ev.id);
        return ev;
      }
    };
    for (const sys of systems) sys.run(ctx);
    draft.time = slice.end;
  }

  draft.turn += 1;
  draft.rngState = rng.value;
  const record: TurnRecord = { turn: draft.turn, from, to, slices: parts.length, eventIds: emitted };
  draft.turns.push(record);
  return draft;
}
