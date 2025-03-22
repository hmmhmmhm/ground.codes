"use client";

import GoogleMap from "@/components/google-map";
import { useDisableRubberBandEffect } from "@/hooks/use-disable-rubber-band";

export default function Home() {
  // Apply the hook to disable iOS rubber band scrolling effect
  useDisableRubberBandEffect();
  
  return (
    <div className="absolute min-h-screen-safe bg-black w-full h-full select-none overflow-hidden">
      <GoogleMap />
    </div>
  );
}
