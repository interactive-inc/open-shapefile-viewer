import { useState, useMemo, useCallback } from "react";
import type { Feature, Geometry, GeoJsonProperties } from "geojson";
import type { Layer, PropertyFilter } from "@/types/layer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PropertyMultiSelect } from "@/components/ui/property-multi-select";
import { Button } from "@/components/ui/button";

interface GlobalLayerFilterProps {
  layers: Layer[];
  globalFilter: PropertyFilter | undefined;
  onSetGlobalFilter: (filter: PropertyFilter | undefined) => void;
  getFilteredFeatures: (
    layer: Layer
  ) => Feature<Geometry | null, GeoJsonProperties>[];
}

export function GlobalLayerFilter({
  layers,
  globalFilter,
  onSetGlobalFilter,
  getFilteredFeatures,
}: GlobalLayerFilterProps) {
  const [selectedLayerId, setSelectedLayerId] = useState<string>("");
  const [selectedKey, setSelectedKey] = useState<string>(
    globalFilter?.key ?? ""
  );
  const [selectedValues, setSelectedValues] = useState<Set<string>>(
    new Set(globalFilter?.values ?? [])
  );

  const selectedLayer = useMemo(
    () => layers.find((l) => l.id === selectedLayerId),
    [layers, selectedLayerId]
  );

  // 選択中レイヤーのフィルター適用済みフィーチャー
  const filteredFeatures = useMemo(
    () => (selectedLayer ? getFilteredFeatures(selectedLayer) : []),
    [selectedLayer, getFilteredFeatures]
  );

  // 全レイヤーの合計フィーチャー数
  const totalFeatureCount = useMemo(
    () => layers.reduce((sum, layer) => sum + layer.geojson.features.length, 0),
    [layers]
  );

  // グローバルフィルター適用後のフィーチャー数を計算
  const globalFilteredCount = useMemo(() => {
    if (!globalFilter?.enabled) return totalFeatureCount;
    let count = 0;
    for (const layer of layers) {
      const features = getFilteredFeatures(layer);
      count += features.filter((f) => {
        const value = f.properties?.[globalFilter.key];
        if (value === null || value === undefined) return false;
        return globalFilter.values.includes(String(value));
      }).length;
    }
    return count;
  }, [layers, globalFilter, getFilteredFeatures, totalFeatureCount]);

  const handleLayerChange = useCallback((layerId: string) => {
    setSelectedLayerId(layerId);
    setSelectedKey("");
    setSelectedValues(new Set());
  }, []);

  const handleKeyChange = useCallback((key: string) => {
    setSelectedKey(key);
    setSelectedValues(new Set());
  }, []);

  const handleApply = useCallback(() => {
    if (!selectedKey || selectedValues.size === 0) return;
    onSetGlobalFilter({
      key: selectedKey,
      values: Array.from(selectedValues),
      enabled: true,
    });
  }, [selectedKey, selectedValues, onSetGlobalFilter]);

  const handleClear = useCallback(() => {
    onSetGlobalFilter(undefined);
    setSelectedKey("");
    setSelectedValues(new Set());
  }, [onSetGlobalFilter]);

  if (layers.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">属性フィルタ (全レイヤー)</CardTitle>
        <CardDescription>
          {globalFilter?.enabled
            ? `${globalFilteredCount}/${totalFeatureCount} 件表示中`
            : "レイヤーを選択して属性でフィルタ"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 現在のフィルター表示 */}
        {globalFilter?.enabled && (
          <div className="p-2 bg-muted rounded text-xs flex items-center justify-between">
            <span className="truncate">
              {globalFilter.key} ={" "}
              {globalFilter.values.length === 1
                ? `"${globalFilter.values[0]}"`
                : `(${globalFilter.values.length}件)`}
            </span>
            <button
              type="button"
              onClick={handleClear}
              className="text-destructive hover:underline flex-shrink-0 ml-2"
            >
              解除
            </button>
          </div>
        )}

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
        </div>

        {/* Property multi-select */}
        {selectedLayerId && (
          <>
            <PropertyMultiSelect
              features={filteredFeatures}
              selectedKey={selectedKey}
              selectedValues={selectedValues}
              onKeyChange={handleKeyChange}
              onValuesChange={setSelectedValues}
              keyLabel="属性キー"
              valuesLabel="フィルタ値 (OR条件)"
            />

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleApply}
                disabled={!selectedKey || selectedValues.size === 0}
                className="flex-1"
              >
                適用
              </Button>
              {globalFilter?.enabled && (
                <Button size="sm" variant="outline" onClick={handleClear}>
                  クリア
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
