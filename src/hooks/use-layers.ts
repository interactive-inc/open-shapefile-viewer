import { useState, useCallback, useEffect, useRef } from "react";
import type { Layer, PropertyFilter, SavedLayerState } from "@/types/layer";
import { LAYER_COLORS } from "@/types/layer";
import {
  parseShapefileFromFiles,
  extractShapefiles,
} from "@/lib/shapefile-parser";
import { STORAGE_KEYS } from "@/lib/constants";
import { layerLogger, shapefileLogger } from "@/lib/logger";

interface UseLayersResult {
  layers: Layer[];
  isLoading: boolean;
  error: string | null;
  addLayerFromFiles: (files: FileList) => Promise<void>;
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

  // 起動時にlocalStorageから設定を復元 (GeoJSONは復元しない)
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LAYERS);
      if (saved) {
        layerLogger.log("Found saved layer settings (GeoJSON needs re-upload)");
      }
    } catch (e) {
      layerLogger.error("Failed to load saved state:", e);
    }
  }, []);

  // レイヤー変更時に設定を自動保存 (GeoJSONは除く)
  useEffect(() => {
    if (!isInitialized.current) return;

    const savedState: SavedLayerState[] = layers.map((layer) => ({
      name: layer.name,
      visible: layer.visible,
      color: layer.color,
      filter: layer.filter,
    }));

    try {
      localStorage.setItem(STORAGE_KEYS.LAYERS, JSON.stringify(savedState));
    } catch (e) {
      layerLogger.error("Failed to save layer state:", e);
    }
  }, [layers]);

  const addLayerFromFiles = useCallback(
    async (files: FileList) => {
      setIsLoading(true);
      setError(null);

      try {
        const extracted = extractShapefiles(files);
        if (!extracted) {
          throw new Error("Shapefileが見つかりません (.shp ファイルを選択してください)");
        }

        const { shpFile, dbfFile, name } = extracted;
        const geojson = await parseShapefileFromFiles(shpFile, dbfFile);

        shapefileLogger.log(`Loaded: ${name} (${geojson.features.length} features)`);

        const layerId = `layer-${++layerIdCounter}`;
        const newLayer: Layer = {
          id: layerId,
          name,
          geojson,
          visible: true,
          color: LAYER_COLORS[layers.length % LAYER_COLORS.length],
        };

        setLayers((prev) => [...prev, newLayer]);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        setError(message);
        shapefileLogger.error("Failed to load shapefile:", e);
      } finally {
        setIsLoading(false);
      }
    },
    [layers.length]
  );

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
      prev.map((layer) => (layer.id === id ? { ...layer, color } : layer))
    );
  }, []);

  const setLayerFilter = useCallback(
    (id: string, filter: PropertyFilter | undefined) => {
      setLayers((prev) =>
        prev.map((layer) => (layer.id === id ? { ...layer, filter } : layer))
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
    try {
      localStorage.removeItem(STORAGE_KEYS.LAYERS);
    } catch (e) {
      layerLogger.error("Failed to clear storage:", e);
    }
  }, []);

  return {
    layers,
    isLoading,
    error,
    addLayerFromFiles,
    removeLayer,
    toggleLayer,
    setLayerColor,
    setLayerFilter,
    reorderLayers,
    clearAll,
  };
}
