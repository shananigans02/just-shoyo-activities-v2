import type * as THREE from "three";

/**
 * Media item from the manifest.
 */
export interface MediaItem {
  url: string;
  width: number;
  height: number;
  title?: string;
}

/**
 * Data for a single plane in a chunk.
 */
export interface PlaneData {
  id: string;
  position: THREE.Vector3;
  scale: THREE.Vector3;
  mediaIndex: number;
}

/**
 * Camera grid position (chunk coordinates).
 */
export interface CameraGrid {
  cx: number;
  cy: number;
  cz: number;
  camZ: number;
}

/**
 * Chunk data for rendering.
 */
export interface ChunkData {
  key: string;
  cx: number;
  cy: number;
  cz: number;
}

/**
 * Chunk offset for neighborhood generation.
 */
export interface ChunkOffset {
  dx: number;
  dy: number;
  dz: number;
}

/**
 * Controller state for camera movement.
 */
export interface ControllerState {
  velocity: { x: number; y: number; z: number };
  targetVel: { x: number; y: number; z: number };
  basePos: { x: number; y: number; z: number };
  drift: { x: number; y: number };
  mouse: { x: number; y: number };
  lastMouse: { x: number; y: number };
  scrollAccum: number;
  isDragging: boolean;
  lastTouches: { x: number; y: number }[];
  lastTouchDist: number;
  lastChunkKey: string;
  lastChunkUpdate: number;
  pendingChunk: { cx: number; cy: number; cz: number } | null;
}

/**
 * Props for the InfiniteCanvas scene.
 */
export interface InfiniteCanvasProps {
  media: MediaItem[];
  backgroundColor?: string;
  fogColor?: string;
  fogNear?: number;
  fogFar?: number;
  showStats?: boolean;
}
