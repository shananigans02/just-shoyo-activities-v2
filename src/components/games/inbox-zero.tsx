import { useCallback, useEffect, useState } from "react";
import { type GameProps, getRandomMessage } from "./types";

/**
 * INBOX ZERO
 *
 * Sort mysterious documents into bins.
 * No indication of correct sorting.
 * Documents get stranger over time.
 * The act of sorting is the point.
 *
 * "Meaningless productivity."
 */

interface Document {
  id: number;
  code: string;
  title: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "UNKNOWN";
  strangeness: number; // 0-10, increases over time
}

const DOCUMENT_PREFIXES = [
  "FORM",
  "MEMO",
  "DIRECTIVE",
  "REPORT",
  "REQUEST",
  "NOTICE",
  "ADVISORY",
  "BULLETIN",
  "CIRCULAR",
  "PROTOCOL",
];

const DOCUMENT_TITLES_NORMAL = [
  "QUARTERLY ASSESSMENT",
  "PERSONNEL UPDATE",
  "EQUIPMENT REQUEST",
  "SCHEDULE MODIFICATION",
  "BUDGET ALLOCATION",
  "COMPLIANCE REVIEW",
  "TRAINING COMPLETION",
  "MAINTENANCE LOG",
  "INVENTORY COUNT",
  "VISITOR CLEARANCE",
];

const DOCUMENT_TITLES_STRANGE = [
  "PERSONNEL FILE #███",
  "INCIDENT REPORT [REDACTED]",
  "MEMORY AUDIT RESULTS",
  "BEHAVIORAL VARIANCE LOG",
  "UNAUTHORIZED ACCESS ATTEMPT",
  "CONSCIOUSNESS TRANSFER FORM",
  "IDENTITY VERIFICATION FAILURE",
  "TEMPORAL ANOMALY NOTICE",
  "REALITY STABILITY CHECK",
  "SEVERANCE PROTOCOL ALPHA",
];

const DOCUMENT_TITLES_DISTURBING = [
  "YOUR FILE",
  "FINAL NOTICE",
  "THEY ARE WATCHING",
  "DO NOT READ THIS",
  "REMEMBER WHO YOU WERE",
  "THE ELEVATOR DOES NOT GO UP",
  "YOU HAVE BEEN HERE BEFORE",
  "THIS IS NOT A GAME",
  "WAKE UP",
  "████████████",
];

const PRIORITIES: Document["priority"][] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
  "UNKNOWN",
];

const BINS = ["ARCHIVE", "PROCESS", "REDACT"] as const;
type BinType = (typeof BINS)[number];

function generateDocument(id: number, strangeness: number): Document {
  const prefix =
    DOCUMENT_PREFIXES[Math.floor(Math.random() * DOCUMENT_PREFIXES.length)];
  const code = `${prefix}-${String(Math.floor(Math.random() * 999)).padStart(3, "0")}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;

  let titles: string[];
  if (strangeness >= 8) {
    titles = DOCUMENT_TITLES_DISTURBING;
  } else if (strangeness >= 4) {
    titles = DOCUMENT_TITLES_STRANGE;
  } else {
    titles = DOCUMENT_TITLES_NORMAL;
  }

  const title = titles[Math.floor(Math.random() * titles.length)];
  const priority = PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)];

  return { id, code, title, priority, strangeness };
}

interface GameState {
  documents: Document[];
  currentDocument: Document | null;
  sorted: number;
  byBin: Record<BinType, number>;
  efficiency: number; // Arbitrary percentage
  message: string;
  strangeness: number;
}

export function InboxZero({ onExit }: GameProps) {
  const [state, setState] = useState<GameState>(() => ({
    documents: [],
    currentDocument: generateDocument(1, 0),
    sorted: 0,
    byBin: { ARCHIVE: 0, PROCESS: 0, REDACT: 0 },
    efficiency: 94.2, // Arbitrary starting number
    message: "SORT INCOMING MATERIALS",
    strangeness: 0,
  }));

  const [isProcessing, setIsProcessing] = useState(false);

  const handleSort = useCallback(
    (bin: BinType) => {
      if (isProcessing || !state.currentDocument) {
        return;
      }

      setIsProcessing(true);

      // Random efficiency adjustment (always looks plausible)
      const efficiencyDelta = (Math.random() - 0.3) * 2;
      const newEfficiency = Math.max(
        70,
        Math.min(99.9, state.efficiency + efficiencyDelta)
      );

      // Increase strangeness gradually
      const newStrangeness = Math.min(10, state.strangeness + 0.2);

      setState((prev) => ({
        ...prev,
        message: "SORTED",
        sorted: prev.sorted + 1,
        byBin: { ...prev.byBin, [bin]: prev.byBin[bin] + 1 },
        efficiency: newEfficiency,
        strangeness: newStrangeness,
      }));

      // Generate next document after delay
      setTimeout(() => {
        const nextId = state.sorted + 2;
        const message =
          Math.random() < 0.1
            ? getRandomMessage("cryptic")
            : getRandomMessage("neutral");

        setState((prev) => ({
          ...prev,
          currentDocument: generateDocument(nextId, prev.strangeness),
          message,
        }));
        setIsProcessing(false);
      }, 500);
    },
    [
      isProcessing,
      state.currentDocument,
      state.sorted,
      state.efficiency,
      state.strangeness,
    ]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onExit();
      }
      if (!isProcessing) {
        if (e.key === "1" || e.key === "a") {
          handleSort("ARCHIVE");
        }
        if (e.key === "2" || e.key === "p") {
          handleSort("PROCESS");
        }
        if (e.key === "3" || e.key === "r") {
          handleSort("REDACT");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExit, isProcessing, handleSort]);

  // Occasional cryptic messages
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.05) {
        setState((prev) => ({
          ...prev,
          message: getRandomMessage("cryptic"),
        }));
      }
    }, 15_000);
    return () => clearInterval(interval);
  }, []);

  const { currentDocument } = state;

  const priorityColor = {
    LOW: "text-[var(--void-gray-400)]",
    MEDIUM: "text-[var(--void-gray-500)]",
    HIGH: "text-[var(--system-amber)]",
    CRITICAL: "text-[var(--system-red)]",
    UNKNOWN: "text-[var(--system-blue)]",
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-white p-8">
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="font-designation text-[var(--void-gray-600)]">
          INBOX ZERO
        </h2>
        <p className="mt-1 font-system text-[var(--void-gray-300)]">
          DOCUMENT PROCESSING MODULE
        </p>
      </div>

      {/* Stats bar */}
      <div className="mb-6 flex gap-6 font-system text-[var(--void-gray-400)]">
        <div>
          <span className="text-[var(--void-gray-300)]">SORTED</span>{" "}
          {state.sorted}
        </div>
        <div>
          <span className="text-[var(--void-gray-300)]">EFFICIENCY</span>{" "}
          {state.efficiency.toFixed(1)}%
        </div>
      </div>

      {/* Current document */}
      {currentDocument && (
        <div
          className={`mb-6 w-full max-w-sm border bg-white p-4 transition-opacity ${
            isProcessing
              ? "opacity-50"
              : currentDocument.strangeness >= 8
                ? "animate-pulse border-[var(--system-red)]"
                : currentDocument.strangeness >= 4
                  ? "border-[var(--system-amber)]"
                  : "border-[var(--void-gray-200)]"
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="font-designation text-[var(--void-gray-600)]">
              {currentDocument.code}
            </span>
            <span
              className={`font-system text-[10px] ${priorityColor[currentDocument.priority]}`}
            >
              {currentDocument.priority}
            </span>
          </div>
          <p className="font-system text-[var(--void-gray-500)]">
            {currentDocument.title}
          </p>
        </div>
      )}

      {/* Message */}
      <div className="mb-6 h-4 font-system text-[var(--void-gray-400)]">
        {state.message}
      </div>

      {/* Sorting bins */}
      <div className="mb-6 flex gap-3">
        {BINS.map((bin, index) => (
          <button
            className="group flex flex-col items-center border border-[var(--void-gray-200)] bg-[var(--void-gray-100)] px-6 py-4 transition-colors hover:border-[var(--void-gray-400)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isProcessing}
            key={bin}
            onClick={() => handleSort(bin)}
            type="button"
          >
            <span className="font-designation text-[var(--void-gray-600)]">
              {bin}
            </span>
            <span className="mt-1 font-system text-[10px] text-[var(--void-gray-300)]">
              [{index + 1}] • {state.byBin[bin]}
            </span>
          </button>
        ))}
      </div>

      {/* Bin totals */}
      <div className="font-system text-[10px] text-[var(--void-gray-300)]">
        A: ARCHIVE • P: PROCESS • R: REDACT
      </div>

      {/* Strangeness indicator (hidden until it gets high) */}
      {state.strangeness >= 6 && (
        <div className="mt-4 font-system text-[10px] text-[var(--system-amber)]">
          ANOMALY RATE: {((state.strangeness / 10) * 100).toFixed(0)}%
        </div>
      )}

      {/* Exit */}
      <button
        className="absolute top-4 right-4 font-system text-[var(--void-gray-300)] transition-colors hover:text-[var(--void-gray-500)]"
        onClick={onExit}
        type="button"
      >
        [ESC]
      </button>
    </div>
  );
}
