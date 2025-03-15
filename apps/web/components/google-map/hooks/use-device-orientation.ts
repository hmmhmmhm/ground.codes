import { useState, useEffect, useCallback, useRef } from "react";

interface DeviceOrientationState {
  heading: number | null;
  isSupported: boolean;
  permissionState: "prompt" | "granted" | "denied" | "unavailable";
}

interface UseDeviceOrientationReturn extends DeviceOrientationState {
  requestPermission: () => Promise<boolean>;
}

export const useDeviceOrientation = (): UseDeviceOrientationReturn => {
  const [orientationState, setOrientationState] =
    useState<DeviceOrientationState>({
      heading: null,
      isSupported: false,
      permissionState: "unavailable",
    });

  // Use a ref to store the latest heading value without triggering re-renders
  const headingRef = useRef<number | null>(null);
  // Debounce timer ref
  const debounceTimerRef = useRef<number | null>(null);
  // Minimum angle change required to update state (in degrees)
  const MIN_ANGLE_CHANGE = 5;

  // Check if device is iOS
  const isIOS = useCallback(() => {
    return !!(
      navigator.userAgent.match(/(iPod|iPhone|iPad)/) &&
      navigator.userAgent.match(/AppleWebKit/)
    );
  }, []);

  // Handle device orientation event with debouncing and threshold
  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    let newHeading: number | null = null;

    // For devices that support deviceorientationabsolute
    if ("compassHeading" in event) {
      newHeading = (event as any).compassHeading;
    }
    // For devices that support deviceorientation with webkitCompassHeading
    else if ("webkitCompassHeading" in event) {
      newHeading = (event as any).webkitCompassHeading;
    }
    // For devices that only provide alpha value (relative to initial position)
    else if (event.alpha !== null) {
      newHeading = event.alpha;
    }

    // If no valid heading or no change, return early
    if (newHeading === null) return;

    // Check if the heading has changed significantly
    const currentHeading = headingRef.current;
    if (currentHeading !== null) {
      const angleDiff = Math.abs(newHeading - currentHeading);
      const normalizedDiff = angleDiff > 180 ? 360 - angleDiff : angleDiff;

      // Only update if the change is significant
      if (normalizedDiff < MIN_ANGLE_CHANGE) return;
    }

    // Update the ref immediately
    headingRef.current = newHeading;

    // Debounce the state update
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      setOrientationState((prev) => ({
        ...prev,
        heading: newHeading,
      }));
      debounceTimerRef.current = null;
    }, 100); // 100ms debounce time
  }, []);

  // Request permission for device orientation
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isIOS()) {
      // For non-iOS devices, no permission needed
      window.addEventListener(
        "deviceorientationabsolute",
        handleOrientation,
        true
      );
      if (!window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientation", handleOrientation, true);
      }
      setOrientationState((prev) => ({
        ...prev,
        isSupported: true,
        permissionState: "granted",
      }));
      return true;
    }

    // For iOS devices
    if (
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      try {
        const permission = await (
          DeviceOrientationEvent as any
        ).requestPermission();
        const granted = permission === "granted";

        if (granted) {
          window.addEventListener("deviceorientation", handleOrientation, true);
          setOrientationState((prev) => ({
            ...prev,
            isSupported: true,
            permissionState: "granted",
          }));
        } else {
          setOrientationState((prev) => ({
            ...prev,
            permissionState: "denied",
          }));
        }

        return granted;
      } catch (error) {
        console.error("Error requesting device orientation permission:", error);
        setOrientationState((prev) => ({
          ...prev,
          isSupported: false,
          permissionState: "unavailable",
        }));
        return false;
      }
    } else {
      // Device orientation is not supported or doesn't require permission
      setOrientationState((prev) => ({
        ...prev,
        isSupported: false,
        permissionState: "unavailable",
      }));
      return false;
    }
  }, [handleOrientation, isIOS]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
      window.removeEventListener(
        "deviceorientationabsolute",
        handleOrientation,
        true
      );
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, [handleOrientation]);

  // Check support on mount
  useEffect(() => {
    const checkSupport = () => {
      const supported = window.DeviceOrientationEvent !== undefined;
      const permissionAPI =
        typeof (DeviceOrientationEvent as any).requestPermission === "function";

      setOrientationState((prev) => ({
        ...prev,
        isSupported: supported,
        permissionState: supported
          ? permissionAPI
            ? "prompt"
            : "granted"
          : "unavailable",
      }));

      // If supported and doesn't need permission, add listener
      if (supported && !permissionAPI && !isIOS()) {
        window.addEventListener(
          "deviceorientationabsolute",
          handleOrientation,
          true
        );
        if (!window.DeviceOrientationEvent) {
          window.addEventListener("deviceorientation", handleOrientation, true);
        }
      }
    };

    checkSupport();

    return () => {
      window.removeEventListener(
        "deviceorientationabsolute",
        handleOrientation,
        true
      );
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, [handleOrientation, isIOS]);

  return {
    ...orientationState,
    requestPermission,
  };
};
