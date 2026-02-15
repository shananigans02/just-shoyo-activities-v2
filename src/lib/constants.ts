import type { ChunkOffset } from "./types";

// Chunk configuration
export const CHUNK_SIZE = 110;
export const RENDER_DISTANCE = 2;
export const CHUNK_FADE_MARGIN = 1;

// Overscan/preload configuration
export const PRELOAD_DISTANCE = 4; // Chunks beyond render distance to preload
export const PRELOAD_THROTTLE_MS = 500; // Min time between preload batches

// Depth fade configuration
export const DEPTH_FADE_START = 140;
export const DEPTH_FADE_END = 260;

// Camera configuration
export const INITIAL_CAMERA_Z = 50;
export const CAMERA_FOV = 60;
export const CAMERA_NEAR = 1;
export const CAMERA_FAR = 500;

// Movement physics
export const VELOCITY_LERP = 0.16;
export const VELOCITY_DECAY = 0.9;
export const MAX_VELOCITY = 3.2;
export const KEYBOARD_SPEED = 0.18;

// Visibility thresholds
export const INVIS_THRESHOLD = 0.01;
export const OPACITY_LERP = 0.18;

// Planes per chunk
export const PLANES_PER_CHUNK = 12;

// Plane size range
export const PLANE_SIZE_MIN = 12;
export const PLANE_SIZE_MAX = 20;

/**
 * Pre-compute chunk offsets for the neighborhood around the camera.
 * Uses Chebyshev distance (max of absolute values).
 */
const computeChunkOffsets = (maxDist: number): ChunkOffset[] => {
  const offsets: ChunkOffset[] = [];

  for (let dx = -maxDist; dx <= maxDist; dx++) {
    for (let dy = -maxDist; dy <= maxDist; dy++) {
      for (let dz = -maxDist; dz <= maxDist; dz++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));
        if (dist <= maxDist) {
          offsets.push({ dx, dy, dz });
        }
      }
    }
  }

  // Sort by distance for optimal loading order
  offsets.sort((a, b) => {
    const distA = Math.max(Math.abs(a.dx), Math.abs(a.dy), Math.abs(a.dz));
    const distB = Math.max(Math.abs(b.dx), Math.abs(b.dy), Math.abs(b.dz));
    return distA - distB;
  });

  return offsets;
};

// Chunks to render (visible + fade margin)
export const CHUNK_OFFSETS = computeChunkOffsets(
  RENDER_DISTANCE + CHUNK_FADE_MARGIN
);

// Chunks to preload (beyond visible, for overscan)
export const PRELOAD_CHUNK_OFFSETS = computeChunkOffsets(
  PRELOAD_DISTANCE
).filter((o) => {
  const dist = Math.max(Math.abs(o.dx), Math.abs(o.dy), Math.abs(o.dz));
  return dist > RENDER_DISTANCE + CHUNK_FADE_MARGIN;
});
