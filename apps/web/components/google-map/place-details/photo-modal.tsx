import React from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { FaTimes } from "react-icons/fa";
import { useI18n } from "@/lib/i18n/i18n-context";

interface PhotoModalProps {
  photoUrl: string;
  onClose: () => void;
}

const PhotoModal: React.FC<PhotoModalProps> = ({ photoUrl, onClose }) => {
  const { t } = useI18n();

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
        onClick={onClose}
      >
        <FaTimes size={18} />
      </button>
      <div className="w-full h-full flex items-center justify-center">
        <Image
          unoptimized
          src={photoUrl}
          alt={t("common.viewFullImage")}
          width={1600}
          height={1200}
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: "95vw" }}
        />
      </div>
    </div>,
    document.body,
  );
};

export default PhotoModal;
