import * as THREE from "three";
import type { MediaItem } from "./types";

/**
 * Simple texture manager with off-main-thread decoding.
 *
 * - Uses createImageBitmap for background decoding (no main thread jank)
 * - Simple queue with concurrent limit
 * - No scroll awareness - just load images steadily
 */

const MAX_CONCURRENT_LOADS = 8;
const MAX_CACHE_SIZE = 750;

const textureCache = new Map<string, THREE.Texture>();
const loadCallbacks = new Map<string, Set<(tex: THREE.Texture) => void>>();
const textureLastUsed = new Map<string, number>();

const loadQueue: string[] = [];
let activeLoads = 0;
const loadingUrls = new Set<string>();

/**
 * Load image using createImageBitmap (decodes off main thread).
 */
const loadImageBitmap = async (url: string): Promise<ImageBitmap> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return createImageBitmap(blob, {
    premultiplyAlpha: "none",
    colorSpaceConversion: "default",
    imageOrientation: "flipY",
  });
};

/**
 * Create THREE.Texture from ImageBitmap.
 */
const createTextureFromBitmap = (bitmap: ImageBitmap): THREE.Texture => {
  const texture = new THREE.Texture(bitmap);
  texture.flipY = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
};

/**
 * Process the load queue.
 */
const processQueue = async (): Promise<void> => {
  while (activeLoads < MAX_CONCURRENT_LOADS && loadQueue.length > 0) {
    const url = loadQueue.shift();
    if (!url || loadingUrls.has(url)) continue;

    // Check if already loaded
    const existing = textureCache.get(url);
    if (existing && existing.image) {
      loadCallbacks.get(url)?.forEach((cb) => cb(existing));
      loadCallbacks.delete(url);
      continue;
    }

    activeLoads++;
    loadingUrls.add(url);

    try {
      const bitmap = await loadImageBitmap(url);
      const texture = createTextureFromBitmap(bitmap);

      textureCache.set(url, texture);
      textureLastUsed.set(url, performance.now());

      // Call all waiting callbacks
      loadCallbacks.get(url)?.forEach((cb) => {
        try {
          cb(texture);
        } catch (e) {
          console.error(e);
        }
      });
      loadCallbacks.delete(url);

      // Evict old textures if needed
      evictOldTextures();
    } catch (err) {
      console.error("Texture load failed:", url, err);
    } finally {
      activeLoads--;
      loadingUrls.delete(url);
    }
  }

  // Continue processing if more in queue
  if (loadQueue.length > 0 && activeLoads < MAX_CONCURRENT_LOADS) {
    // Use setTimeout to avoid stack overflow and give browser breathing room
    setTimeout(processQueue, 0);
  }
};

/**
 * Evict oldest textures if cache is too large.
 */
const evictOldTextures = (): void => {
  if (textureCache.size <= MAX_CACHE_SIZE) return;

  const entries = Array.from(textureLastUsed.entries());
  entries.sort((a, b) => a[1] - b[1]);

  const toRemove = textureCache.size - MAX_CACHE_SIZE;
  for (let i = 0; i < toRemove && i < entries.length; i++) {
    const [url] = entries[i];
    const tex = textureCache.get(url);
    if (tex) {
      tex.dispose();
      textureCache.delete(url);
      textureLastUsed.delete(url);
    }
  }
};

/**
 * Get or load a texture.
 * Returns immediately. Calls onLoad when texture is ready.
 */
export const getTexture = (
  item: MediaItem,
  onLoad?: (texture: THREE.Texture) => void
): void => {
  const url = item.url;
  textureLastUsed.set(url, performance.now());

  // Already loaded?
  const existing = textureCache.get(url);
  if (existing && existing.image) {
    onLoad?.(existing);
    return;
  }

  // Add callback
  if (onLoad) {
    if (!loadCallbacks.has(url)) {
      loadCallbacks.set(url, new Set());
    }
    loadCallbacks.get(url)!.add(onLoad);
  }

  // Already queued or loading?
  if (loadingUrls.has(url) || loadQueue.includes(url)) {
    return;
  }

  // Add to queue and start processing
  loadQueue.push(url);
  processQueue();
};

/**
 * Preload textures (same as getTexture but no callback).
 */
export const preloadTextures = (items: MediaItem[]): void => {
  for (const item of items) {
    const url = item.url;
    if (
      textureCache.has(url) ||
      loadingUrls.has(url) ||
      loadQueue.includes(url)
    ) {
      continue;
    }
    loadQueue.push(url);
  }
  processQueue();
};

/**
 * Preload all textures and return a promise that resolves when all are loaded.
 * Use this for initial load to ensure cache is fully populated.
 * Optional onProgress callback reports progress as 0-1.
 */
export const preloadAllTextures = (
  items: MediaItem[],
  onProgress?: (progress: number) => void
): Promise<void> => {
  return new Promise((resolve) => {
    const total = items.length;
    let loaded = 0;

    if (total === 0) {
      onProgress?.(1);
      resolve();
      return;
    }

    const reportProgress = () => {
      loaded++;
      onProgress?.(loaded / total);
      if (loaded === total) resolve();
    };

    for (const item of items) {
      const url = item.url;

      // Already cached?
      if (textureCache.has(url) && textureCache.get(url)?.image) {
        reportProgress();
        continue;
      }

      // Load with callback
      getTexture(item, () => {
        reportProgress();
      });
    }
  });
};

/**
 * Check if texture is loaded and ready.
 */
export const isTextureCached = (url: string): boolean => {
  const tex = textureCache.get(url);
  if (!tex) return false;
  // Check for ImageBitmap or HTMLImageElement
  const img = tex.image;
  if (img instanceof ImageBitmap) return true;
  if (img instanceof HTMLImageElement)
    return img.complete && img.naturalWidth > 0;
  return img !== null && img !== undefined;
};

/**
 * Get cached texture directly (for instant display).
 */
export const getCachedTexture = (url: string): THREE.Texture | null => {
  const tex = textureCache.get(url);
  if (!tex) return null;
  const img = tex.image;
  if (img instanceof ImageBitmap) return tex;
  if (img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0)
    return tex;
  if (img !== null && img !== undefined) return tex;
  return null;
};

/**
 * Clear the texture cache.
 */
export const clearTextureCache = (): void => {
  textureCache.forEach((tex) => tex.dispose());
  textureCache.clear();
  loadCallbacks.clear();
  textureLastUsed.clear();
  loadQueue.length = 0;
  activeLoads = 0;
  loadingUrls.clear();
};

// Keep these exports for compatibility but they're no-ops now
export const updateScrollVelocity = (_velocity: number): void => {};
export const boostPriority = (_urls: string[]): void => {};
export const getLoadingStats = () => ({
  cached: textureCache.size,
  queued: loadQueue.length,
  loading: activeLoads,
});
