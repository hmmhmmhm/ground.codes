import React from "react";
import { GoogleMap } from "@react-google-maps/api";
import MapMarkers from "./map-markers";

interface MapContainerProps {
  center: { lat: number; lng: number };
  onLoad: (map: google.maps.Map) => void;
  onUnmount: (map: google.maps.Map) => void;
  onMapClick: (e: google.maps.MapMouseEvent) => void;
  userLocation: { lat: number; lng: number } | null;
  selectedArea: { lat: number; lng: number } | null;
}

const containerStyle = {
  width: "100%",
  height: "100%",
};

const MapContainer: React.FC<MapContainerProps> = ({
  center,
  onLoad,
  onUnmount,
  onMapClick,
  userLocation,
  selectedArea,
}) => {
  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={18}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={onMapClick}
    >
      <MapMarkers userLocation={userLocation} selectedArea={selectedArea} />
    </GoogleMap>
  );
};

export default React.memo(MapContainer);
