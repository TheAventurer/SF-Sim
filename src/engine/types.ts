/**
 * Core data model. The simulation state is the single source of truth:
 * AI may propose decisions and write narrative, but only validated changes
 * to these structures are ever saved.
 */

/** ISO-8601 timestamp in UTC, e.g. "2031-03-03T05:00:00.000Z". */
export type ISOTime = string;
export type FactionId = string;
export type LocationId = string;
export type EventId = string;

/** [longitude, latitude] in degrees (WGS84). */
export type LonLat = [number, number];

export type FlagStyle = 'bands' | 'hoist' | 'diag' | 'cross' | 'chevron' | 'ring';

export interface FlagSpec {
  style: FlagStyle;
  /** Main field / outer bands. */
  c1: string;
  /** Secondary band, hoist or cross. */
  c2: string;
  /** Tertiary band. */
  c3: string;
  /** Emblem colour. */
  e: string;
}

export type FactionKind =
  | 'government'
  | 'movement'
  | 'municipal'
  | 'security'
  | 'civic'
  | 'mercenary'
  | 'foreign';

export interface FactionStats {
  legitimacy: number;
  morale: number;
  readiness: number;
  supply: number;
  support: number;
}

export interface Faction {
  id: FactionId;
  name: string;
  short: string;
  kind: FactionKind;
  /** Colour used for territory on the map. */
  color: string;
  flag: FlagSpec;
  leader: string;
  ideology: string;
  goals: string[];
  /** 0–100 values. */
  stats: FactionStats;
  /** Relationship score to every other faction, −100 (hostile) to +100 (allied). */
  relations: Record<FactionId, number>;
}

export type LocationKind = 'region' | 'county' | 'zone' | 'city' | 'district';

export interface Location {
  id: LocationId;
  name: string;
  kind: LocationKind;
  /** Spatial hierarchy: region → county → zone → city → district. */
  parentId: LocationId | null;
  population: number;
  /** Share of control per faction, each 0–1, summing to at most 1. The remainder is uncontrolled. */
  control: Record<FactionId, number>;
  /** Areas: one or more rings of [lon, lat]. */
  polygons?: LonLat[][];
  /** Point features such as cities. */
  point?: LonLat;
  tags?: string[];
}

export type Severity = 'routine' | 'notable' | 'major';
export type EventCategory =
  | 'military'
  | 'political'
  | 'economy'
  | 'humanitarian'
  | 'foreign'
  | 'intelligence'
  | 'system';

/** One authoritative change written to world state. */
export interface StateChange {
  path: string;
  before: unknown;
  after: unknown;
}

export interface WorldEvent {
  id: EventId;
  time: ISOTime;
  locationId: LocationId;
  participants: FactionId[];
  severity: Severity;
  category: EventCategory;
  headline: string;
  body: string;
  /** Earlier events that caused this one. */
  causes: EventId[];
  changes: StateChange[];
}

/** A God Mode edit, kept for the audit log. */
export interface Intervention {
  id: string;
  time: ISOTime;
  action: string;
  reason: string;
  changes: StateChange[];
}

export interface TurnRecord {
  turn: number;
  from: ISOTime;
  to: ISOTime;
  slices: number;
  eventIds: EventId[];
}

export interface Geography {
  /** Mainland coastline ring(s). */
  coastline: LonLat[][];
  /** Lakes and other inland water. */
  water: LonLat[][];
}

export interface Scenario {
  format: 'sf-sim-scenario';
  version: 1;
  id: string;
  name: string;
  description: string;
  start: ISOTime;
  seed: number;
  geography: Geography;
  factions: Faction[];
  locations: Location[];
  events: WorldEvent[];
}

export interface WorldState {
  version: 1;
  scenarioId: string;
  scenarioName: string;
  seed: number;
  /** Current RNG state, so a loaded save continues exactly where it left off. */
  rngState: number;
  time: ISOTime;
  turn: number;
  /** Next event number, for stable event ids. */
  nextEventNo: number;
  geography: Geography;
  factions: Record<FactionId, Faction>;
  locations: Record<LocationId, Location>;
  events: WorldEvent[];
  turns: TurnRecord[];
  interventions: Intervention[];
}
