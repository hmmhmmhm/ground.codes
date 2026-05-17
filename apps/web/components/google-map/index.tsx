"use client";

import React, { useState } from "react";
import { FaCopy, FaShareAlt } from "react-icons/fa";
import { GoogleMap } from "@react-google-maps/api";
import { useMapContainer } from "./hooks/use-map-container";
import MapMarkers from "./map-markers";
import MapControls from "./map-controls";
import MapSearch from "./map-search";
import PlaceDetails from "./place-details";
import WeatherInfo from "./weather-info";
import { useI18n } from "@/lib/i18n/i18n-context";
import Earth3DMap from "./earth-3d-map";
import Planetary3DMap from "./planetary-3d-map";
import { getSelectedAreaDetailText } from "./selected-area-summary";
import { buildGroundCodeSharePath } from "@/lib/code/share-url";
import {
  DEFAULT_GROUND_CODE_PRECISION_METERS,
  formatPrecisionMeters,
} from "@/lib/code/ground-codes";

function GoogleMapComponent() {
  const { t, isChangingLanguage } = useI18n();
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const {
    isLoaded,
    hasGoogleMapsApiKey,
    center,
    zoom,
    map,
    onLoad,
    onUnmount,
    onZoomChanged,
    userLocation,
    selectedArea,
    showGrid,
    toggleGrid,
    getUserLocation,
    isLoading,
    encodedCoordinates,
    isEncoding,
    handlePlaceSelect,
    handleGroundSearch,
    handleGroundSearchResultSelect,
    isGroundSearchLoading,
    groundSearchError,
    groundSearchResults,
    initialGroundSearchQuery,
    mapType,
    selectMapType,
    body,
    isEarth,
    selectBody,
    planetaryAttribution,
    mapHeading,
    resetMapHeading,
    setMapHeading,
    locationMode,
    selectedAreaAddress,
    // Place Details state
    placeDetailsVisible,
    selectedPlaceId,
    selectedLocation,
    closePlaceDetails,
    // InfoWindow state
    showInfoWindow,
    setShowInfoWindow,
    setSelectedArea,
  } = useMapContainer();
  const isEarth3D = isEarth && mapType === "earth3d";
  const isPlanetary3D = !isEarth && mapType === "planetary3d";
  const showGoogleMap = hasGoogleMapsApiKey && !isEarth3D && !isPlanetary3D;
  const groundCodePrecisionLabel = t("map.coordinates.precision", {
    precision: formatPrecisionMeters(DEFAULT_GROUND_CODE_PRECISION_METERS),
  });
  const search = (
    <MapSearch
      map={isEarth && showGoogleMap ? map : null}
      onPlaceSelect={isEarth && showGoogleMap ? handlePlaceSelect : undefined}
      onGroundSearch={handleGroundSearch}
      onGroundSearchResultSelect={handleGroundSearchResultSelect}
      isGroundSearchLoading={isGroundSearchLoading}
      groundSearchError={groundSearchError}
      groundSearchResults={groundSearchResults}
      initialQuery={initialGroundSearchQuery}
    />
  );
  const copyGroundCode = async () => {
    if (!encodedCoordinates) return;
    await navigator.clipboard?.writeText(encodedCoordinates);
    setFeedbackMessage(t("map.coordinates.copied"));
    window.setTimeout(() => setFeedbackMessage(null), 1800);
  };
  const shareSelectedArea = async () => {
    if (!selectedArea) return;

    const url = `${window.location.origin}${buildGroundCodeSharePath({
      code: encodedCoordinates,
      body,
    })}`;

    if (navigator.share) {
      await navigator.share({
        title: encodedCoordinates,
        text: encodedCoordinates,
        url,
      });
      return;
    }

    await navigator.clipboard?.writeText(url);
    setFeedbackMessage(t("map.coordinates.shareCopied"));
    window.setTimeout(() => setFeedbackMessage(null), 1800);
  };
  const selectedAreaPanel = selectedArea ? (
    <div
      className="absolute bottom-[calc(env(safe-area-inset-bottom)+12px)] left-1/2 z-20 max-h-[42vh] w-[min(calc(100%-24px),30rem)] -translate-x-1/2 overflow-auto rounded-lg border border-white/20 bg-black/65 px-4 py-3 text-xs text-white shadow-lg backdrop-blur-md"
      data-testid="selected-area-panel"
    >
      <div className="font-mono">
        {selectedArea.lat.toFixed(6)}, {selectedArea.lng.toFixed(6)}
      </div>
      <div className="mt-2 break-all text-white/80">
        {isEncoding ? t("map.encoding") : encodedCoordinates}
      </div>
      <div className="mt-2 max-h-14 overflow-auto break-words text-[11px] leading-snug text-white/65 sm:max-h-none">
        {getSelectedAreaDetailText({
          address: isEarth ? selectedAreaAddress : null,
          precisionLabel: groundCodePrecisionLabel,
        })}
      </div>
      {!isEncoding && encodedCoordinates && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-md border border-white/15 px-2 py-1 text-xs text-white/85 hover:bg-white/10"
            onClick={copyGroundCode}
            aria-label={t("map.coordinates.copy")}
            title={t("map.coordinates.copy")}
          >
            <FaCopy aria-hidden="true" />
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-md border border-white/15 px-2 py-1 text-xs text-white/85 hover:bg-white/10"
            onClick={shareSelectedArea}
            aria-label={t("map.coordinates.share")}
            title={t("map.coordinates.share")}
          >
            <FaShareAlt aria-hidden="true" />
          </button>
        </div>
      )}
      {feedbackMessage && (
        <div className="mt-2 text-[11px] text-white/70">{feedbackMessage}</div>
      )}
    </div>
  ) : null;

  // Language change in progress, do not render map component
  if (isChangingLanguage) {
    return <div className="relative w-full h-full bg-gray-200"></div>;
  }

  if (!isLoaded) {
    return (
      <div className="relative flex h-full w-full items-center justify-center bg-black text-white">
        {search}
        <div className="px-4 text-sm text-white/75">{t("map.loading")}</div>
        {selectedAreaPanel}
      </div>
    );
  }

  if (!hasGoogleMapsApiKey) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-[#0a0f12] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:42px_42px]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_45%,rgba(255,255,255,0.04))]" />
        <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-white/20" />
        {search}
        <MapControls
          {...{
            showGrid,
            toggleGrid,
            getUserLocation,
            mapType,
            selectMapType,
            body,
            selectBody,
            isEarth,
            mapHeading,
            resetMapHeading,
            setMapHeading,
            isLoadingLocation: isLoading,
            locationMode,
            hasSelectedArea: Boolean(selectedArea),
          }}
        />
        {selectedAreaPanel}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full map-container">
      {showGoogleMap ? (
        <GoogleMap
          {...{
            center,
            onLoad,
            onUnmount,
            mapContainerStyle: {
              width: "100%",
              height: "100%",
            },
          }}
          zoom={zoom}
          onZoomChanged={onZoomChanged}
          options={{
            disableDefaultUI: true, // Disables all default UI controls
            zoomControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            clickableIcons: isEarth,
          }}
        >
          <MapMarkers
            userLocation={isEarth ? userLocation : null}
            selectedArea={selectedArea}
            zoom={zoom}
            encodedCoordinates={encodedCoordinates}
            isEncoding={isEncoding}
            isTrackingMode={locationMode === "TRACKING"}
            showInfoWindow={showInfoWindow}
            setShowInfoWindow={setShowInfoWindow}
          />
        </GoogleMap>
      ) : isEarth3D ? (
        <Earth3DMap
          center={center}
          encodedCoordinates={encodedCoordinates}
          isEncoding={isEncoding}
          mapHeading={mapHeading}
          onCameraHeadingChange={setMapHeading}
          selectedArea={selectedArea}
          showGrid={showGrid}
          setSelectedArea={setSelectedArea}
          userLocation={userLocation}
        />
      ) : (
        <Planetary3DMap
          body={body === "earth" ? "moon" : body}
          center={center}
          encodedCoordinates={encodedCoordinates}
          isEncoding={isEncoding}
          mapHeading={mapHeading}
          onCameraHeadingChange={setMapHeading}
          selectedArea={selectedArea}
          showGrid={showGrid}
          setSelectedArea={setSelectedArea}
        />
      )}

      {search}

      <MapControls
        {...{
          showGrid,
          toggleGrid,
          getUserLocation,
          mapType,
          selectMapType,
          body,
          selectBody,
          isEarth,
          mapHeading,
          resetMapHeading,
          setMapHeading,
          isLoadingLocation: isLoading,
          locationMode,
          hasSelectedArea: Boolean(selectedArea),
        }}
      />

      {selectedAreaPanel}

      {planetaryAttribution && !isPlanetary3D && (
        <div className="absolute left-[10px] bottom-[10px] z-10 bg-black/40 backdrop-blur-md border border-white/20 rounded-md px-2 py-1 text-[11px] text-white/80">
          {planetaryAttribution}
        </div>
      )}

      {/* Weather Information */}
      {isEarth && !isEarth3D && <WeatherInfo map={map} />}

      {/* Place Details UI */}
      {isEarth && !isEarth3D && (
        <PlaceDetails
          map={map}
          visible={placeDetailsVisible}
          placeId={selectedPlaceId}
          location={selectedLocation}
          onClose={closePlaceDetails}
        />
      )}
    </div>
  );
}

export default React.memo(GoogleMapComponent);
