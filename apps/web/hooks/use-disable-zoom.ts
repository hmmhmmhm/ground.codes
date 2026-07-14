import { useEffect } from "react";

type BrowserZoomEventLike = {
  ctrlKey?: boolean;
  metaKey?: boolean;
  touches?: { length: number };
  scale?: number;
};

export function shouldPreventBrowserZoom(event: BrowserZoomEventLike) {
  if (event.ctrlKey || event.metaKey) return true;
  if (event.touches && event.touches.length > 1) return true;
  return typeof event.scale === "number" && event.scale !== 1;
}

/**
 * Install browser zoom prevention and return a complete listener cleanup.
 */
export function installBrowserZoomPrevention(
  windowTarget: Pick<
    Window,
    "addEventListener" | "removeEventListener"
  > = window,
  documentTarget: Pick<
    Document,
    "addEventListener" | "removeEventListener"
  > = document,
) {
  const handleWheel = (e: WheelEvent) => {
    if (shouldPreventBrowserZoom(e)) {
      e.preventDefault();
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (shouldPreventBrowserZoom(e)) {
      e.preventDefault();
    }
  };

  const handleGesture = (e: Event) => {
    e.preventDefault();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === "+" || e.key === "-" || e.key === "=")
    ) {
      e.preventDefault();
    }
  };

  windowTarget.addEventListener("wheel", handleWheel, { passive: false });
  windowTarget.addEventListener("keydown", handleKeyDown);
  documentTarget.addEventListener("touchmove", handleTouchMove, {
    passive: false,
  });
  documentTarget.addEventListener("gesturestart", handleGesture, {
    passive: false,
  });
  documentTarget.addEventListener("gesturechange", handleGesture, {
    passive: false,
  });
  documentTarget.addEventListener("gestureend", handleGesture, {
    passive: false,
  });

  return () => {
    windowTarget.removeEventListener("wheel", handleWheel);
    windowTarget.removeEventListener("keydown", handleKeyDown);
    documentTarget.removeEventListener("touchmove", handleTouchMove);
    documentTarget.removeEventListener("gesturestart", handleGesture);
    documentTarget.removeEventListener("gesturechange", handleGesture);
    documentTarget.removeEventListener("gestureend", handleGesture);
  };
}

/**
 * A hook that prevents browser zoom functionality by intercepting
 * wheel events with Ctrl/Meta key and keyboard shortcuts (Ctrl/Meta + +/-)
 */
export function useDisableZoom() {
  useEffect(() => installBrowserZoomPrevention(), []);
}
