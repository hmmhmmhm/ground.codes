import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { googleMapDarkTheme } from "@/lib/map/google-map-theme";
import type { EarthMapType } from "./map-container-initial-state";

type UseMapControlsOptions = {
  map: google.maps.Map | null;
  mapType: EarthMapType;
  setMapType: Dispatch<SetStateAction<EarthMapType>>;
  setShowGrid: Dispatch<SetStateAction<boolean>>;
  showGrid: boolean;
};

export const useMapControls = ({
  map,
  mapType,
  setMapType,
  setShowGrid,
  showGrid,
}: UseMapControlsOptions) => {
  const [mapHeading, setMapHeading] = useState(0);
  const [mapTilt, setMapTilt] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gridWasVisible, setGridWasVisible] = useState(true);

  const selectMapType = useCallback(
    (newType: EarthMapType) => {
      if (newType === mapType) return;
      try {
        document.cookie = `MAP_TYPE=${newType};path=/;max-age=31536000`;
        setMapType(newType);
        if (!map || newType === "earth3d" || newType === "planetary3d") return;

        if (newType === "roadmap") {
          map.setOptions({
            styles: googleMapDarkTheme,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
          });
        } else {
          map.setOptions({
            styles: [],
            mapTypeControlOptions: {
              mapTypeIds: [google.maps.MapTypeId.HYBRID],
            },
          });
          map.setMapTypeId(google.maps.MapTypeId.HYBRID);
        }
      } catch (error) {
        console.error("Failed to change map type:", error);
      }
    },
    [map, mapType, setMapType],
  );

  const resetMapHeading = useCallback(() => {
    map?.setHeading(0);
    setMapHeading(0);
  }, [map]);

  const setMapHeadingValue = useCallback(
    (heading: number) => {
      if (map) {
        map.setOptions({ rotateControl: true });
        map.setHeading(heading);
      }
      setMapHeading(heading);
    },
    [map],
  );

  const onHeadingChanged = useCallback(() => {
    const newHeading = map?.getHeading();
    if (newHeading === undefined) return;
    setMapHeading(newHeading);
    if (newHeading !== 0 && showGrid) {
      setGridWasVisible(true);
      setShowGrid(false);
    } else if (
      newHeading === 0 &&
      !showGrid &&
      gridWasVisible &&
      mapTilt === 0
    ) {
      setShowGrid(true);
      setGridWasVisible(false);
    }
  }, [gridWasVisible, map, mapTilt, setShowGrid, showGrid]);

  const onTiltChanged = useCallback(() => {
    const newTilt = map?.getTilt();
    if (newTilt === undefined) return;
    setMapTilt(newTilt);
    if (newTilt !== 0 && showGrid) {
      setGridWasVisible(true);
      setShowGrid(false);
    } else if (
      newTilt === 0 &&
      !showGrid &&
      gridWasVisible &&
      mapHeading === 0
    ) {
      setShowGrid(true);
      setGridWasVisible(false);
    }
  }, [gridWasVisible, map, mapHeading, setShowGrid, showGrid]);

  const toggleFullscreen = useCallback(() => {
    const mapContainer = document.querySelector(".map-container");
    if (!mapContainer) return;

    if (!document.fullscreenElement) {
      mapContainer.requestFullscreen().catch((error) => {
        console.error(
          `Error attempting to enable fullscreen: ${error.message}`,
        );
      });
      setIsFullscreen(true);
    } else {
      void document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return {
    isFullscreen,
    mapHeading,
    mapTilt,
    onHeadingChanged,
    onTiltChanged,
    resetMapHeading,
    selectMapType,
    setMapHeadingValue,
    toggleFullscreen,
  };
};
