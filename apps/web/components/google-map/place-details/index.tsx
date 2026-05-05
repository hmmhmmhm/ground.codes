import React, { useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
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
  FaStar,
  FaRegStar,
  FaCode,
} from "react-icons/fa";

import { PlaceDetailsProps } from "./types";
import { getCurrentDayIndex, getDayIndexFromString, isOpenNow, getPlaceTypeName } from "./helpers";
import { usePlaceDetails } from "./use-place-details";
import { useGroundCode } from "./use-ground-code";
import { useCopy } from "./use-copy";
import PhotoGallery from "./photo-gallery";
import PhotoModal from "./photo-modal";

const PlaceDetails: React.FC<PlaceDetailsProps> = ({
  map,
  visible,
  placeId,
  location,
  onClose,
}) => {
  const { t, locale } = useI18n();

  // Photo state (lifted here so usePlaceDetails can reset it via callback)
  const [photoErrors, setPhotoErrors] = useState<Record<number, boolean>>({});
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const resetPhotoState = useCallback(() => {
    setPhotoErrors({});
    setSelectedPhoto(null);
  }, []);

  const { isLoading, error, placeDetails } = usePlaceDetails(
    map,
    placeId,
    visible,
    resetPhotoState
  );

  const { groundCode, isLoadingGroundCode } = useGroundCode(location, visible);

  const { address: addressCopy, groundCode: groundCodeCopy, phone: phoneCopy } = useCopy(
    useCallback(() => placeDetails?.formatted_address, [placeDetails]),
    useCallback(() => groundCode || undefined, [groundCode]),
    useCallback(() => placeDetails?.formatted_phone_number, [placeDetails])
  );

  const handleImageError = (index: number) => {
    setPhotoErrors((prev) => ({ ...prev, [index]: true }));
  };

  if (!visible) return null;

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
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white" />
          </div>
        )}

        {error && (
          <div className="text-white bg-red-500/20 p-4 rounded-md mt-4 backdrop-blur-sm border border-red-500/30">
            {error}
          </div>
        )}

        {!isLoading && placeDetails && (
          <div className="text-white mt-6">
            {/* Photo gallery */}
            {placeDetails.photos && placeDetails.photos.length > 0 && (
              <PhotoGallery
                photos={placeDetails.photos}
                photoErrors={photoErrors}
                placeName={placeDetails.name}
                onPhotoError={handleImageError}
                onSelectPhoto={setSelectedPhoto}
              />
            )}

            {/* Place name and type */}
            <div className="mb-6 pb-4 border-b border-white/10">
              <h2 className="text-2xl font-bold mb-2">{placeDetails.name}</h2>

              {placeDetails.types && placeDetails.types.length > 0 && (
                <div className="flex items-center mb-3">
                  <FaStoreAlt className="text-gray-300 mr-2" />
                  <span className="text-gray-300 text-sm">
                    {getPlaceTypeName(placeDetails.types?.[0], locale as Locale)}
                  </span>
                </div>
              )}

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

            {/* Address */}
            {placeDetails.formatted_address && (
              <div
                className="mb-4 p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
                onClick={addressCopy.copy}
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
                        {addressCopy.copied && (
                          <span className="text-green-400 text-xs bg-green-400/10 px-2 py-1 rounded mr-2">
                            {t("common.addressCopied")}
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); addressCopy.copy(); }}
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
                onClick={groundCodeCopy.copy}
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
                        {groundCodeCopy.copied && (
                          <span className="text-green-400 text-xs bg-green-400/10 px-2 py-1 rounded mr-2">
                            {t("common.groundCodeCopied")}
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); groundCodeCopy.copy(); }}
                          className="text-purple-400 hover:text-purple-300 transition-colors p-2 rounded-md hover:bg-white/10"
                          title={t("common.copyGroundCode")}
                        >
                          <FaCopy size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="font-mono tracking-wider">
                      {isLoadingGroundCode ? (
                        <span className="text-gray-400">{t("common.loading")}</span>
                      ) : groundCode ? (
                        groundCode
                      ) : (
                        <span className="text-gray-400">{t("common.unavailable")}</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Phone */}
            {placeDetails.formatted_phone_number && (
              <div
                className="mb-4 p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
                onClick={phoneCopy.copy}
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
                        {phoneCopy.copied && (
                          <span className="text-green-400 text-xs bg-green-400/10 px-2 py-1 rounded mr-2">
                            {t("common.phoneCopied")}
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); phoneCopy.copy(); }}
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

            {/* Website */}
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
                      style={{ wordWrap: "break-word", overflowWrap: "break-word", hyphens: "auto" }}
                    >
                      {placeDetails.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Opening hours */}
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
                    <p className={isOpenNow(placeDetails) ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
                      {isOpenNow(placeDetails) ? t("common.openNow") : t("common.closedNow")}
                    </p>
                    <div className="mt-2 text-sm">
                      {placeDetails.opening_hours.weekday_text &&
                        placeDetails.opening_hours.weekday_text.map(
                          (day: string, index: number) => {
                            const dayIndex = getDayIndexFromString(day);
                            const isCurrentDay = dayIndex === getCurrentDayIndex();
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

      {/* Full-screen photo modal */}
      {selectedPhoto && (
        <PhotoModal photoUrl={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
    </div>
  );
};

export default PlaceDetails;
