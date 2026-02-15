import { type ReactNode, useEffect, useState } from "react";

interface SystemOverlayProps {
  /** Show scan line effect */
  showScanLines?: boolean;
  /** Callback when games/recreation is clicked */
  onGamesClick?: () => void;
  /** Children rendered in center (optional) */
  children?: ReactNode;
  /** Allow extra props to pass through without errors */
  [key: string]: unknown;
}

/**
 * FYI Modal
 */
function FYIModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabIndex={0}
        aria-label="Close"
      />

      {/* Modal */}
      <div className="relative mx-4 max-h-[80vh] w-full max-w-lg overflow-y-auto border border-[var(--void-gray-300)] bg-white p-6 shadow-lg">
        {/* Close button */}
        <button
          className="absolute top-4 right-4 font-system text-[var(--void-gray-400)] transition-colors hover:text-[var(--void-gray-600)]"
          onClick={onClose}
          type="button"
        >
          ✕
        </button>

        <div className="font-system text-[11px] leading-relaxed text-[var(--void-gray-500)]">
          <p className="mb-4">
            hi!{" "}
            <a
              href="https://x.com/notshananigans"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--void-gray-600)] underline transition-colors hover:text-black"
            >
              shanz
            </a>
            {" "}here,
          </p>

          <p className="mb-4">
            1) if u wanna create sth like this w the infinite zoom in + out, pls go to{" "}
            <a
              href="https://github.com/yyyyaaa/yyyyaaa-2026"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--void-gray-600)] underline transition-colors hover:text-black"
            >
              this link
            </a>
            {" "}from{" "}
            <a
              href="https://x.com/phatggg"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--void-gray-600)] underline transition-colors hover:text-black"
            >
              @phatggg
            </a>
            {" "}on x who was kind enough to open source his{" "}
            <a
              href="https://www.yyyyaaa.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--void-gray-600)] underline transition-colors hover:text-black"
            >
              website
            </a>
          </p>

          <p className="mb-3">
            2) if u wanna create similar images — use this prompt in chatgpt:
          </p>

          <div className="mb-2 border border-[var(--void-gray-200)] bg-[var(--void-gray-50,#fafafa)] p-3 text-[10px] leading-relaxed text-[var(--void-gray-400)]">
            <p className="mb-2 font-bold text-[var(--void-gray-500)]">Updated prompt (copy/paste):</p>
            <p className="mb-2">
              Stylized miniature collectible figurine of Hinata Shoyo from Haikyuu!! — non-chibi anime scale figure. Render as a 1/8 scale PVC/resin collectible with true-to-anime proportions: head only slightly oversized (NOT chibi), slender limbs, realistic teen-athlete body ratios, clean simplified geometry, crisp silhouette, matte plastic/resin material, soft stylized shading, minimal micro-texture, clean modern collectible aesthetic (premium figure photography vibe), not photoreal skin.
            </p>
            <p className="mb-2">
              Pose: Hinata crouched / bent forward, both hands low, gently scattering small crumbs toward 3–4 crows on the ground; calm focused expression; hair spiky orange; Karasuno uniform.
            </p>
            <p className="mb-2">
              Diorama base: small clean miniature base with smooth continuous realistic flooring (cast concrete / compacted ground), subtle natural surface texture, softly blended edges, a few small realistic environment accents (tiny grass tufts, a small bench or bag optional), NO tiles, NO blocky/lego look, NO hard grid patterns. Balanced composition, miniature scale model, isometric 3/4 top-down view, centered product shot.
            </p>
            <p className="mb-2">
              Lighting &amp; render: bright white background, soft studio product lighting, high-key exposure, soft contact shadows, global illumination, clean edges, consistent style, sharp focus, 4K, modern collectible render.
            </p>
            <p>
              Negative prompt: chibi, super deformed, big head, tiny body, bobblehead, nendoroid, SD style, cartoon toy proportions, kawaii oversized face, huge eyes, toddler proportions; photoreal human skin, pores, veins, realism, gritty texture; lego, voxel, blocky base, tiled floor, checkerboard, hard grid; low-res, blurry, noisy, messy background, harsh shadows, dramatic low-key lighting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main system overlay
 */
export function SystemOverlay({
  showScanLines = true,
  children,
}: SystemOverlayProps) {
  const [isFYIOpen, setIsFYIOpen] = useState(false);

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-10 ${showScanLines ? "scan-lines" : ""}`}
    >
      {/* Top left - Haikyuu logo */}
      <div className="absolute top-5 left-5 sm:top-6 sm:left-6">
        <a href="https://www.netflix.com/title/80090673" target="_blank" rel="noopener noreferrer" className="pointer-events-auto">
          <img
            src="/haikyuu-logo.png"
            alt="Haikyuu"
            className="h-10 w-auto opacity-90"
          />
        </a>
      </div>

      {/* Top right - Fan Request + FYI */}
      <div className="absolute top-5 right-5 text-right sm:top-6 sm:right-6">
        <a
          className="pointer-events-auto font-system text-[var(--void-gray-400)] transition-colors hover:text-[var(--void-gray-600)]"
          href="https://x.com/intent/post?text=hey%20%40notshananigans%2C%20i%20want%20to%20see%20shoyo%20do%20"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="text-[var(--void-gray-300)] hover:text-[var(--void-gray-500)]">[</span>
          FAN REQUEST
          <span className="text-[var(--void-gray-300)] hover:text-[var(--void-gray-500)]">]</span>
        </a>

        <div className="mt-1">
          <button
            className="pointer-events-auto font-system text-[var(--void-gray-400)] transition-colors hover:text-[var(--void-gray-600)]"
            onClick={() => setIsFYIOpen(true)}
            type="button"
          >
            <span className="text-[var(--void-gray-300)] hover:text-[var(--void-gray-500)]">[</span>
            FYI
            <span className="text-[var(--void-gray-300)] hover:text-[var(--void-gray-500)]">]</span>
          </button>
        </div>
      </div>

      {/* FYI Modal */}
      <FYIModal isOpen={isFYIOpen} onClose={() => setIsFYIOpen(false)} />

      {/* Center content slot */}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}

      {/* Corner decorations - subtle framing */}
      <CornerFrame />
    </div>
  );
}

/**
 * Corner frame decoration - institutional, clinical framing.
 */
function CornerFrame() {
  const cornerClass =
    "absolute w-4 h-4 border-[var(--void-gray-200)] opacity-40";

  return (
    <>
      <div
        className={`${cornerClass} top-3 left-3 border-t border-l sm:top-4 sm:left-4`}
      />
      <div
        className={`${cornerClass} top-3 right-3 border-t border-r sm:top-4 sm:right-4`}
      />
      <div
        className={`${cornerClass} left-3 border-b border-l sm:left-4`}
        style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
      />
      <div
        className={`${cornerClass} right-3 border-r border-b sm:right-4`}
        style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
      />
    </>
  );
}

/**
 * Database-style loading screen.
 */
export function DatabaseLoader({
  progress,
  message = "ACCESSING RECORDS",
}: {
  progress?: number;
  message?: string;
}) {
  const [dots, setDots] = useState("");
  const [recordCount, setRecordCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : `${d}.`));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress === undefined) {
      return;
    }
    const target = Math.floor(progress * 45);
    if (recordCount < target) {
      const timeout = setTimeout(() => {
        setRecordCount((c) => Math.min(c + 1, target));
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [progress, recordCount]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-6">
        <div className="font-designation text-[var(--void-gray-500)]">
          {message}
          <span className="inline-block w-6">{dots}</span>
        </div>
        <div className="h-px w-48 overflow-hidden bg-[var(--void-gray-200)]">
          {progress !== undefined ? (
            <div
              className="h-full bg-[var(--void-gray-400)] transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          ) : (
            <div className="h-full w-1/4 animate-progress bg-[var(--void-gray-400)]" />
          )}
        </div>
        {progress !== undefined && (
          <div className="font-system text-[var(--void-gray-300)]">
            {recordCount} / 45 RECORDS
          </div>
        )}
      </div>
      <div className="absolute bottom-8 font-system text-[var(--void-gray-300)]">
        PLEASE REMAIN CALM
      </div>
    </div>
  );
}

export const SYSTEM_LABELS = [
  "PROCESSING",
  "ARCHIVED",
  "REDACTED",
  "INCOMPLETE",
  "PENDING REVIEW",
  "CLASSIFIED",
  "APPROVED",
  "UNDER OBSERVATION",
  "ERROR: HUMAN INPUT REQUIRED",
  "DO NOT DISTURB",
] as const;

export type SystemLabel = (typeof SYSTEM_LABELS)[number];

export function getSystemLabel(index: number): SystemLabel {
  const weights = [20, 25, 5, 15, 10, 3, 15, 4, 2, 1];
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const seed = ((index * 7919) % totalWeight) + 1;
  let cumulative = 0;

  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (seed <= cumulative) {
      return SYSTEM_LABELS[i];
    }
  }

  return "ARCHIVED";
}

// Legacy exports
export { SystemOverlay as Overlay };

export const GithubIcon = () => (
  <svg aria-hidden="true" fill="currentColor" height="18" viewBox="0 0 24 24" width="18">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

export const TwitterIcon = () => (
  <svg aria-hidden="true" fill="currentColor" height="18" viewBox="0 0 24 24" width="18">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const LinkedInIcon = () => (
  <svg aria-hidden="true" fill="currentColor" height="18" viewBox="0 0 24 24" width="18">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

export const EmailIcon = () => (
  <svg aria-hidden="true" fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18">
    <rect height="16" rx="2" width="20" x="2" y="4" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);