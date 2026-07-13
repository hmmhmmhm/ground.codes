import { useState, useEffect, useCallback, useRef } from "react";

interface DeviceOrientationState {
  heading: number | null;
  isSupported: boolean;
  permissionState: "prompt" | "granted" | "denied" | "unavailable";
  isCalibrating: boolean;
}

interface UseDeviceOrientationReturn extends DeviceOrientationState {
  requestPermission: () => Promise<boolean>;
}

type DeviceOrientationPermission = "granted" | "denied" | "prompt";

interface DeviceOrientationEventWithCompass extends DeviceOrientationEvent {
  compassHeading?: number;
  webkitCompassHeading?: number;
}

interface DeviceOrientationEventConstructorWithPermission {
  requestPermission?: () => Promise<DeviceOrientationPermission>;
}

export const useDeviceOrientation = (): UseDeviceOrientationReturn => {
  const [orientationState, setOrientationState] =
    useState<DeviceOrientationState>({
      heading: null,
      isSupported: false,
      permissionState: "unavailable",
      isCalibrating: false,
    });

  // Use a ref to store the latest heading value without triggering re-renders
  const headingRef = useRef<number | null>(null);
  // Debounce timer ref
  const debounceTimerRef = useRef<number | null>(null);
  // Orientation listener added ref
  const orientationListenerAddedRef = useRef<boolean>(false);
  // Last heading update time ref
  const lastHeadingUpdateTimeRef = useRef<number>(0);
  // Minimum angle change required to update state (in degrees)
  const MIN_ANGLE_CHANGE = 2;
  // Minimum update interval (in milliseconds)
  const MIN_UPDATE_INTERVAL = 50;

  // Check if device is iOS
  const isIOS = useCallback(() => {
    return !!(
      navigator.userAgent.match(/(iPod|iPhone|iPad)/) &&
      navigator.userAgent.match(/AppleWebKit/)
    );
  }, []);

  // Update the orientation state when the heading changes
  const updateHeading = useCallback((newHeading: number) => {
    // Update the heading ref immediately
    headingRef.current = newHeading;

    // Use requestAnimationFrame to batch updates with the browser's render cycle
    requestAnimationFrame(() => {
      setOrientationState((prev) => {
        // Double-check if the heading has actually changed from the current state
        if (prev.heading === newHeading) return prev;
        return {
          ...prev,
          heading: newHeading,
        };
      });
    });
  }, []);

  // Handle device orientation event with debouncing and threshold
  const handleOrientation = useCallback(
    (event: DeviceOrientationEventWithCompass) => {
      let newHeading: number | null = null;

      // For devices that support deviceorientationabsolute
      if (typeof event.compassHeading === "number") {
        newHeading = event.compassHeading;
      }
      // For devices that support deviceorientation with webkitCompassHeading
      else if (typeof event.webkitCompassHeading === "number") {
        newHeading = event.webkitCompassHeading;
      }
      // For devices that only provide alpha value (relative to initial position)
      else if (event.alpha !== null) {
        // 모바일 기기에서 alpha 값은 0-360도 범위
        newHeading = 360 - event.alpha; // 방향 조정 (북쪽이 0도가 되도록)
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

      // Update the orientation state
      updateHeading(newHeading);

      // Debounce the state update
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }

      // Use requestAnimationFrame to batch updates with the browser's render cycle
      const currentTime = Date.now();
      if (
        currentTime - lastHeadingUpdateTimeRef.current <
        MIN_UPDATE_INTERVAL
      ) {
        debounceTimerRef.current = window.setTimeout(
          () => {
            requestAnimationFrame(() => {
              lastHeadingUpdateTimeRef.current = currentTime;
            });
            debounceTimerRef.current = null;
          },
          MIN_UPDATE_INTERVAL -
            (currentTime - lastHeadingUpdateTimeRef.current),
        );
      } else {
        requestAnimationFrame(() => {
          lastHeadingUpdateTimeRef.current = currentTime;
        });
      }
    },
    [updateHeading],
  );

  // Request permission for device orientation
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isIOS()) {
      // For non-iOS devices, no permission needed
      if (!orientationListenerAddedRef.current) {
        window.addEventListener(
          "deviceorientationabsolute",
          handleOrientation,
          true,
        );
        if (!window.DeviceOrientationEvent) {
          window.addEventListener("deviceorientation", handleOrientation, true);
        }
        orientationListenerAddedRef.current = true;
      }
      setOrientationState((prev) => ({
        ...prev,
        isSupported: true,
        permissionState: "granted",
      }));
      return true;
    }

    // For iOS devices
    const orientationEvent =
      window.DeviceOrientationEvent as unknown as DeviceOrientationEventConstructorWithPermission;

    if (typeof orientationEvent.requestPermission === "function") {
      try {
        const permission = await orientationEvent.requestPermission();
        const granted = permission === "granted";

        if (granted) {
          if (!orientationListenerAddedRef.current) {
            window.addEventListener(
              "deviceorientation",
              handleOrientation,
              true,
            );
            orientationListenerAddedRef.current = true;
          }
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
      if (orientationListenerAddedRef.current) {
        window.removeEventListener(
          "deviceorientationabsolute",
          handleOrientation,
          true,
        );
        window.removeEventListener(
          "deviceorientation",
          handleOrientation,
          true,
        );
        orientationListenerAddedRef.current = false;
      }
    };
  }, [handleOrientation]);

  // Check support on mount
  useEffect(() => {
    const checkSupport = () => {
      const supported = window.DeviceOrientationEvent !== undefined;
      const orientationEvent =
        window.DeviceOrientationEvent as unknown as DeviceOrientationEventConstructorWithPermission;
      const permissionAPI =
        typeof orientationEvent.requestPermission === "function";

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
          true,
        );
        if (!window.DeviceOrientationEvent) {
          window.addEventListener("deviceorientation", handleOrientation, true);
        }
        orientationListenerAddedRef.current = true;
      }
    };

    checkSupport();

    return () => {
      if (orientationListenerAddedRef.current) {
        window.removeEventListener(
          "deviceorientationabsolute",
          handleOrientation,
          true,
        );
        window.removeEventListener(
          "deviceorientation",
          handleOrientation,
          true,
        );
        orientationListenerAddedRef.current = false;
      }
    };
  }, [handleOrientation, isIOS]);

  return {
    ...orientationState,
    requestPermission,
  };
};
