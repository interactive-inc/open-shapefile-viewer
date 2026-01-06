import type { Layer } from "@/types/layer";
import { LAYER_COLORS } from "@/types/layer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface LayerPanelProps {
  layers: Layer[];
  isLoading: boolean;
  onAddLayer: () => void;
  onRemoveLayer: (id: string) => void;
  onToggleLayer: (id: string) => void;
  onSetLayerColor: (id: string, color: string) => void;
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
  onMoveUp,
  onMoveDown,
  onClearAll,
}: LayerPanelProps) {
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

        <div className="space-y-2 max-h-[300px] overflow-auto">
          {layers.map((layer, index) => (
            <div
              key={layer.id}
              className="flex items-center gap-2 p-2 border rounded-md bg-background"
            >
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
