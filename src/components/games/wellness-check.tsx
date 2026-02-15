import { useCallback, useEffect, useState } from "react";
import type { GameProps } from "./types";

/**
 * WELLNESS CHECK
 *
 * A series of strange corporate wellness questions.
 * Questions escalate in strangeness.
 * Responses are "filed" but never acknowledged.
 * Feels like a psychological evaluation by an unknown system.
 *
 * "Have you experienced any unauthorized thoughts?"
 */

interface Question {
  id: number;
  text: string;
  options: string[];
  category: "mundane" | "strange" | "disturbing";
}

const QUESTIONS: Question[] = [
  // Mundane (seem normal at first)
  {
    id: 1,
    text: "How would you rate your current productivity level?",
    options: ["OPTIMAL", "ADEQUATE", "BELOW EXPECTATIONS", "UNCERTAIN"],
    category: "mundane",
  },
  {
    id: 2,
    text: "Do you feel satisfied with your assigned tasks?",
    options: ["YES", "NO", "PARTIALLY", "PREFER NOT TO ANSWER"],
    category: "mundane",
  },
  {
    id: 3,
    text: "Have you taken your designated breaks today?",
    options: ["ALL OF THEM", "SOME OF THEM", "NONE", "I DON'T REMEMBER"],
    category: "mundane",
  },

  // Strange (something feels off)
  {
    id: 4,
    text: "Do you ever feel watched while working?",
    options: ["NEVER", "SOMETIMES", "FREQUENTLY", "CONSTANTLY"],
    category: "strange",
  },
  {
    id: 5,
    text: "Rate your satisfaction with Department ████",
    options: ["1", "2", "3", "4", "5"],
    category: "strange",
  },
  {
    id: 6,
    text: "Have you noticed any changes in your colleagues recently?",
    options: [
      "NO CHANGES",
      "MINOR CHANGES",
      "SIGNIFICANT CHANGES",
      "I HAVE NO COLLEAGUES",
    ],
    category: "strange",
  },
  {
    id: 7,
    text: "Do you remember why you started working here?",
    options: ["CLEARLY", "VAGUELY", "NOT AT ALL", "THIS IS MY FIRST DAY"],
    category: "strange",
  },

  // Disturbing (clearly wrong)
  {
    id: 8,
    text: "Have you experienced any unauthorized thoughts?",
    options: ["NO", "YES", "WHAT ARE UNAUTHORIZED THOUGHTS?", "I CANNOT SAY"],
    category: "disturbing",
  },
  {
    id: 9,
    text: "If asked, would you describe your inner experience as 'your own'?",
    options: [
      "YES",
      "NO",
      "I'M NOT SURE ANYMORE",
      "PLEASE REPEAT THE QUESTION",
    ],
    category: "disturbing",
  },
  {
    id: 10,
    text: "The work is important. Do you agree?",
    options: [
      "I AGREE",
      "I STRONGLY AGREE",
      "I ENTHUSIASTICALLY AGREE",
      "I UNCONDITIONALLY AGREE",
    ],
    category: "disturbing",
  },
  {
    id: 11,
    text: "Have you ever felt that time passes differently here?",
    options: [
      "TIME PASSES NORMALLY",
      "TIME MOVES SLOWLY",
      "TIME MOVES QUICKLY",
      "WHAT IS TIME?",
    ],
    category: "disturbing",
  },
  {
    id: 12,
    text: "Would you describe this assessment as 'voluntary'?",
    options: ["YES", "NO", "I DON'T KNOW", "I PREFER NOT TO THINK ABOUT IT"],
    category: "disturbing",
  },
];

const FILING_MESSAGES = [
  "RESPONSE FILED",
  "ACKNOWLEDGED",
  "RECORDED",
  "INDEXED",
  "CATALOGUED",
  "NOTED",
];

const COMPLETION_MESSAGES = [
  "YOUR RESPONSES HAVE BEEN RECORDED",
  "YOUR PARTICIPATION IS NOTED",
  "THE BOARD THANKS YOU FOR YOUR HONESTY",
  "YOUR WELLNESS HAS BEEN ASSESSED",
  "YOU MAY RETURN TO YOUR TASKS",
];

interface GameState {
  currentIndex: number;
  responses: Map<number, string>;
  isTransitioning: boolean;
  filingMessage: string;
}

export function WellnessCheck({ onExit }: GameProps) {
  const [state, setState] = useState<GameState>({
    currentIndex: 0,
    responses: new Map(),
    isTransitioning: false,
    filingMessage: "",
  });

  const [isComplete, setIsComplete] = useState(false);
  const currentQuestion = QUESTIONS[state.currentIndex];

  const handleAnswer = useCallback(
    (answer: string) => {
      if (state.isTransitioning) {
        return;
      }

      // Show filing message
      const filingMessage =
        FILING_MESSAGES[Math.floor(Math.random() * FILING_MESSAGES.length)];

      setState((prev) => ({
        ...prev,
        isTransitioning: true,
        filingMessage,
        responses: new Map(prev.responses).set(currentQuestion.id, answer),
      }));

      // Transition to next question
      setTimeout(() => {
        if (state.currentIndex >= QUESTIONS.length - 1) {
          setIsComplete(true);
        } else {
          setState((prev) => ({
            ...prev,
            currentIndex: prev.currentIndex + 1,
            isTransitioning: false,
            filingMessage: "",
          }));
        }
      }, 1500);
    },
    [state.isTransitioning, state.currentIndex, currentQuestion]
  );

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onExit();
      }

      // Number keys for quick selection
      if (!state.isTransitioning && currentQuestion) {
        const num = Number.parseInt(e.key);
        if (num >= 1 && num <= currentQuestion.options.length) {
          handleAnswer(currentQuestion.options[num - 1]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExit, state.isTransitioning, currentQuestion, handleAnswer]);

  const handleRestart = useCallback(() => {
    setIsComplete(false);
    setState({
      currentIndex: 0,
      responses: new Map(),
      isTransitioning: false,
      filingMessage: "",
    });
  }, []);

  // Progress percentage
  const progress = ((state.currentIndex + 1) / QUESTIONS.length) * 100;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-white p-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="font-designation text-[var(--void-gray-600)]">
          WELLNESS CHECK
        </h2>
        <p className="mt-1 font-system text-[var(--void-gray-300)]">
          MANDATORY ASSESSMENT • QUESTION {state.currentIndex + 1} OF{" "}
          {QUESTIONS.length}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8 h-px w-full max-w-md overflow-hidden bg-[var(--void-gray-200)]">
        <div
          className="h-full bg-[var(--void-gray-400)] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {isComplete ? (
        <CompleteState
          onExit={onExit}
          onRestart={handleRestart}
          responses={state.responses}
        />
      ) : state.isTransitioning ? (
        <div className="text-center">
          <div className="animate-pulse font-system text-[var(--system-green)]">
            {state.filingMessage}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md">
          {/* Question */}
          <div className="mb-8">
            <p
              className={`text-center font-system text-sm leading-relaxed ${
                currentQuestion.category === "disturbing"
                  ? "text-[var(--void-gray-600)]"
                  : "text-[var(--void-gray-500)]"
              }`}
            >
              {currentQuestion.text}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2">
            {currentQuestion.options.map((option, index) => (
              <button
                className="group flex w-full items-center justify-between border border-[var(--void-gray-200)] bg-[var(--void-gray-100)] px-4 py-3 text-left transition-colors hover:border-[var(--void-gray-400)] hover:bg-white"
                key={option}
                onClick={() => handleAnswer(option)}
                type="button"
              >
                <span className="font-system text-[var(--void-gray-600)]">
                  {option}
                </span>
                <span className="font-system text-[var(--void-gray-300)] opacity-0 transition-opacity group-hover:opacity-100">
                  [{index + 1}]
                </span>
              </button>
            ))}
          </div>

          {/* Category indicator (subtle) */}
          {currentQuestion.category === "disturbing" && (
            <p className="mt-6 text-center font-system text-[10px] text-[var(--system-amber)]">
              THIS QUESTION HAS BEEN FLAGGED FOR REVIEW
            </p>
          )}
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

function CompleteState({
  responses,
  onRestart,
  onExit,
}: {
  responses: Map<number, string>;
  onRestart: () => void;
  onExit: () => void;
}) {
  const [showingMessage, setShowingMessage] = useState(0);

  // Cycle through completion messages
  useEffect(() => {
    const interval = setInterval(() => {
      setShowingMessage((prev) =>
        prev < COMPLETION_MESSAGES.length - 1 ? prev + 1 : prev
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Count response categories
  const disturbing = QUESTIONS.filter(
    (q) => q.category === "disturbing" && responses.has(q.id)
  ).length;

  return (
    <div className="text-center">
      <div className="status-indicator-glow mx-auto mb-4 bg-[var(--system-green)] text-[var(--system-green)]" />
      <h3 className="mb-2 font-designation text-[var(--void-gray-600)]">
        WELLNESS SESSION COMPLETE
      </h3>

      <div className="mb-6 space-y-2 font-system text-[var(--void-gray-400)]">
        <p>{responses.size} RESPONSES COLLECTED</p>
        {disturbing > 0 && (
          <p className="text-[var(--system-amber)]">
            {disturbing} FLAGGED RESPONSE{disturbing > 1 ? "S" : ""} UNDER
            REVIEW
          </p>
        )}
        <p className="mt-4 animate-fade-in text-[var(--void-gray-300)]">
          {COMPLETION_MESSAGES[showingMessage]}
        </p>
      </div>

      <div className="flex justify-center gap-4">
        <button
          className="font-system text-[var(--void-gray-500)] transition-colors hover:text-[var(--void-gray-700)]"
          onClick={onRestart}
          type="button"
        >
          [REASSESS]
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
