import { useEffect, useState } from "react";

/**
 * Detect if the current device supports touch input.
 * Updates dynamically if device capabilities change.
 */
export const useIsTouchDevice = (): boolean => {
  const [isTouch, setIsTouch] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches
    );
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(pointer: coarse)");

    const handleChange = (e: MediaQueryListEvent) => {
      setIsTouch(
        e.matches || "ontouchstart" in window || navigator.maxTouchPoints > 0
      );
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    // Legacy browsers
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return isTouch;
};
