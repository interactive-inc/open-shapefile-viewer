import { useState, useCallback } from "react";
import { STORAGE_KEYS } from "@/lib/constants";

export type MapStyleId = "osm" | "positron" | "dark" | "osm-muted";

export interface MapStyleConfig {
  id: MapStyleId;
  name: string;
  url: string;
  attribution: string;
  filter: string | null;
}

export const MAP_STYLES: Record<MapStyleId, MapStyleConfig> = {
  osm: {
    id: "osm",
    name: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    filter: null,
  },
  positron: {
    id: "positron",
    name: "CartoDB Positron",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    filter: null,
  },
  dark: {
    id: "dark",
    name: "CartoDB Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    filter: null,
  },
  "osm-muted": {
    id: "osm-muted",
    name: "OSM (淡色)",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    filter: "brightness(1.1) saturate(0.3)",
  },
};

/** useMapStyle の戻り値型 */
export interface UseMapStyleResult {
  styleId: MapStyleId;
  currentStyle: MapStyleConfig;
  setStyle: (id: MapStyleId) => void;
  allStyles: MapStyleConfig[];
}

export function useMapStyle(): UseMapStyleResult {
  const [styleId, setStyleId] = useState<MapStyleId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MAP_STYLE);
      if (saved && saved in MAP_STYLES) {
        return saved as MapStyleId;
      }
    } catch {
      // ignore
    }
    return "osm";
  });

  const setStyle = useCallback((id: MapStyleId) => {
    setStyleId(id);
    try {
      localStorage.setItem(STORAGE_KEYS.MAP_STYLE, id);
    } catch {
      // ignore
    }
  }, []);

  const currentStyle = MAP_STYLES[styleId];

  return {
    styleId,
    currentStyle,
    setStyle,
    allStyles: Object.values(MAP_STYLES),
  };
}
