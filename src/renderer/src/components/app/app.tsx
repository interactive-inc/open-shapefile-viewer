import { useState, useCallback, useMemo } from "react";
import type { Feature } from "geojson";
import { useLayers } from "@/hooks/use-layers";
import { useAreas } from "@/hooks/use-areas";
import { MapView } from "@/components/map/map-container";
import { GeoJSONLayer } from "@/components/map/geojson-layer";
import { FeatureInfoPanel } from "@/components/map/feature-info-panel";
import { LayerPanel } from "@/components/app/layer-panel";
import { AreaPanel } from "@/components/app/area-panel";
import { FeatureSelector } from "@/components/area/feature-selector";
import { Button } from "@/components/ui/button";

type TabType = "layers" | "areas";

// 選択されたフィーチャーの状態
interface SelectedFeatureState {
  layerId: string;
  index: number;
  feature: Feature;
}

export function App() {
  const {
    layers,
    isLoading: isLayersLoading,
    error: layersError,
    addLayer,
    removeLayer,
    toggleLayer,
    setLayerColor,
    setLayerFilter,
    reorderLayers,
    clearAll: clearAllLayers,
  } = useLayers();

  const {
    project,
    projectPath,
    isDirty,
    areaTree,
    selectedAreaId,
    isLoading: isAreasLoading,
    error: areasError,
    areaColorMap,
    newProject,
    openProject,
    saveProject,
    addArea,
    removeArea,
    updateArea,
    selectArea,
    addFeatureToArea,
    removeFeatureFromArea,
    addFeaturesToArea,
    getAreaById,
  } = useAreas();

  const [activeTab, setActiveTab] = useState<TabType>("layers");
  const [selectedFeatureState, setSelectedFeatureState] = useState<SelectedFeatureState | null>(null);

  // 選択中エリアに属するフィーチャーIDのSet
  const selectedAreaFeatureIds = useMemo(() => {
    if (!selectedAreaId) return undefined;
    const area = getAreaById(selectedAreaId);
    if (!area) return undefined;
    return new Set(area.featureIds);
  }, [selectedAreaId, getAreaById, project]);

  const handleFeatureClick = useCallback(
    (layerId: string) => (feature: Feature, featureId: string, index: number) => {
      setSelectedFeatureState({ layerId, index, feature });

      // エリア選択モードの場合
      if (activeTab === "areas" && selectedAreaId) {
        const selectedArea = getAreaById(selectedAreaId);
        if (selectedArea) {
          // 選択中エリアに既に含まれている場合は削除、そうでなければ追加
          if (selectedArea.featureIds.includes(featureId)) {
            removeFeatureFromArea(selectedAreaId, featureId);
          } else {
            addFeatureToArea(selectedAreaId, featureId);
          }
        }
      }
    },
    [activeTab, selectedAreaId, addFeatureToArea, removeFeatureFromArea, getAreaById]
  );

  const handleAddFeatures = useCallback(
    (featureIds: string[]) => {
      if (selectedAreaId) {
        addFeaturesToArea(selectedAreaId, featureIds);
      }
    },
    [selectedAreaId, addFeaturesToArea]
  );

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
    clearAllLayers();
    setSelectedFeatureState(null);
  };

  const error = layersError || areasError;
  const isLoading = isLayersLoading || isAreasLoading;

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-80 border-r flex flex-col gap-4 p-4 overflow-auto">
        {/* Tab buttons */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <Button
            variant={activeTab === "layers" ? "default" : "ghost"}
            size="sm"
            className="flex-1"
            onClick={() => setActiveTab("layers")}
          >
            レイヤー
          </Button>
          <Button
            variant={activeTab === "areas" ? "default" : "ghost"}
            size="sm"
            className="flex-1"
            onClick={() => setActiveTab("areas")}
          >
            エリア
          </Button>
        </div>

        {/* Layer panel */}
        {activeTab === "layers" && (
          <LayerPanel
            layers={layers}
            isLoading={isLayersLoading}
            onAddLayer={addLayer}
            onRemoveLayer={removeLayer}
            onToggleLayer={toggleLayer}
            onSetLayerColor={setLayerColor}
            onSetLayerFilter={setLayerFilter}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onClearAll={handleClearAll}
          />
        )}

        {/* Area panel */}
        {activeTab === "areas" && (
          <>
            <AreaPanel
              project={project}
              projectPath={projectPath}
              isDirty={isDirty}
              areaTree={areaTree}
              selectedAreaId={selectedAreaId}
              isLoading={isAreasLoading}
              onNewProject={newProject}
              onOpenProject={openProject}
              onSaveProject={saveProject}
              onAddArea={addArea}
              onRemoveArea={removeArea}
              onUpdateArea={updateArea}
              onSelectArea={selectArea}
            />

            <FeatureSelector
              layers={layers}
              selectedAreaId={selectedAreaId}
              onAddFeatures={handleAddFeatures}
            />
          </>
        )}

        {error && (
          <p className="text-xs text-destructive px-2">エラー: {error}</p>
        )}

        <FeatureInfoPanel feature={selectedFeatureState?.feature ?? null} />
      </aside>

      {/* Map */}
      <main className="flex-1 relative">
        <MapView>
          {layers
            .filter((layer) => layer.visible)
            .slice()
            .reverse()
            .map((layer, index, visibleLayers) => (
              <GeoJSONLayer
                key={`${layer.id}-${layer.color}`}
                layerId={layer.id}
                data={layer.geojson}
                color={layer.color}
                onFeatureClick={handleFeatureClick(layer.id)}
                selectedFeatureIndex={
                  selectedFeatureState?.layerId === layer.id
                    ? selectedFeatureState.index
                    : null
                }
                fitBounds={visibleLayers.length === 1}
                areaColorMap={project ? areaColorMap : undefined}
                areaSelectionMode={activeTab === "areas" && selectedAreaId !== null}
                showSelectionHighlight={activeTab === "layers"}
                selectedAreaFeatureIds={selectedAreaFeatureIds}
                filter={layer.filter}
              />
            ))}
        </MapView>

        {/* Selection mode indicator */}
        {activeTab === "areas" && selectedAreaId && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg text-sm">
            クリックで追加/削除
          </div>
        )}
      </main>
    </div>
  );
}
