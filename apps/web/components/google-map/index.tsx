import React from "react";
import { GoogleMap } from "@react-google-maps/api";
import { useMapContainer } from "./hooks/use-map-container";
import MapMarkers from "./map-markers";
import MapControls from "./map-controls";
import MapSearch from "./map-search";
import PlaceDetails from "./place-details";
import { useI18n } from "@/lib/i18n/i18n-context";

function GoogleMapComponent() {
  const { t, isChangingLanguage } = useI18n();
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
    isLoading,
    isTrackingLocation,
    encodedCoordinates,
    isEncoding,
    handlePlaceSelect,
    mapType,
    toggleMapType,
    isFullscreen,
    toggleFullscreen,
    locationMode,
    // Place Details state
    placeDetailsVisible,
    selectedPlaceId,
    selectedLocation,
    closePlaceDetails,
  } = useMapContainer();

  // 언어 변경 중에는 맵 컴포넌트를 렌더링하지 않음
  if (isChangingLanguage) {
    return <div className="relative w-full h-full bg-gray-200"></div>;
  }

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
          clickableIcons: true, // Enable clickable POIs
        }}
      >
        <MapMarkers
          userLocation={userLocation}
          selectedArea={selectedArea}
          zoom={zoom}
          encodedCoordinates={encodedCoordinates}
          isEncoding={isEncoding}
          isTrackingMode={locationMode === 'TRACKING'}
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
          isLoadingLocation: isLoading,
          isTrackingLocation,
          locationMode,
        }}
      />

      {/* Place Details UI */}
      <PlaceDetails
        map={map}
        visible={placeDetailsVisible}
        placeId={selectedPlaceId}
        location={selectedLocation}
        onClose={closePlaceDetails}
      />
    </div>
  ) : (
    <div>{t("map.loading")}</div>
  );
}

export default React.memo(GoogleMapComponent);
