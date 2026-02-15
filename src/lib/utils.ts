/**
 * Immediately invoke a function and return its result.
 * Useful for inline IIFEs with proper typing.
 */
export const run = <T>(fn: () => T): T => fn();

/**
 * Clamp a value between min and max bounds.
 */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/**
 * Linear interpolation between two values.
 * @param a Start value
 * @param b End value
 * @param t Interpolation factor (0-1)
 */
export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

/**
 * Generate a deterministic pseudo-random number from a seed.
 * Uses a simple but effective hash function.
 * @returns A number between 0 and 1
 */
export const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9999.9) * 99_999.9;
  return x - Math.floor(x);
};

/**
 * Hash a string to a number for use as a seed.
 * Uses djb2 algorithm variant.
 */
export const hashString = (str: string): number => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
};
