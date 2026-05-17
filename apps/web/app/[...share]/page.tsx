"use client";

import GoogleMap from "@/components/google-map";

export default function SharedCodePage() {
  return (
    <div className="absolute min-h-screen-safe bg-black w-full h-full select-none overflow-hidden">
      <GoogleMap />
    </div>
  );
}
