'use client';

import { useDisableZoom } from '@/hooks/use-disable-zoom';

/**
 * A component that prevents browser zoom functionality
 * This is a client component since it interacts with browser events
 */
export function DisableZoom() {
  // Apply the zoom disabling hook
  useDisableZoom();
  
  // This component doesn't render anything
  return null;
}
