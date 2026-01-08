import { useState, useCallback, useMemo, useRef } from "react";
import type { Feature } from "geojson";
import { useLayers } from "@/hooks/use-layers";
import { useAreas } from "@/hooks/use-areas";
import { useMapStyle } from "@/hooks/use-map-style";
import { useResizableSidebar } from "@/hooks/use-resizable-sidebar";
import { MapView } from "@/components/map/map-view";
import { GeoJSONLayer } from "@/components/map/geojson-layer";
import { FeatureInfoPanel } from "@/components/map/feature-info-panel";
import { LayerPanel } from "@/components/app/layer-panel";
import { AreaPanel } from "@/components/app/area-panel";
import { PrefectureSelector } from "@/components/app/prefecture-selector";
import { FeatureSelector } from "@/components/area/feature-selector";
import { GlobalLayerFilter } from "@/components/layer/global-layer-filter";
import { Button } from "@/components/ui/button";

type TabType = "layers" | "areas";

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
    globalFilter,
    addLayerFromFiles,
    removeLayer,
    toggleLayer,
    setLayerColor,
    setLayerFilter,
    setGlobalFilter,
    reorderLayers,
    clearAll: clearAllLayers,
  } = useLayers();

  const {
    project,
    projectName,
    isDirty,
    areaTree,
    selectedAreaId,
    isLoading: isAreasLoading,
    error: areasError,
    areaColorMap,
    newProject,
    openProjectFromFile,
    downloadProject,
    closeProject,
    addArea,
    removeArea,
    updateArea,
    selectArea,
    addFeatureToArea,
    removeFeatureFromArea,
    addFeaturesToArea,
    getAreaById,
  } = useAreas();

  const { currentStyle, setStyle, allStyles } = useMapStyle();
  const { width: sidebarWidth, handleMouseDown: handleSidebarResize } = useResizableSidebar();

  const [activeTab, setActiveTab] = useState<TabType>("layers");
  const [selectedFeatureState, setSelectedFeatureState] =
    useState<SelectedFeatureState | null>(null);

  // File input refs
  const shapefileInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);

  // 選択中エリアに属するフィーチャーIDのSet
  const selectedAreaFeatureIds = useMemo(() => {
    if (!selectedAreaId) return undefined;
    const area = getAreaById(selectedAreaId);
    if (!area) return undefined;
    return new Set(area.featureIds);
  }, [selectedAreaId, getAreaById, project]);

  // レイヤーフィルター適用済みフィーチャーを取得
  const getFilteredFeatures = useCallback(
    (layer: (typeof layers)[number]) => {
      if (!layer.filter?.enabled) return layer.geojson.features;
      const { key, values } = layer.filter;
      return layer.geojson.features.filter((f) => {
        const value = f.properties?.[key];
        if (value === null || value === undefined) return false;
        return values.includes(String(value));
      });
    },
    []
  );

  // Shapefile file input handler
  const handleShapefileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        await addLayerFromFiles(files);
      }
      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [addLayerFromFiles]
  );

  // Project file input handler
  const handleProjectFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await openProjectFromFile(file);
      }
      e.target.value = "";
    },
    [openProjectFromFile]
  );

  // Trigger file inputs
  const handleAddLayer = useCallback(() => {
    shapefileInputRef.current?.click();
  }, []);

  const handleOpenProject = useCallback(() => {
    projectInputRef.current?.click();
  }, []);

  const handleFeatureClick = useCallback(
    (layerId: string) =>
      (feature: Feature, featureId: string, index: number) => {
        setSelectedFeatureState({ layerId, index, feature });

        if (activeTab === "areas" && selectedAreaId) {
          const selectedArea = getAreaById(selectedAreaId);
          if (selectedArea) {
            if (selectedArea.featureIds.includes(featureId)) {
              removeFeatureFromArea(selectedAreaId, featureId);
            } else {
              addFeatureToArea(selectedAreaId, featureId);
            }
          }
        }
      },
    [
      activeTab,
      selectedAreaId,
      addFeatureToArea,
      removeFeatureFromArea,
      getAreaById,
    ]
  );

  const handleAddFeatures = useCallback(
    (featureIds: string[]) => {
      if (selectedAreaId) {
        addFeaturesToArea(selectedAreaId, featureIds);
      }
    },
    [selectedAreaId, addFeaturesToArea]
  );

  const handleRemoveFeatures = useCallback(
    (featureIds: string[]) => {
      if (selectedAreaId) {
        for (const featureId of featureIds) {
          removeFeatureFromArea(selectedAreaId, featureId);
        }
      }
    },
    [selectedAreaId, removeFeatureFromArea]
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

  return (
    <div className="flex h-screen">
      {/* Hidden file inputs */}
      <input
        ref={shapefileInputRef}
        type="file"
        accept=".shp,.dbf,.shx"
        multiple
        onChange={handleShapefileChange}
        className="hidden"
      />
      <input
        ref={projectInputRef}
        type="file"
        accept=".json"
        onChange={handleProjectFileChange}
        className="hidden"
      />

      {/* Sidebar */}
      <aside
        className="border-r flex flex-col gap-4 p-4 overflow-auto relative"
        style={{ width: sidebarWidth }}
      >
        {/* Resize handle */}
        <div
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors"
          onMouseDown={handleSidebarResize}
        />
        {/* Prefecture selector */}
        <PrefectureSelector />

        {/* Map style selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">
            地図スタイル
          </label>
          <select
            value={currentStyle.id}
            onChange={(e) => setStyle(e.target.value as typeof currentStyle.id)}
            className="flex-1 text-sm border rounded px-2 py-1"
          >
            {allStyles.map((style) => (
              <option key={style.id} value={style.id}>
                {style.name}
              </option>
            ))}
          </select>
        </div>

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
          <>
            <LayerPanel
              layers={layers}
              isLoading={isLayersLoading}
              onAddLayer={handleAddLayer}
              onRemoveLayer={removeLayer}
              onToggleLayer={toggleLayer}
              onSetLayerColor={setLayerColor}
              onSetLayerFilter={setLayerFilter}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onClearAll={handleClearAll}
            />

            <GlobalLayerFilter
              layers={layers}
              globalFilter={globalFilter}
              onSetGlobalFilter={setGlobalFilter}
              getFilteredFeatures={getFilteredFeatures}
            />
          </>
        )}

        {/* Area panel */}
        {activeTab === "areas" && (
          <>
            <AreaPanel
              project={project}
              projectName={projectName}
              isDirty={isDirty}
              areaTree={areaTree}
              selectedAreaId={selectedAreaId}
              isLoading={isAreasLoading}
              onNewProject={newProject}
              onOpenProject={handleOpenProject}
              onDownloadProject={() => downloadProject(layers)}
              onCloseProject={closeProject}
              onAddArea={addArea}
              onRemoveArea={removeArea}
              onUpdateArea={updateArea}
              onSelectArea={selectArea}
            />

            <FeatureSelector
              layers={layers}
              selectedAreaId={selectedAreaId}
              assignedFeatureIds={new Set(areaColorMap.keys())}
              selectedAreaFeatureIds={selectedAreaFeatureIds}
              onAddFeatures={handleAddFeatures}
              onRemoveFeatures={handleRemoveFeatures}
              getFilteredFeatures={getFilteredFeatures}
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
        <MapView mapStyle={currentStyle}>
          {layers
            .filter((layer) => layer.visible)
            .slice()
            .reverse()
            .map((layer, _index, visibleLayers) => (
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
                areaSelectionMode={
                  activeTab === "areas" && selectedAreaId !== null
                }
                showSelectionHighlight={activeTab === "layers"}
                selectedAreaFeatureIds={selectedAreaFeatureIds}
                filter={layer.filter}
                globalFilter={globalFilter}
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
