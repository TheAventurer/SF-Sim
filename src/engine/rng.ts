/**
 * Small seeded PRNG (mulberry32). Its whole state is one 32-bit integer,
 * which is stored in the world so saves resume deterministically.
 */
export class Rng {
  private state: number;

  constructor(state: number) {
    this.state = state >>> 0;
  }

  /** Current state, to store back into the world. */
  get value(): number {
    return this.state;
  }

  /** Float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Float in [min, max). */
  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  /** Integer in [min, max]. */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  chance(p: number): boolean {
    return this.next() < p;
  }
}
