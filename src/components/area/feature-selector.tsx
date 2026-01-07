import { useState, useMemo } from "react";
import type { Feature, Geometry, GeoJsonProperties } from "geojson";
import { generateFeatureId, type Layer } from "@/types/layer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PropertyMultiSelect } from "@/components/ui/property-multi-select";
import { filterFeaturesByProperty } from "@/lib/property-filter-utils";

interface FeatureSelectorProps {
  layers: Layer[];
  selectedAreaId: string | null;
  assignedFeatureIds: Set<string>;
  onAddFeatures: (featureIds: string[]) => void;
  getFilteredFeatures: (
    layer: Layer
  ) => Feature<Geometry | null, GeoJsonProperties>[];
}

export function FeatureSelector({
  layers,
  selectedAreaId,
  assignedFeatureIds,
  onAddFeatures,
  getFilteredFeatures,
}: FeatureSelectorProps) {
  const [selectedLayerId, setSelectedLayerId] = useState<string>("");
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set());

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

  // 割り当て済みを除外したフィーチャー (選択肢表示用)
  const unassignedFeatures = useMemo(() => {
    if (!selectedLayer) return [];
    return filteredFeatures.filter((feature) => {
      const index = allFeatures.findIndex((f) => f === feature);
      const featureId = generateFeatureId(selectedLayer.id, index);
      return !assignedFeatureIds.has(featureId);
    });
  }, [selectedLayer, filteredFeatures, allFeatures, assignedFeatureIds]);

  // フィルター適用状態
  const isFilterApplied = selectedLayer?.filter?.enabled ?? false;
  const totalCount = allFeatures.length;
  const filteredCount = filteredFeatures.length;
  const unassignedCount = unassignedFeatures.length;

  // Get matching features (already excludes assigned ones via unassignedFeatures)
  const matchingFeatures = useMemo(() => {
    if (!selectedLayer || !selectedKey || selectedValues.size === 0) {
      return [];
    }

    // 未割り当てフィーチャーから属性で絞り込み
    const matchedFeatures = filterFeaturesByProperty(
      unassignedFeatures,
      selectedKey,
      Array.from(selectedValues)
    );

    // 元のfeatures配列でのインデックスを取得してID生成
    return matchedFeatures.map((feature) => {
      const index = allFeatures.findIndex((f) => f === feature);
      return {
        feature,
        id: generateFeatureId(selectedLayer.id, index),
        index,
      };
    });
  }, [selectedLayer, unassignedFeatures, allFeatures, selectedKey, selectedValues]);

  const handleAddAll = () => {
    if (matchingFeatures.length > 0) {
      onAddFeatures(matchingFeatures.map((f) => f.id));
    }
  };

  const handleLayerChange = (layerId: string) => {
    setSelectedLayerId(layerId);
    setSelectedKey("");
    setSelectedValues(new Set());
  };

  const handleKeyChange = (key: string) => {
    setSelectedKey(key);
  };

  const handleValuesChange = (values: Set<string>) => {
    setSelectedValues(values);
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
        <CardDescription>属性値でフィーチャーを一括選択</CardDescription>
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
          <PropertyMultiSelect
            features={unassignedFeatures}
            selectedKey={selectedKey}
            selectedValues={selectedValues}
            onKeyChange={handleKeyChange}
            onValuesChange={handleValuesChange}
            keyLabel="属性キー"
          />
        )}

        {/* Results */}
        {selectedValues.size > 0 && (
          <div className="space-y-2">
            <p className="text-sm">
              {matchingFeatures.length} 件マッチ
              {unassignedCount > 0 && unassignedCount < filteredCount && (
                <span className="text-muted-foreground">
                  {" "}(未割当のみ表示)
                </span>
              )}
            </p>
            <Button
              size="sm"
              onClick={handleAddAll}
              disabled={matchingFeatures.length === 0}
              className="w-full"
            >
              {matchingFeatures.length > 0 ? `${matchingFeatures.length} 件を追加` : "追加可能なフィーチャーなし"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
