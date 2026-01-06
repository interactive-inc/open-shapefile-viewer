import type { Feature, Geometry, GeoJsonProperties } from "geojson";

/**
 * フィーチャーから利用可能なプロパティキーを取得
 */
export function getAvailablePropertyKeys(
  features: Feature<Geometry | null, GeoJsonProperties>[]
): string[] {
  const keysSet = new Set<string>();
  for (const feature of features) {
    if (feature.properties) {
      for (const key of Object.keys(feature.properties)) {
        keysSet.add(key);
      }
    }
  }
  return Array.from(keysSet).sort();
}

/**
 * 指定したキーの一意な値を取得
 */
export function getAvailablePropertyValues(
  features: Feature<Geometry | null, GeoJsonProperties>[],
  key: string
): string[] {
  if (!key) return [];
  const valuesSet = new Set<string>();
  for (const feature of features) {
    const value = feature.properties?.[key];
    if (value !== null && value !== undefined) {
      valuesSet.add(String(value));
    }
  }
  return Array.from(valuesSet).sort();
}

/**
 * プロパティ値でフィーチャーをフィルタリング (OR条件)
 */
export function filterFeaturesByProperty<T extends Feature<Geometry | null, GeoJsonProperties>>(
  features: T[],
  key: string,
  values: string[]
): T[] {
  if (!key || values.length === 0) return [];
  const valuesSet = new Set(values);
  return features.filter((feature) => {
    const value = feature.properties?.[key];
    if (value === null || value === undefined) return false;
    return valuesSet.has(String(value));
  });
}
