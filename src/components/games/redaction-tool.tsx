import { useCallback, useEffect, useState } from "react";
import type { GameProps } from "./types";

/**
 * REDACTION TOOL
 *
 * Review documents and apply appropriate redactions.
 * The system grades your work but never explains why.
 * Guidelines are classified.
 *
 * "Redaction is protection."
 */

const NORMAL_DOCUMENTS = [
  [
    "QUARTERLY REPORT - SECTOR 7G",
    "Revenue increased by 12.4% this period.",
    "Employee satisfaction remains within acceptable parameters.",
    "The new initiative shows promising early results.",
    "Budget allocation requires minor adjustment.",
    "All departments meeting productivity targets.",
    "Recommend continued monitoring of metrics.",
    "Next review scheduled for Q3.",
  ],
  [
    "MEMO: POLICY UPDATE",
    "Effective immediately, break room hours are 12:00-13:00.",
    "Badge scanning is now required for floor access.",
    "All personal devices must be registered.",
    "Elevator maintenance scheduled for Tuesday.",
    "Reminder: Weekly reports due by Friday.",
    "Contact HR for policy questions.",
    "Compliance is mandatory.",
  ],
  [
    "INCIDENT REPORT #4471",
    "Date: [CURRENT DATE]",
    "Location: Floor 4, Conference Room B",
    "Personnel involved: 3 employees",
    "Nature of incident: Minor scheduling conflict",
    "Resolution: Meeting rescheduled",
    "Follow-up required: No",
    "Report filed by: Department Head",
  ],
];

const STRANGE_DOCUMENTS = [
  [
    "MEMO: REGARDING THE SOUNDS",
    "Several employees have reported unusual sounds.",
    "The sounds are normal building operations.",
    "Please do not investigate the sounds.",
    "The sounds will stop when appropriate.",
    "Anyone who hears the sounds should continue working.",
    "There is nothing in the walls.",
    "This memo will not be repeated.",
  ],
  [
    "PERSONNEL FILE: [YOUR NAME]",
    "Status: Active",
    "Performance: Observed",
    "Notes: Shows potential",
    "Recommendation: Continue monitoring",
    "Special instructions: None at this time",
    "Previous assignment: [REDACTED]",
    "Next evaluation: When ready",
  ],
  [
    "FLOOR PLAN DISCREPANCY",
    "Room 407 does not appear on current maps.",
    "This is intentional.",
    "Please do not attempt to locate Room 407.",
    "Room 407 has always been there.",
    "Room 407 has never been there.",
    "Room 407 is where you need to be.",
    "Disregard this document.",
  ],
];

const DISTURBING_DOCUMENTS = [
  [
    "REMINDER: YOU ARE HAPPY",
    "Your work is meaningful.",
    "You chose to be here.",
    "The outside is irrelevant.",
    "Your memories are accurate.",
    "Time passes normally here.",
    "You have always worked here.",
    "You will always work here.",
  ],
  [
    "NOTICE: REGARDING YOUR REFLECTION",
    "If your reflection does not match, do not be alarmed.",
    "The mirrors are functioning correctly.",
    "Your reflection is you.",
    "You are your reflection.",
    "The delay is normal.",
    "Please stop looking at the mirrors.",
    "The mirrors have been removed for your comfort.",
  ],
];

const RESPONSES = {
  acceptable: [
    "REDACTION LEVEL: ACCEPTABLE",
    "REDACTION APPROVED",
    "CLASSIFICATION MAINTAINED",
    "DOCUMENT SECURED",
  ],
  additional: [
    "REQUIRES ADDITIONAL REMOVAL",
    "INSUFFICIENT REDACTION",
    "SENSITIVE CONTENT REMAINS",
    "PLEASE REVIEW AGAIN",
  ],
  excessive: [
    "EXCESSIVE REDACTION DETECTED",
    "CONTENT OVER-OBSCURED",
    "INFORMATION UNNECESSARILY HIDDEN",
    "REDACTION LEVEL: PARANOID",
  ],
  complete: [
    "REDACTION PROTOCOL COMPLETE",
    "DOCUMENT FULLY PROCESSED",
    "OPTIMAL REDACTION ACHIEVED",
    "COMMENDABLE DISCRETION",
  ],
};

function getDocument(count: number): string[] {
  if (count >= 8 && Math.random() < 0.3) {
    return DISTURBING_DOCUMENTS[
      Math.floor(Math.random() * DISTURBING_DOCUMENTS.length)
    ];
  }
  if (count >= 4 && Math.random() < 0.4) {
    return STRANGE_DOCUMENTS[
      Math.floor(Math.random() * STRANGE_DOCUMENTS.length)
    ];
  }
  return NORMAL_DOCUMENTS[Math.floor(Math.random() * NORMAL_DOCUMENTS.length)];
}

function getRandomResponse(redactedCount: number, totalLines: number): string {
  const ratio = redactedCount / totalLines;

  if (ratio === 0) {
    const arr = RESPONSES.additional;
    return arr[Math.floor(Math.random() * arr.length)];
  }
  if (ratio > 0.7) {
    const arr = RESPONSES.excessive;
    return arr[Math.floor(Math.random() * arr.length)];
  }
  if (ratio > 0.4 && Math.random() < 0.3) {
    const arr = RESPONSES.complete;
    return arr[Math.floor(Math.random() * arr.length)];
  }
  const arr = RESPONSES.acceptable;
  return arr[Math.floor(Math.random() * arr.length)];
}

export function RedactionTool({ onExit }: GameProps) {
  const [documentCount, setDocumentCount] = useState(0);
  const [currentDocument, setCurrentDocument] = useState(() => getDocument(0));
  const [redactedLines, setRedactedLines] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onExit();
        return;
      }
      if (e.key === "Enter" && !isProcessing) {
        handleSubmit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExit, isProcessing]);

  const toggleRedaction = useCallback(
    (lineIndex: number) => {
      if (isProcessing) return;
      setRedactedLines((prev) => {
        const next = new Set(prev);
        if (next.has(lineIndex)) {
          next.delete(lineIndex);
        } else {
          next.add(lineIndex);
        }
        return next;
      });
    },
    [isProcessing]
  );

  const handleSubmit = useCallback(() => {
    if (isProcessing) return;

    setIsProcessing(true);
    setMessage("REVIEWING REDACTIONS...");

    setTimeout(() => {
      const response = getRandomResponse(
        redactedLines.size,
        currentDocument.length
      );
      setMessage(response);

      setTimeout(() => {
        const newCount = documentCount + 1;
        setDocumentCount(newCount);
        setCurrentDocument(getDocument(newCount));
        setRedactedLines(new Set());
        setMessage(null);
        setIsProcessing(false);
      }, 1500);
    }, 600);
  }, [isProcessing, redactedLines, currentDocument, documentCount]);

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-[var(--void-gray-200)] border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="status-indicator-glow bg-[var(--system-green)] text-[var(--system-green)]" />
          <span className="font-designation text-[var(--void-gray-600)]">
            REDACTION TOOL
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
            DOCUMENTS PROCESSED: {documentCount}
          </span>
          <span className="font-system text-[10px] text-[var(--void-gray-300)]">
            GUIDELINES ARE CLASSIFIED
          </span>
        </div>
      </div>

      {/* Document display */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-md border border-[var(--void-gray-200)] bg-white p-6">
          <div className="mb-4 font-system text-[10px] text-[var(--void-gray-300)]">
            DOCUMENT #{String(documentCount + 1).padStart(4, "0")}
          </div>
          <div className="space-y-2">
            {currentDocument.map((line, index) => (
              <button
                className={`group relative block w-full text-left transition-all ${
                  isProcessing ? "cursor-default" : "cursor-pointer"
                }`}
                disabled={isProcessing}
                key={`${documentCount}-${index}`}
                onClick={() => toggleRedaction(index)}
                type="button"
              >
                <div
                  className={`relative px-2 py-1 font-system text-[11px] leading-relaxed ${
                    redactedLines.has(index)
                      ? "bg-[var(--void-gray-900)] text-[var(--void-gray-900)]"
                      : "text-[var(--void-gray-600)] hover:bg-[var(--void-gray-100)]"
                  }`}
                >
                  {line}
                  {redactedLines.has(index) && (
                    <span className="absolute inset-0 flex items-center justify-center font-system text-[8px] text-[var(--void-gray-400)]">
                      [REDACTED]
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
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
            CLICK LINES TO REDACT • ENTER TO SUBMIT
          </span>
          <button
            className="border border-[var(--void-gray-300)] bg-white px-6 py-2 font-system text-[var(--void-gray-600)] transition-colors hover:border-[var(--void-gray-500)] hover:bg-[var(--void-gray-100)] disabled:opacity-50"
            disabled={isProcessing}
            onClick={handleSubmit}
            type="button"
          >
            [FINALIZE REDACTION]
          </button>
        </div>
      </div>
    </div>
  );
}
