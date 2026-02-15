import { type ReactNode, useEffect, useState } from "react";

/**
 * LUMEN INTERFACE OVERLAY
 *
 * A minimal, system-like overlay that feels like an internal workspace
 * of an unknown organization. Calm, sterile, subtly disturbing.
 *
 * "The visitor is not meant to understand the system,
 *  only to observe its calm efficiency."
 */

interface SystemOverlayProps {
  /** Cryptic organizational designation */
  designation?: string;
  /** Operator identifier */
  operatorId?: string;
  /** Operator clearance level */
  clearance?: string;
  /** System status - affects indicator color */
  status?: "nominal" | "processing" | "standby";
  /** Show scan line effect */
  showScanLines?: boolean;
  /** Callback when contact is clicked */
  onContactClick?: () => void;
  /** Callback when games/recreation is clicked */
  onGamesClick?: () => void;
  /** Children rendered in center (optional) */
  children?: ReactNode;
}

/**
 * Main system overlay - minimal, mysterious, institutional.
 */
export function SystemOverlay({
  designation = "SECTOR-7G",
  operatorId = "yyyyaaa",
  clearance = "CREATIVE",
  status = "nominal",
  showScanLines = true,
  onContactClick,
  onGamesClick,
  children,
}: SystemOverlayProps) {

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

      {/* Top right - Fan Request button */}
      <div className="absolute top-5 right-5 sm:top-6 sm:right-6">
        <a
          className="pointer-events-auto font-system text-[var(--void-gray-400)] transition-colors hover:text-[var(--void-gray-600)]"
          href="https://x.com/intent/post?text=Hey%20%40notshananigans%20I%20want%20to%20see%20Shoyo%20do%20"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="text-[var(--void-gray-300)] hover:text-[var(--void-gray-500)]">[</span>
          FAN REQUEST
          <span className="text-[var(--void-gray-300)] hover:text-[var(--void-gray-500)]">]</span>
        </a>
      </div>

      {/* Bottom left - Recreation */}
      <div
        className="absolute left-5 sm:left-6"
        style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {onGamesClick && (
          <button
            className="pointer-events-auto font-system text-[var(--void-gray-300)] transition-colors hover:text-[var(--void-gray-500)]"
            onClick={onGamesClick}
            type="button"
          >
            [RECREATION]
          </button>
        )}
      </div>

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
 * Feels like accessing records in a massive corporate system.
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

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : `${d}.`));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  // Animate record count
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
      {/* Main loading text */}
      <div className="flex flex-col items-center gap-6">
        <div className="font-designation text-[var(--void-gray-500)]">
          {message}
          <span className="inline-block w-6">{dots}</span>
        </div>

        {/* Progress bar */}
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

        {/* Record count */}
        {progress !== undefined && (
          <div className="font-system text-[var(--void-gray-300)]">
            {recordCount} / 45 RECORDS
          </div>
        )}
      </div>

      {/* Bottom system message */}
      <div className="absolute bottom-8 font-system text-[var(--void-gray-300)]">
        PLEASE REMAIN CALM
      </div>
    </div>
  );
}

/**
 * System label tooltip - appears on hover over images.
 * Used for the uncanny "PROCESSING", "ARCHIVED" labels.
 */
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

/**
 * Get a deterministic system label based on index.
 * Creates the illusion of a classification system.
 */
export function getSystemLabel(index: number): SystemLabel {
  // Weight towards mundane labels, rare chance of unsettling ones
  const weights = [20, 25, 5, 15, 10, 3, 15, 4, 2, 1];
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  // Use index as seed for deterministic selection
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

// ─────────────────────────────────────────────────────────────────────────────
// Utility functions
// ─────────────────────────────────────────────────────────────────────────────

function formatSystemTime(): string {
  const now = new Date();
  return now.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function generateSessionId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy exports (for backwards compatibility)
// ─────────────────────────────────────────────────────────────────────────────

export { SystemOverlay as Overlay };

export const GithubIcon = () => (
  <svg
    aria-hidden="true"
    fill="currentColor"
    height="18"
    viewBox="0 0 24 24"
    width="18"
  >
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

export const TwitterIcon = () => (
  <svg
    aria-hidden="true"
    fill="currentColor"
    height="18"
    viewBox="0 0 24 24"
    width="18"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const LinkedInIcon = () => (
  <svg
    aria-hidden="true"
    fill="currentColor"
    height="18"
    viewBox="0 0 24 24"
    width="18"
  >
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

export const EmailIcon = () => (
  <svg
    aria-hidden="true"
    fill="none"
    height="18"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="18"
  >
    <rect height="16" rx="2" width="20" x="2" y="4" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);