import { useCallback, useEffect, useRef, useState } from "react";
import type { GameProps } from "./types";

/**
 * ELEVATOR CALIBRATION
 *
 * Align the indicator with the target zone.
 * Hold for 3 seconds to calibrate.
 * The target will shift. Recalibration is required.
 *
 * "Calibration is eternal."
 */

const TRACK_WIDTH = 400;
const INITIAL_TARGET_WIDTH = 60;
const MIN_TARGET_WIDTH = 25;
const HOLD_DURATION = 3000; // 3 seconds
const TARGET_MOVE_SPEED = 0.15; // pixels per frame

const MESSAGES = {
  idle: ["AWAITING ALIGNMENT", "POSITION INDICATOR", "BEGIN CALIBRATION"],
  holding: [
    "HOLD STEADY",
    "CALIBRATING...",
    "MAINTAIN POSITION",
    "DO NOT MOVE",
  ],
  success: [
    "CALIBRATION ACCEPTED",
    "ALIGNMENT VERIFIED",
    "PARAMETERS UPDATED",
    "PROCEEDING",
  ],
  shift: [
    "RECALIBRATION REQUIRED",
    "TARGET SHIFTED",
    "NEW PARAMETERS DETECTED",
    "ALIGNMENT NEEDED",
  ],
  lost: [
    "CALIBRATION LOST",
    "REALIGN INDICATOR",
    "POSITION DEVIATED",
    "TRY AGAIN",
  ],
};

function getMessage(type: keyof typeof MESSAGES): string {
  const arr = MESSAGES[type];
  return arr[Math.floor(Math.random() * arr.length)];
}

export function ElevatorCalibration({ onExit }: GameProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  const [sliderPosition, setSliderPosition] = useState(50); // 0-100%
  const [targetPosition, setTargetPosition] = useState(50); // 0-100%
  const [targetWidth, setTargetWidth] = useState(INITIAL_TARGET_WIDTH);
  const [targetDirection, setTargetDirection] = useState(1); // 1 or -1
  const [holdProgress, setHoldProgress] = useState(0);
  const [calibrationLevel, setCalibrationLevel] = useState(0);
  const [message, setMessage] = useState(getMessage("idle"));
  const [isAligned, setIsAligned] = useState(false);

  const holdStartTime = useRef<number | null>(null);
  const isDragging = useRef(false);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onExit();
        return;
      }
      // Arrow keys for fine control
      if (e.key === "ArrowLeft") {
        setSliderPosition((p) => Math.max(0, p - 1));
      } else if (e.key === "ArrowRight") {
        setSliderPosition((p) => Math.min(100, p + 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExit]);

  // Check alignment
  const checkAlignment = useCallback(() => {
    const sliderPx = (sliderPosition / 100) * TRACK_WIDTH;
    const targetPx = (targetPosition / 100) * TRACK_WIDTH;
    const halfTarget = targetWidth / 2;

    return Math.abs(sliderPx - targetPx) <= halfTarget;
  }, [sliderPosition, targetPosition, targetWidth]);

  // Main game loop
  useEffect(() => {
    const gameLoop = () => {
      const now = Date.now();

      // Move target slowly
      setTargetPosition((prev) => {
        const moveAmount = TARGET_MOVE_SPEED * (calibrationLevel * 0.1 + 1);
        let newPos = prev + targetDirection * moveAmount;

        // Bounce off edges
        if (newPos <= 10 || newPos >= 90) {
          setTargetDirection((d) => -d);
          newPos = Math.max(10, Math.min(90, newPos));
        }

        return newPos;
      });

      // Check alignment and update hold progress
      const aligned = checkAlignment();
      setIsAligned(aligned);

      if (aligned) {
        if (holdStartTime.current === null) {
          holdStartTime.current = now;
          setMessage(getMessage("holding"));
        }

        const holdDuration = now - holdStartTime.current;
        const progress = Math.min(100, (holdDuration / HOLD_DURATION) * 100);
        setHoldProgress(progress);

        // Check for successful calibration
        if (holdDuration >= HOLD_DURATION) {
          setCalibrationLevel((l) => l + 1);
          setMessage(getMessage("success"));

          // Reset for next level
          setTimeout(() => {
            const newLevel = calibrationLevel + 1;
            setTargetWidth(
              Math.max(MIN_TARGET_WIDTH, INITIAL_TARGET_WIDTH - newLevel * 5)
            );
            setTargetPosition(20 + Math.random() * 60);
            setHoldProgress(0);
            holdStartTime.current = null;
            setMessage(getMessage("shift"));
          }, 1000);
        }
      } else {
        if (holdStartTime.current !== null) {
          // Lost alignment
          setMessage(getMessage("lost"));
        }
        holdStartTime.current = null;
        setHoldProgress(0);
      }

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animationRef.current);
  }, [calibrationLevel, targetDirection, checkAlignment]);

  // Mouse handlers for slider
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    updateSliderPosition(e);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging.current) {
      updateSliderPosition(e);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const updateSliderPosition = useCallback((e: React.MouseEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    isDragging.current = true;
    updateSliderPositionTouch(e);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDragging.current) {
      updateSliderPositionTouch(e);
    }
  }, []);

  const updateSliderPositionTouch = useCallback((e: React.TouchEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-[var(--void-gray-200)] border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`status-indicator-glow ${
              isAligned
                ? "bg-[var(--system-green)] text-[var(--system-green)]"
                : "bg-[var(--system-amber)] text-[var(--system-amber)]"
            }`}
          />
          <span className="font-designation text-[var(--void-gray-600)]">
            ELEVATOR CALIBRATION
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

      {/* Stats */}
      <div className="border-[var(--void-gray-100)] border-b px-6 py-3">
        <div className="flex items-center justify-between">
          <span className="font-system text-[var(--void-gray-400)]">
            CALIBRATION LEVEL: {calibrationLevel}
          </span>
          <span className="font-system text-[10px] text-[var(--void-gray-300)]">
            PRECISION REQUIRED
          </span>
        </div>
      </div>

      {/* Main calibration area */}
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        {/* Hold progress indicator */}
        <div className="mb-8">
          <div className="mb-2 text-center font-system text-[10px] text-[var(--void-gray-300)]">
            HOLD PROGRESS
          </div>
          <div className="h-2 w-48 bg-[var(--void-gray-200)]">
            <div
              className={`h-full transition-all duration-100 ${
                holdProgress > 0
                  ? "bg-[var(--system-green)]"
                  : "bg-[var(--void-gray-300)]"
              }`}
              style={{ width: `${holdProgress}%` }}
            />
          </div>
          <div className="mt-1 text-center font-system text-[10px] text-[var(--void-gray-400)]">
            {Math.round(holdProgress)}%
          </div>
        </div>

        {/* Calibration track */}
        <div className="mb-8 w-full max-w-md">
          <div className="mb-2 text-center font-system text-[10px] text-[var(--void-gray-300)]">
            ALIGNMENT TRACK
          </div>
          <div
            className="relative mx-auto h-12 cursor-pointer select-none border border-[var(--void-gray-300)] bg-[var(--void-gray-100)]"
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchEnd={() => (isDragging.current = false)}
            onTouchMove={handleTouchMove}
            onTouchStart={handleTouchStart}
            ref={trackRef}
            style={{ width: TRACK_WIDTH }}
          >
            {/* Target zone */}
            <div
              className={`absolute top-0 bottom-0 transition-colors ${
                isAligned
                  ? "bg-[var(--system-green)]/30"
                  : "bg-[var(--system-amber)]/20"
              }`}
              style={{
                left: `${targetPosition}%`,
                width: targetWidth,
                transform: "translateX(-50%)",
              }}
            >
              {/* Target zone borders */}
              <div
                className={`absolute top-0 bottom-0 left-0 w-px ${
                  isAligned
                    ? "bg-[var(--system-green)]"
                    : "bg-[var(--system-amber)]"
                }`}
              />
              <div
                className={`absolute top-0 right-0 bottom-0 w-px ${
                  isAligned
                    ? "bg-[var(--system-green)]"
                    : "bg-[var(--system-amber)]"
                }`}
              />
            </div>

            {/* Slider indicator */}
            <div
              className="absolute top-1 bottom-1 w-1 bg-[var(--void-gray-700)] transition-none"
              style={{
                left: `${sliderPosition}%`,
                transform: "translateX(-50%)",
              }}
            />

            {/* Track marks */}
            {[0, 25, 50, 75, 100].map((mark) => (
              <div
                className="absolute top-0 h-2 w-px bg-[var(--void-gray-300)]"
                key={mark}
                style={{ left: `${mark}%` }}
              />
            ))}
          </div>

          {/* Scale labels */}
          <div className="mt-1 flex justify-between font-system text-[9px] text-[var(--void-gray-300)]">
            <span>0</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
          </div>
        </div>

        {/* Message */}
        <div className="font-system text-[var(--void-gray-500)]">{message}</div>
      </div>

      {/* Footer */}
      <div className="border-[var(--void-gray-100)] border-t px-6 py-3">
        <div className="text-center font-system text-[10px] text-[var(--void-gray-300)]">
          DRAG SLIDER OR USE ARROW KEYS • HOLD IN TARGET FOR 3 SECONDS
        </div>
      </div>
    </div>
  );
}
