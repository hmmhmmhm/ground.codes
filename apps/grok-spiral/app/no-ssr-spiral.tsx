"use client";

import dynamic from "next/dynamic";

const SpiralClient = dynamic(() => import("./spiral-client"), { ssr: false });

export default function NoSsrSpiral() {
  return <SpiralClient />;
}
