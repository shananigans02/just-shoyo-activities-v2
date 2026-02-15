import type * as THREE from "three";

/**
 * Centralized fade animation manager.
 *
 * Instead of 324 separate useFrame callbacks, we have ONE animation loop
 * that only updates planes that are actively fading. This is the key to
 * smooth performance.
 *
 * Inspired by GSAP's approach: batch all animations in a single tick.
 */

interface FadeEntry {
  imageMaterial: THREE.MeshBasicMaterial;
  placeholderMaterial: THREE.MeshBasicMaterial;
  imageMesh: THREE.Mesh;
  placeholderMesh: THREE.Mesh;
  imageOpacity: number;
  placeholderOpacity: number;
}

// Active fade animations
const activeFades = new Map<string, FadeEntry>();

// Animation state
let isAnimating = false;
let animationFrameId: number | null = null;

// Fade speed (per frame at 60fps)
const FADE_IN_SPEED = 0.08; // ~12 frames to fully fade in
const FADE_OUT_SPEED = 0.1; // ~10 frames to fully fade out

/**
 * Start a fade animation for a plane.
 * Call this when a texture finishes loading.
 */
export function startFade(
  id: string,
  imageMaterial: THREE.MeshBasicMaterial,
  placeholderMaterial: THREE.MeshBasicMaterial,
  imageMesh: THREE.Mesh,
  placeholderMesh: THREE.Mesh
): void {
  activeFades.set(id, {
    imageMaterial,
    placeholderMaterial,
    imageMesh,
    placeholderMesh,
    imageOpacity: 0,
    placeholderOpacity: 1,
  });

  // Start animation loop if not running
  if (!isAnimating) {
    isAnimating = true;
    animationFrameId = requestAnimationFrame(animate);
  }
}

/**
 * Remove a fade entry (e.g., when component unmounts).
 */
export function removeFade(id: string): void {
  activeFades.delete(id);
}

/**
 * The single animation loop that handles ALL fades.
 */
function animate(): void {
  const toRemove: string[] = [];

  for (const [id, entry] of activeFades) {
    // Fade in image
    entry.imageOpacity = Math.min(1, entry.imageOpacity + FADE_IN_SPEED);
    // Fade out placeholder
    entry.placeholderOpacity = Math.max(
      0,
      entry.placeholderOpacity - FADE_OUT_SPEED
    );

    // Apply to materials
    entry.imageMaterial.opacity = entry.imageOpacity;
    entry.placeholderMaterial.opacity = entry.placeholderOpacity;

    // Update visibility
    entry.imageMesh.visible = entry.imageOpacity > 0.01;
    entry.placeholderMesh.visible = entry.placeholderOpacity > 0.01;

    // Enable depth write when fully opaque
    entry.imageMaterial.depthWrite = entry.imageOpacity > 0.99;

    // Remove from active fades when complete
    if (entry.imageOpacity >= 1 && entry.placeholderOpacity <= 0) {
      toRemove.push(id);
    }
  }

  // Clean up completed fades
  for (const id of toRemove) {
    activeFades.delete(id);
  }

  // Continue animation if there are active fades
  if (activeFades.size > 0) {
    animationFrameId = requestAnimationFrame(animate);
  } else {
    isAnimating = false;
    animationFrameId = null;
  }
}

/**
 * Stop all animations (cleanup).
 */
export function stopAllFades(): void {
  activeFades.clear();
  isAnimating = false;
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

/**
 * Get stats for debugging.
 */
export function getFadeStats() {
  return {
    activeFades: activeFades.size,
    isAnimating,
  };
}
