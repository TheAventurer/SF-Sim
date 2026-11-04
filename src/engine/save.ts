import type { WorldState } from './types';

export const SAVE_FORMAT = 'sf-sim-save';
export const SAVE_VERSION = 1;

export interface SaveFile {
  format: typeof SAVE_FORMAT;
  version: typeof SAVE_VERSION;
  savedAt: string;
  label: string;
  world: WorldState;
}

export function serializeWorld(world: WorldState, label = '', savedAt = new Date().toISOString()): string {
  const file: SaveFile = { format: SAVE_FORMAT, version: SAVE_VERSION, savedAt, label, world };
  return JSON.stringify(file);
}

/** Parses a save file. Throws a readable error if it is not a compatible save. */
export function deserializeWorld(text: string): SaveFile {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Save file is not valid JSON.');
  }
  const f = data as Partial<SaveFile>;
  if (!f || typeof f !== 'object' || f.format !== SAVE_FORMAT) throw new Error('Not an SF-Sim save file.');
  if (f.version !== SAVE_VERSION) throw new Error(`Unsupported save version ${String(f.version)}.`);
  const w = f.world as Partial<WorldState> | undefined;
  if (!w || typeof w.time !== 'string' || typeof w.rngState !== 'number' || !w.factions || !w.locations || !Array.isArray(w.events)) {
    throw new Error('Save file is missing world data.');
  }
  return f as SaveFile;
}
