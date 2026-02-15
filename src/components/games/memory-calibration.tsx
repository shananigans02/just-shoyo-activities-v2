import { useCallback, useEffect, useState } from "react";
import { type GameProps, getRandomMessage } from "./types";

/**
 * MEMORY CALIBRATION
 *
 * A memory matching game with corporate unease.
 * Cards show mundane office items.
 * Occasionally matched pairs unmatch themselves.
 * The game suggests your memory is unreliable.
 *
 * "Did that card change?"
 */

const OFFICE_ITEMS = [
  { id: "stapler", symbol: "⊡", label: "STAPLER" },
  { id: "folder", symbol: "▭", label: "FOLDER" },
  { id: "mug", symbol: "⊔", label: "MUG" },
  { id: "badge", symbol: "⬡", label: "BADGE" },
  { id: "clock", symbol: "◎", label: "CLOCK" },
  { id: "lamp", symbol: "△", label: "LAMP" },
  { id: "phone", symbol: "▢", label: "PHONE" },
  { id: "plant", symbol: "◇", label: "PLANT" },
];

interface Card {
  id: number;
  itemId: string;
  symbol: string;
  label: string;
  isFlipped: boolean;
  isMatched: boolean;
  wasUnmatched: boolean; // Tracks if this card was unmatched (for unsettling effect)
}

interface GameState {
  cards: Card[];
  flippedIndices: number[];
  matches: number;
  attempts: number;
  message: string;
  isChecking: boolean;
  deviationsDetected: number;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function createCards(): Card[] {
  // Use 6 pairs for a 4x3 grid
  const selectedItems = OFFICE_ITEMS.slice(0, 6);
  const pairs = [...selectedItems, ...selectedItems];
  const shuffled = shuffleArray(pairs);

  return shuffled.map((item, index) => ({
    id: index,
    itemId: item.id,
    symbol: item.symbol,
    label: item.label,
    isFlipped: false,
    isMatched: false,
    wasUnmatched: false,
  }));
}

export function MemoryCalibration({ onExit }: GameProps) {
  const [state, setState] = useState<GameState>(() => ({
    cards: createCards(),
    flippedIndices: [],
    matches: 0,
    attempts: 0,
    message: "ALIGN MEMORY PATTERNS",
    isChecking: false,
    deviationsDetected: 0,
  }));

  const [isComplete, setIsComplete] = useState(false);

  // Check for win condition
  useEffect(() => {
    if (state.matches === 6 && !isComplete) {
      setIsComplete(true);
      setState((prev) => ({
        ...prev,
        message: "CALIBRATION COMPLETE",
      }));
    }
  }, [state.matches, isComplete]);

  // Random unmatch effect (creates unease)
  useEffect(() => {
    if (state.matches < 2 || isComplete) {
      return;
    }

    // 5% chance every 10 seconds to unmatch a pair
    const interval = setInterval(() => {
      if (Math.random() < 0.05) {
        setState((prev) => {
          const matchedCards = prev.cards.filter((c) => c.isMatched);
          if (matchedCards.length < 2) {
            return prev;
          }

          // Find a random matched pair to unmatch
          const itemIds = [...new Set(matchedCards.map((c) => c.itemId))];
          const targetItemId =
            itemIds[Math.floor(Math.random() * itemIds.length)];

          const newCards = prev.cards.map((card) =>
            card.itemId === targetItemId
              ? {
                  ...card,
                  isMatched: false,
                  isFlipped: false,
                  wasUnmatched: true,
                }
              : card
          );

          return {
            ...prev,
            cards: newCards,
            matches: prev.matches - 1,
            deviationsDetected: prev.deviationsDetected + 1,
            message: "DEVIATION DETECTED",
          };
        });
      }
    }, 10_000);

    return () => clearInterval(interval);
  }, [state.matches, isComplete]);

  const handleCardClick = useCallback(
    (index: number) => {
      if (
        state.isChecking ||
        state.cards[index].isFlipped ||
        state.cards[index].isMatched ||
        state.flippedIndices.length >= 2
      ) {
        return;
      }

      setState((prev) => {
        const newFlipped = [...prev.flippedIndices, index];
        const newCards = prev.cards.map((card, i) =>
          i === index ? { ...card, isFlipped: true } : card
        );

        return {
          ...prev,
          cards: newCards,
          flippedIndices: newFlipped,
          message: "PROCESSING",
        };
      });
    },
    [state.isChecking, state.cards, state.flippedIndices]
  );

  // Check for matches when two cards are flipped
  useEffect(() => {
    if (state.flippedIndices.length !== 2) {
      return;
    }

    setState((prev) => ({ ...prev, isChecking: true }));

    const [first, second] = state.flippedIndices;
    const firstCard = state.cards[first];
    const secondCard = state.cards[second];
    const isMatch = firstCard.itemId === secondCard.itemId;

    const timeout = setTimeout(() => {
      setState((prev) => {
        if (isMatch) {
          const newCards = prev.cards.map((card, i) =>
            i === first || i === second ? { ...card, isMatched: true } : card
          );

          return {
            ...prev,
            cards: newCards,
            flippedIndices: [],
            matches: prev.matches + 1,
            attempts: prev.attempts + 1,
            message: getRandomMessage("positive"),
            isChecking: false,
          };
        }

        // No match - flip cards back
        const newCards = prev.cards.map((card, i) =>
          i === first || i === second ? { ...card, isFlipped: false } : card
        );

        return {
          ...prev,
          cards: newCards,
          flippedIndices: [],
          attempts: prev.attempts + 1,
          message: getRandomMessage("negative"),
          isChecking: false,
        };
      });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [state.flippedIndices, state.cards]);

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

  const handleRestart = useCallback(() => {
    setIsComplete(false);
    setState({
      cards: createCards(),
      flippedIndices: [],
      matches: 0,
      attempts: 0,
      message: "MEMORY PATTERNS RESET",
      isChecking: false,
      deviationsDetected: 0,
    });
  }, []);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-white p-8">
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="font-designation text-[var(--void-gray-600)]">
          MEMORY CALIBRATION
        </h2>
        <p className="mt-1 font-system text-[var(--void-gray-300)]">
          PATTERN RECOGNITION MODULE
        </p>
      </div>

      {/* Message */}
      <div className="mb-6 h-4 font-system text-[var(--void-gray-400)]">
        {state.message}
      </div>

      {isComplete ? (
        <CompleteState
          attempts={state.attempts}
          deviations={state.deviationsDetected}
          onExit={onExit}
          onRestart={handleRestart}
        />
      ) : (
        <>
          {/* Card grid */}
          <div className="mb-6 grid grid-cols-4 gap-2">
            {state.cards.map((card, index) => (
              <button
                className={`flex h-16 w-16 items-center justify-center border transition-all duration-300 ${
                  card.isMatched
                    ? "border-[var(--system-green)] bg-[var(--void-gray-100)]"
                    : card.isFlipped
                      ? "border-[var(--void-gray-400)] bg-white"
                      : "cursor-pointer border-[var(--void-gray-200)] bg-[var(--void-gray-100)] hover:border-[var(--void-gray-300)]"
                } ${card.wasUnmatched ? "animate-pulse" : ""}`}
                disabled={card.isMatched || card.isFlipped || state.isChecking}
                key={card.id}
                onClick={() => handleCardClick(index)}
                type="button"
              >
                {card.isFlipped || card.isMatched ? (
                  <span className="text-2xl text-[var(--void-gray-600)]">
                    {card.symbol}
                  </span>
                ) : (
                  <span className="text-[var(--void-gray-300)]">?</span>
                )}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="flex gap-6 font-system text-[var(--void-gray-400)]">
            <div>
              <span className="text-[var(--void-gray-300)]">ALIGNED</span>{" "}
              {state.matches}/6
            </div>
            <div>
              <span className="text-[var(--void-gray-300)]">ATTEMPTS</span>{" "}
              {state.attempts}
            </div>
            {state.deviationsDetected > 0 && (
              <div className="text-[var(--system-amber)]">
                <span className="text-[var(--void-gray-300)]">DEVIATIONS</span>{" "}
                {state.deviationsDetected}
              </div>
            )}
          </div>
        </>
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

function CompleteState({
  attempts,
  deviations,
  onRestart,
  onExit,
}: {
  attempts: number;
  deviations: number;
  onRestart: () => void;
  onExit: () => void;
}) {
  return (
    <div className="text-center">
      <div className="status-indicator-glow mx-auto mb-4 bg-[var(--system-green)] text-[var(--system-green)]" />
      <h3 className="mb-2 font-designation text-[var(--void-gray-600)]">
        CALIBRATION COMPLETE
      </h3>
      <div className="mb-6 space-y-1 font-system text-[var(--void-gray-400)]">
        <p>PATTERNS ALIGNED IN {attempts} ATTEMPTS</p>
        {deviations > 0 && (
          <p className="text-[var(--system-amber)]">
            {deviations} DEVIATION{deviations > 1 ? "S" : ""} CORRECTED
          </p>
        )}
        <p className="mt-4 text-[var(--void-gray-300)]">
          YOUR MEMORY IS NOW SYNCHRONIZED
        </p>
      </div>
      <div className="flex justify-center gap-4">
        <button
          className="font-system text-[var(--void-gray-500)] transition-colors hover:text-[var(--void-gray-700)]"
          onClick={onRestart}
          type="button"
        >
          [RECALIBRATE]
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
