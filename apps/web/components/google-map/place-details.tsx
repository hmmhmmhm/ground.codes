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

    // 새로운 장소가 선택되면 이전 데이터 초기화
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
        console.log("Fetching place details for:", placeId);

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
              console.log("Place details received:", result);
              setPlaceDetails(result);
            } else {
              console.error("Failed to fetch place details:", status);
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

  // 주소 복사 함수
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

  // 그라운드 코드 복사 함수
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

  // 전화번호 복사 함수
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

  // 그라운드 코드 생성 (위도/경도 기반 간단한 인코딩)
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

  // location이나 locale이 변경될 때만 그라운드 코드 생성
  useEffect(() => {
    if (location && visible) {
      generateGroundCode();
    }
  }, [location, locale, visible, generateGroundCode]);

  // 컴포넌트가 숨겨질 때 데이터 초기화
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

  // 이미지 로드 에러 처리
  const handleImageError = (index: number) => {
    setPhotoErrors((prev) => ({ ...prev, [index]: true }));
  };

  // 현재 요일 확인 (0: 일요일, 1: 월요일, ..., 6: 토요일)
  const getCurrentDayIndex = () => {
    return new Date().getDay();
  };

  // 영업 중인지 확인하는 함수
  const isOpenNow = () => {
    try {
      console.log("Opening hours data:", placeDetails?.opening_hours);

      // periods 데이터를 사용한 방법
      if (placeDetails?.opening_hours?.periods) {
        console.log(
          "Checking periods data:",
          placeDetails.opening_hours.periods
        );
        const now = new Date();
        const day = now.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const currentTime = hours * 60 + minutes; // 현재 시간을 분 단위로 변환

        // 현재 요일에 해당하는 영업 시간 찾기
        const todayPeriods = placeDetails.opening_hours.periods.filter(
          (period: any) => period.open && period.open.day === day
        );

        console.log("Today's periods:", todayPeriods);

        // 24시간 영업 확인 (periods 길이가 1이고 close가 없는 경우)
        if (
          placeDetails.opening_hours.periods.length === 1 &&
          placeDetails.opening_hours.periods[0].open &&
          !placeDetails.opening_hours.periods[0].close
        ) {
          console.log("24-hour operation detected from periods data");
          return true;
        }

        // 현재 시간이 영업 시간 내인지 확인
        for (const period of todayPeriods) {
          if (!period.open || !period.close) continue;

          // 시간 형식 변환 (예: "0900" -> 9*60 = 540분)
          const openTime =
            parseInt(period.open.time.substring(0, 2)) * 60 +
            parseInt(period.open.time.substring(2, 4));
          const closeTime =
            parseInt(period.close.time.substring(0, 2)) * 60 +
            parseInt(period.close.time.substring(2, 4));

          console.log(
            `Period: open=${openTime}min, close=${closeTime}min, current=${currentTime}min`
          );

          // 일반적인 경우 (오픈 시간이 마감 시간보다 이른 경우)
          if (openTime < closeTime) {
            if (currentTime >= openTime && currentTime < closeTime) {
              console.log("Open: current time is within business hours");
              return true;
            }
          }
          // 자정을 넘어가는 경우 (예: 오후 10시 - 오전 2시)
          else {
            if (currentTime >= openTime || currentTime < closeTime) {
              console.log(
                "Open: current time is within overnight business hours"
              );
              return true;
            }
          }
        }
      }

      // 3. weekday_text를 파싱하는 방법 (periods가 없는 경우 대체 방법)
      if (placeDetails?.opening_hours?.weekday_text) {
        console.log(
          "Checking weekday_text:",
          placeDetails.opening_hours.weekday_text
        );

        // 현재 시간과 요일 확인
        const now = new Date();
        const currentDay = now.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // 현재 요일에 해당하는 텍스트 찾기
        const dayText = placeDetails.opening_hours.weekday_text[currentDay];
        console.log("Current day text:", dayText);

        if (dayText) {
          // 24시간 영업인 경우
          if (
            dayText.includes("24 hours") ||
            dayText.includes("24시간") ||
            dayText.toLowerCase().includes("open 24 hours")
          ) {
            console.log("24-hour operation detected from text");
            return true;
          }

          // 휴무일인 경우
          if (
            dayText.includes("Closed") ||
            dayText.includes("휴무") ||
            dayText.includes("休息")
          ) {
            console.log("Closed day detected from text");
            return false;
          }

          // 시간 추출 패턴 - 다양한 형식 지원
          // "Monday: 9:00 AM – 5:00 PM" 또는 "월요일: 오전 9:00 - 오후 5:00" 등
          const timePatterns = [
            // 영어 형식 (AM/PM)
            /(\d{1,2}):(\d{2})\s*(AM|PM)\s*[–-]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i,
            // 24시간 형식
            /(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/i,
            // 한국어 형식 (오전/오후)
            /(오전|오후)\s*(\d{1,2}):(\d{2})\s*[–-]\s*(오전|오후)\s*(\d{1,2}):(\d{2})/i,
          ];

          // 각 패턴으로 시도
          for (const pattern of timePatterns) {
            const match = dayText.match(pattern);
            if (!match) continue;

            console.log("Time pattern matched:", match);

            let openHour24, openMinute, closeHour24, closeMinute;

            // 패턴에 따라 다르게 처리
            if (pattern.source.includes("AM|PM")) {
              // 영어 AM/PM 형식
              const [
                _,
                openHour,
                openMinute,
                openAmPm,
                closeHour,
                closeMinute,
                closeAmPm,
              ] = match;

              // 24시간제로 변환
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

            // 현재 시간이 영업 시간 내인지 확인
            const currentTime = currentHour * 60 + currentMinute;
            const openTime =
              openHour24 * 60 +
              (typeof openMinute === "string" ? parseInt(openMinute) : 0);
            const closeTime =
              closeHour24 * 60 +
              (typeof closeMinute === "string" ? parseInt(closeMinute) : 0);

            console.log(
              `Parsed times: open=${openTime}min, close=${closeTime}min, current=${currentTime}min`
            );

            // 일반적인 경우 (오픈 시간이 마감 시간보다 이른 경우)
            if (openTime < closeTime) {
              if (currentTime >= openTime && currentTime < closeTime) {
                console.log(
                  "Open: current time is within business hours (text parsing)"
                );
                return true;
              }
            }
            // 자정을 넘어가는 경우 (예: 오후 10시 - 오전 2시)
            else {
              if (currentTime >= openTime || currentTime < closeTime) {
                console.log(
                  "Open: current time is within overnight business hours (text parsing)"
                );
                return true;
              }
            }

            // 패턴이 매치되었으면 더 이상 다른 패턴을 시도하지 않음
            break;
          }
        }
      }

      // 기본값으로 false 반환
      console.log(
        "No valid opening hours information found, defaulting to closed"
      );
      return false;
    } catch (error) {
      console.error("Error checking if place is open:", error);
      return false;
    }
  };

  // 요일 문자열에서 요일 확인 (예: "Monday: 9:00 AM – 5:00 PM" -> 1)
  const getDayIndexFromString = (dayString: string | undefined): number => {
    if (!dayString) return -1;

    // 영어 요일 이름 배열
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    // 한국어 요일 이름 배열
    const koDays = [
      "일요일",
      "월요일",
      "화요일",
      "수요일",
      "목요일",
      "금요일",
      "토요일",
    ];

    // 중국어 요일 이름 배열
    const cnDays = [
      "星期日",
      "星期一",
      "星期二",
      "星期三",
      "星期四",
      "星期五",
      "星期六",
    ];

    // 영어 요일 확인
    for (let i = 0; i < days.length; i++) {
      if (dayString.startsWith(days[i]!)) {
        return i;
      }
    }

    // 한국어 요일 확인
    for (let i = 0; i < koDays.length; i++) {
      if (dayString.includes(koDays[i]!)) {
        return i;
      }
    }

    // 중국어 요일 확인
    for (let i = 0; i < cnDays.length; i++) {
      if (dayString.includes(cnDays[i]!)) {
        return i;
      }
    }

    return -1;
  };

  // 사진 확대 보기 닫기
  const closePhotoView = () => {
    setSelectedPhoto(null);
  };

  if (!visible) return null;

  // 타입 정의를 위한 인터페이스
  type PlaceTypesRecord = Record<string, string>;

  const placeTypes: Record<Locale, PlaceTypesRecord> = {
    en: enPlaceTypes as PlaceTypesRecord,
    ko: koPlaceTypes as PlaceTypesRecord,
    cn: cnPlaceTypes as PlaceTypesRecord,
  };

  // 현재 장소 유형의 번역된 이름 가져오기
  const getPlaceTypeName = (type: string | undefined): string => {
    if (!type) return "";

    // 현재 로케일에 맞는 번역 찾기
    const translatedType = placeTypes[locale as Locale][type];

    // 번역이 없으면 기본 형식으로 변환 (언더스코어를 공백으로)
    return translatedType || type.replace(/_/g, " ");
  };

  return (
    <div className="fixed left-0 top-0 bottom-0 z-20 w-full md:w-[400px] overflow-auto">
      <div className="h-auto bg-black/70 backdrop-blur-md p-4 border-r border-white/20 min-h-screen">
        {/* 닫기 버튼 */}
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
            {/* 사진 정보 - 사진이 있고 모든 사진이 에러가 아닌 경우에만 표시 */}
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
                        // 이미지 에러가 있는 경우 렌더링하지 않음
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

            {/* 장소 이름 및 타입 */}
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

              {/* 별점 표시 */}
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

            {/* 주소 정보 */}
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

            {/* 그라운드 코드 */}
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

            {/* 전화번호 정보 */}
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

            {/* 웹사이트 정보 */}
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

            {/* 영업시간 정보 */}
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

            {/* Google Maps 링크 */}
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

      {/* 사진 확대 보기 모달 - React Portal 사용 */}
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
