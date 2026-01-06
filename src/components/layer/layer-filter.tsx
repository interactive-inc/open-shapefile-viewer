import { useState } from "react";
import type { Layer, PropertyFilter } from "@/types/layer";
import { Button } from "@/components/ui/button";
import { PropertyMultiSelect } from "@/components/ui/property-multi-select";

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

  return (
    <div className="p-3 border rounded-lg bg-card space-y-3">
      <div className="text-sm font-medium">フィルター設定</div>

      <PropertyMultiSelect
        features={layer.geojson.features}
        selectedKey={selectedKey}
        selectedValues={selectedValues}
        onKeyChange={setSelectedKey}
        onValuesChange={setSelectedValues}
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
