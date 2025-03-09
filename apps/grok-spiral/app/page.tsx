"use client";
import SpiralViewer from "@repo/ui/components/spiral-viewer";
import { getCoordinates, getNFromCoordinates } from "@/lib/grok-spiral";

export default function Home() {
  return (
    <div className="min-h-screen bg-black p-4">
      <SpiralViewer {...{ getCoordinates, getNFromCoordinates }} />
    </div>
  );
}
