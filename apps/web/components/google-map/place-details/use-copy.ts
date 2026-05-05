import { useState, useCallback } from "react";

/** Duration (ms) for which the "copied" confirmation badge is shown. */
const COPIED_DURATION_MS = 2000;

const useCopyText = (getText: () => string | undefined) => {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    const text = getText();
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), COPIED_DURATION_MS);
      })
      .catch((err) => {
        console.error("Clipboard write failed:", err);
      });
  }, [getText]);

  return { copied, copy };
};

/**
 * Bundles all three clipboard-copy actions used inside PlaceDetails.
 * Each returns a { copied, copy } pair so the UI can show confirmation badges.
 */
export const useCopy = (
  getAddress: () => string | undefined,
  getGroundCode: () => string | undefined,
  getPhone: () => string | undefined
) => {
  const address = useCopyText(getAddress);
  const groundCode = useCopyText(getGroundCode);
  const phone = useCopyText(getPhone);

  return { address, groundCode, phone };
};
