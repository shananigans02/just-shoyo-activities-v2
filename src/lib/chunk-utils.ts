import { Vector3 } from "three";
import {
  CHUNK_SIZE,
  PLANE_SIZE_MAX,
  PLANE_SIZE_MIN,
  PLANES_PER_CHUNK,
} from "./constants";
import type { PlaneData } from "./types";
import { hashString, seededRandom } from "./utils";

// LRU cache for chunk plane data
const MAX_PLANE_CACHE = 256;
const planeCache = new Map<string, PlaneData[]>();

/**
 * Generate planes for a chunk at the given coordinates.
 * Uses deterministic seeded random for consistent results.
 */
export const generateChunkPlanes = (
  cx: number,
  cy: number,
  cz: number
): PlaneData[] => {
  const planes: PlaneData[] = [];
  const seed = hashString(`${cx},${cy},${cz}`);

  for (let i = 0; i < PLANES_PER_CHUNK; i++) {
    const s = seed + i * 1000;
    const r = (n: number) => seededRandom(s + n);

    const size = PLANE_SIZE_MIN + r(4) * (PLANE_SIZE_MAX - PLANE_SIZE_MIN);

    planes.push({
      id: `${cx}-${cy}-${cz}-${i}`,
      position: new Vector3(
        cx * CHUNK_SIZE + r(0) * CHUNK_SIZE,
        cy * CHUNK_SIZE + r(1) * CHUNK_SIZE,
        cz * CHUNK_SIZE + r(2) * CHUNK_SIZE
      ),
      scale: new Vector3(size, size, 1),
      mediaIndex: Math.floor(r(5) * 1_000_000),
    });
  }

  return planes;
};

/**
 * Get planes for a chunk with LRU caching.
 * Moves accessed entries to end for LRU ordering.
 */
export const generateChunkPlanesCached = (
  cx: number,
  cy: number,
  cz: number
): PlaneData[] => {
  const key = `${cx},${cy},${cz}`;
  const cached = planeCache.get(key);

  if (cached) {
    // Move to end for LRU ordering
    planeCache.delete(key);
    planeCache.set(key, cached);
    return cached;
  }

  const planes = generateChunkPlanes(cx, cy, cz);
  planeCache.set(key, planes);

  // Evict oldest entries if cache is full
  while (planeCache.size > MAX_PLANE_CACHE) {
    const firstKey = planeCache.keys().next().value;
    if (firstKey) {
      planeCache.delete(firstKey);
    }
  }

  return planes;
};

/**
 * Get throttle time for chunk updates based on zoom state.
 * Higher speeds = longer throttle to prevent thrashing.
 */
export const getChunkUpdateThrottleMs = (
  isZooming: boolean,
  zoomSpeed: number
): number => {
  if (zoomSpeed > 1.0) return 500;
  if (isZooming) return 400;
  return 100;
};

/**
 * Check if enough time has passed since last update.
 */
export const shouldThrottleUpdate = (
  lastUpdate: number,
  throttleMs: number,
  now: number
): boolean => {
  return now - lastUpdate >= throttleMs;
};

/**
 * Clear the plane cache.
 */
export const clearPlaneCache = (): void => {
  planeCache.clear();
};
