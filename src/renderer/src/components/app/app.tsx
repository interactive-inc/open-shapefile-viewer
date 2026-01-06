import { useState } from "react";
import type { Feature } from "geojson";
import { useLayers } from "@/hooks/use-layers";
import { MapView } from "@/components/map/map-container";
import { GeoJSONLayer } from "@/components/map/geojson-layer";
import { FeatureInfoPanel } from "@/components/map/feature-info-panel";
import { LayerPanel } from "@/components/app/layer-panel";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export function App() {
  const {
    layers,
    isLoading,
    error,
    addLayer,
    removeLayer,
    toggleLayer,
    setLayerColor,
    reorderLayers,
    clearAll,
  } = useLayers();

  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  const handleFeatureClick = (feature: Feature) => {
    setSelectedFeature(feature);
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      reorderLayers(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < layers.length - 1) {
      reorderLayers(index, index + 1);
    }
  };

  const handleClearAll = () => {
    clearAll();
    setSelectedFeature(null);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-80 border-r flex flex-col gap-4 p-4 overflow-auto">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Shapefile Viewer</CardTitle>
          </CardHeader>
        </Card>

        <LayerPanel
          layers={layers}
          isLoading={isLoading}
          onAddLayer={addLayer}
          onRemoveLayer={removeLayer}
          onToggleLayer={toggleLayer}
          onSetLayerColor={setLayerColor}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onClearAll={handleClearAll}
        />

        {error && (
          <p className="text-xs text-destructive px-2">エラー: {error}</p>
        )}

        <FeatureInfoPanel feature={selectedFeature} />
      </aside>

      {/* Map */}
      <main className="flex-1">
        <MapView>
          {layers
            .filter((layer) => layer.visible)
            .map((layer, index) => (
              <GeoJSONLayer
                key={`${layer.id}-${layer.color}`}
                data={layer.geojson}
                color={layer.color}
                onFeatureClick={handleFeatureClick}
                selectedFeature={selectedFeature}
                fitBounds={index === 0 && layers.filter((l) => l.visible).length === 1}
              />
            ))}
        </MapView>
      </main>
    </div>
  );
}
