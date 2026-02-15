import { lazy, Suspense } from "react";
import { DatabaseLoader } from "../overlay";
import type { InfiniteCanvasSceneProps } from "./scene";

export type { InfiniteCanvasSceneProps } from "./scene";

/**
 * Lazy-loaded Infinite Canvas component.
 * Shows a database-access loading screen while loading Three.js.
 */
const LazyInfiniteCanvasScene = lazy(() =>
  import("./scene").then((mod) => ({ default: mod.InfiniteCanvasScene }))
);

export function InfiniteCanvas(props: InfiniteCanvasSceneProps) {
  return (
    <Suspense fallback={<DatabaseLoader message="INITIALIZING SYSTEM" />}>
      <LazyInfiniteCanvasScene {...props} />
    </Suspense>
  );
}
