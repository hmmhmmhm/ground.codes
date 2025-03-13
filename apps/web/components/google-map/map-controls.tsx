import React from "react";

interface MapControlsProps {
  showGrid: boolean;
  toggleGrid: () => void;
  getUserLocation: () => void;
}

const MapControls: React.FC<MapControlsProps> = ({
  showGrid,
  toggleGrid,
  getUserLocation,
}) => {
  return (
    <>
      <button
        onClick={toggleGrid}
        className="absolute bottom-[200px] right-[10px] bg-white border-none rounded-full w-[40px] h-[40px] shadow-md cursor-pointer flex justify-center items-center z-10"
        title="Toggle grid display"
        aria-label="Toggle grid display"
        style={{ backgroundColor: showGrid ? "#4285F4" : "#FFFFFF" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={showGrid ? "#FFFFFF" : "#1A73E8"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="3" y1="9" x2="21" y2="9"></line>
          <line x1="3" y1="15" x2="21" y2="15"></line>
          <line x1="9" y1="3" x2="9" y2="21"></line>
          <line x1="15" y1="3" x2="15" y2="21"></line>
        </svg>
      </button>

      <button
        onClick={getUserLocation}
        className="absolute bottom-[150px] right-[10px] bg-white border-none rounded-full w-[40px] h-[40px] shadow-md cursor-pointer flex justify-center items-center z-10"
        title="내 위치로 이동"
        aria-label="내 위치로 이동"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1A73E8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4"></circle>
          <path d="M12 2v2"></path>
          <path d="M12 20v2"></path>
          <path d="M2 12h2"></path>
          <path d="M20 12h2"></path>
          <path d="M20 12h2"></path>
        </svg>
      </button>
    </>
  );
};

export default MapControls;
