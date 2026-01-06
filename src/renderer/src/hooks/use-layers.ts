import { useState, useCallback, useEffect, useRef } from "react";
import type { FeatureCollection } from "geojson";
import type { Layer, PropertyFilter } from "@/types/layer";
import { LAYER_COLORS } from "@/types/layer";
import type { SavedLayerState } from "@/types/electron.d";

interface UseLayersResult {
  layers: Layer[];
  isLoading: boolean;
  error: string | null;
  addLayer: () => Promise<void>;
  removeLayer: (id: string) => void;
  toggleLayer: (id: string) => void;
  setLayerColor: (id: string, color: string) => void;
  setLayerFilter: (id: string, filter: PropertyFilter | undefined) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  clearAll: () => void;
}

let layerIdCounter = 0;

export function useLayers(): UseLayersResult {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialized = useRef(false);
  const isRestoring = useRef(false);

  // 起動時に保存されたレイヤー状態を復元
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const restoreLayers = async () => {
      try {
        const savedLayers = await window.electronAPI.loadLayerState();
        if (savedLayers.length === 0) return;

        console.log(`[Layers] Restoring ${savedLayers.length} layers...`);
        isRestoring.current = true;
        setIsLoading(true);

        const restoredLayers: Layer[] = [];

        for (const saved of savedLayers) {
          try {
            const data = await window.electronAPI.loadShapefile(saved.filePath);
            const featureCollection: FeatureCollection = Array.isArray(data)
              ? data[0]
              : data;

            const layerId = `layer-${++layerIdCounter}`;
            restoredLayers.push({
              id: layerId,
              name: saved.name,
              filePath: saved.filePath,
              geojson: featureCollection,
              visible: saved.visible,
              color: saved.color,
              filter: saved.filter,
            });
            console.log(`[Layers] Restored: ${saved.name}`);
          } catch (e) {
            console.error(`[Layers] Failed to restore ${saved.filePath}:`, e);
          }
        }

        setLayers(restoredLayers);
      } catch (e) {
        console.error("[Layers] Failed to load saved state:", e);
      } finally {
        setIsLoading(false);
        isRestoring.current = false;
      }
    };

    restoreLayers();
  }, []);

  // レイヤー変更時に自動保存 (復元中は除く)
  useEffect(() => {
    if (isRestoring.current) return;
    if (!isInitialized.current) return;

    const savedState: SavedLayerState[] = layers.map((layer) => ({
      filePath: layer.filePath,
      name: layer.name,
      visible: layer.visible,
      color: layer.color,
      filter: layer.filter,
    }));

    window.electronAPI.saveLayerState(savedState);
  }, [layers]);

  const addLayer = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const filePath = await window.electronAPI.openShapefileDialog();
      if (!filePath) {
        setIsLoading(false);
        return;
      }

      const data = await window.electronAPI.loadShapefile(filePath);
      const featureCollection: FeatureCollection = Array.isArray(data)
        ? data[0]
        : data;

      const fileName = filePath.split("/").pop()?.replace(".shp", "") || "Layer";
      const layerId = `layer-${++layerIdCounter}`;

      const newLayer: Layer = {
        id: layerId,
        name: fileName,
        filePath,
        geojson: featureCollection,
        visible: true,
        color: LAYER_COLORS[layers.length % LAYER_COLORS.length],
      };

      setLayers((prev) => [...prev, newLayer]);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(message);
      console.error("Failed to load shapefile:", e);
    } finally {
      setIsLoading(false);
    }
  }, [layers.length]);

  const removeLayer = useCallback((id: string) => {
    setLayers((prev) => prev.filter((layer) => layer.id !== id));
  }, []);

  const toggleLayer = useCallback((id: string) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer
      )
    );
  }, []);

  const setLayerColor = useCallback((id: string, color: string) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === id ? { ...layer, color } : layer
      )
    );
  }, []);

  const setLayerFilter = useCallback(
    (id: string, filter: PropertyFilter | undefined) => {
      setLayers((prev) =>
        prev.map((layer) =>
          layer.id === id ? { ...layer, filter } : layer
        )
      );
    },
    []
  );

  const reorderLayers = useCallback((fromIndex: number, toIndex: number) => {
    setLayers((prev) => {
      const newLayers = [...prev];
      const [removed] = newLayers.splice(fromIndex, 1);
      newLayers.splice(toIndex, 0, removed);
      return newLayers;
    });
  }, []);

  const clearAll = useCallback(() => {
    setLayers([]);
    setError(null);
    window.electronAPI.clearLayerState();
  }, []);

  return {
    layers,
    isLoading,
    error,
    addLayer,
    removeLayer,
    toggleLayer,
    setLayerColor,
    setLayerFilter,
    reorderLayers,
    clearAll,
  };
}
