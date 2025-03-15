import React from "react";
import { GoogleMap } from "@react-google-maps/api";
import { useMapContainer } from "./hooks/use-map-container";
import MapMarkers from "./map-markers";
import MapControls from "./map-controls";
import MapSearch from "./map-search";
import { useI18n } from "@/lib/i18n/i18n-context";

function GoogleMapComponent() {
  const { t } = useI18n();
  const {
    isLoaded,
    center,
    zoom,
    map,
    onLoad,
    onUnmount,
    onMapClick,
    onZoomChanged,
    userLocation,
    selectedArea,
    showGrid,
    toggleGrid,
    getUserLocation,
    isLoadingLocation,
    isTrackingLocation,
    encodedCoordinates,
    isEncoding,
    handlePlaceSelect,
    mapType,
    toggleMapType,
    isFullscreen,
    toggleFullscreen,
    locationMode,
  } = useMapContainer();

  return isLoaded ? (
    <div className="relative w-full h-full map-container">
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
        onClick={onMapClick}
        onZoomChanged={onZoomChanged}
        options={{
          mapTypeId: mapType,
          disableDefaultUI: true, // Disables all default UI controls
          zoomControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false, // Disable clickable POIs like parks
        }}
      >
        <MapMarkers
          userLocation={userLocation}
          selectedArea={selectedArea}
          zoom={zoom}
          encodedCoordinates={encodedCoordinates}
          isEncoding={isEncoding}
        />
      </GoogleMap>

      <MapSearch map={map} onPlaceSelect={handlePlaceSelect} />

      <MapControls
        {...{
          showGrid,
          toggleGrid,
          getUserLocation,
          mapType,
          toggleMapType,
          isFullscreen,
          toggleFullscreen,
          isLoadingLocation,
          isTrackingLocation,
          locationMode,
        }}
      />
    </div>
  ) : (
    <div>{t("map.loading")}</div>
  );
}

export default React.memo(GoogleMapComponent);
