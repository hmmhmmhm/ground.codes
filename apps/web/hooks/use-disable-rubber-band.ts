import { useEffect } from "react";

/**
 * A hook that prevents iOS rubber band scrolling effect by intercepting
 * touchmove events when the user is trying to scroll past the top of the page
 */
export function useDisableRubberBandEffect() {
  useEffect(() => {
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        startY = e.touches[0].screenY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        const amountMovedY = e.touches[0].screenY - startY;

        // Prevent scrolling down when at the top of the page (rubber band effect)
        if (amountMovedY > 0 && window.scrollY <= 0) {
          e.preventDefault();
        }
      }
    };

    // Add event listeners with passive: false to allow preventDefault()
    document.body.addEventListener("touchstart", handleTouchStart);
    document.body.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });

    // Clean up by removing event listeners when the component unmounts
    return () => {
      document.body.removeEventListener("touchstart", handleTouchStart);
      document.body.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);
}
