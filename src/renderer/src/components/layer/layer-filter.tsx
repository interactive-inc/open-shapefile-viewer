import { useState, useMemo } from "react";
import type { Layer, PropertyFilter } from "@/types/layer";
import { Button } from "@/components/ui/button";

interface LayerFilterProps {
  layer: Layer;
  onSetFilter: (filter: PropertyFilter | undefined) => void;
  onClose: () => void;
}

export function LayerFilter({ layer, onSetFilter, onClose }: LayerFilterProps) {
  const [selectedKey, setSelectedKey] = useState<string>(
    layer.filter?.key ?? ""
  );
  const [selectedValues, setSelectedValues] = useState<Set<string>>(
    new Set(layer.filter?.values ?? [])
  );

  // 利用可能なプロパティキーを取得
  const availableKeys = useMemo(() => {
    const keysSet = new Set<string>();
    for (const feature of layer.geojson.features) {
      if (feature.properties) {
        for (const key of Object.keys(feature.properties)) {
          keysSet.add(key);
        }
      }
    }
    return Array.from(keysSet).sort();
  }, [layer.geojson.features]);

  // 選択されたキーの値一覧を取得
  const availableValues = useMemo(() => {
    if (!selectedKey) return [];
    const valuesSet = new Set<string>();
    for (const feature of layer.geojson.features) {
      const value = feature.properties?.[selectedKey];
      if (value !== null && value !== undefined) {
        valuesSet.add(String(value));
      }
    }
    return Array.from(valuesSet).sort();
  }, [layer.geojson.features, selectedKey]);

  const handleApply = () => {
    if (!selectedKey || selectedValues.size === 0) return;
    onSetFilter({
      key: selectedKey,
      values: Array.from(selectedValues),
      enabled: true,
    });
    onClose();
  };

  const handleClear = () => {
    onSetFilter(undefined);
    setSelectedKey("");
    setSelectedValues(new Set());
    onClose();
  };

  const handleKeyChange = (key: string) => {
    setSelectedKey(key);
    setSelectedValues(new Set()); // キー変更時は値をリセット
  };

  const handleValueToggle = (value: string) => {
    setSelectedValues((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedValues(new Set(availableValues));
  };

  const handleDeselectAll = () => {
    setSelectedValues(new Set());
  };

  return (
    <div className="p-3 border rounded-lg bg-card space-y-3">
      <div className="text-sm font-medium">フィルター設定</div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">属性</label>
        <select
          className="w-full text-sm border rounded px-2 py-1"
          value={selectedKey}
          onChange={(e) => handleKeyChange(e.target.value)}
        >
          <option value="">選択してください</option>
          {availableKeys.map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </div>

      {selectedKey && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">
              値 (OR条件) - {selectedValues.size}/{availableValues.length}
            </label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-primary hover:underline"
              >
                全選択
              </button>
              <span className="text-xs text-muted-foreground">/</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-xs text-primary hover:underline"
              >
                全解除
              </button>
            </div>
          </div>
          <div className="max-h-40 overflow-auto border rounded p-2 space-y-1">
            {availableValues.map((value) => (
              <label
                key={value}
                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent rounded px-1"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.has(value)}
                  onChange={() => handleValueToggle(value)}
                  className="rounded"
                />
                <span className="truncate">{value}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleApply}
          disabled={!selectedKey || selectedValues.size === 0}
          className="flex-1"
        >
          適用
        </Button>
        <Button size="sm" variant="outline" onClick={handleClear}>
          クリア
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>
          閉じる
        </Button>
      </div>
    </div>
  );
}
