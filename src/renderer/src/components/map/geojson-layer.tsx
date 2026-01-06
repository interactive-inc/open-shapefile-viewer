import { GeoJSON, useMap } from "react-leaflet";
import type { Feature, FeatureCollection, GeoJsonProperties } from "geojson";
import type { Layer, PathOptions } from "leaflet";
import { useEffect, useRef, useMemo, useCallback } from "react";
import { generateFeatureId, type PropertyFilter } from "@/types/layer";

// 最新のコールバックを参照するためのRef型
type FeatureClickHandler = (feature: Feature, featureId: string, index: number) => void;

// エリア割り当て情報 (featureId -> color)
type AreaColorMap = Map<string, string>;

// フィルター後のフィーチャー (元のインデックスを保持)
interface FilteredFeature {
  feature: Feature;
  originalIndex: number;
}

interface GeoJSONLayerProps {
  layerId: string;
  data: FeatureCollection;
  color: string;
  onFeatureClick: (feature: Feature, featureId: string, index: number) => void;
  selectedFeatureIndex: number | null; // インデックスで選択を管理
  fitBounds?: boolean;
  // エリア関連
  areaColorMap?: AreaColorMap; // featureId -> color のマップ
  areaSelectionMode?: boolean;
  showSelectionHighlight?: boolean; // 選択ハイライトを表示するか
  selectedAreaFeatureIds?: Set<string>; // 選択中エリアに属するフィーチャーID
  // フィルター
  filter?: PropertyFilter;
}

export function GeoJSONLayer({
  layerId,
  data,
  color,
  onFeatureClick,
  selectedFeatureIndex,
  fitBounds = false,
  areaColorMap,
  areaSelectionMode = false,
  showSelectionHighlight = true,
  selectedAreaFeatureIds,
  filter,
}: GeoJSONLayerProps) {
  const map = useMap();
  const geoJsonRef = useRef<L.GeoJSON | null>(null);

  // フィルター適用 (元のインデックスを保持)
  const { filteredData, originalIndexMap } = useMemo(() => {
    if (!filter?.enabled || !filter.key) {
      // フィルターなし: 全フィーチャーをそのまま使用
      const indexMap = new Map<Feature, number>();
      data.features.forEach((f, i) => indexMap.set(f, i));
      return { filteredData: data, originalIndexMap: indexMap };
    }

    // フィルター適用 (OR条件: いずれかの値にマッチ)
    const filtered: FilteredFeature[] = [];
    const valuesSet = new Set(filter.values);
    data.features.forEach((feature, index) => {
      const value = feature.properties?.[filter.key];
      if (valuesSet.has(String(value))) {
        filtered.push({ feature, originalIndex: index });
      }
    });

    const indexMap = new Map<Feature, number>();
    const newFeatures = filtered.map((f) => {
      indexMap.set(f.feature, f.originalIndex);
      return f.feature;
    });

    return {
      filteredData: { ...data, features: newFeatures },
      originalIndexMap: indexMap,
    };
  }, [data, filter]);

  // 最新のコールバックをrefに保存 (クロージャ問題を回避)
  const onFeatureClickRef = useRef<FeatureClickHandler>(onFeatureClick);
  onFeatureClickRef.current = onFeatureClick;

  // 最新の選択インデックスをrefに保存 (ホバー時のクロージャ問題を回避)
  const selectedFeatureIndexRef = useRef<number | null>(selectedFeatureIndex);
  selectedFeatureIndexRef.current = selectedFeatureIndex;

  // エリア色を取得 (Mapから直接取得)
  const getAreaColorForIndex = useCallback(
    (featureIndex: number): string | null => {
      if (!areaColorMap) return null;
      const featureId = generateFeatureId(layerId, featureIndex);
      return areaColorMap.get(featureId) ?? null;
    },
    [layerId, areaColorMap]
  );

  // キー生成用: areaColorMapの内容を文字列化
  const areaColorMapKey = useMemo(() => {
    if (!areaColorMap || areaColorMap.size === 0) return "";
    return Array.from(areaColorMap.entries())
      .filter(([id]) => id.startsWith(layerId + ":"))
      .map(([id, c]) => `${id}=${c}`)
      .join(",");
  }, [layerId, areaColorMap]);

  // Fit bounds when fitBounds is true
  useEffect(() => {
    if (fitBounds && geoJsonRef.current) {
      const bounds = geoJsonRef.current.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [data, map, fitBounds]);

  const getStyleForFeature = useCallback(
    (featureIndex: number, isSelected: boolean, isHover: boolean): PathOptions => {
      // エリア色があればそれを使用
      const areaColor = getAreaColorForIndex(featureIndex);
      const baseColor = areaColor ?? color;
      const isAssigned = areaColor !== null;

      if (isSelected && showSelectionHighlight) {
        return {
          color: "#fbbf24", // amber - 選択状態は黄色系
          weight: 4,
          fillOpacity: 0.6,
          fillColor: "#fbbf24",
        };
      }

      // エリア選択モード時のホバースタイル
      if (isHover && areaSelectionMode) {
        const featureId = generateFeatureId(layerId, featureIndex);
        const belongsToSelectedArea = selectedAreaFeatureIds?.has(featureId) ?? false;

        if (belongsToSelectedArea) {
          // 選択中エリアに属する: 赤系で「削除可能」を表示
          return {
            color: "#ef4444",
            weight: 3,
            fillOpacity: 0.5,
            fillColor: "#ef4444",
          };
        }
        if (isAssigned) {
          // 他のエリアに割り当て済み: 薄いグレーで「変更不可」を表示
          return {
            color: "#9ca3af",
            weight: 2,
            fillOpacity: 0.3,
            fillColor: "#9ca3af",
            dashArray: "4, 4",
          };
        }
        // 未割り当て: 緑色で「追加可能」を表示
        return {
          color: "#22c55e",
          weight: 3,
          fillOpacity: 0.5,
          fillColor: "#22c55e",
        };
      }

      if (isHover) {
        return {
          color: baseColor,
          weight: 3,
          fillOpacity: 0.5,
          fillColor: baseColor,
        };
      }

      return {
        color: baseColor,
        weight: areaColor ? 2 : 1,
        fillOpacity: areaColor ? 0.4 : 0.2,
        fillColor: baseColor,
      };
    },
    [color, getAreaColorForIndex, areaSelectionMode, showSelectionHighlight, layerId, selectedAreaFeatureIds]
  );

  // 最新のスタイル関数をrefに保存 (ホバー時のクロージャ問題を回避)
  const getStyleForFeatureRef = useRef(getStyleForFeature);
  getStyleForFeatureRef.current = getStyleForFeature;

  // originalIndexMapをrefに保存 (イベントハンドラ内で使用)
  const originalIndexMapRef = useRef(originalIndexMap);
  originalIndexMapRef.current = originalIndexMap;

  const style = useCallback(
    (feature: Feature | undefined): PathOptions => {
      if (!feature) return getStyleForFeature(0, false, false);

      // フィーチャーの元インデックスを取得
      const index = originalIndexMap.get(feature) ?? 0;
      const isSelected = selectedFeatureIndex === index;

      return getStyleForFeature(index, isSelected, false);
    },
    [originalIndexMap, selectedFeatureIndex, getStyleForFeature]
  );

  const onEachFeature = useCallback(
    (feature: Feature<GeoJsonProperties>, layer: Layer) => {
      // 元インデックスをMapから取得
      const index = originalIndexMapRef.current.get(feature) ?? 0;
      const featureId = generateFeatureId(layerId, index);

      layer.on({
        click: () => {
          // refを使用して最新のコールバックを呼び出す
          onFeatureClickRef.current(feature, featureId, index);
        },
        mouseover: (e) => {
          const target = e.target as L.Path;
          // refを使用して最新の選択状態を参照
          const isSelected = selectedFeatureIndexRef.current === index;
          if (!isSelected) {
            target.setStyle(getStyleForFeatureRef.current(index, false, true));
          }
        },
        mouseout: (e) => {
          const target = e.target as L.Path;
          // refを使用して最新の選択状態を参照
          const isSelected = selectedFeatureIndexRef.current === index;
          if (!isSelected) {
            target.setStyle(getStyleForFeatureRef.current(index, false, false));
          }
        },
      });
    },
    [
      layerId,
      // selectedFeatureIndex, getStyleForFeature, onFeatureClick, originalIndexMapはrefを使用するため依存配列から削除
    ]
  );

  // フィルター後のデータが空の場合は何も描画しない
  if (!filteredData || !filteredData.features || filteredData.features.length === 0) {
    return null;
  }

  // キーにエリア割り当て、選択モード、フィルターを含めて、変更時に再描画
  const selectionModeKey = areaSelectionMode ? "select" : "view";
  const filterKey = filter?.enabled ? `${filter.key}=${filter.values.join(",")}` : "nofilter";

  return (
    <GeoJSON
      ref={geoJsonRef}
      key={`${layerId}-${filteredData.features.length}-${color}-${areaColorMapKey}-${selectionModeKey}-${filterKey}`}
      data={filteredData}
      style={style}
      onEachFeature={onEachFeature}
    />
  );
}
