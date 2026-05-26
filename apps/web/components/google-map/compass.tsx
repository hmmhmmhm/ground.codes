import React, { useCallback, useRef, useState, useEffect } from "react";

import { CompassIcon } from "./compass-icon";

interface CompassProps {
  mapHeading: number;
  resetMapHeading: () => void;
  setMapHeading?: (heading: number) => void;
  className?: string;
  title: string;
  ariaLabel: string;
}

const Compass: React.FC<CompassProps> = ({
  mapHeading,
  resetMapHeading,
  setMapHeading,
  className = "absolute bottom-[100px] right-[10px]",
  title,
  ariaLabel,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const compassRef = useRef<HTMLButtonElement>(null);
  const startAngleRef = useRef<number>(0);
  const startHeadingRef = useRef<number>(0);
  const hasDraggedRef = useRef<boolean>(false); // Whether a drag actually occurred
  const startPosRef = useRef<{ x: number; y: number } | null>(null); // Drag start position
  const lastDragTimeRef = useRef<number>(0); // Last drag time

  // Calculate mouse position
  const calculateAngle = useCallback(
    (centerX: number, centerY: number, pointX: number, pointY: number) => {
      return Math.atan2(pointY - centerY, pointX - centerX) * (180 / Math.PI);
    },
    [],
  );

  // Handle mouse movement during drag
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!compassRef.current || !setMapHeading) return;

      // Calculate the difference between the start position and current position
      if (startPosRef.current) {
        const dx = Math.abs(e.clientX - startPosRef.current.x);
        const dy = Math.abs(e.clientY - startPosRef.current.y);

        // Consider it a drag only if the mouse moved more than 3 pixels
        if (dx > 3 || dy > 3) {
          hasDraggedRef.current = true;
          lastDragTimeRef.current = Date.now(); // Update last drag time
        }
      }

      const rect = compassRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const currentAngle = calculateAngle(
        centerX,
        centerY,
        e.clientX,
        e.clientY,
      );

      // Calculate the difference between the start angle and current angle
      let angleDiff = currentAngle - startAngleRef.current;

      // If the angle difference exceeds 180 degrees, calculate the opposite direction (shortest path rotation)
      if (angleDiff > 180) angleDiff -= 360;
      if (angleDiff < -180) angleDiff += 360;

      // Calculate rotation angle (clockwise rotation decreases angle)
      let newHeading = (startHeadingRef.current - angleDiff) % 360;
      if (newHeading < 0) newHeading += 360;
      setMapHeading(newHeading);
    },
    [calculateAngle, setMapHeading],
  );

  // Handle touch movement
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!compassRef.current || !setMapHeading || !e.touches[0]) return;

      // Calculate the difference between the start position and current position
      if (startPosRef.current) {
        const dx = Math.abs(e.touches[0].clientX - startPosRef.current.x);
        const dy = Math.abs(e.touches[0].clientY - startPosRef.current.y);

        // Consider it a drag only if the touch moved more than 3 pixels
        if (dx > 3 || dy > 3) {
          hasDraggedRef.current = true;
          lastDragTimeRef.current = Date.now(); // Update last drag time
        }
      }

      const rect = compassRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const currentAngle = calculateAngle(
        centerX,
        centerY,
        e.touches[0].clientX,
        e.touches[0].clientY,
      );

      // Calculate the difference between the start angle and current angle
      let angleDiff = currentAngle - startAngleRef.current;

      // If the angle difference exceeds 180 degrees, calculate the opposite direction (shortest path rotation)
      if (angleDiff > 180) angleDiff -= 360;
      if (angleDiff < -180) angleDiff += 360;

      // Calculate rotation angle (clockwise rotation decreases angle)
      let newHeading = (startHeadingRef.current - angleDiff) % 360;
      if (newHeading < 0) newHeading += 360;
      setMapHeading(newHeading);

      // Prevent default action
      e.preventDefault();
    },
    [calculateAngle, setMapHeading],
  );

  // Handle drag end
  const handleDragEnd = useCallback((e: MouseEvent | TouchEvent) => {
    setIsDragging(false);

    // Reset drag state (for next interaction)
    const wasDragging = hasDraggedRef.current;
    hasDraggedRef.current = false;
    startPosRef.current = null;

    // If a drag occurred, prevent click event
    if (wasDragging) {
      lastDragTimeRef.current = Date.now();

      // Prevent click event after drag
      if (e instanceof MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }, []);

  // Event listener registration and cleanup
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("mouseup", handleDragEnd);
      document.addEventListener("touchend", handleDragEnd);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("mouseup", handleDragEnd);
      document.removeEventListener("touchend", handleDragEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("mouseup", handleDragEnd);
      document.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, handleMouseMove, handleTouchMove, handleDragEnd]);

  // Handle mouse drag start
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!compassRef.current || !setMapHeading) return;

      // Prevent default action and event bubbling
      e.preventDefault();
      e.stopPropagation();

      // Store drag start position
      startPosRef.current = { x: e.clientX, y: e.clientY };
      hasDraggedRef.current = false;

      const rect = compassRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      startAngleRef.current = calculateAngle(
        centerX,
        centerY,
        e.clientX,
        e.clientY,
      );
      startHeadingRef.current = mapHeading;
      setIsDragging(true);
    },
    [calculateAngle, mapHeading, setMapHeading],
  );

  // Handle touch drag start
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>) => {
      if (!compassRef.current || !setMapHeading || !e.touches[0]) return;

      // Prevent default action and event bubbling
      e.preventDefault();
      e.stopPropagation();

      // Store drag start position
      startPosRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      hasDraggedRef.current = false;

      const rect = compassRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      startAngleRef.current = calculateAngle(
        centerX,
        centerY,
        e.touches[0].clientX,
        e.touches[0].clientY,
      );
      startHeadingRef.current = mapHeading;
      setIsDragging(true);
    },
    [calculateAngle, mapHeading, setMapHeading],
  );

  // Handle click (reset only if no drag occurred recently)
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      // Check if a drag occurred recently (300ms within)
      const timeSinceLastDrag = Date.now() - lastDragTimeRef.current;

      // If a drag occurred or recently ended, ignore click event
      if (hasDraggedRef.current || timeSinceLastDrag < 300) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // If no drag occurred recently, reset heading
      resetMapHeading();
    },
    [resetMapHeading],
  );

  return (
    <button
      ref={compassRef}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={`${className} ${isDragging ? "cursor-grabbing" : "cursor-grab"} bg-black/50 backdrop-blur-md border border-white/20 rounded-full w-[40px] h-[40px] flex justify-center items-center z-10 overflow-hidden`}
      title={isDragging ? "Drag to rotate map" : title}
      aria-label={ariaLabel}
      style={{
        transform: `rotate(-${mapHeading}deg)`,
        transition: isDragging ? "none" : "transform 0.3s ease-in-out",
      }}
    >
      <CompassIcon />
    </button>
  );
};

export default Compass;
