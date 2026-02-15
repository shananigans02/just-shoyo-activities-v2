import { useCallback, useEffect, useState } from "react";
import type { GameProps } from "./types";

/**
 * SURVEILLANCE TAGGING
 *
 * Review scenes and apply classification tags.
 * The system never confirms correctness.
 * Your assessments contribute to the record.
 *
 * "Your observation has been filed."
 */

type TagType = "IDLE" | "PROCESSING" | "WAITING" | "ANOMALOUS";

// Scene descriptions that create visual imagery
const SCENE_DESCRIPTIONS = [
  "FIGURE SEATED AT DESK. HANDS ON KEYBOARD. SCREEN ILLUMINATED.",
  "EMPTY CORRIDOR. FLUORESCENT LIGHTING. NO MOVEMENT DETECTED.",
  "TWO FIGURES IN CONVERSATION. GESTURES MINIMAL. DURATION: 3:47",
  "FIGURE STANDING AT WINDOW. FACING OUTWARD. DURATION: 12:03",
  "CONFERENCE ROOM B. SEVEN FIGURES SEATED. PRESENTATION ACTIVE.",
  "BREAK ROOM. SINGLE FIGURE. BEVERAGE CONTAINER PRESENT.",
  "ELEVATOR LOBBY. FIGURE WAITING. CHECKING WATCH.",
  "CUBICLE 7-G. FIGURE REVIEWING DOCUMENTS. EXPRESSION: NEUTRAL",
  "STORAGE AREA. FIGURE MOVING BOXES. LABEL: UNKNOWN",
  "HALLWAY INTERSECTION. NO FIGURES PRESENT. LIGHT FLICKERING.",
  "FIGURE AT COPY MACHINE. DOCUMENT COUNT: 47. DURATION: 8:21",
  "FIGURE IN DOORWAY. DIRECTION: ENTERING. BADGE VISIBLE.",
  "STAIRWELL C. ASCENDING FIGURE. FLOOR: 3 TO 4.",
  "CAFETERIA. MULTIPLE FIGURES. NOISE LEVEL: MODERATE",
  "PARKING LEVEL B2. VEHICLE MOVEMENT DETECTED. TIME: 17:34",
];

const STRANGE_SCENES = [
  "FIGURE FACING WALL. DURATION: 47:12. NO MOVEMENT.",
  "EMPTY ROOM. CHAIR SPINNING. NO FIGURE PRESENT.",
  "FIGURE IN MIRROR. REFLECTION NOT MATCHING. DURATION: 2:03",
  "ELEVATOR. ASCENDING. FLOOR COUNTER: ERROR",
  "FIGURE WAVING AT CAMERA. SMILING. DURATION: CONTINUOUS",
  "CORRIDOR. SAME FIGURE. MULTIPLE INSTANCES. COUNT: 3",
  "WINDOW VIEW. OUTSIDE: DARK. TIME: 14:22",
  "FIGURE READING DOCUMENT. DOCUMENT: BLANK.",
  "MEETING ROOM. ALL FIGURES IDENTICAL. COUNT: 8",
  "STAIRWELL. DESCENDING. FLOOR COUNT: NEGATIVE",
];

const RESPONSES = [
  "TAG RECORDED",
  "OBSERVATION NOTED",
  "CLASSIFICATION FILED",
  "ASSESSMENT LOGGED",
  "TAG APPLIED",
  "OBSERVATION ARCHIVED",
];

function getScene(index: number): string {
  // Introduce strange scenes after 15 reviews
  if (index >= 15 && Math.random() < 0.3) {
    return STRANGE_SCENES[Math.floor(Math.random() * STRANGE_SCENES.length)];
  }
  return SCENE_DESCRIPTIONS[index % SCENE_DESCRIPTIONS.length];
}

export function SurveillanceTagging({ onExit }: GameProps) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [currentScene, setCurrentScene] = useState(() => getScene(0));
  const [message, setMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTag, setSelectedTag] = useState<TagType | null>(null);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onExit();
        return;
      }
      if (isProcessing) return;

      // Keyboard shortcuts
      if (e.key === "1" || e.key.toLowerCase() === "i") {
        handleTag("IDLE");
      } else if (e.key === "2" || e.key.toLowerCase() === "p") {
        handleTag("PROCESSING");
      } else if (e.key === "3" || e.key.toLowerCase() === "w") {
        handleTag("WAITING");
      } else if (e.key === "4" || e.key.toLowerCase() === "a") {
        handleTag("ANOMALOUS");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExit, isProcessing]);

  const handleTag = useCallback(
    (tag: TagType) => {
      if (isProcessing) return;

      setIsProcessing(true);
      setSelectedTag(tag);
      setMessage("PROCESSING...");

      setTimeout(() => {
        const response =
          RESPONSES[Math.floor(Math.random() * RESPONSES.length)];
        setMessage(response);

        setTimeout(() => {
          const newIndex = sceneIndex + 1;
          setSceneIndex(newIndex);
          setCurrentScene(getScene(newIndex));
          setMessage(null);
          setIsProcessing(false);
          setSelectedTag(null);
        }, 1000);
      }, 400);
    },
    [isProcessing, sceneIndex]
  );

  const tags: { type: TagType; key: string }[] = [
    { type: "IDLE", key: "1" },
    { type: "PROCESSING", key: "2" },
    { type: "WAITING", key: "3" },
    { type: "ANOMALOUS", key: "4" },
  ];

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-[var(--void-gray-200)] border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="status-indicator-glow bg-[var(--system-green)] text-[var(--system-green)]" />
          <span className="font-designation text-[var(--void-gray-600)]">
            SURVEILLANCE TAGGING
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
            SCENES REVIEWED: {sceneIndex}
          </span>
          <span className="font-system text-[10px] text-[var(--void-gray-300)]">
            YOUR ASSESSMENTS ARE RECORDED
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        {/* Scene display */}
        <div className="mb-8 w-full max-w-md">
          <div className="mb-2 text-center font-system text-[10px] text-[var(--void-gray-300)]">
            SCENE #{String(sceneIndex + 1).padStart(4, "0")}
          </div>
          <div className="border border-[var(--void-gray-200)] bg-[var(--void-gray-100)] p-6">
            {/* Simulated surveillance view */}
            <div className="mb-4 aspect-video border border-[var(--void-gray-200)] bg-[var(--void-gray-50)] p-4">
              <div className="flex h-full items-center justify-center">
                <div className="font-system text-[10px] text-[var(--void-gray-400)] leading-relaxed">
                  [VISUAL FEED REDACTED]
                </div>
              </div>
            </div>
            {/* Scene description */}
            <div className="font-system text-[11px] text-[var(--void-gray-600)] leading-relaxed">
              {currentScene}
            </div>
          </div>
        </div>

        {/* Tag buttons */}
        <div className="mb-6 flex flex-wrap justify-center gap-3">
          {tags.map(({ type, key }) => (
            <button
              className={`border px-5 py-3 transition-all ${
                selectedTag === type
                  ? "border-[var(--void-gray-500)] bg-[var(--void-gray-200)]"
                  : "border-[var(--void-gray-300)] bg-white hover:border-[var(--void-gray-500)] hover:bg-[var(--void-gray-100)]"
              }`}
              disabled={isProcessing}
              key={type}
              onClick={() => handleTag(type)}
              type="button"
            >
              <div className="mb-1 font-designation text-[var(--void-gray-600)]">
                {type}
              </div>
              <div className="font-system text-[10px] text-[var(--void-gray-300)]">
                [{key}]
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
          PRESS [1] [2] [3] [4] TO TAG
        </div>
      </div>
    </div>
  );
}
