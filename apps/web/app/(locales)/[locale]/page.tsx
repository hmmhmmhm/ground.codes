"use client";

import GoogleMap from "@/components/google-map";

export default function Home() {
  return (
    <div className="absolute min-h-screen-safe bg-black w-full h-full">
      <GoogleMap />
    </div>
  );
}
