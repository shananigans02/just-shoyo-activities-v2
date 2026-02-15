"use client";

import {
  KeyboardControls,
  Stats,
  useKeyboardControls,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as React from "react";
import * as THREE from "three";
import { useIsTouchDevice } from "../../hooks/use-is-touch-device";
import {
  generateChunkPlanesCached,
  generateChunkPlanesCached as getChunkPlanes,
  getChunkUpdateThrottleMs,
  shouldThrottleUpdate,
} from "../../lib/chunk-utils";
import {
  CHUNK_OFFSETS,
  CHUNK_SIZE,
  INITIAL_CAMERA_Z,
  KEYBOARD_SPEED,
  MAX_VELOCITY,
  PRELOAD_CHUNK_OFFSETS,
  PRELOAD_THROTTLE_MS,
  VELOCITY_DECAY,
  VELOCITY_LERP,
} from "../../lib/constants";
import { removeFade, startFade } from "../../lib/fade-manager";
import {
  getCachedTexture,
  getTexture,
  preloadAllTextures,
  preloadTextures,
} from "../../lib/texture-manager";
import type { ChunkData, MediaItem } from "../../lib/types";
import { clamp, lerp } from "../../lib/utils";

// Shared geometry for all planes
const PLANE_GEOMETRY = new THREE.PlaneGeometry(1, 1);

// Keyboard control mapping
const KEYBOARD_MAP = [
  { name: "forward", keys: ["w", "W", "ArrowUp"] },
  { name: "backward", keys: ["s", "S", "ArrowDown"] },
  { name: "left", keys: ["a", "A", "ArrowLeft"] },
  { name: "right", keys: ["d", "D", "ArrowRight"] },
  { name: "up", keys: ["e", "E"] },
  { name: "down", keys: ["q", "Q"] },
];

type KeyboardKeys = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
};

// Touch distance calculation for pinch zoom
const getTouchDistance = (touches: { x: number; y: number }[]) => {
  if (touches.length < 2) return 0;
  const [t1, t2] = touches;
  const dx = t1.x - t2.x;
  const dy = t1.y - t2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

type CameraGridState = {
  cx: number;
  cy: number;
  cz: number;
  camZ: number;
};

type ControllerState = {
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
  lastPreloadUpdate: number;
  lastPreloadKey: string;
};

const createInitialState = (camZ: number): ControllerState => ({
  velocity: { x: 0, y: 0, z: 0 },
  targetVel: { x: 0, y: 0, z: 0 },
  basePos: { x: 0, y: 0, z: camZ },
  drift: { x: 0, y: 0 },
  mouse: { x: 0, y: 0 },
  lastMouse: { x: 0, y: 0 },
  scrollAccum: 0,
  isDragging: false,
  lastTouches: [],
  lastTouchDist: 0,
  lastChunkKey: "",
  lastChunkUpdate: 0,
  pendingChunk: null,
  lastPreloadUpdate: 0,
  lastPreloadKey: "",
});

/**
 * Individual media plane - NO useFrame, uses centralized fade manager.
 * Placeholder has correct aspect ratio from manifest.
 * CACHED TEXTURES are applied directly during render (no flash).
 */
const MediaPlane = React.memo(function MediaPlane({
  position,
  scale,
  media,
}: {
  position: THREE.Vector3;
  scale: THREE.Vector3;
  media: MediaItem;
  chunkCx?: number;
  chunkCy?: number;
  chunkCz?: number;
  cameraGridRef?: React.RefObject<CameraGridState>;
}) {
  const placeholderMeshRef = React.useRef<THREE.Mesh>(null);
  const imageMeshRef = React.useRef<THREE.Mesh>(null);
  const imageMaterialRef = React.useRef<THREE.MeshBasicMaterial>(null);
  const placeholderMaterialRef = React.useRef<THREE.MeshBasicMaterial>(null);
  const textureAppliedRef = React.useRef(false);

  // Calculate aspect ratio from manifest (known before load!)
  const aspect = media.width / media.height;
  const scaleX = scale.y * aspect;
  const scaleY = scale.y;

  // Get cached texture DURING RENDER - this is the key to avoiding flash!
  // React allows reading from cache during render as long as it's synchronous and pure
  const cachedTexture = getCachedTexture(media.url);
  const isCached = cachedTexture !== null;

  // Mark as applied if we got it from cache during render
  if (isCached && !textureAppliedRef.current) {
    textureAppliedRef.current = true;
  }

  // Unique ID for fade manager
  const fadeId = React.useRef(
    `${media.url}-${position.x}-${position.y}-${position.z}`
  );

  // ASYNC: Load texture if not cached, with fade animation
  React.useEffect(() => {
    // Skip if already have cached texture from render
    if (textureAppliedRef.current) return;

    getTexture(media, (texture) => {
      // Skip if already applied (e.g., component remounted with cached texture)
      if (textureAppliedRef.current) return;

      const imageMaterial = imageMaterialRef.current;
      const placeholderMaterial = placeholderMaterialRef.current;
      const imageMesh = imageMeshRef.current;
      const placeholderMesh = placeholderMeshRef.current;

      if (
        !(imageMaterial && placeholderMaterial && imageMesh && placeholderMesh)
      )
        return;

      // Apply texture
      imageMaterial.map = texture;
      imageMaterial.needsUpdate = true;
      textureAppliedRef.current = true;

      // New texture - animate fade
      startFade(
        fadeId.current,
        imageMaterial,
        placeholderMaterial,
        imageMesh,
        placeholderMesh
      );
    });

    // Cleanup on unmount
    return () => {
      removeFade(fadeId.current);
      textureAppliedRef.current = false;
    };
  }, [media]);

  return (
    <group position={position}>
      {/* White placeholder - hidden if cached */}
      <mesh
        geometry={PLANE_GEOMETRY}
        ref={placeholderMeshRef}
        scale={[scaleX, scaleY, 1]}
        visible={!isCached}
      >
        <meshBasicMaterial
          color="#f5f5f5"
          depthWrite={false}
          opacity={isCached ? 0 : 1}
          ref={placeholderMaterialRef}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>
      {/* Actual image - texture applied directly from cache during render */}
      <mesh
        geometry={PLANE_GEOMETRY}
        ref={imageMeshRef}
        scale={[scaleX, scaleY, 1]}
        visible={isCached}
      >
        <meshBasicMaterial
          depthWrite={isCached}
          map={cachedTexture}
          opacity={isCached ? 1 : 0}
          ref={imageMaterialRef}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>
    </group>
  );
});

/**
 * Chunk containing multiple media planes - memoized to prevent re-renders.
 * Planes are generated synchronously (cached) to avoid first-frame flash.
 */
const Chunk = React.memo(function Chunk({
  cx,
  cy,
  cz,
  media,
  cameraGridRef,
}: {
  cx: number;
  cy: number;
  cz: number;
  media: MediaItem[];
  cameraGridRef: React.RefObject<CameraGridState>;
}) {
  // Generate planes synchronously - it's cached and very fast
  // This avoids the first-frame flash where planes would be null
  const planes = React.useMemo(
    () => generateChunkPlanesCached(cx, cy, cz),
    [cx, cy, cz]
  );

  return (
    <group>
      {planes.map((plane) => {
        const mediaItem = media[plane.mediaIndex % media.length];
        if (!mediaItem) return null;

        return (
          <MediaPlane
            cameraGridRef={cameraGridRef}
            chunkCx={cx}
            chunkCy={cy}
            chunkCz={cz}
            key={plane.id}
            media={mediaItem}
            position={plane.position}
            scale={plane.scale}
          />
        );
      })}
    </group>
  );
});

/**
 * Main scene controller.
 */
function SceneController({
  media,
  onLoadProgress,
  onLoadComplete,
}: {
  media: MediaItem[];
  onLoadProgress?: (progress: number) => void;
  onLoadComplete?: () => void;
}) {
  const { camera, gl } = useThree();
  const isTouchDevice = useIsTouchDevice();
  const [, getKeys] = useKeyboardControls<keyof KeyboardKeys>();

  const state = React.useRef<ControllerState>(
    createInitialState(INITIAL_CAMERA_Z)
  );
  const cameraGridRef = React.useRef<CameraGridState>({
    cx: 0,
    cy: 0,
    cz: 0,
    camZ: camera.position.z,
  });

  const [chunks, setChunks] = React.useState<ChunkData[]>([]);
  const [isPreloaded, setIsPreloaded] = React.useState(false);

  // CRITICAL: Preload ALL images before showing any chunks
  // This ensures the cache is fully populated and prevents white flash
  React.useEffect(() => {
    let mounted = true;
    preloadAllTextures(media, (progress) => {
      if (mounted) onLoadProgress?.(progress);
    }).then(() => {
      if (mounted) {
        setIsPreloaded(true);
        onLoadComplete?.();
      }
    });
    return () => {
      mounted = false;
    };
  }, [media, onLoadProgress, onLoadComplete]);

  // Input event handlers
  React.useEffect(() => {
    const canvas = gl.domElement;
    const s = state.current;
    canvas.style.cursor = "grab";

    const setCursor = (cursor: string) => {
      canvas.style.cursor = cursor;
    };

    const onMouseDown = (e: MouseEvent) => {
      s.isDragging = true;
      s.lastMouse = { x: e.clientX, y: e.clientY };
      setCursor("grabbing");
    };

    const onMouseUp = () => {
      s.isDragging = false;
      setCursor("grab");
    };

    const onMouseLeave = () => {
      s.mouse = { x: 0, y: 0 };
      s.isDragging = false;
      setCursor("grab");
    };

    const onMouseMove = (e: MouseEvent) => {
      s.mouse = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };

      if (s.isDragging) {
        s.targetVel.x -= (e.clientX - s.lastMouse.x) * 0.025;
        s.targetVel.y += (e.clientY - s.lastMouse.y) * 0.025;
        s.lastMouse = { x: e.clientX, y: e.clientY };
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      s.scrollAccum += e.deltaY * 0.006;
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      s.lastTouches = Array.from(e.touches).map((t) => ({
        x: t.clientX,
        y: t.clientY,
      }));
      s.lastTouchDist = getTouchDistance(s.lastTouches);
      setCursor("grabbing");
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touches = Array.from(e.touches).map((t) => ({
        x: t.clientX,
        y: t.clientY,
      }));

      if (touches.length === 1 && s.lastTouches.length >= 1) {
        const [touch] = touches;
        const [last] = s.lastTouches;
        if (touch && last) {
          s.targetVel.x -= (touch.x - last.x) * 0.02;
          s.targetVel.y += (touch.y - last.y) * 0.02;
        }
      } else if (touches.length === 2 && s.lastTouchDist > 0) {
        const dist = getTouchDistance(touches);
        s.scrollAccum += (s.lastTouchDist - dist) * 0.006;
        s.lastTouchDist = dist;
      }

      s.lastTouches = touches;
    };

    const onTouchEnd = (e: TouchEvent) => {
      s.lastTouches = Array.from(e.touches).map((t) => ({
        x: t.clientX,
        y: t.clientY,
      }));
      s.lastTouchDist = getTouchDistance(s.lastTouches);
      setCursor("grab");
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [gl]);

  // Main animation loop
  useFrame(() => {
    const s = state.current;
    const now = performance.now();

    // Keyboard input
    const { forward, backward, left, right, up, down } = getKeys();
    if (forward) s.targetVel.z -= KEYBOARD_SPEED;
    if (backward) s.targetVel.z += KEYBOARD_SPEED;
    if (left) s.targetVel.x -= KEYBOARD_SPEED;
    if (right) s.targetVel.x += KEYBOARD_SPEED;
    if (down) s.targetVel.y -= KEYBOARD_SPEED;
    if (up) s.targetVel.y += KEYBOARD_SPEED;

    // Mouse drift
    const isZooming = Math.abs(s.velocity.z) > 0.05;
    const zoomFactor = clamp(s.basePos.z / 50, 0.3, 2.0);
    const driftAmount = 8.0 * zoomFactor;
    const driftLerp = isZooming ? 0.2 : 0.12;

    if (s.isDragging) {
      // Freeze drift
    } else if (isTouchDevice) {
      s.drift.x = lerp(s.drift.x, 0, driftLerp);
      s.drift.y = lerp(s.drift.y, 0, driftLerp);
    } else {
      s.drift.x = lerp(s.drift.x, s.mouse.x * driftAmount, driftLerp);
      s.drift.y = lerp(s.drift.y, s.mouse.y * driftAmount, driftLerp);
    }

    // Apply scroll
    s.targetVel.z += s.scrollAccum;
    s.scrollAccum *= 0.8;

    // Clamp velocities
    s.targetVel.x = clamp(s.targetVel.x, -MAX_VELOCITY, MAX_VELOCITY);
    s.targetVel.y = clamp(s.targetVel.y, -MAX_VELOCITY, MAX_VELOCITY);
    s.targetVel.z = clamp(s.targetVel.z, -MAX_VELOCITY, MAX_VELOCITY);

    // Smooth velocity (inertia)
    s.velocity.x = lerp(s.velocity.x, s.targetVel.x, VELOCITY_LERP);
    s.velocity.y = lerp(s.velocity.y, s.targetVel.y, VELOCITY_LERP);
    s.velocity.z = lerp(s.velocity.z, s.targetVel.z, VELOCITY_LERP);

    // Update position
    s.basePos.x += s.velocity.x;
    s.basePos.y += s.velocity.y;
    s.basePos.z += s.velocity.z;

    // Apply camera position
    camera.position.set(
      s.basePos.x + s.drift.x,
      s.basePos.y + s.drift.y,
      s.basePos.z
    );

    // Velocity decay
    s.targetVel.x *= VELOCITY_DECAY;
    s.targetVel.y *= VELOCITY_DECAY;
    s.targetVel.z *= VELOCITY_DECAY;

    // Chunk coordinates
    const cx = Math.floor(s.basePos.x / CHUNK_SIZE);
    const cy = Math.floor(s.basePos.y / CHUNK_SIZE);
    const cz = Math.floor(s.basePos.z / CHUNK_SIZE);

    cameraGridRef.current = { cx, cy, cz, camZ: s.basePos.z };

    // Chunk boundary check
    const key = `${cx},${cy},${cz}`;
    if (key !== s.lastChunkKey) {
      s.pendingChunk = { cx, cy, cz };
      s.lastChunkKey = key;
    }

    // Throttled chunk updates
    const throttleMs = getChunkUpdateThrottleMs(
      isZooming,
      Math.abs(s.velocity.z)
    );

    if (
      s.pendingChunk &&
      shouldThrottleUpdate(s.lastChunkUpdate, throttleMs, now)
    ) {
      const { cx: ucx, cy: ucy, cz: ucz } = s.pendingChunk;
      s.pendingChunk = null;
      s.lastChunkUpdate = now;

      setChunks(
        CHUNK_OFFSETS.map((o) => ({
          key: `${ucx + o.dx},${ucy + o.dy},${ucz + o.dz}`,
          cx: ucx + o.dx,
          cy: ucy + o.dy,
          cz: ucz + o.dz,
        }))
      );
    }

    // Overscan preloading - load textures for chunks about to come into view
    const preloadKey = `${cx},${cy},${cz}`;
    if (
      preloadKey !== s.lastPreloadKey &&
      now - s.lastPreloadUpdate > PRELOAD_THROTTLE_MS
    ) {
      s.lastPreloadKey = preloadKey;
      s.lastPreloadUpdate = now;

      // Sort preload offsets by velocity direction (prioritize where user is heading)
      const vx = s.velocity.x;
      const vy = s.velocity.y;
      const vz = s.velocity.z;
      const sortedOffsets = [...PRELOAD_CHUNK_OFFSETS].sort((a, b) => {
        // Dot product with velocity - higher means more aligned with movement
        const dotA = a.dx * vx + a.dy * vy + a.dz * vz;
        const dotB = b.dx * vx + b.dy * vy + b.dz * vz;
        return dotB - dotA; // Higher dot product = closer to movement direction
      });

      // Compute media items for preload chunks (in priority order)
      const preloadItems: MediaItem[] = [];
      for (const offset of sortedOffsets) {
        const pcx = cx + offset.dx;
        const pcy = cy + offset.dy;
        const pcz = cz + offset.dz;

        // Get planes for this preload chunk
        const planes = getChunkPlanes(pcx, pcy, pcz);
        for (const plane of planes) {
          const mediaItem = media[plane.mediaIndex % media.length];
          if (mediaItem && !preloadItems.includes(mediaItem)) {
            preloadItems.push(mediaItem);
          }
        }
      }

      // Queue preloading (low priority, won't block visible textures)
      if (preloadItems.length > 0) {
        preloadTextures(preloadItems);
      }
    }
  });

  // Initialize chunks on mount
  React.useEffect(() => {
    const s = state.current;
    s.basePos = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
    };

    setChunks(
      CHUNK_OFFSETS.map((o) => ({
        key: `${o.dx},${o.dy},${o.dz}`,
        cx: o.dx,
        cy: o.dy,
        cz: o.dz,
      }))
    );
  }, [camera]);

  // Don't render chunks until all textures are preloaded
  if (!isPreloaded) {
    return null;
  }

  return (
    <>
      {chunks.map((chunk) => (
        <Chunk
          cameraGridRef={cameraGridRef}
          cx={chunk.cx}
          cy={chunk.cy}
          cz={chunk.cz}
          key={chunk.key}
          media={media}
        />
      ))}
    </>
  );
}

export interface InfiniteCanvasSceneProps {
  media: MediaItem[];
  showFps?: boolean;
  showControls?: boolean;
  cameraFov?: number;
  cameraNear?: number;
  cameraFar?: number;
  fogNear?: number;
  fogFar?: number;
  backgroundColor?: string;
  fogColor?: string;
}

/**
 * Main infinite canvas scene component.
 */
export function InfiniteCanvasScene({
  media,
  showFps = false,
  showControls = false,
  cameraFov = 60,
  cameraNear = 1,
  cameraFar = 500,
  fogNear = 120,
  fogFar = 320,
  backgroundColor = "#ffffff",
  fogColor = "#ffffff",
}: InfiniteCanvasSceneProps) {
  const isTouchDevice = useIsTouchDevice();
  const [loadProgress, setLoadProgress] = React.useState(0);
  const [isLoaded, setIsLoaded] = React.useState(false);

  const dpr = Math.min(
    window.devicePixelRatio || 1,
    isTouchDevice ? 1.25 : 1.5
  );

  // Memoize callbacks to prevent effect re-runs
  const handleProgress = React.useCallback((progress: number) => {
    setLoadProgress(progress);
  }, []);

  const handleComplete = React.useCallback(() => {
    setIsLoaded(true);
  }, []);

  if (!media.length) return null;

  return (
    <KeyboardControls map={KEYBOARD_MAP}>
      <div className="absolute inset-0 touch-none bg-white">
        {/* Loading overlay - minimal */}
        {!isLoaded && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white">
            <div className="h-px w-32 overflow-hidden bg-[var(--void-gray-200)]">
              <div
                className="h-full bg-[var(--void-gray-400)] transition-all duration-300"
                style={{ width: `${loadProgress * 100}%` }}
              />
            </div>
          </div>
        )}

        <Canvas
          camera={{
            position: [0, 0, INITIAL_CAMERA_Z],
            fov: cameraFov,
            near: cameraNear,
            far: cameraFar,
          }}
          className="absolute inset-0 h-full w-full touch-none bg-white"
          dpr={dpr}
          flat
          gl={{ antialias: false, powerPreference: "high-performance" }}
        >
          <color args={[backgroundColor]} attach="background" />
          <fog args={[fogColor, fogNear, fogFar]} attach="fog" />
          <SceneController
            media={media}
            onLoadComplete={handleComplete}
            onLoadProgress={handleProgress}
          />
          {showFps && (
            <Stats className="absolute! top-3! right-3! left-auto!" />
          )}
        </Canvas>

        {showControls && (
          <div className="absolute right-3 bottom-3 z-10 rounded-lg border border-neutral-200 bg-white/80 px-3 py-2 text-neutral-600 text-xs shadow-sm backdrop-blur-sm">
            {isTouchDevice ? (
              <span>
                <b className="text-neutral-800">Drag</b> Pan ·{" "}
                <b className="text-neutral-800">Pinch</b> Zoom
              </span>
            ) : (
              <span>
                <b className="text-neutral-800">WASD</b> Move ·{" "}
                <b className="text-neutral-800">QE</b> Up/Down ·{" "}
                <b className="text-neutral-800">Scroll</b> Zoom
              </span>
            )}
          </div>
        )}
      </div>
    </KeyboardControls>
  );
}