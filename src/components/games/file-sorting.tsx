import { useCallback, useEffect, useState } from "react";
import type { GameProps } from "./types";

/**
 * FILE SORTING
 *
 * Sort files into drawers. There is no correct answer.
 * The system always accepts your decision.
 * All classifications are recorded.
 *
 * "Your judgment has been noted."
 */

type DrawerType = "ACCEPTED" | "PENDING" | "UNKNOWN";

const NORMAL_CODES = [
  "A-41",
  "B-17",
  "C-09",
  "D-33",
  "E-52",
  "F-78",
  "G-14",
  "H-96",
  "J-23",
  "K-87",
  "L-45",
  "M-13",
  "N-61",
  "P-29",
  "Q-74",
  "R-38",
  "S-55",
  "T-82",
  "U-19",
  "V-67",
  "W-44",
  "X-77",
  "Y-31",
  "Z-90",
];

const STRANGE_CODES = [
  "??-41",
  "ERR-09",
  "NULL-00",
  "???-??",
  "0-0-0",
  "X-X-X",
  "[BLANK]",
  "---",
  "VOID-1",
  "NaN-NaN",
  "\\n-\\r",
  "404-00",
];

const DISTURBING_CODES = [
  "[REDACTED]",
  "[YOUR NAME]",
  "[REMEMBER]",
  "[HELP]",
  "[CLASSIFIED]",
  "[SEE BACK]",
  "[DO NOT]",
  "[URGENT]",
  "[FINAL]",
  "[DELETED]",
];

const RESPONSES = {
  acceptable: [
    "SORTING ACCEPTABLE",
    "CLASSIFICATION RECORDED",
    "DECISION LOGGED",
    "FILED ACCORDINGLY",
  ],
  review: [
    "SORTING REQUIRES REVIEW",
    "CLASSIFICATION PENDING AUDIT",
    "DECISION NOTED FOR VERIFICATION",
    "FLAGGED FOR SECONDARY REVIEW",
  ],
  noted: [
    "CLASSIFICATION NOTED",
    "UNUSUAL SORTING PATTERN",
    "DECISION INTERESTING",
    "METHODOLOGY OBSERVED",
  ],
};

function generateFileCode(fileCount: number): string {
  // Escalate strangeness based on files processed
  const strangeThreshold = 10;
  const disturbingThreshold = 25;

  if (fileCount >= disturbingThreshold && Math.random() < 0.3) {
    return DISTURBING_CODES[
      Math.floor(Math.random() * DISTURBING_CODES.length)
    ];
  }
  if (fileCount >= strangeThreshold && Math.random() < 0.25) {
    return STRANGE_CODES[Math.floor(Math.random() * STRANGE_CODES.length)];
  }
  return NORMAL_CODES[Math.floor(Math.random() * NORMAL_CODES.length)];
}

function getRandomResponse(): string {
  const roll = Math.random();
  if (roll < 0.7) {
    const arr = RESPONSES.acceptable;
    return arr[Math.floor(Math.random() * arr.length)];
  }
  if (roll < 0.95) {
    const arr = RESPONSES.review;
    return arr[Math.floor(Math.random() * arr.length)];
  }
  const arr = RESPONSES.noted;
  return arr[Math.floor(Math.random() * arr.length)];
}

export function FileSorting({ onExit }: GameProps) {
  const [currentFile, setCurrentFile] = useState(() => generateFileCode(0));
  const [fileCount, setFileCount] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastDrawer, setLastDrawer] = useState<DrawerType | null>(null);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onExit();
        return;
      }
      if (isProcessing) return;

      // Keyboard shortcuts for drawers
      if (e.key === "1" || e.key.toLowerCase() === "a") {
        handleSort("ACCEPTED");
      } else if (e.key === "2" || e.key.toLowerCase() === "p") {
        handleSort("PENDING");
      } else if (e.key === "3" || e.key.toLowerCase() === "u") {
        handleSort("UNKNOWN");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExit, isProcessing]);

  const handleSort = useCallback(
    (drawer: DrawerType) => {
      if (isProcessing) return;

      setIsProcessing(true);
      setLastDrawer(drawer);
      setMessage("PROCESSING...");

      setTimeout(() => {
        setMessage(getRandomResponse());

        setTimeout(() => {
          const newCount = fileCount + 1;
          setFileCount(newCount);
          setCurrentFile(generateFileCode(newCount));
          setMessage(null);
          setIsProcessing(false);
          setLastDrawer(null);
        }, 1200);
      }, 400);
    },
    [isProcessing, fileCount]
  );

  const drawers: DrawerType[] = ["ACCEPTED", "PENDING", "UNKNOWN"];

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-[var(--void-gray-200)] border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="status-indicator-glow bg-[var(--system-green)] text-[var(--system-green)]" />
          <span className="font-designation text-[var(--void-gray-600)]">
            FILE SORTING
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

      {/* Counter */}
      <div className="border-[var(--void-gray-100)] border-b px-6 py-3">
        <div className="flex items-center justify-between">
          <span className="font-system text-[var(--void-gray-400)]">
            FILES PROCESSED: {fileCount}
          </span>
          <span className="font-system text-[10px] text-[var(--void-gray-300)]">
            ALL DECISIONS ARE RECORDED
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        {/* Current file */}
        <div className="mb-8">
          <div className="mb-2 text-center font-system text-[10px] text-[var(--void-gray-300)]">
            CURRENT FILE
          </div>
          <div className="border-2 border-[var(--void-gray-300)] bg-[var(--void-gray-100)] px-12 py-8">
            <div className="text-center font-designation text-2xl text-[var(--void-gray-700)]">
              {currentFile}
            </div>
          </div>
        </div>

        {/* Drawer buttons */}
        <div className="mb-6 flex gap-4">
          {drawers.map((drawer, index) => (
            <button
              className={`group border px-6 py-4 transition-all ${
                lastDrawer === drawer
                  ? "border-[var(--void-gray-500)] bg-[var(--void-gray-200)]"
                  : "border-[var(--void-gray-300)] bg-white hover:border-[var(--void-gray-500)] hover:bg-[var(--void-gray-100)]"
              }`}
              disabled={isProcessing}
              key={drawer}
              onClick={() => handleSort(drawer)}
              type="button"
            >
              <div className="mb-1 font-designation text-[var(--void-gray-600)]">
                {drawer}
              </div>
              <div className="font-system text-[10px] text-[var(--void-gray-300)]">
                [{index + 1}]
              </div>
            </button>
          ))}
        </div>

        {/* Message area */}
        <div className="h-8">
          {message && (
            <div className="animate-fade-in font-system text-[var(--void-gray-500)]">
              {message}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-[var(--void-gray-100)] border-t px-6 py-3">
        <div className="text-center font-system text-[10px] text-[var(--void-gray-300)]">
          PRESS [1] [2] [3] OR [A] [P] [U] TO SORT
        </div>
      </div>
    </div>
  );
}
