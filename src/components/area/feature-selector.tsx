import { useState, useMemo } from "react";
import type { Layer } from "@/types/layer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FeatureSelectorProps {
  layers: Layer[];
  selectedAreaId: string | null;
  onAddFeatures: (featureIds: string[]) => void;
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
  onAddFeatures,
}: FeatureSelectorProps) {
  const [selectedLayerId, setSelectedLayerId] = useState<string>("");
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [selectedValue, setSelectedValue] = useState<string>("");

  // Get available property keys from selected layer
  const availableKeys = useMemo(() => {
    const layer = layers.find((l) => l.id === selectedLayerId);
    if (!layer || layer.geojson.features.length === 0) return [];

    const keysSet = new Set<string>();
    for (const feature of layer.geojson.features) {
      if (feature.properties) {
        for (const key of Object.keys(feature.properties)) {
          keysSet.add(key);
        }
      }
    }
    return Array.from(keysSet).sort();
  }, [layers, selectedLayerId]);

  // Get unique values for selected key
  const availableValues = useMemo(() => {
    const layer = layers.find((l) => l.id === selectedLayerId);
    if (!layer || !selectedKey) return [];

    const valuesSet = new Set<string>();
    for (const feature of layer.geojson.features) {
      if (feature.properties && selectedKey in feature.properties) {
        const value = feature.properties[selectedKey];
        if (value !== null && value !== undefined) {
          valuesSet.add(String(value));
        }
      }
    }
    return Array.from(valuesSet).sort();
  }, [layers, selectedLayerId, selectedKey]);

  // Get matching features
  const matchingFeatures = useMemo(() => {
    const layer = layers.find((l) => l.id === selectedLayerId);
    if (!layer || !selectedKey || !selectedValue) return [];

    return layer.geojson.features
      .map((feature, index) => ({
        feature,
        id: generateFeatureId(layer.id, index),
        index,
      }))
      .filter(({ feature }) => {
        if (!feature.properties) return false;
        const value = feature.properties[selectedKey];
        return String(value) === selectedValue;
      });
  }, [layers, selectedLayerId, selectedKey, selectedValue]);

  const handleAddAll = () => {
    if (matchingFeatures.length > 0) {
      onAddFeatures(matchingFeatures.map((f) => f.id));
    }
  };

  const handleLayerChange = (layerId: string) => {
    setSelectedLayerId(layerId);
    setSelectedKey("");
    setSelectedValue("");
  };

  const handleKeyChange = (key: string) => {
    setSelectedKey(key);
    setSelectedValue("");
  };

  if (!selectedAreaId) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">属性フィルタ</CardTitle>
          <CardDescription>
            エリアを選択してください
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">属性フィルタ</CardTitle>
        <CardDescription>
          属性値でフィーチャーを一括選択
        </CardDescription>
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
            {layers.map((layer) => (
              <option key={layer.id} value={layer.id}>
                {layer.name}
              </option>
            ))}
          </select>
        </div>

        {/* Property key selector */}
        {selectedLayerId && (
          <div>
            <label className="text-xs text-muted-foreground">属性キー</label>
            <select
              value={selectedKey}
              onChange={(e) => handleKeyChange(e.target.value)}
              className="w-full text-sm px-2 py-1 border rounded"
            >
              <option value="">選択してください</option>
              {availableKeys.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Property value selector */}
        {selectedKey && (
          <div>
            <label className="text-xs text-muted-foreground">属性値</label>
            <select
              value={selectedValue}
              onChange={(e) => setSelectedValue(e.target.value)}
              className="w-full text-sm px-2 py-1 border rounded"
            >
              <option value="">選択してください</option>
              {availableValues.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Results */}
        {selectedValue && (
          <div className="space-y-2">
            <p className="text-sm">
              {matchingFeatures.length} 件のフィーチャーがマッチ
            </p>
            <Button
              size="sm"
              onClick={handleAddAll}
              disabled={matchingFeatures.length === 0}
              className="w-full"
            >
              すべて追加
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
