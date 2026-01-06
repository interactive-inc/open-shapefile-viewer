import type { FeatureCollection } from "geojson";

export interface PropertyFilter {
  key: string;
  values: string[]; // OR条件: いずれかの値にマッチ
  enabled: boolean;
}

export interface Layer {
  id: string;
  name: string;
  geojson: FeatureCollection;
  visible: boolean;
  color: string;
  filter?: PropertyFilter;
}

/**
 * localStorage に保存するレイヤー状態
 * (GeoJSON は大きいので保存しない - 再度ファイルを読み込む必要あり)
 */
export interface SavedLayerState {
  name: string;
  visible: boolean;
  color: string;
  filter?: PropertyFilter;
}

export const LAYER_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
];

/**
 * フィーチャーIDを生成
 * layerId:featureIndex 形式
 */
export function generateFeatureId(layerId: string, featureIndex: number): string {
  return `${layerId}:${featureIndex}`;
}

/**
 * フィーチャーIDからレイヤーIDとインデックスを取得
 */
export function parseFeatureId(featureId: string): { layerId: string; index: number } | null {
  const parts = featureId.split(":");
  if (parts.length !== 2) return null;
  const index = Number.parseInt(parts[1], 10);
  if (Number.isNaN(index)) return null;
  return { layerId: parts[0], index };
}
