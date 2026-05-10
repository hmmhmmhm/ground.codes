import React from "react";
import { GoogleMap } from "@react-google-maps/api";
import { useMapContainer } from "./hooks/use-map-container";
import MapMarkers from "./map-markers";
import MapControls from "./map-controls";
import MapSearch from "./map-search";
import PlaceDetails from "./place-details";
import WeatherInfo from "./weather-info";
import { useI18n } from "@/lib/i18n/i18n-context";
import Earth3DMap from "./earth-3d-map";

function GoogleMapComponent() {
  const { t, isChangingLanguage } = useI18n();
  const {
    isLoaded,
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
    isTrackingLocation,
    encodedCoordinates,
    isEncoding,
    handlePlaceSelect,
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
  const showGoogleMap = !isEarth3D;

  // Language change in progress, do not render map component
  if (isChangingLanguage) {
    return <div className="relative w-full h-full bg-gray-200"></div>;
  }

  return isLoaded ? (
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
      ) : (
        <Earth3DMap
          center={center}
          encodedCoordinates={encodedCoordinates}
          isEncoding={isEncoding}
          selectedArea={selectedArea}
          showGrid={showGrid}
          setSelectedArea={setSelectedArea}
          userLocation={userLocation}
        />
      )}

      {isEarth && !isEarth3D && (
        <MapSearch map={map} onPlaceSelect={handlePlaceSelect} />
      )}

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
          isTrackingLocation,
          locationMode,
        }}
      />

      {planetaryAttribution && (
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
  ) : (
    <div>{t("map.loading")}</div>
  );
}

export default React.memo(GoogleMapComponent);
