import React, { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import enPlaceTypes from "@/messages/en/placeTypes.json";
import koPlaceTypes from "@/messages/ko/placeTypes.json";
import cnPlaceTypes from "@/messages/cn/placeTypes.json";
import { encode } from "@/lib/code/ground-codes";
import { Locale } from "@/i18n";
import {
  FaMapMarkerAlt,
  FaPhone,
  FaPhoneAlt,
  FaGlobe,
  FaClock,
  FaCopy,
  FaMapMarkedAlt,
  FaTimes,
  FaStoreAlt,
  FaImages,
  FaExpand,
  FaStar,
  FaRegStar,
  FaCode,
} from "react-icons/fa";
import { createPortal } from "react-dom";

interface PlaceDetailsProps {
  map: google.maps.Map | null;
  visible: boolean;
  placeId: string | null;
  location: google.maps.LatLng | null;
  onClose: () => void;
}

const PlaceDetails: React.FC<PlaceDetailsProps> = ({
  map,
  visible,
  placeId,
  location,
  onClose,
}) => {
  const { t, locale } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeDetails, setPlaceDetails] = useState<any>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [photoErrors, setPhotoErrors] = useState<Record<number, boolean>>({});
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [groundCode, setGroundCode] = useState<string>("");
  const [isLoadingGroundCode, setIsLoadingGroundCode] = useState(false);
  const [copiedGroundCode, setCopiedGroundCode] = useState(false);
  const [copiedPhoneNumber, setCopiedPhoneNumber] = useState(false);

  // Fetch place details when placeId changes
  useEffect(() => {
    if (!visible || !map || !placeId) {
      return;
    }

    // When a new place is selected, reset previous data
    setPlaceDetails(null);
    setGroundCode("");
    setPhotoErrors({});
    setSelectedPhoto(null);
    setCopiedAddress(false);
    setCopiedGroundCode(false);
    setCopiedPhoneNumber(false);

    const fetchPlaceDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Create a PlacesService instance
        const service = new google.maps.places.PlacesService(map);

        // Request place details
        service.getDetails(
          {
            placeId,
            fields: [
              "name",
              "formatted_address",
              "formatted_phone_number",
              "rating",
              "user_ratings_total",
              "website",
              "photos",
              "opening_hours",
              "types",
              "url",
              "vicinity",
            ],
          },
          (result, status) => {
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              result
            ) {
              setPlaceDetails(result);
            } else {
              setError(t("common.error.placeDetails"));
            }
            setIsLoading(false);
          }
        );
      } catch (err) {
        console.error("Error fetching place details:", err);
        setError(t("common.error.placeDetails"));
        setIsLoading(false);
      }
    };

    fetchPlaceDetails();
  }, [map, placeId, visible]);

  // Copy address to clipboard function
  const copyAddressToClipboard = useCallback(() => {
    if (placeDetails?.formatted_address) {
      navigator.clipboard
        .writeText(placeDetails.formatted_address)
        .then(() => {
          setCopiedAddress(true);
          setTimeout(() => setCopiedAddress(false), 2000);
        })
        .catch((err) => {
          console.error("주소 복사 실패:", err);
        });
    }
  }, [placeDetails]);

  // Copy ground code to clipboard function
  const copyGroundCodeToClipboard = useCallback(() => {
    if (groundCode) {
      navigator.clipboard
        .writeText(groundCode)
        .then(() => {
          setCopiedGroundCode(true);
          setTimeout(() => setCopiedGroundCode(false), 2000);
        })
        .catch((err) => {
          console.error("그라운드 코드 복사 실패:", err);
        });
    }
  }, [groundCode]);

  // Copy phone number to clipboard function
  const copyPhoneNumberToClipboard = useCallback(() => {
    if (placeDetails?.formatted_phone_number) {
      navigator.clipboard
        .writeText(placeDetails.formatted_phone_number)
        .then(() => {
          setCopiedPhoneNumber(true);
          setTimeout(() => setCopiedPhoneNumber(false), 2000);
        })
        .catch((err) => {
          console.error("전화번호 복사 실패:", err);
        });
    }
  }, [placeDetails]);

  // Generate ground code (simple encoding based on latitude/longitude)
  const generateGroundCode = useCallback(async () => {
    if (!location) return "";
    try {
      setIsLoadingGroundCode(true);
      const code = await encode({
        lat: location.lat(),
        lng: location.lng(),
        language:
          locale === "ko" ? "korean" : locale === "cn" ? "chinese" : "english",
      });
      setGroundCode(code);
    } catch (err) {
      console.error("Error generating ground code:", err);
      setGroundCode("");
    } finally {
      setIsLoadingGroundCode(false);
    }
  }, [location, locale]);

  // When location or locale changes, generate ground code
  useEffect(() => {
    if (location && visible) {
      generateGroundCode();
    }
  }, [location, locale, visible, generateGroundCode]);

  // When component is hidden, reset data
  useEffect(() => {
    if (!visible) {
      setPlaceDetails(null);
      setGroundCode("");
      setError(null);
      setPhotoErrors({});
      setSelectedPhoto(null);
      setCopiedAddress(false);
      setCopiedGroundCode(false);
      setCopiedPhoneNumber(false);
      setIsLoading(false);
    }
  }, [visible]);

  // Handle image load error
  const handleImageError = (index: number) => {
    setPhotoErrors((prev) => ({ ...prev, [index]: true }));
  };

  // Get current day index (0: Sunday, 1: Monday, ..., 6: Saturday)
  const getCurrentDayIndex = () => {
    return new Date().getDay();
  };

  // Check if the place is open now
  const isOpenNow = () => {
    try {
      if (placeDetails?.opening_hours?.periods) {
        const now = new Date();
        const day = now.getDay(); // 0: Sunday, 1: Monday, ..., 6: Saturday
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const currentTime = hours * 60 + minutes; // Convert current time to minutes

        // Find opening hours for the current day
        const todayPeriods = placeDetails.opening_hours.periods.filter(
          (period: any) => period.open && period.open.day === day
        );

        // Check if the place is open 24 hours (periods length is 1 and no close time)
        if (
          placeDetails.opening_hours.periods.length === 1 &&
          placeDetails.opening_hours.periods[0].open &&
          !placeDetails.opening_hours.periods[0].close
        ) {
          return true;
        }

        // Check if current time is within business hours
        for (const period of todayPeriods) {
          if (!period.open || !period.close) continue;

          // Convert time format (e.g., "0900" -> 9*60 = 540 minutes)
          const openTime =
            parseInt(period.open.time.substring(0, 2)) * 60 +
            parseInt(period.open.time.substring(2, 4));
          const closeTime =
            parseInt(period.close.time.substring(0, 2)) * 60 +
            parseInt(period.close.time.substring(2, 4));

          // Normal case (opening time is earlier than closing time)
          if (openTime < closeTime) {
            if (currentTime >= openTime && currentTime < closeTime) {
              return true;
            }
          }
          // Crossing midnight case (e.g., 10:00 PM - 2:00 AM)
          else {
            if (currentTime >= openTime || currentTime < closeTime) {
              return true;
            }
          }
        }
      }

      // Check weekday_text
      if (placeDetails?.opening_hours?.weekday_text) {
        // Get current time and day
        const now = new Date();
        const currentDay = now.getDay(); // 0: Sunday, 1: Monday, ..., 6: Saturday
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Find the text for the current day
        const dayText = placeDetails.opening_hours.weekday_text[currentDay];

        if (dayText) {
          // 24-hour operation check
          if (
            dayText.includes("24 hours") ||
            dayText.includes("24시간") ||
            dayText.toLowerCase().includes("open 24 hours")
          ) {
            return true;
          }

          // 휴무일인 경우
          if (
            dayText.includes("Closed") ||
            dayText.includes("휴무") ||
            dayText.includes("休息")
          ) {
            return false;
          }

          // Extract time patterns - support various formats
          // "Monday: 9:00 AM – 5:00 PM" or "월요일: 오전 9:00 - 오후 5:00" etc
          const timePatterns = [
            // English format (AM/PM)
            /(\d{1,2}):(\d{2})\s*(AM|PM)\s*[–-]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i,
            // 24-hour format
            /(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/i,
            // Korean format (오전/오후)
            /(오전|오후)\s*(\d{1,2}):(\d{2})\s*[–-]\s*(오전|오후)\s*(\d{1,2}):(\d{2})/i,
          ];

          // Try each pattern
          for (const pattern of timePatterns) {
            const match = dayText.match(pattern);
            if (!match) continue;

            let openHour24, openMinute, closeHour24, closeMinute;

            // Handle pattern
            if (pattern.source.includes("AM|PM")) {
              // English AM/PM format
              const [
                _,
                openHour,
                _openMinute,
                openAmPm,
                closeHour,
                _closeMinute,
                closeAmPm,
              ] = match;

              // Convert to 24-hour format
              openHour24 = parseInt(openHour);
              if (openAmPm.toUpperCase() === "PM" && openHour24 < 12)
                openHour24 += 12;
              if (openAmPm.toUpperCase() === "AM" && openHour24 === 12)
                openHour24 = 0;

              closeHour24 = parseInt(closeHour);
              if (closeAmPm.toUpperCase() === "PM" && closeHour24 < 12)
                closeHour24 += 12;
              if (closeAmPm.toUpperCase() === "AM" && closeHour24 === 12)
                closeHour24 = 0;
            } else if (pattern.source.includes("오전|오후")) {
              // 한국어 오전/오후 형식
              const [
                _,
                openAmPm,
                openHour,
                openMinute,
                closeAmPm,
                closeHour,
                closeMinute,
              ] = match;

              openHour24 = parseInt(openHour);
              if (openAmPm === "오후" && openHour24 < 12) openHour24 += 12;
              if (openAmPm === "오전" && openHour24 === 12) openHour24 = 0;

              closeHour24 = parseInt(closeHour);
              if (closeAmPm === "오후" && closeHour24 < 12) closeHour24 += 12;
              if (closeAmPm === "오전" && closeHour24 === 12) closeHour24 = 0;
            } else {
              // 24시간 형식
              const [_, openHour, openMinute, closeHour, closeMinute] = match;
              openHour24 = parseInt(openHour);
              closeHour24 = parseInt(closeHour);
            }

            // Check if current time is within business hours
            const currentTime = currentHour * 60 + currentMinute;
            const openTime =
              openHour24 * 60 +
              (typeof openMinute === "string" ? parseInt(openMinute) : 0);
            const closeTime =
              closeHour24 * 60 +
              (typeof closeMinute === "string" ? parseInt(closeMinute) : 0);

            // 일반적인 경우 (오픈 시간이 마감 시간보다 이른 경우)
            if (openTime < closeTime) {
              if (currentTime >= openTime && currentTime < closeTime) {
                return true;
              }
            }
            // 자정을 넘어가는 경우 (예: 오후 10시 - 오전 2시)
            else {
              if (currentTime >= openTime || currentTime < closeTime) {
                return true;
              }
            }

            // If pattern matches, stop trying other patterns
            break;
          }
        }
      }

      // Default to false
      return false;
    } catch (error) {
      console.error("Error checking if place is open:", error);
      return false;
    }
  };

  // Get day index from day string (e.g., "Monday: 9:00 AM – 5:00 PM" -> 1)
  const getDayIndexFromString = (dayString: string | undefined): number => {
    if (!dayString) return -1;

    // English day names array
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    // Korean day names array
    const koDays = [
      "일요일",
      "월요일",
      "화요일",
      "수요일",
      "목요일",
      "금요일",
      "토요일",
    ];

    // Chinese day names array
    const cnDays = [
      "星期日",
      "星期一",
      "星期二",
      "星期三",
      "星期四",
      "星期五",
      "星期六",
    ];

    // English day check
    for (let i = 0; i < days.length; i++) {
      if (dayString.startsWith(days[i]!)) {
        return i;
      }
    }

    // Korean day check
    for (let i = 0; i < koDays.length; i++) {
      if (dayString.includes(koDays[i]!)) {
        return i;
      }
    }

    // Chinese day check
    for (let i = 0; i < cnDays.length; i++) {
      if (dayString.includes(cnDays[i]!)) {
        return i;
      }
    }

    return -1;
  };

  // Close photo view
  const closePhotoView = () => {
    setSelectedPhoto(null);
  };

  if (!visible) return null;

  // Type definition interface
  type PlaceTypesRecord = Record<string, string>;

  const placeTypes: Record<Locale, PlaceTypesRecord> = {
    en: enPlaceTypes as PlaceTypesRecord,
    ko: koPlaceTypes as PlaceTypesRecord,
    cn: cnPlaceTypes as PlaceTypesRecord,
  };

  // Get translated place type name
  const getPlaceTypeName = (type: string | undefined): string => {
    if (!type) return "";

    // Find translation for current locale
    const translatedType = placeTypes[locale as Locale][type];

    // If no translation, convert to default format (underscores to spaces)
    return translatedType || type.replace(/_/g, " ");
  };

  return (
    <div className="fixed left-0 top-0 bottom-0 z-20 w-full md:w-[400px] overflow-auto">
      <div className="h-auto bg-black/70 backdrop-blur-md p-4 border-r border-white/20 min-h-screen">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
          aria-label={t("common.close")}
        >
          <FaTimes size={18} />
        </button>

        {isLoading && (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
          </div>
        )}

        {error && (
          <div className="text-white bg-red-500/20 p-4 rounded-md mt-4 backdrop-blur-sm border border-red-500/30">
            {error}
          </div>
        )}

        {!isLoading && placeDetails && (
          <div className="text-white mt-6">
            {/* Photo information - only show if there are photos and no errors */}
            {placeDetails.photos &&
              placeDetails.photos.length > 0 &&
              Object.keys(photoErrors).length < placeDetails.photos.length && (
                <div className="mb-6 p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-colors">
                  <div className="flex items-start mb-2">
                    <div className="mr-3 mt-1 text-pink-400">
                      <FaImages size={18} />
                    </div>
                    <h3 className="text-sm font-medium text-gray-300">
                      {t("common.photos")}
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {placeDetails.photos
                      .slice(0, 4)
                      .map((photo: any, index: number) => {
                        // If there is an image error, do not render
                        if (photoErrors[index]) return null;

                        const photoUrl = photo.getUrl({
                          maxWidth: 300,
                          maxHeight: 300,
                        });

                        const fullPhotoUrl = photo.getUrl({
                          maxWidth: 1200,
                          maxHeight: 1200,
                        });

                        return (
                          <div
                            key={index}
                            className="aspect-square overflow-hidden rounded-md border border-white/10 hover:border-white/30 transition-all hover:scale-105 cursor-pointer relative group"
                            onClick={() => setSelectedPhoto(fullPhotoUrl)}
                            title={t("common.viewFullImage")}
                          >
                            <img
                              src={photoUrl}
                              alt={`${placeDetails.name} ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={() => handleImageError(index)}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <FaExpand size={24} className="text-white" />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

            {/* Place name and type */}
            <div className="mb-6 pb-4 border-b border-white/10">
              <h2 className="text-2xl font-bold mb-2">{placeDetails.name}</h2>

              {placeDetails.types && placeDetails.types.length > 0 && (
                <div className="flex items-center mb-3">
                  <FaStoreAlt className="text-gray-300 mr-2" />
                  <span className="text-gray-300 text-sm">
                    {getPlaceTypeName(placeDetails.types?.[0])}
                  </span>
                </div>
              )}

              {/* Rating display */}
              {placeDetails.rating && (
                <div className="flex items-center mb-1">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className="text-yellow-400 mr-1">
                        {i < Math.floor(placeDetails.rating) ? (
                          <FaStar size={16} />
                        ) : (
                          <FaRegStar size={16} />
                        )}
                      </span>
                    ))}
                  </div>
                  <span className="ml-2 text-sm">
                    {placeDetails.rating} ({placeDetails.user_ratings_total}{" "}
                    {t("common.reviews")})
                  </span>
                </div>
              )}
            </div>

            {/* Address information */}
            {placeDetails.formatted_address && (
              <div
                className="mb-4 p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
                onClick={copyAddressToClipboard}
                title={t("common.copyAddress")}
              >
                <div className="flex items-start">
                  <div className="mr-3 mt-1 text-blue-400">
                    <FaMapMarkerAlt size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-medium text-gray-300 mb-1">
                        {t("common.address")}
                      </h3>
                      <div className="flex items-center">
                        {copiedAddress && (
                          <span className="text-green-400 text-xs bg-green-400/10 px-2 py-1 rounded mr-2">
                            {t("common.addressCopied")}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyAddressToClipboard();
                          }}
                          className="text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-md hover:bg-white/10"
                          title={t("common.copyAddress")}
                        >
                          <FaCopy size={14} />
                        </button>
                      </div>
                    </div>
                    <p>{placeDetails.formatted_address}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Ground code */}
            {location && (
              <div
                className="mb-4 p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
                onClick={copyGroundCodeToClipboard}
                title={t("common.copyGroundCode")}
              >
                <div className="flex items-start">
                  <div className="mr-3 mt-1 text-indigo-400">
                    <FaCode size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-medium text-gray-300 mb-1">
                        {t("common.groundCode")}
                      </h3>
                      <div className="flex items-center">
                        {copiedGroundCode && (
                          <span className="text-green-400 text-xs bg-green-400/10 px-2 py-1 rounded mr-2">
                            {t("common.groundCodeCopied")}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyGroundCodeToClipboard();
                          }}
                          className="text-purple-400 hover:text-purple-300 transition-colors p-2 rounded-md hover:bg-white/10"
                          title={t("common.copyGroundCode")}
                        >
                          <FaCopy size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="font-mono tracking-wider">
                      {isLoadingGroundCode ? (
                        <span className="text-gray-400">
                          {t("common.loading")}
                        </span>
                      ) : groundCode ? (
                        groundCode
                      ) : (
                        <span className="text-gray-400">
                          {t("common.unavailable")}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Phone number information */}
            {placeDetails.formatted_phone_number && (
              <div
                className="mb-4 p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
                onClick={copyPhoneNumberToClipboard}
                title={t("common.copyPhone")}
              >
                <div className="flex items-start">
                  <div className="mr-3 mt-1 text-green-400">
                    <FaPhone size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-medium text-gray-300 mb-1">
                        {t("common.phone")}
                      </h3>
                      <div className="flex items-center">
                        {copiedPhoneNumber && (
                          <span className="text-green-400 text-xs bg-green-400/10 px-2 py-1 rounded mr-2">
                            {t("common.phoneCopied")}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyPhoneNumberToClipboard();
                          }}
                          className="text-green-400 hover:text-green-300 transition-colors p-2 rounded-md hover:bg-white/10 mr-2"
                          title={t("common.copyPhone")}
                        >
                          <FaCopy size={14} />
                        </button>
                        <a
                          href={`tel:${placeDetails.formatted_phone_number.replace(/\s+/g, "")}`}
                          className="text-green-400 hover:text-green-300 transition-colors p-2 rounded-md hover:bg-white/10"
                          title={t("common.call")}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FaPhoneAlt size={14} />
                        </a>
                      </div>
                    </div>
                    <p>{placeDetails.formatted_phone_number}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Website information */}
            {placeDetails.website && (
              <div
                className="mb-4 p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
                onClick={() => window.open(placeDetails.website, "_blank")}
                title={placeDetails.website}
              >
                <div className="flex items-start">
                  <div className="mr-3 mt-1 text-purple-400">
                    <FaGlobe size={18} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-300 mb-1">
                      {t("common.website")}
                    </h3>
                    <a
                      href={placeDetails.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline break-all overflow-hidden text-ellipsis max-w-full inline-block"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                        hyphens: "auto",
                      }}
                    >
                      {placeDetails.website
                        .replace(/^https?:\/\//, "")
                        .replace(/\/$/, "")}
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Business hours information */}
            {placeDetails.opening_hours && (
              <div className="mb-4 p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-colors">
                <div className="flex items-start">
                  <div className="mr-3 mt-1 text-yellow-400">
                    <FaClock size={18} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-300 mb-1">
                      {t("common.hours")}
                    </h3>
                    <p
                      className={
                        isOpenNow()
                          ? "text-green-400 font-medium"
                          : "text-red-400 font-medium"
                      }
                    >
                      {isOpenNow()
                        ? t("common.openNow")
                        : t("common.closedNow")}
                    </p>
                    <div className="mt-2 text-sm">
                      {placeDetails.opening_hours.weekday_text &&
                        placeDetails.opening_hours.weekday_text.map(
                          (day: string, index: number) => {
                            const dayIndex = getDayIndexFromString(day);
                            const isCurrentDay =
                              dayIndex === getCurrentDayIndex();
                            return (
                              <p
                                key={index}
                                className={`py-1 border-b border-white/5 last:border-0 ${
                                  isCurrentDay
                                    ? "bg-white/10 text-white font-medium px-2 -mx-2 rounded"
                                    : ""
                                }`}
                              >
                                {day}
                              </p>
                            );
                          }
                        )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Google Maps link */}
            <div className="mt-6 flex justify-center">
              <a
                href={placeDetails.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center bg-white/90 hover:bg-white text-black py-3 px-5 rounded-md transition-colors backdrop-blur-sm border shadow-lg"
              >
                <FaMapMarkedAlt className="mr-2" size={16} />
                {t("common.viewOnGoogleMaps")}
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Photo view modal - React Portal usage */}
      {selectedPhoto &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
            onClick={closePhotoView}
          >
            <button
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
              onClick={closePhotoView}
            >
              <FaTimes size={18} />
            </button>
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={selectedPhoto}
                alt={t("common.viewFullImage")}
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: "95vw" }}
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default PlaceDetails;
