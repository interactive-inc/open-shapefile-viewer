import type { FeatureCollection } from "geojson";

export interface Layer {
  id: string;
  name: string;
  filePath: string;
  geojson: FeatureCollection;
  visible: boolean;
  color: string;
}

export const LAYER_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
];
