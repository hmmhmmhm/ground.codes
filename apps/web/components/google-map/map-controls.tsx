import React, { useState } from "react";
import { usePathname } from 'next/navigation';
import { locales, Locale } from '@/i18n';
import { useI18n } from "@/lib/i18n/i18n-context";

interface MapControlsProps {
  showGrid: boolean;
  toggleGrid: () => void;
  getUserLocation: () => void;
  mapType: string;
  toggleMapType: () => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

const MapControls: React.FC<MapControlsProps> = ({
  showGrid,
  toggleGrid,
  getUserLocation,
  mapType,
  toggleMapType,
  isFullscreen,
  toggleFullscreen,
}) => {
  const { t, locale, setLocale } = useI18n();
  const [showLanguageOptions, setShowLanguageOptions] = useState(false);

  const handleLanguageChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setShowLanguageOptions(false);
  };

  return (
    <>
      {/* Map Type Control and Language Selector (Top Right) */}
      <div className="absolute top-[10px] right-[10px] flex flex-row gap-2 z-10">
        <button
          onClick={toggleMapType}
          className="bg-white border-none rounded-md px-3 py-2 shadow-md cursor-pointer flex items-center gap-2 text-sm"
          title={mapType === "roadmap" ? t('map.controls.roadmap') : t('map.controls.satellite')}
          aria-label={mapType === "roadmap" ? t('map.controls.roadmap') : t('map.controls.satellite')}
        >
          {mapType === "roadmap" ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1A73E8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                <line x1="8" y1="2" x2="8" y2="18"></line>
                <line x1="16" y1="6" x2="16" y2="22"></line>
              </svg>
              <span className="text-[#1A73E8]">{t('map.controls.roadmapLabel')}</span>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1A73E8"
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
              <span className="text-[#1A73E8]">{t('map.controls.satelliteLabel')}</span>
            </>
          )}
        </button>
        
        {/* Language Selector Button */}
        <div className="relative">
          <button
            onClick={() => setShowLanguageOptions(!showLanguageOptions)}
            className="bg-white border-none rounded-md px-3 py-2 shadow-md cursor-pointer flex items-center gap-2 text-sm"
            title={t('map.controls.language')}
            aria-label={t('map.controls.language')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1A73E8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span className="text-[#1A73E8]">{locale === 'en' ? 'EN' : 'KO'}</span>
          </button>

          {/* Language Options Dropdown */}
          {showLanguageOptions && (
            <div className="absolute top-[45px] right-0 bg-white border-none rounded-md shadow-md cursor-pointer">
              <div className="flex flex-col">
                {locales.map((localeOption) => (
                  <button
                    key={localeOption}
                    onClick={() => handleLanguageChange(localeOption)}
                    className={`px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${
                      locale === localeOption ? 'bg-gray-100 font-bold' : ''
                    }`}
                  >
                    <span className="text-[#1A73E8]">
                      {localeOption === 'en' ? 'English' : '한국어'}
                    </span>
                    {locale === localeOption && (
                      <span className="text-green-500">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid and Location Controls (Bottom Right) */}
      <button
        onClick={toggleGrid}
        className="absolute bottom-[200px] right-[10px] bg-white border-none rounded-full w-[40px] h-[40px] shadow-md cursor-pointer flex justify-center items-center z-10"
        title={t('map.controls.toggleGrid')}
        aria-label={t('map.controls.toggleGrid')}
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
        title={t('map.controls.myLocation')}
        aria-label={t('map.controls.myLocation')}
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
