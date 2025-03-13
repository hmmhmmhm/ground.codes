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
      <div className="rounded-md overflow-hidden relative">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="장소 검색..."
          className="w-full p-2 pl-10 bg-white text-black placeholder-gray-600 border-none focus:outline-none"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default MapSearch;
