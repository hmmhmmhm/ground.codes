import React, { useState } from "react";
import { locales, Locale } from "@/i18n";
import { useI18n } from "@/lib/i18n/i18n-context";
import { LocationMode } from "./types";
import Compass from "./compass";
import { BODY_OPTIONS, CelestialBody } from "@/lib/map/celestial-bodies";
import { EarthMapType } from "./hooks/use-map-container";
import {
  ChevronIcon,
  GridIcon,
  LanguageIcon,
  LoadingLocationIcon,
  LocationIcon,
  MapTypeIcon,
} from "./map-control-icons";
import { LOCALE_LABELS, LOCALE_SHORT_LABELS } from "./map-control-labels";

// Define location mode enum (same as use-map-container.ts)
// enum LocationMode {
//   OFF = 0,        // Off
//   LOCATE = 1,     // My Location
//   TRACKING = 2,   // Tracking
// }

interface MapControlsProps {
  showGrid: boolean;
  toggleGrid: () => void;
  getUserLocation: () => void;
  mapType: EarthMapType;
  selectMapType: (mapType: EarthMapType) => void;
  mapHeading: number;
  resetMapHeading: () => void;
  setMapHeading?: (heading: number) => void;
  isLoadingLocation?: boolean;
  locationMode?: LocationMode;
  body?: CelestialBody;
  selectBody?: (body: CelestialBody) => void;
  isEarth?: boolean;
  hasSelectedArea?: boolean;
}

const MapControls: React.FC<MapControlsProps> = ({
  showGrid,
  toggleGrid,
  getUserLocation,
  mapType,
  selectMapType,
  mapHeading,
  resetMapHeading,
  setMapHeading,
  isLoadingLocation = false,
  locationMode = LocationMode.OFF,
  body = "earth",
  selectBody = () => {},
  isEarth = true,
  hasSelectedArea = false,
}) => {
  const { t, locale, setLocale } = useI18n();
  const [showBodyOptions, setShowBodyOptions] = useState(false);
  const [showMapTypeOptions, setShowMapTypeOptions] = useState(false);
  const [showLanguageOptions, setShowLanguageOptions] = useState(false);
  const bodyLabels: Record<CelestialBody, string> = {
    earth: t("map.bodies.earth"),
    moon: t("map.bodies.moon"),
    mars: t("map.bodies.mars"),
  };
  const activeBodyLabel = bodyLabels[body];

  const handleLanguageChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setShowLanguageOptions(false);
  };

  const handleBodyChange = (newBody: CelestialBody) => {
    selectBody(newBody);
    setShowBodyOptions(false);
  };

  const mapTypeLabels: Record<EarthMapType, string> = {
    roadmap: t("map.controls.normalMapLabel"),
    satellite: t("map.controls.satelliteMapLabel"),
    earth3d: t("map.controls.earth3DLabel"),
    planetary3d: t("map.controls.planetary3DLabel"),
  };
  const activeMapTypeLabel = mapTypeLabels[mapType];
  const mapTypeOptions: EarthMapType[] = isEarth
    ? ["roadmap", "satellite", "earth3d"]
    : ["roadmap", "planetary3d"];
  const mobileUpDesktopDownMenuPosition =
    "absolute bottom-[45px] left-0 right-auto top-auto sm:bottom-auto sm:left-auto sm:right-0 sm:top-[45px]";

  const handleMapTypeChange = (newMapType: EarthMapType) => {
    selectMapType(newMapType);
    setShowMapTypeOptions(false);
  };

  // Get location button style based on location mode
  const getLocationButtonStyle = () => {
    if (locationMode === LocationMode.TRACKING) {
      return { backgroundColor: "rgba(66, 133, 244, 0.7)" };
    } else if (locationMode === LocationMode.LOCATE) {
      return { backgroundColor: "rgba(52, 168, 83, 0.7)" };
    } else {
      return { backgroundColor: "rgba(0, 0, 0, 0.3)" };
    }
  };

  // Get location button tooltip text based on location mode
  const getLocationButtonTitle = () => {
    if (locationMode === LocationMode.TRACKING) {
      return t("map.controls.stopTracking");
    } else if (locationMode === LocationMode.LOCATE) {
      return t("map.controls.myLocation");
    } else {
      return t("map.controls.myLocation");
    }
  };

  return (
    <>
      {/* Map Type Control and Language Selector (Top Right) */}
      <div
        className={`absolute left-3 top-auto z-10 flex flex-row gap-2 sm:left-auto sm:right-[10px] sm:top-[10px] ${
          hasSelectedArea
            ? "bottom-[calc(env(safe-area-inset-bottom)+168px)] sm:bottom-auto"
            : "bottom-[100px] sm:bottom-auto"
        }`}
        data-testid="map-settings-controls"
      >
        <div className="relative">
          <button
            onClick={() => {
              setShowBodyOptions(!showBodyOptions);
              setShowMapTypeOptions(false);
              setShowLanguageOptions(false);
            }}
            className="flex min-h-10 min-w-[64px] cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white backdrop-blur-md sm:justify-start"
            title={t("map.controls.body")}
            aria-label={t("map.controls.body")}
            aria-expanded={showBodyOptions}
          >
            <span>{activeBodyLabel}</span>
            <ChevronIcon />
          </button>

          {showBodyOptions && (
            <div
              className={`${mobileUpDesktopDownMenuPosition} min-w-[132px] overflow-hidden rounded-lg border border-white/20 bg-black/30 backdrop-blur-md cursor-pointer`}
            >
              <div className="flex flex-col">
                {BODY_OPTIONS.map((option) => (
                  <button
                    key={option.body}
                    onClick={() => handleBodyChange(option.body)}
                    className={`px-3 py-2 text-sm hover:bg-white/10 flex items-center justify-between gap-3 ${
                      body === option.body ? "bg-white/10 font-bold" : ""
                    }`}
                    title={bodyLabels[option.body]}
                    aria-label={bodyLabels[option.body]}
                  >
                    <span className="text-white flex items-center gap-2">
                      <span>{bodyLabels[option.body]}</span>
                    </span>
                    {body === option.body && (
                      <span className="text-green-400">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowMapTypeOptions(!showMapTypeOptions);
              setShowBodyOptions(false);
              setShowLanguageOptions(false);
            }}
            className="flex min-h-10 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white backdrop-blur-md sm:justify-start"
            title={t("map.controls.mapType")}
            aria-label={t("map.controls.mapType")}
            aria-expanded={showMapTypeOptions}
          >
            <MapTypeIcon type={mapType} />
            <span className="hidden sm:inline">{activeMapTypeLabel}</span>
            <ChevronIcon />
          </button>

          {showMapTypeOptions && (
            <div
              className={`${mobileUpDesktopDownMenuPosition} min-w-[144px] overflow-hidden rounded-lg border border-white/20 bg-black/30 backdrop-blur-md cursor-pointer`}
            >
              <div className="flex flex-col">
                {mapTypeOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleMapTypeChange(option)}
                    className={`px-3 py-2 text-sm hover:bg-white/10 flex items-center justify-between gap-3 ${
                      mapType === option ? "bg-white/10 font-bold" : ""
                    }`}
                    title={mapTypeLabels[option]}
                    aria-label={mapTypeLabels[option]}
                  >
                    <span className="text-white flex items-center gap-2">
                      <MapTypeIcon type={option} />
                      <span>{mapTypeLabels[option]}</span>
                    </span>
                    {mapType === option && (
                      <span className="text-green-400">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Language Selector Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowLanguageOptions(!showLanguageOptions);
              setShowBodyOptions(false);
              setShowMapTypeOptions(false);
            }}
            className="flex min-h-10 min-w-11 cursor-pointer items-center gap-2 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm backdrop-blur-md"
            title={t("map.controls.language")}
            aria-label={t("map.controls.language")}
            aria-expanded={showLanguageOptions}
          >
            <LanguageIcon />
            <span className="hidden text-white sm:inline">
              {LOCALE_SHORT_LABELS[locale]}
            </span>
          </button>

          {/* Language Options Dropdown */}
          {showLanguageOptions && (
            <div
              className={`${mobileUpDesktopDownMenuPosition} rounded-lg border border-white/20 bg-black/30 backdrop-blur-md cursor-pointer`}
            >
              <div className="flex flex-col">
                {locales.map((localeOption) => (
                  <button
                    key={localeOption}
                    onClick={() => handleLanguageChange(localeOption)}
                    className={`px-3 py-2 text-sm hover:bg-white/10 flex items-center justify-between gap-3 ${
                      locale === localeOption ? "bg-white/10 font-bold" : ""
                    }`}
                  >
                    <span className="text-white flex items-center gap-2">
                      <span className="text-xs text-white/70 min-w-5">
                        {LOCALE_SHORT_LABELS[localeOption]}
                      </span>
                      {LOCALE_LABELS[localeOption]}
                    </span>
                    {locale === localeOption && (
                      <span className="text-green-400">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid, Location, and Compass Controls (Bottom Right) */}
      <div
        className={`absolute right-[10px] z-10 flex flex-col-reverse gap-[10px] ${
          hasSelectedArea
            ? "bottom-[calc(env(safe-area-inset-bottom)+168px)] sm:bottom-[100px]"
            : "bottom-[100px]"
        }`}
        data-testid="map-action-controls"
      >
        <Compass
          mapHeading={mapHeading}
          resetMapHeading={resetMapHeading}
          setMapHeading={setMapHeading}
          className="relative"
          title={t("map.controls.resetRotation")}
          ariaLabel={t("map.controls.resetRotation")}
        />

        {isEarth && (
          <button
            onClick={getUserLocation}
            className="bg-black/30 backdrop-blur-md border border-white/20 rounded-full w-[40px] h-[40px] cursor-pointer flex justify-center items-center"
            title={getLocationButtonTitle()}
            aria-label={getLocationButtonTitle()}
            style={getLocationButtonStyle()}
          >
            {isLoadingLocation ? (
              <LoadingLocationIcon />
            ) : (
              <LocationIcon mode={locationMode} />
            )}
          </button>
        )}

        <button
          onClick={toggleGrid}
          className="bg-black/30 backdrop-blur-md border border-white/20 rounded-full w-[40px] h-[40px] cursor-pointer flex justify-center items-center"
          title={t("map.controls.toggleGrid")}
          aria-label={t("map.controls.toggleGrid")}
          style={{
            backgroundColor: showGrid
              ? "rgba(66, 133, 244, 0.7)"
              : "rgba(0, 0, 0, 0.3)",
          }}
        >
          <GridIcon />
        </button>
      </div>
    </>
  );
};

export default MapControls;
