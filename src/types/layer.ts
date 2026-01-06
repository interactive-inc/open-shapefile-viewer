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

/**
 * フィーチャーのプロパティから名称を生成
 * 都道府県名 + 市区町村名 + 町大字名 + 丁目字名 を結合
 */
export function generateFeatureName(properties: Record<string, unknown> | null): string {
  if (!properties) return "";

  const parts: string[] = [];
  const keys = ["都道府県名", "市区町村名", "町大字名", "丁目字名"];

  for (const key of keys) {
    const value = properties[key];
    if (value !== null && value !== undefined && value !== "") {
      parts.push(String(value));
    }
  }

  return parts.join("");
}

/**
 * レイヤー配列からフィーチャーIDに対応する名称を取得
 */
export function getFeatureNameFromLayers(
  featureId: string,
  layers: Layer[]
): string {
  const parsed = parseFeatureId(featureId);
  if (!parsed) return "";

  const layer = layers.find((l) => l.id === parsed.layerId);
  if (!layer) return "";

  const feature = layer.geojson.features[parsed.index];
  if (!feature) return "";

  return generateFeatureName(feature.properties as Record<string, unknown> | null);
}
