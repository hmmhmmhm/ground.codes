import React, { useEffect, useRef } from "react";

interface MapSearchProps {
  map: google.maps.Map | null;
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
}

const MapSearch: React.FC<MapSearchProps> = ({ map, onPlaceSelect }) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  useEffect(() => {
    if (!map || !searchInputRef.current) return;

    // Initialize the InfoWindow
    infoWindowRef.current = new google.maps.InfoWindow();

    // Initialize the Autocomplete
    autocompleteRef.current = new google.maps.places.Autocomplete(
      searchInputRef.current,
      {
        fields: ["address_components", "geometry", "name", "formatted_address"],
      }
    );

    autocompleteRef.current.bindTo("bounds", map);

    // Add listener for place selection
    const listener = autocompleteRef.current.addListener(
      "place_changed",
      () => {
        const place = autocompleteRef.current?.getPlace();

        if (!place?.geometry?.location) {
          window.alert(
            `No details available for: ${place?.name || "this place"}`
          );
          return;
        }

        onPlaceSelect(place);
      }
    );

    return () => {
      // Clean up listener when component unmounts
      if (listener) {
        google.maps.event.removeListener(listener);
      }
    };
  }, [map, onPlaceSelect]);

  return (
    <div className="absolute top-0 left-0 z-10 m-2 w-64">
      <div className="bg-gray-800 rounded-md shadow-lg overflow-hidden">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="장소 검색..."
          className="w-full p-2 bg-[#5b5b5b] text-white placeholder-gray-400 border-none focus:outline-none"
        />
      </div>
    </div>
  );
};

export default MapSearch;
