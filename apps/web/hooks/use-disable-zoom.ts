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
 * A hook that prevents browser zoom functionality by intercepting
 * wheel events with Ctrl/Meta key and keyboard shortcuts (Ctrl/Meta + +/-)
 */
export function useDisableZoom() {
  useEffect(() => {
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

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("gesturestart", handleGesture, { passive: false });
    document.addEventListener("gesturechange", handleGesture, {
      passive: false,
    });
    document.addEventListener("gestureend", handleGesture, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("gesturestart", handleGesture);
      document.removeEventListener("gesturechange", handleGesture);
      document.removeEventListener("gestureend", handleGesture);
    };
  }, []);
}
