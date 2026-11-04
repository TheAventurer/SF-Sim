import type { Faction, Location, Scenario, WorldState } from './types';

const EPS = 1e-6;

/** Checks a scenario for structural problems. Returns a list of human-readable errors (empty = valid). */
export function validateScenario(s: Scenario): string[] {
  const errors: string[] = [];
  if (s.format !== 'sf-sim-scenario') errors.push(`format must be "sf-sim-scenario", got "${String(s.format)}"`);
  if (s.version !== 1) errors.push(`unsupported scenario version ${String(s.version)}`);
  if (Number.isNaN(new Date(s.start).getTime())) errors.push(`start is not a valid time: ${s.start}`);
  if (!Number.isInteger(s.seed)) errors.push('seed must be an integer');

  const factionIds = new Set<string>();
  for (const f of s.factions) {
    if (factionIds.has(f.id)) errors.push(`duplicate faction id ${f.id}`);
    factionIds.add(f.id);
  }
  for (const f of s.factions) {
    for (const [k, v] of Object.entries(f.stats)) {
      if (!(v >= 0 && v <= 100)) errors.push(`faction ${f.id}: stat ${k} out of range 0–100 (${v})`);
    }
    for (const [other, v] of Object.entries(f.relations)) {
      if (!factionIds.has(other)) errors.push(`faction ${f.id}: relation to unknown faction ${other}`);
      if (!(v >= -100 && v <= 100)) errors.push(`faction ${f.id}: relation to ${other} out of range (${v})`);
    }
  }

  const locIds = new Set<string>();
  for (const l of s.locations) {
    if (locIds.has(l.id)) errors.push(`duplicate location id ${l.id}`);
    locIds.add(l.id);
  }
  for (const l of s.locations) {
    if (l.parentId !== null && !locIds.has(l.parentId)) errors.push(`location ${l.id}: unknown parent ${l.parentId}`);
    let total = 0;
    for (const [fid, share] of Object.entries(l.control)) {
      if (!factionIds.has(fid)) errors.push(`location ${l.id}: control by unknown faction ${fid}`);
      if (!(share >= 0 && share <= 1)) errors.push(`location ${l.id}: control share for ${fid} out of range (${share})`);
      total += share;
    }
    if (total > 1 + EPS) errors.push(`location ${l.id}: control shares sum to ${total.toFixed(3)} (> 1)`);
  }
  // Detect cycles in the location hierarchy.
  const parent = new Map(s.locations.map((l) => [l.id, l.parentId] as const));
  for (const l of s.locations) {
    const seen = new Set<string>();
    let cur: string | null = l.id;
    while (cur !== null && parent.has(cur)) {
      if (seen.has(cur)) {
        errors.push(`location ${l.id}: parent chain has a cycle`);
        break;
      }
      seen.add(cur);
      cur = parent.get(cur) ?? null;
    }
  }

  for (const e of s.events) {
    if (!locIds.has(e.locationId)) errors.push(`event ${e.id}: unknown location ${e.locationId}`);
    for (const p of e.participants) if (!factionIds.has(p)) errors.push(`event ${e.id}: unknown participant ${p}`);
  }
  return errors;
}

/** Builds a fresh world from a scenario. Throws if the scenario is invalid. */
export function createWorld(s: Scenario): WorldState {
  const errors = validateScenario(s);
  if (errors.length) throw new Error(`Invalid scenario "${s.id}":\n- ${errors.join('\n- ')}`);
  const clone = structuredClone(s);
  const factions: Record<string, Faction> = {};
  for (const f of clone.factions) factions[f.id] = f;
  const locations: Record<string, Location> = {};
  for (const l of clone.locations) locations[l.id] = l;
  return {
    version: 1,
    scenarioId: clone.id,
    scenarioName: clone.name,
    seed: clone.seed,
    rngState: clone.seed >>> 0,
    time: new Date(clone.start).toISOString(),
    turn: 0,
    nextEventNo: clone.events.length + 1,
    geography: clone.geography,
    factions,
    locations,
    events: clone.events,
    turns: [],
    interventions: []
  };
}

/** The faction holding the largest share of a location, if any. */
export function dominantController(l: Location): { id: string; share: number } | null {
  let best: { id: string; share: number } | null = null;
  for (const [id, share] of Object.entries(l.control)) {
    if (share > 0 && (!best || share > best.share)) best = { id, share };
  }
  return best;
}

/** True when the top two controllers are within `margin` of each other. */
export function isContested(l: Location, margin = 0.15): boolean {
  const shares = Object.values(l.control).filter((v) => v > 0).sort((a, b) => b - a);
  return shares.length >= 2 && shares[0] - shares[1] <= margin;
}
