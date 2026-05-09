"use client";

import SpiralViewer from "@repo/ui/components/spiral-viewer";
import { getCoordinates, getNFromCoordinates } from "@/lib/grok-spiral";

export default function SpiralClient() {
  return <SpiralViewer {...{ getCoordinates, getNFromCoordinates }} />;
}
