import React, { useCallback, useRef, useState, useEffect } from "react";

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
    []
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
        e.clientY
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
    [calculateAngle, setMapHeading]
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
        e.touches[0].clientY
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
    [calculateAngle, setMapHeading]
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
        e.clientY
      );
      startHeadingRef.current = mapHeading;
      setIsDragging(true);
    },
    [calculateAngle, mapHeading, setMapHeading]
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
        e.touches[0].clientY
      );
      startHeadingRef.current = mapHeading;
      setIsDragging(true);
    },
    [calculateAngle, mapHeading, setMapHeading]
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
    [resetMapHeading]
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
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Compass outer circle */}
        <circle
          cx="12"
          cy="12"
          r="11"
          fill="rgba(34, 34, 34, 0.14)"
          stroke="#444444"
          strokeWidth="1"
        />

        {/* Compass ticks - statically implemented */}
        {/* 12 o'clock (north) */}
        <line
          x1="12"
          y1="1"
          x2="12"
          y2="3.5"
          stroke="#FFFFFF"
          strokeWidth="1"
        />
        {/* 1 o'clock (east) */}
        <line
          x1="15.5"
          y1="2.2"
          x2="14.6"
          y2="4.3"
          stroke="#FFFFFF"
          strokeWidth="0.5"
        />
        {/* 2 o'clock (east) */}
        <line
          x1="18.5"
          y1="4.5"
          x2="16.7"
          y2="6"
          stroke="#FFFFFF"
          strokeWidth="1"
        />
        {/* 3 o'clock (east) */}
        <line
          x1="20.8"
          y1="7.5"
          x2="18.7"
          y2="8.4"
          stroke="#FFFFFF"
          strokeWidth="0.5"
        />
        <line
          x1="22"
          y1="12"
          x2="19.5"
          y2="12"
          stroke="#FFFFFF"
          strokeWidth="1"
        />
        {/* 5 o'clock (west) */}
        <line
          x1="20.8"
          y1="16.5"
          x2="18.7"
          y2="15.6"
          stroke="#FFFFFF"
          strokeWidth="0.5"
        />
        {/* 6 o'clock (south) */}
        <line
          x1="18.5"
          y1="19.5"
          x2="16.7"
          y2="18"
          stroke="#FFFFFF"
          strokeWidth="1"
        />
        {/* 7 o'clock (west) */}
        <line
          x1="15.5"
          y1="21.8"
          x2="14.6"
          y2="19.7"
          stroke="#FFFFFF"
          strokeWidth="0.5"
        />
        {/* 8 o'clock (west) */}
        <line
          x1="12"
          y1="23"
          x2="12"
          y2="20.5"
          stroke="#FFFFFF"
          strokeWidth="1"
        />
        {/* 9 o'clock (west) */}
        <line
          x1="8.5"
          y1="21.8"
          x2="9.4"
          y2="19.7"
          stroke="#FFFFFF"
          strokeWidth="0.5"
        />
        {/* 10 o'clock (west) */}
        <line
          x1="5.5"
          y1="19.5"
          x2="7.3"
          y2="18"
          stroke="#FFFFFF"
          strokeWidth="1"
        />
        {/* 11 o'clock (west) */}
        <line
          x1="3.2"
          y1="16.5"
          x2="5.3"
          y2="15.6"
          stroke="#FFFFFF"
          strokeWidth="0.5"
        />
        <line
          x1="2"
          y1="12"
          x2="4.5"
          y2="12"
          stroke="#FFFFFF"
          strokeWidth="1"
        />
        {/* 1 o'clock (east) */}
        <line
          x1="3.2"
          y1="7.5"
          x2="5.3"
          y2="8.4"
          stroke="#FFFFFF"
          strokeWidth="0.5"
        />
        {/* 2 o'clock (east) */}
        <line
          x1="5.5"
          y1="4.5"
          x2="7.3"
          y2="6"
          stroke="#FFFFFF"
          strokeWidth="1"
        />
        {/* 3 o'clock (east) */}
        <line
          x1="8.5"
          y1="2.2"
          x2="9.4"
          y2="4.3"
          stroke="#FFFFFF"
          strokeWidth="0.5"
        />

        {/* Compass north direction indicator - red triangle */}
        <path
          d="M12 1L14.5 4L9.5 4L12 1Z"
          fill="#FF4444"
          stroke="#FF4444"
          strokeWidth="0.5"
        />

        {/* Compass center crosshair */}
        <circle
          cx="12"
          cy="12"
          r="1"
          fill="#FFFFFF"
          stroke="#FFFFFF"
          strokeWidth="0.5"
        />
        <line
          x1="12"
          y1="9"
          x2="12"
          y2="15"
          stroke="#FFFFFF"
          strokeWidth="0.5"
        />
        <line
          x1="9"
          y1="12"
          x2="15"
          y2="12"
          stroke="#FFFFFF"
          strokeWidth="0.5"
        />
      </svg>
    </button>
  );
};

export default Compass;
