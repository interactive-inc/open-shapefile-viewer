import { useState, useMemo, useCallback } from "react";
import type { Feature, Geometry, GeoJsonProperties } from "geojson";
import type { Layer } from "@/types/layer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PropertyMultiSelect } from "@/components/ui/property-multi-select";

interface FeatureSelectorProps {
  layers: Layer[];
  selectedAreaId: string | null;
  assignedFeatureIds: Set<string>;
  selectedAreaFeatureIds: Set<string> | undefined;
  onAddFeatures: (featureIds: string[]) => void;
  onRemoveFeatures: (featureIds: string[]) => void;
  getFilteredFeatures: (
    layer: Layer
  ) => Feature<Geometry | null, GeoJsonProperties>[];
}

/**
 * フィーチャーIDを生成
 */
function generateFeatureId(layerId: string, featureIndex: number): string {
  return `${layerId}:${featureIndex}`;
}

export function FeatureSelector({
  layers,
  selectedAreaId,
  assignedFeatureIds,
  selectedAreaFeatureIds,
  onAddFeatures,
  onRemoveFeatures,
  getFilteredFeatures,
}: FeatureSelectorProps) {
  const [selectedLayerId, setSelectedLayerId] = useState<string>("");
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [showOtherAreaAssigned, setShowOtherAreaAssigned] = useState<boolean>(false);

  const selectedLayer = useMemo(
    () => layers.find((l) => l.id === selectedLayerId),
    [layers, selectedLayerId]
  );

  // フィルター適用済みフィーチャーを取得
  const filteredFeatures = useMemo(
    () => (selectedLayer ? getFilteredFeatures(selectedLayer) : []),
    [selectedLayer, getFilteredFeatures]
  );

  // 元のfeaturesはID生成用に保持
  const allFeatures = useMemo(
    () => selectedLayer?.geojson.features ?? [],
    [selectedLayer]
  );

  // フィーチャーとIDのマッピング
  const featureIdMap = useMemo(() => {
    if (!selectedLayer) return new Map<Feature<Geometry | null, GeoJsonProperties>, string>();
    const map = new Map<Feature<Geometry | null, GeoJsonProperties>, string>();
    allFeatures.forEach((feature, index) => {
      map.set(feature, generateFeatureId(selectedLayer.id, index));
    });
    return map;
  }, [selectedLayer, allFeatures]);

  // 選択中エリアに属するフィーチャー (このレイヤーの)
  const selectedAreaFeaturesInLayer = useMemo(() => {
    if (!selectedLayer || !selectedAreaFeatureIds) return [];
    return filteredFeatures.filter((feature) => {
      const featureId = featureIdMap.get(feature);
      return featureId && selectedAreaFeatureIds.has(featureId);
    });
  }, [selectedLayer, filteredFeatures, featureIdMap, selectedAreaFeatureIds]);

  // 他のエリアに割り当て済みのフィーチャー (選択可能にしない)
  const otherAreaAssignedFeatures = useMemo(() => {
    if (!selectedLayer || !selectedAreaFeatureIds) return new Set<Feature<Geometry | null, GeoJsonProperties>>();
    const set = new Set<Feature<Geometry | null, GeoJsonProperties>>();
    filteredFeatures.forEach((feature) => {
      const featureId = featureIdMap.get(feature);
      if (featureId && assignedFeatureIds.has(featureId) && !selectedAreaFeatureIds.has(featureId)) {
        set.add(feature);
      }
    });
    return set;
  }, [selectedLayer, filteredFeatures, featureIdMap, assignedFeatureIds, selectedAreaFeatureIds]);

  // 表示用フィーチャー (他エリア割当済みを除外するかどうか)
  const displayFeatures = useMemo(() => {
    if (showOtherAreaAssigned) return filteredFeatures;
    return filteredFeatures.filter((f) => !otherAreaAssignedFeatures.has(f));
  }, [filteredFeatures, otherAreaAssignedFeatures, showOtherAreaAssigned]);

  // 選択中エリアに属するフィーチャーの値をSet化
  const selectedValues = useMemo(() => {
    if (!selectedKey) return new Set<string>();
    const values = new Set<string>();
    selectedAreaFeaturesInLayer.forEach((feature) => {
      const value = feature.properties?.[selectedKey];
      if (value !== null && value !== undefined) {
        values.add(String(value));
      }
    });
    return values;
  }, [selectedKey, selectedAreaFeaturesInLayer]);

  // フィルター適用状態
  const isFilterApplied = selectedLayer?.filter?.enabled ?? false;
  const totalCount = allFeatures.length;
  const filteredCount = filteredFeatures.length;

  // 値の変更ハンドラ (チェックのON/OFFで追加/削除)
  const handleValuesChange = useCallback(
    (newValues: Set<string>) => {
      if (!selectedLayer || !selectedKey) return;

      // 追加された値
      const addedValues = [...newValues].filter((v) => !selectedValues.has(v));
      // 削除された値
      const removedValues = [...selectedValues].filter((v) => !newValues.has(v));

      // 追加: その値を持つ未割当フィーチャーをエリアに追加
      if (addedValues.length > 0) {
        const featureIdsToAdd: string[] = [];
        filteredFeatures.forEach((feature) => {
          const featureId = featureIdMap.get(feature);
          if (!featureId) return;
          // 既に他のエリアに割り当て済みならスキップ
          if (assignedFeatureIds.has(featureId)) return;
          const value = feature.properties?.[selectedKey];
          if (value !== null && value !== undefined && addedValues.includes(String(value))) {
            featureIdsToAdd.push(featureId);
          }
        });
        if (featureIdsToAdd.length > 0) {
          onAddFeatures(featureIdsToAdd);
        }
      }

      // 削除: その値を持つ選択中エリアのフィーチャーを削除
      if (removedValues.length > 0) {
        const featureIdsToRemove: string[] = [];
        selectedAreaFeaturesInLayer.forEach((feature) => {
          const featureId = featureIdMap.get(feature);
          if (!featureId) return;
          const value = feature.properties?.[selectedKey];
          if (value !== null && value !== undefined && removedValues.includes(String(value))) {
            featureIdsToRemove.push(featureId);
          }
        });
        if (featureIdsToRemove.length > 0) {
          onRemoveFeatures(featureIdsToRemove);
        }
      }
    },
    [
      selectedLayer,
      selectedKey,
      selectedValues,
      filteredFeatures,
      featureIdMap,
      assignedFeatureIds,
      selectedAreaFeaturesInLayer,
      onAddFeatures,
      onRemoveFeatures,
    ]
  );

  const handleLayerChange = (layerId: string) => {
    setSelectedLayerId(layerId);
    setSelectedKey("");
  };

  const handleKeyChange = (key: string) => {
    setSelectedKey(key);
  };

  if (!selectedAreaId) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">属性フィルタ</CardTitle>
          <CardDescription>エリアを選択してください</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">属性フィルタ</CardTitle>
        <CardDescription>チェックでエリアに追加/削除</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Layer selector */}
        <div>
          <label className="text-xs text-muted-foreground">レイヤー</label>
          <select
            value={selectedLayerId}
            onChange={(e) => handleLayerChange(e.target.value)}
            className="w-full text-sm px-2 py-1 border rounded"
          >
            <option value="">選択してください</option>
            {layers.map((layer) => {
              const layerFilterActive = layer.filter?.enabled ?? false;
              const layerFiltered = layerFilterActive
                ? getFilteredFeatures(layer).length
                : layer.geojson.features.length;
              const layerTotal = layer.geojson.features.length;
              return (
                <option key={layer.id} value={layer.id}>
                  {layer.name}
                  {layerFilterActive && ` (${layerFiltered}/${layerTotal}件)`}
                </option>
              );
            })}
          </select>
          {isFilterApplied && (
            <p className="text-xs text-muted-foreground mt-1">
              フィルター適用中: {filteredCount}/{totalCount} 件
            </p>
          )}
        </div>

        {/* Property multi-select */}
        {selectedLayerId && (
          <>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="show-other-assigned"
                checked={showOtherAreaAssigned}
                onChange={(e) => setShowOtherAreaAssigned(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="show-other-assigned" className="text-xs text-muted-foreground cursor-pointer">
                他エリア割当済みも表示
              </label>
            </div>
            <PropertyMultiSelect
              features={displayFeatures}
              selectedKey={selectedKey}
              selectedValues={selectedValues}
              onKeyChange={handleKeyChange}
              onValuesChange={handleValuesChange}
              keyLabel="属性キー"
            />
            {selectedKey && (
              <p className="text-xs text-muted-foreground">
                選択中エリア: {selectedAreaFeaturesInLayer.length} 件
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
