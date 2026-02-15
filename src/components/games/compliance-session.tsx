import { useCallback, useEffect, useRef, useState } from "react";
import { type GameProps, getRandomMessage } from "./types";

/**
 * COMPLIANCE SESSION
 *
 * A clicker/idle game where you maintain a compliance bar.
 * No explanation of what compliance means.
 * The bar drains faster over time.
 * You can never win, only maintain.
 *
 * "Productivity is peace."
 */

interface ComplianceState {
  level: number; // 0-100
  tier: number; // Increases at milestones
  clicks: number;
  drainRate: number; // Increases over time
  message: string;
  messageType: "positive" | "neutral" | "negative" | "cryptic";
}

const TIER_THRESHOLDS = [100, 500, 1000, 2500, 5000, 10_000];
const TIER_NAMES = [
  "PROBATIONARY",
  "PROVISIONAL",
  "STANDARD",
  "ELEVATED",
  "DISTINGUISHED",
  "EXEMPLARY",
  "TRANSCENDENT",
];

export function ComplianceSession({ onExit }: GameProps) {
  const [state, setState] = useState<ComplianceState>({
    level: 50,
    tier: 0,
    clicks: 0,
    drainRate: 0.3,
    message: "MAINTAIN COMPLIANCE LEVEL",
    messageType: "neutral",
  });

  const [isTerminated, setIsTerminated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastClickTime = useRef(Date.now());

  // Drain compliance over time
  useEffect(() => {
    if (isTerminated) {
      return;
    }

    const interval = setInterval(() => {
      setState((prev) => {
        const timeSinceClick = Date.now() - lastClickTime.current;
        const idleMultiplier = Math.min(timeSinceClick / 5000, 2); // Drain faster when idle

        const newLevel = Math.max(
          0,
          prev.level - prev.drainRate * (1 + idleMultiplier * 0.5)
        );

        if (newLevel <= 0) {
          setIsTerminated(true);
          return { ...prev, level: 0 };
        }

        // Random cryptic message
        if (Math.random() < 0.01) {
          return {
            ...prev,
            level: newLevel,
            message: getRandomMessage("cryptic"),
            messageType: "cryptic" as const,
          };
        }

        return { ...prev, level: newLevel };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isTerminated]);

  // Handle click
  const handleClick = useCallback(() => {
    if (isTerminated) {
      return;
    }

    lastClickTime.current = Date.now();

    setState((prev) => {
      const newClicks = prev.clicks + 1;
      const levelGain = Math.max(1, 5 - prev.tier * 0.5); // Less effective at higher tiers
      const newLevel = Math.min(100, prev.level + levelGain);

      // Check for tier upgrade
      let newTier = prev.tier;
      let newMessage = prev.message;
      let newMessageType = prev.messageType;
      let newDrainRate = prev.drainRate;

      const nextThreshold = TIER_THRESHOLDS[prev.tier];
      if (nextThreshold && newClicks >= nextThreshold) {
        newTier = prev.tier + 1;
        newDrainRate = prev.drainRate + 0.1;
        newMessage = `TIER ${newTier + 1} CLEARANCE ACHIEVED`;
        newMessageType = "positive";
      } else if (newClicks % 50 === 0) {
        // Periodic messages
        newMessage = getRandomMessage("positive");
        newMessageType = "positive";
      } else if (newClicks % 25 === 0) {
        newMessage = getRandomMessage("neutral");
        newMessageType = "neutral";
      }

      return {
        level: newLevel,
        tier: newTier,
        clicks: newClicks,
        drainRate: newDrainRate,
        message: newMessage,
        messageType: newMessageType,
      };
    });
  }, [isTerminated]);

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onExit();
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleClick();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExit, handleClick]);

  // Resume from termination
  const handleResume = useCallback(() => {
    setIsTerminated(false);
    setState((prev) => ({
      ...prev,
      level: 50,
      message: "SESSION RESUMED",
      messageType: "neutral",
    }));
  }, []);

  const messageColor = {
    positive: "text-[var(--system-green)]",
    neutral: "text-[var(--void-gray-400)]",
    negative: "text-[var(--system-red)]",
    cryptic: "text-[var(--system-amber)]",
  }[state.messageType];

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center bg-white p-8"
      onClick={handleClick}
      ref={containerRef}
    >
      {isTerminated ? (
        <TerminatedState onExit={onExit} onResume={handleResume} />
      ) : (
        <>
          {/* Header */}
          <div className="mb-8 text-center">
            <h2 className="font-designation text-[var(--void-gray-600)]">
              COMPLIANCE SESSION
            </h2>
            <p className="mt-1 font-system text-[var(--void-gray-300)]">
              CLEARANCE: {TIER_NAMES[state.tier]}
            </p>
          </div>

          {/* Main compliance bar */}
          <div className="mb-6 w-full max-w-xs">
            <div className="mb-2 flex justify-between font-system text-[var(--void-gray-400)]">
              <span>COMPLIANCE LEVEL</span>
              <span>{Math.round(state.level)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden bg-[var(--void-gray-200)]">
              <div
                className="h-full transition-all duration-100"
                style={{
                  width: `${state.level}%`,
                  backgroundColor:
                    state.level > 60
                      ? "var(--system-green)"
                      : state.level > 30
                        ? "var(--system-amber)"
                        : "var(--system-red)",
                }}
              />
            </div>
          </div>

          {/* Message display */}
          <div className={`mb-8 h-6 text-center font-system ${messageColor}`}>
            {state.message}
          </div>

          {/* Click area indicator */}
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 h-16 w-16 cursor-pointer border border-[var(--void-gray-200)] bg-[var(--void-gray-100)] transition-colors hover:border-[var(--void-gray-400)]" />
            <p className="font-system text-[var(--void-gray-300)]">
              CLICK OR PRESS SPACE
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-8 font-system text-[var(--void-gray-400)]">
            <div>
              <span className="text-[var(--void-gray-300)]">ACTIONS</span>{" "}
              {state.clicks}
            </div>
            <div>
              <span className="text-[var(--void-gray-300)]">DRAIN RATE</span>{" "}
              {state.drainRate.toFixed(1)}
            </div>
          </div>

          {/* Exit hint */}
          <button
            className="absolute top-4 right-4 font-system text-[var(--void-gray-300)] transition-colors hover:text-[var(--void-gray-500)]"
            onClick={(e) => {
              e.stopPropagation();
              onExit();
            }}
            type="button"
          >
            [ESC]
          </button>
        </>
      )}
    </div>
  );
}

function TerminatedState({
  onResume,
  onExit,
}: {
  onResume: () => void;
  onExit: () => void;
}) {
  return (
    <div className="text-center">
      <div className="status-indicator mx-auto mb-4 bg-[var(--system-red)]" />
      <h3 className="mb-2 font-designation text-[var(--void-gray-600)]">
        COMPLIANCE SESSION TERMINATED
      </h3>
      <p className="mb-6 font-system text-[var(--void-gray-400)]">
        YOUR COMPLIANCE HAS LAPSED
      </p>
      <div className="flex justify-center gap-4">
        <button
          className="font-system text-[var(--void-gray-500)] transition-colors hover:text-[var(--void-gray-700)]"
          onClick={onResume}
          type="button"
        >
          [RESUME SESSION]
        </button>
        <button
          className="font-system text-[var(--void-gray-400)] transition-colors hover:text-[var(--void-gray-600)]"
          onClick={onExit}
          type="button"
        >
          [EXIT]
        </button>
      </div>
    </div>
  );
}
