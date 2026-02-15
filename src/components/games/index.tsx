import { useCallback, useEffect, useState } from "react";
import { BoxAlignment } from "./box-alignment";
import { ComplianceSession } from "./compliance-session";
import { CursorTest } from "./cursor-test";
import { DepartmentOverview } from "./department-overview";
import { ElevatorCalibration } from "./elevator-calibration";
import { FileSorting } from "./file-sorting";
import { InboxZero } from "./inbox-zero";
import { MemoryCalibration } from "./memory-calibration";
import { MicroMaze } from "./micro-maze";
import { RedactionTool } from "./redaction-tool";
import { SurveillanceTagging } from "./surveillance-tagging";
import { TimeLogging } from "./time-logging";
import { GAME_METADATA, type GameType } from "./types";
import { WellnessCheck } from "./wellness-check";

/**
 * RECREATIONAL MODULES
 *
 * A collection of mandatory recreational activities
 * designed to maintain operator wellness and productivity.
 *
 * "Recreation is mandatory."
 */

interface GameLauncherProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GameLauncher({ isOpen, onClose }: GameLauncherProps) {
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !selectedGame) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, selectedGame]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setSelectedGame(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleGameExit = useCallback(() => {
    setSelectedGame(null);
  }, []);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      if (e.target === e.currentTarget && !selectedGame) {
        onClose();
      }
    },
    [selectedGame, onClose]
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-labelledby="game-launcher-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleBackdropClick(e);
        }
      }}
      role="dialog"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-white/95 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative mx-4 h-full max-h-[600px] w-full max-w-2xl animate-fade-in border border-[var(--void-gray-200)] bg-white">
        {selectedGame ? (
          <GameRenderer game={selectedGame} onExit={handleGameExit} />
        ) : (
          <GameMenu onClose={onClose} onSelectGame={setSelectedGame} />
        )}
      </div>
    </div>
  );
}

function GameMenu({
  onSelectGame,
  onClose,
}: {
  onSelectGame: (game: GameType) => void;
  onClose: () => void;
}) {
  const games: GameType[] = [
    "compliance",
    "memory",
    "wellness",
    "inbox",
    "overview",
    "box-alignment",
    "file-sorting",
    "surveillance-tagging",
    "elevator-calibration",
    "micro-maze",
    "redaction-tool",
    "time-logging",
    "cursor-test",
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-[var(--void-gray-200)] border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="status-indicator-glow bg-[var(--system-green)] text-[var(--system-green)]" />
          <h2
            className="font-designation text-[var(--void-gray-600)]"
            id="game-launcher-title"
          >
            RECREATIONAL MODULES
          </h2>
        </div>
        <button
          aria-label="Close"
          className="font-system text-[var(--void-gray-400)] transition-colors hover:text-[var(--void-gray-600)]"
          onClick={onClose}
          type="button"
        >
          [ESC]
        </button>
      </div>

      {/* Subtitle */}
      <div className="border-[var(--void-gray-100)] border-b px-6 py-3">
        <p className="font-system text-[var(--void-gray-400)]">
          SELECT MANDATORY RECREATIONAL ACTIVITY
        </p>
      </div>

      {/* Game list */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {games.map((game) => {
            const meta = GAME_METADATA[game];
            return (
              <button
                className="group flex flex-col items-start border border-[var(--void-gray-200)] bg-[var(--void-gray-100)] p-4 text-left transition-colors hover:border-[var(--void-gray-400)] hover:bg-white"
                key={game}
                onClick={() => onSelectGame(game)}
                type="button"
              >
                <div className="mb-1 flex w-full items-center justify-between">
                  <span className="font-designation text-[var(--void-gray-600)]">
                    {meta.title}
                  </span>
                  <span className="font-system text-[10px] text-[var(--void-gray-300)] opacity-0 transition-opacity group-hover:opacity-100">
                    [SELECT]
                  </span>
                </div>
                <span className="mb-2 font-system text-[10px] text-[var(--system-amber)]">
                  {meta.subtitle}
                </span>
                <span className="font-system text-[var(--void-gray-400)]">
                  {meta.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-[var(--void-gray-100)] border-t px-6 py-3">
        <p className="text-center font-system text-[10px] text-[var(--void-gray-300)]">
          RECREATION IS MANDATORY • YOUR PARTICIPATION IS LOGGED
        </p>
      </div>
    </div>
  );
}

function GameRenderer({
  game,
  onExit,
}: {
  game: GameType;
  onExit: () => void;
}) {
  switch (game) {
    case "compliance":
      return <ComplianceSession onExit={onExit} />;
    case "memory":
      return <MemoryCalibration onExit={onExit} />;
    case "wellness":
      return <WellnessCheck onExit={onExit} />;
    case "inbox":
      return <InboxZero onExit={onExit} />;
    case "overview":
      return <DepartmentOverview onExit={onExit} />;
    case "box-alignment":
      return <BoxAlignment onExit={onExit} />;
    case "file-sorting":
      return <FileSorting onExit={onExit} />;
    case "surveillance-tagging":
      return <SurveillanceTagging onExit={onExit} />;
    case "elevator-calibration":
      return <ElevatorCalibration onExit={onExit} />;
    case "micro-maze":
      return <MicroMaze onExit={onExit} />;
    case "redaction-tool":
      return <RedactionTool onExit={onExit} />;
    case "time-logging":
      return <TimeLogging onExit={onExit} />;
    case "cursor-test":
      return <CursorTest onExit={onExit} />;
    default:
      return null;
  }
}

export type { GameType } from "./types";
// Re-export types and components for convenience
export { GAME_METADATA } from "./types";
