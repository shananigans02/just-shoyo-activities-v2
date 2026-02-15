import { useCallback, useEffect, useRef, useState } from "react";
import type { GameProps } from "./types";

/**
 * CURSOR TEST
 *
 * Demonstrate hand stability within designated parameters.
 * Keep your cursor inside the shrinking zone.
 * Remain calm.
 *
 * "Your stability has been recorded."
 */

const INITIAL_ZONE_SIZE = 200;
const MIN_ZONE_SIZE = 40;
const SHRINK_RATE = 0.3; // pixels per frame (60fps)
const STABILITY_DRAIN = 0.5; // per frame when outside
const STABILITY_GAIN = 0.1; // per frame when inside

const MESSAGES = {
  stable: [
    "STABILITY ACCEPTABLE",
    "HAND MOVEMENT NORMAL",
    "MOTOR FUNCTION ADEQUATE",
    "CONTROL MAINTAINED",
  ],
  unstable: [
    "MINOR TREMOR DETECTED",
    "DEVIATION RECORDED",
    "INSTABILITY NOTED",
    "CONTROL WAVERING",
  ],
  warning: [
    "STABILITY CRITICAL",
    "INTERVENTION RECOMMENDED",
    "ASSESSMENT COMPROMISED",
    "RECALIBRATION REQUIRED",
  ],
  complete: [
    "PHASE COMPLETE",
    "PROCEEDING TO NEXT LEVEL",
    "ASSESSMENT CONTINUES",
    "PARAMETERS RESET",
  ],
  failed: [
    "TEST INCONCLUSIVE",
    "STABILITY INSUFFICIENT",
    "REASSESSMENT REQUIRED",
    "RESULTS INVALIDATED",
  ],
};

function getMessage(type: keyof typeof MESSAGES): string {
  const arr = MESSAGES[type];
  return arr[Math.floor(Math.random() * arr.length)];
}

export function CursorTest({ onExit }: GameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  const [zoneSize, setZoneSize] = useState(INITIAL_ZONE_SIZE);
  const [stability, setStability] = useState(100);
  const [isInside, setIsInside] = useState(true);
  const [message, setMessage] = useState("INITIALIZING...");
  const [level, setLevel] = useState(1);
  const [isFailed, setIsFailed] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Cursor position relative to center
  const cursorPos = useRef({ x: 0, y: 0 });
  const containerCenter = useRef({ x: 0, y: 0 });

  // Update container center on mount and resize
  useEffect(() => {
    const updateCenter = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        containerCenter.current = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      }
    };

    updateCenter();
    window.addEventListener("resize", updateCenter);
    return () => window.removeEventListener("resize", updateCenter);
  }, []);

  // Mouse move handler
  const handleMouseMove = useCallback((e: MouseEvent) => {
    cursorPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onExit();
        return;
      }
      if (e.key === " " && isFailed) {
        // Restart
        setZoneSize(INITIAL_ZONE_SIZE);
        setStability(100);
        setIsFailed(false);
        setMessage("RESUMING ASSESSMENT...");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExit, isFailed]);

  // Main game loop
  useEffect(() => {
    if (isFailed || isPaused) return;

    let lastMessageTime = Date.now();

    const gameLoop = () => {
      // Calculate distance from center
      const dx = cursorPos.current.x - containerCenter.current.x;
      const dy = cursorPos.current.y - containerCenter.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const halfZone = zoneSize / 2;

      const inside = distance <= halfZone;
      setIsInside(inside);

      // Update stability
      setStability((prev) => {
        const newStability = inside
          ? Math.min(100, prev + STABILITY_GAIN)
          : Math.max(0, prev - STABILITY_DRAIN);

        // Check for failure
        if (newStability <= 0) {
          setIsFailed(true);
          setMessage(getMessage("failed"));
          return 0;
        }

        return newStability;
      });

      // Shrink zone
      setZoneSize((prev) => {
        const newSize = prev - SHRINK_RATE;

        // Check for level complete
        if (newSize <= MIN_ZONE_SIZE) {
          setLevel((l) => l + 1);
          setMessage(getMessage("complete"));
          return INITIAL_ZONE_SIZE - level * 20; // Each level starts smaller
        }

        return newSize;
      });

      // Update message periodically
      const now = Date.now();
      if (now - lastMessageTime > 3000) {
        lastMessageTime = now;
        setStability((s) => {
          if (s > 70) {
            setMessage(getMessage("stable"));
          } else if (s > 30) {
            setMessage(getMessage("unstable"));
          } else {
            setMessage(getMessage("warning"));
          }
          return s;
        });
      }

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    // Initial delay
    const timer = setTimeout(() => {
      setMessage("BEGIN");
      animationRef.current = requestAnimationFrame(gameLoop);
    }, 1500);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animationRef.current);
    };
  }, [isFailed, isPaused, zoneSize, level]);

  // Pause when mouse leaves container
  const handleMouseEnter = useCallback(() => setIsPaused(false), []);
  const handleMouseLeave = useCallback(() => setIsPaused(true), []);

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-[var(--void-gray-200)] border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`status-indicator-glow ${
              stability > 50
                ? "bg-[var(--system-green)] text-[var(--system-green)]"
                : stability > 25
                  ? "bg-[var(--system-amber)] text-[var(--system-amber)]"
                  : "bg-[var(--system-red)] text-[var(--system-red)]"
            }`}
          />
          <span className="font-designation text-[var(--void-gray-600)]">
            CURSOR TEST
          </span>
        </div>
        <button
          className="font-system text-[var(--void-gray-400)] transition-colors hover:text-[var(--void-gray-600)]"
          onClick={onExit}
          type="button"
        >
          [ESC]
        </button>
      </div>

      {/* Stats bar */}
      <div className="border-[var(--void-gray-100)] border-b px-6 py-3">
        <div className="flex items-center justify-between">
          <span className="font-system text-[var(--void-gray-400)]">
            LEVEL: {level}
          </span>
          <div className="flex items-center gap-4">
            <span className="font-system text-[10px] text-[var(--void-gray-300)]">
              STABILITY
            </span>
            <div className="h-2 w-32 bg-[var(--void-gray-200)]">
              <div
                className={`h-full transition-all duration-100 ${
                  stability > 50
                    ? "bg-[var(--system-green)]"
                    : stability > 25
                      ? "bg-[var(--system-amber)]"
                      : "bg-[var(--system-red)]"
                }`}
                style={{ width: `${stability}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main area */}
      <div
        className="relative flex flex-1 items-center justify-center bg-[var(--void-gray-50)]"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        ref={containerRef}
      >
        {/* Target zone */}
        <div
          className={`pointer-events-none absolute border-2 transition-colors duration-200 ${
            isInside
              ? "border-[var(--system-green)] bg-[var(--system-green)]/5"
              : "border-[var(--system-red)] bg-[var(--system-red)]/5"
          }`}
          style={{
            width: zoneSize,
            height: zoneSize,
          }}
        />

        {/* Center crosshair */}
        <div className="pointer-events-none absolute">
          <div className="absolute top-1/2 left-1/2 h-px w-4 -translate-x-1/2 bg-[var(--void-gray-300)]" />
          <div className="absolute top-1/2 left-1/2 h-4 w-px -translate-y-1/2 bg-[var(--void-gray-300)]" />
        </div>

        {/* Failed overlay */}
        {isFailed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90">
            <div className="mb-4 font-designation text-[var(--void-gray-600)] text-xl">
              {message}
            </div>
            <div className="font-system text-[var(--void-gray-400)]">
              PRESS [SPACE] TO RESTART
            </div>
          </div>
        )}

        {/* Paused indicator */}
        {isPaused && !isFailed && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <div className="font-system text-[var(--void-gray-400)]">
              RETURN CURSOR TO CONTINUE
            </div>
          </div>
        )}
      </div>

      {/* Message area */}
      <div className="border-[var(--void-gray-100)] border-t px-6 py-3">
        <div className="text-center font-system text-[var(--void-gray-500)]">
          {message}
        </div>
      </div>

      {/* Footer */}
      <div className="border-[var(--void-gray-100)] border-t px-6 py-3">
        <div className="text-center font-system text-[10px] text-[var(--void-gray-300)]">
          REMAIN CALM • KEEP CURSOR INSIDE ZONE
        </div>
      </div>
    </div>
  );
}
