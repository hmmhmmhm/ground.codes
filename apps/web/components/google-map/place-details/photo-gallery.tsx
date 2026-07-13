import React from "react";
import Image from "next/image";
import { FaImages, FaExpand } from "react-icons/fa";
import { useI18n } from "@/lib/i18n/i18n-context";

interface PhotoGalleryProps {
  photos: google.maps.places.PlacePhoto[];
  photoErrors: Record<number, boolean>;
  placeName: string;
  onPhotoError: (index: number) => void;
  onSelectPhoto: (url: string) => void;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  photoErrors,
  placeName,
  onPhotoError,
  onSelectPhoto,
}) => {
  const { t } = useI18n();

  const visibleCount = photos.length - Object.keys(photoErrors).length;
  if (visibleCount === 0) return null;

  return (
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
        {photos.slice(0, 4).map((photo, index) => {
          if (photoErrors[index]) return null;

          const photoUrl = photo.getUrl({ maxWidth: 300, maxHeight: 300 });
          const fullPhotoUrl = photo.getUrl({
            maxWidth: 1200,
            maxHeight: 1200,
          });

          return (
            <div
              key={index}
              className="aspect-square overflow-hidden rounded-md border border-white/10 hover:border-white/30 transition-all hover:scale-105 cursor-pointer relative group"
              onClick={() => onSelectPhoto(fullPhotoUrl)}
              title={t("common.viewFullImage")}
            >
              <Image
                unoptimized
                src={photoUrl}
                alt={`${placeName} ${index + 1}`}
                width={300}
                height={300}
                className="w-full h-full object-cover"
                onError={() => onPhotoError(index)}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <FaExpand size={24} className="text-white" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PhotoGallery;
