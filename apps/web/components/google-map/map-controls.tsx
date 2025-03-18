import React, { useState } from "react";
import { usePathname } from 'next/navigation';
import { locales, Locale } from '@/i18n';
import { useI18n } from "@/lib/i18n/i18n-context";
import { LocationMode } from './types';

// 위치 모드 상태를 정의하는 열거형 (use-map-container.ts와 동일하게 유지)
// enum LocationMode {
//   OFF = 0,        // 꺼짐
//   LOCATE = 1,     // 내 위치 보기
//   TRACKING = 2,   // 위치 추적
// }

interface MapControlsProps {
  showGrid: boolean;
  toggleGrid: () => void;
  getUserLocation: () => void;
  mapType: string;
  toggleMapType: () => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  isLoadingLocation?: boolean;
  isTrackingLocation?: boolean;
  locationMode?: LocationMode;
}

const MapControls: React.FC<MapControlsProps> = ({
  showGrid,
  toggleGrid,
  getUserLocation,
  mapType,
  toggleMapType,
  isFullscreen,
  toggleFullscreen,
  isLoadingLocation = false,
  isTrackingLocation = false,
  locationMode = 0,
}) => {
  const { t, locale, setLocale } = useI18n();
  const [showLanguageOptions, setShowLanguageOptions] = useState(false);

  const handleLanguageChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setShowLanguageOptions(false);
  };

  // 위치 모드에 따른 버튼 배경색 결정
  const getLocationButtonStyle = () => {
    if (locationMode === LocationMode.TRACKING) {
      return { backgroundColor: "rgba(66, 133, 244, 0.7)" };
    } else if (locationMode === LocationMode.LOCATE) {
      return { backgroundColor: "rgba(52, 168, 83, 0.7)" };
    } else {
      return { backgroundColor: "rgba(0, 0, 0, 0.3)" };
    }
  };

  // 위치 모드에 따른 툴팁 텍스트 결정
  const getLocationButtonTitle = () => {
    if (locationMode === LocationMode.TRACKING) {
      return t('map.controls.stopTracking');
    } else if (locationMode === LocationMode.LOCATE) {
      return t('map.controls.myLocation');
    } else {
      return t('map.controls.myLocation');
    }
  };

  return (
    <>
      {/* Map Type Control and Language Selector (Top Right) */}
      <div className="absolute top-[10px] right-[10px] flex flex-row gap-2 z-10">
        <button
          onClick={toggleMapType}
          className="bg-black/30 backdrop-blur-md border border-white/20 rounded-lg px-3 py-2 cursor-pointer flex items-center gap-2 text-sm"
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
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                <line x1="8" y1="2" x2="8" y2="18"></line>
                <line x1="16" y1="6" x2="16" y2="22"></line>
              </svg>
              <span className="text-white hidden md:inline">{t('map.controls.roadmapLabel')}</span>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFFFFF"
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
              <span className="text-white hidden md:inline">{t('map.controls.satelliteLabel')}</span>
            </>
          )}
        </button>
        
        {/* Language Selector Button */}
        <div className="relative">
          <button
            onClick={() => setShowLanguageOptions(!showLanguageOptions)}
            className="bg-black/30 backdrop-blur-md border border-white/20 rounded-lg px-3 py-2 cursor-pointer flex items-center gap-2 text-sm"
            title={t('map.controls.language')}
            aria-label={t('map.controls.language')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span className="text-white hidden md:inline">{locale === 'en' ? 'EN' : 'KO'}</span>
          </button>

          {/* Language Options Dropdown */}
          {showLanguageOptions && (
            <div className="absolute top-[45px] right-0 bg-black/30 backdrop-blur-md border border-white/20 rounded-lg cursor-pointer">
              <div className="flex flex-col">
                {locales.map((localeOption) => (
                  <button
                    key={localeOption}
                    onClick={() => handleLanguageChange(localeOption)}
                    className={`px-3 py-2 text-sm hover:bg-white/10 flex items-center gap-2 ${
                      locale === localeOption ? 'bg-white/10 font-bold' : ''
                    }`}
                  >
                    <span className="text-white">
                      {localeOption === 'en' ? 'English' : '한국어'}
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

      {/* Grid and Location Controls (Bottom Right) */}
      <button
        onClick={toggleGrid}
        className="absolute bottom-[200px] right-[10px] bg-black/30 backdrop-blur-md border border-white/20 rounded-full w-[40px] h-[40px] cursor-pointer flex justify-center items-center z-10"
        title={t('map.controls.toggleGrid')}
        aria-label={t('map.controls.toggleGrid')}
        style={{ backgroundColor: showGrid ? "rgba(66, 133, 244, 0.7)" : "rgba(0, 0, 0, 0.3)" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FFFFFF"
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
        className="absolute bottom-[150px] right-[10px] bg-black/30 backdrop-blur-md border border-white/20 rounded-full w-[40px] h-[40px] cursor-pointer flex justify-center items-center z-10"
        title={getLocationButtonTitle()}
        aria-label={getLocationButtonTitle()}
        style={getLocationButtonStyle()}
      >
        {isLoadingLocation ? (
          <svg 
            className="animate-spin" 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#FFFFFF" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
          </svg>
        ) : locationMode === LocationMode.TRACKING ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
          </svg>
        ) : locationMode === LocationMode.LOCATE ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"></path>
            <circle cx="12" cy="9" r="3"></circle>
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"></path>
            <circle cx="12" cy="9" r="3"></circle>
          </svg>
        )}
      </button>

      <button
        onClick={toggleFullscreen}
        className="absolute bottom-[100px] right-[10px] bg-black/30 backdrop-blur-md border border-white/20 rounded-full w-[40px] h-[40px] cursor-pointer flex justify-center items-center z-10"
        title={isFullscreen ? t('map.controls.exitFullscreen') : t('map.controls.enterFullscreen')}
        aria-label={isFullscreen ? t('map.controls.exitFullscreen') : t('map.controls.enterFullscreen')}
      >
        {isFullscreen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
          </svg>
        )}
      </button>
    </>
  );
};

export default MapControls;
