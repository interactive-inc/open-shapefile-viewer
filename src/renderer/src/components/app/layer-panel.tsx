import { useState } from "react";
import type { Layer, PropertyFilter } from "@/types/layer";
import { LAYER_COLORS } from "@/types/layer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LayerFilter } from "@/components/layer/layer-filter";

interface LayerPanelProps {
  layers: Layer[];
  isLoading: boolean;
  onAddLayer: () => void;
  onRemoveLayer: (id: string) => void;
  onToggleLayer: (id: string) => void;
  onSetLayerColor: (id: string, color: string) => void;
  onSetLayerFilter: (id: string, filter: PropertyFilter | undefined) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onClearAll: () => void;
}

export function LayerPanel({
  layers,
  isLoading,
  onAddLayer,
  onRemoveLayer,
  onToggleLayer,
  onSetLayerColor,
  onSetLayerFilter,
  onMoveUp,
  onMoveDown,
  onClearAll,
}: LayerPanelProps) {
  const [filterOpenLayerId, setFilterOpenLayerId] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>レイヤー</CardTitle>
        <CardDescription>
          {layers.length} 件のレイヤー
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={onAddLayer}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "読み込み中..." : "レイヤーを追加"}
        </Button>

        {layers.length > 0 && (
          <Button
            onClick={onClearAll}
            variant="outline"
            className="w-full"
          >
            すべてクリア
          </Button>
        )}

        <div className="space-y-2 max-h-[400px] overflow-auto">
          {layers.map((layer, index) => (
            <div key={layer.id} className="space-y-2">
              <div className="flex items-center gap-2 p-2 border rounded-md bg-background">
                {/* Visibility toggle */}
                <button
                  type="button"
                  onClick={() => onToggleLayer(layer.id)}
                  className="w-5 h-5 flex items-center justify-center"
                  title={layer.visible ? "非表示" : "表示"}
                >
                  {layer.visible ? "👁" : "👁‍🗨"}
                </button>

                {/* Color picker */}
                <div className="relative">
                  <div
                    className="w-4 h-4 rounded border cursor-pointer"
                    style={{ backgroundColor: layer.color }}
                  />
                  <select
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    value={layer.color}
                    onChange={(e) => onSetLayerColor(layer.id, e.target.value)}
                  >
                    {LAYER_COLORS.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Layer name */}
                <span className="flex-1 text-sm truncate" title={layer.name}>
                  {layer.name}
                </span>

                {/* Feature count */}
                <span className="text-xs text-muted-foreground">
                  {layer.geojson.features.length}
                </span>

                {/* Filter button */}
                <button
                  type="button"
                  onClick={() =>
                    setFilterOpenLayerId(
                      filterOpenLayerId === layer.id ? null : layer.id
                    )
                  }
                  className={`text-xs px-1 ${
                    layer.filter?.enabled
                      ? "text-primary font-bold"
                      : "text-muted-foreground"
                  }`}
                  title="フィルター"
                >
                  {layer.filter?.enabled ? "🔍" : "🔽"}
                </button>

                {/* Move buttons */}
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => onMoveUp(index)}
                    disabled={index === 0}
                    className="text-xs px-1 disabled:opacity-30"
                    title="上へ"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveDown(index)}
                    disabled={index === layers.length - 1}
                    className="text-xs px-1 disabled:opacity-30"
                    title="下へ"
                  >
                    ↓
                  </button>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => onRemoveLayer(layer.id)}
                  className="text-xs text-destructive px-1"
                  title="削除"
                >
                  ✕
                </button>
              </div>

              {/* Filter indicator */}
              {layer.filter?.enabled && (
                <div className="ml-6 text-xs text-muted-foreground flex items-center gap-1">
                  <span className="truncate">
                    フィルター: {layer.filter.key} = {layer.filter.values.length === 1
                      ? `"${layer.filter.values[0]}"`
                      : `(${layer.filter.values.length}件)`}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSetLayerFilter(layer.id, undefined)}
                    className="text-destructive hover:underline flex-shrink-0"
                  >
                    解除
                  </button>
                </div>
              )}

              {/* Filter panel */}
              {filterOpenLayerId === layer.id && (
                <LayerFilter
                  layer={layer}
                  onSetFilter={(filter) => onSetLayerFilter(layer.id, filter)}
                  onClose={() => setFilterOpenLayerId(null)}
                />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
