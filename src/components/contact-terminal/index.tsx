import { useCallback, useEffect, useRef, useState } from "react";

/**
 * CONTACT TERMINAL
 *
 * A system-like contact form that feels like submitting an internal
 * communication request to an unknown department.
 *
 * Uses Formspree for form submission (no backend required).
 */

// Formspree endpoint - replace with your actual form ID
const FORMSPREE_URL = "https://formspree.io/f/xpwzgkdq"; // You'll need to create this

type FormStatus = "idle" | "submitting" | "success" | "error";

interface ContactTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail?: string;
}

const SUBJECT_OPTIONS = [
  { value: "inquiry", label: "GENERAL INQUIRY" },
  { value: "collaboration", label: "COLLABORATION REQUEST" },
  { value: "opportunity", label: "OPPORTUNITY" },
  { value: "other", label: "OTHER / UNCLASSIFIED" },
];

type SubjectValue = (typeof SUBJECT_OPTIONS)[number]["value"];

export function ContactTerminal({ isOpen, onClose }: ContactTerminalProps) {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [subject, setSubject] = useState<SubjectValue>("inquiry");
  const [message, setMessage] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus trap and escape key handling
  useEffect(() => {
    if (!isOpen) return;

    // Focus first input when opened
    const timer = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 100);

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Reset form when closed
  useEffect(() => {
    if (!isOpen) {
      // Delay reset to allow closing animation
      const timer = setTimeout(() => {
        setStatus("idle");
        setSubject("inquiry");
        setMessage("");
        setSenderEmail("");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (status === "submitting") return;

      setStatus("submitting");

      try {
        const response = await fetch(FORMSPREE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: senderEmail,
            subject: SUBJECT_OPTIONS.find((o) => o.value === subject)?.label,
            message,
            _subject: `[YYYYAAA] ${SUBJECT_OPTIONS.find((o) => o.value === subject)?.label}`,
          }),
        });

        if (response.ok) {
          setStatus("success");
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    },
    [senderEmail, subject, message, status]
  );

  if (!isOpen) return null;

  return (
    <div
      aria-labelledby="contact-terminal-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-white/90 backdrop-blur-sm" />

      {/* Terminal Window */}
      <div
        className="relative mx-4 w-full max-w-md animate-fade-in border border-[var(--void-gray-200)] bg-white"
        ref={modalRef}
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-[var(--void-gray-200)] border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="status-indicator bg-[var(--system-green)]" />
            <h2
              className="font-designation text-[var(--void-gray-600)]"
              id="contact-terminal-title"
            >
              TRANSMIT INQUIRY
            </h2>
          </div>
          <button
            aria-label="Close terminal"
            className="font-system text-[var(--void-gray-400)] transition-colors hover:text-[var(--void-gray-600)]"
            onClick={onClose}
          >
            [ESC]
          </button>
        </div>

        {/* Terminal Body */}
        <div className="p-4">
          {status === "success" ? (
            <SuccessState onClose={onClose} />
          ) : status === "error" ? (
            <ErrorState onRetry={() => setStatus("idle")} />
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Sender Email */}
              <div>
                <label
                  className="mb-2 block font-system text-[var(--void-gray-400)]"
                  htmlFor="sender-email"
                >
                  RETURN ADDRESS
                </label>
                <input
                  className="w-full border border-[var(--void-gray-200)] bg-[var(--void-gray-100)] px-3 py-2 font-system text-[var(--void-gray-700)] transition-colors placeholder:text-[var(--void-gray-400)] focus:border-[var(--void-gray-400)] focus:outline-none"
                  id="sender-email"
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="your@email.com"
                  ref={firstInputRef}
                  required
                  type="email"
                  value={senderEmail}
                />
              </div>

              {/* Subject Classification */}
              <div>
                <label
                  className="mb-2 block font-system text-[var(--void-gray-400)]"
                  htmlFor="subject"
                >
                  SUBJECT CLASSIFICATION
                </label>
                <select
                  className="w-full cursor-pointer appearance-none border border-[var(--void-gray-200)] bg-[var(--void-gray-100)] px-3 py-2 font-system text-[var(--void-gray-700)] transition-colors focus:border-[var(--void-gray-400)] focus:outline-none"
                  id="subject"
                  onChange={(e) => setSubject(e.target.value as SubjectValue)}
                  value={subject}
                >
                  {SUBJECT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message Content */}
              <div>
                <label
                  className="mb-2 block font-system text-[var(--void-gray-400)]"
                  htmlFor="message"
                >
                  MESSAGE CONTENT
                </label>
                <textarea
                  className="w-full resize-none border border-[var(--void-gray-200)] bg-[var(--void-gray-100)] px-3 py-2 font-system text-[var(--void-gray-700)] transition-colors placeholder:text-[var(--void-gray-400)] focus:border-[var(--void-gray-400)] focus:outline-none"
                  id="message"
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter transmission content..."
                  required
                  rows={4}
                  value={message}
                />
              </div>

              {/* Submit Button */}
              <button
                className="w-full bg-[var(--void-gray-900)] py-3 font-designation text-white tracking-wider transition-colors hover:bg-[var(--void-gray-800)] focus:outline-none focus:ring-2 focus:ring-[var(--void-gray-400)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={status === "submitting"}
                type="submit"
              >
                {status === "submitting" ? (
                  <span className="animate-pulse">TRANSMITTING...</span>
                ) : (
                  "TRANSMIT"
                )}
              </button>

              {/* Footer note */}
              <p className="text-center font-system text-[10px] text-[var(--void-gray-300)]">
                TRANSMISSION ROUTED TO DEPARTMENT INBOX
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function SuccessState({ onClose }: { onClose: () => void }) {
  return (
    <div className="py-8 text-center">
      <div className="status-indicator-glow mx-auto mb-4 bg-[var(--system-green)] text-[var(--system-green)]" />
      <h3 className="mb-2 font-designation text-[var(--void-gray-600)]">
        TRANSMISSION COMPLETE
      </h3>
      <p className="mb-6 font-system text-[var(--void-gray-400)]">
        YOUR INQUIRY HAS BEEN LOGGED
      </p>
      <button
        className="font-system text-[var(--void-gray-500)] transition-colors hover:text-[var(--void-gray-700)]"
        onClick={onClose}
      >
        [CLOSE TERMINAL]
      </button>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-8 text-center">
      <div className="status-indicator mx-auto mb-4 bg-[var(--system-red)]" />
      <h3 className="mb-2 font-designation text-[var(--void-gray-600)]">
        TRANSMISSION FAILED
      </h3>
      <p className="mb-6 font-system text-[var(--void-gray-400)]">
        ERROR: NETWORK ANOMALY DETECTED
      </p>
      <button
        className="font-system text-[var(--void-gray-500)] transition-colors hover:text-[var(--void-gray-700)]"
        onClick={onRetry}
      >
        [RETRY TRANSMISSION]
      </button>
    </div>
  );
}
