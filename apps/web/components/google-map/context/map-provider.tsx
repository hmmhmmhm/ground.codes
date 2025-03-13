import React, { createContext, useContext } from "react";
import { MapContextType, MapProviderProps } from "./types";
import { useMapContextState } from "./use-map-context";

export const MapContext = createContext<MapContextType | null>(null);

export const MapProvider: React.FC<MapProviderProps> = ({ children }) => {
  const contextValue = useMapContextState();

  return (
    <MapContext.Provider value={contextValue}>{children}</MapContext.Provider>
  );
};

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMapContext must be used within a MapProvider");
  }
  return context;
};
