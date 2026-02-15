import { useCallback, useEffect, useState } from "react";
import type { GameProps } from "./types";

/**
 * TIME LOGGING
 *
 * Fill fake timesheets with meaningless activity codes.
 * No effect. No consequence. All entries are permanent.
 *
 * "Your time has been allocated."
 */

interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  activity: string;
  isLocked: boolean;
}

const ACTIVITIES = [
  "PROCESSING",
  "WAITING",
  "OBSERVING",
  "HOLDING",
  "REVIEWING",
  "IDLE",
  "CALIBRATING",
  "DOCUMENTING",
];

const LOCKED_ACTIVITIES = [
  "[CLASSIFIED]",
  "[REDACTED]",
  "[SEE SUPERVISOR]",
  "[PENDING REVIEW]",
];

function generateTimeBlocks(timesheetNumber: number): TimeBlock[] {
  const blocks: TimeBlock[] = [];
  let currentMinute = 9 * 60; // Start at 09:00

  // Generate 6-8 blocks
  const blockCount = 6 + Math.floor(Math.random() * 3);

  for (let i = 0; i < blockCount; i++) {
    const duration = 5 + Math.floor(Math.random() * 8); // 5-12 minutes
    const startHour = Math.floor(currentMinute / 60);
    const startMin = currentMinute % 60;
    const endMinute = currentMinute + duration;
    const endHour = Math.floor(endMinute / 60);
    const endMin = endMinute % 60;

    const formatTime = (h: number, m: number) =>
      `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

    // Occasionally lock a block (more frequent as timesheets progress)
    const lockChance = Math.min(0.15 + timesheetNumber * 0.02, 0.4);
    const isLocked = Math.random() < lockChance;

    blocks.push({
      id: `block-${i}`,
      startTime: formatTime(startHour, startMin),
      endTime: formatTime(endHour, endMin),
      activity: isLocked
        ? LOCKED_ACTIVITIES[
            Math.floor(Math.random() * LOCKED_ACTIVITIES.length)
          ]
        : "",
      isLocked,
    });

    currentMinute = endMinute;
  }

  return blocks;
}

export function TimeLogging({ onExit }: GameProps) {
  const [timesheetNumber, setTimesheetNumber] = useState(1);
  const [blocks, setBlocks] = useState<TimeBlock[]>(() =>
    generateTimeBlocks(1)
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onExit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExit]);

  const handleActivityChange = useCallback(
    (blockId: string, activity: string) => {
      setBlocks((prev) =>
        prev.map((block) =>
          block.id === blockId ? { ...block, activity } : block
        )
      );
    },
    []
  );

  const handleSubmit = useCallback(() => {
    // Check if all non-locked blocks have activities
    const unfilledBlocks = blocks.filter((b) => !(b.isLocked || b.activity));
    if (unfilledBlocks.length > 0) {
      setMessage("INCOMPLETE ENTRIES DETECTED");
      setTimeout(() => setMessage(null), 2000);
      return;
    }

    setIsSubmitting(true);
    setMessage("LOGGING TIME...");

    setTimeout(() => {
      setMessage("TIME LOGGED SUCCESSFULLY");

      setTimeout(() => {
        // Generate new timesheet
        const newNumber = timesheetNumber + 1;
        setTimesheetNumber(newNumber);
        setBlocks(generateTimeBlocks(newNumber));
        setMessage(null);
        setIsSubmitting(false);
      }, 1500);
    }, 800);
  }, [blocks, timesheetNumber]);

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-[var(--void-gray-200)] border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="status-indicator-glow bg-[var(--system-green)] text-[var(--system-green)]" />
          <span className="font-designation text-[var(--void-gray-600)]">
            TIME LOGGING
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

      {/* Timesheet header */}
      <div className="border-[var(--void-gray-100)] border-b px-6 py-3">
        <div className="flex items-center justify-between">
          <span className="font-system text-[var(--void-gray-400)]">
            TIMESHEET #{String(timesheetNumber).padStart(3, "0")}
          </span>
          <span className="font-system text-[10px] text-[var(--void-gray-300)]">
            ALL ENTRIES ARE PERMANENT
          </span>
        </div>
      </div>

      {/* Time blocks */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-2">
          {blocks.map((block) => (
            <div
              className={`flex items-center gap-4 border p-3 ${
                block.isLocked
                  ? "border-[var(--void-gray-200)] bg-[var(--void-gray-100)]"
                  : "border-[var(--void-gray-200)] bg-white"
              }`}
              key={block.id}
            >
              {/* Time range */}
              <div className="w-28 font-system text-[var(--void-gray-500)]">
                {block.startTime} - {block.endTime}
              </div>

              {/* Activity selector */}
              {block.isLocked ? (
                <div className="flex-1 font-system text-[var(--void-gray-400)]">
                  {block.activity}
                </div>
              ) : (
                <select
                  className="flex-1 border border-[var(--void-gray-200)] bg-white px-3 py-1.5 font-system text-[var(--void-gray-600)] focus:border-[var(--void-gray-400)] focus:outline-none"
                  disabled={isSubmitting}
                  onChange={(e) =>
                    handleActivityChange(block.id, e.target.value)
                  }
                  value={block.activity}
                >
                  <option value="">SELECT ACTIVITY</option>
                  {ACTIVITIES.map((activity) => (
                    <option key={activity} value={activity}>
                      {activity}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Message area */}
      {message && (
        <div className="border-[var(--void-gray-100)] border-t px-6 py-3">
          <div className="text-center font-system text-[var(--void-gray-500)]">
            {message}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-[var(--void-gray-200)] border-t px-6 py-4">
        <div className="flex items-center justify-between">
          <span className="font-system text-[10px] text-[var(--void-gray-300)]">
            TIMESHEETS LOGGED: {timesheetNumber - 1}
          </span>
          <button
            className="border border-[var(--void-gray-300)] bg-white px-6 py-2 font-system text-[var(--void-gray-600)] transition-colors hover:border-[var(--void-gray-500)] hover:bg-[var(--void-gray-100)] disabled:opacity-50"
            disabled={isSubmitting}
            onClick={handleSubmit}
            type="button"
          >
            [SUBMIT TIMESHEET]
          </button>
        </div>
      </div>
    </div>
  );
}
