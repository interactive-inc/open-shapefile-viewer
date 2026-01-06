import { useState, useCallback } from "react";
import type { FeatureCollection } from "geojson";
import type { Layer } from "@/types/layer";
import { LAYER_COLORS } from "@/types/layer";

interface UseLayersResult {
  layers: Layer[];
  isLoading: boolean;
  error: string | null;
  addLayer: () => Promise<void>;
  removeLayer: (id: string) => void;
  toggleLayer: (id: string) => void;
  setLayerColor: (id: string, color: string) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  clearAll: () => void;
}

let layerIdCounter = 0;

export function useLayers(): UseLayersResult {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  }, []);

  return {
    layers,
    isLoading,
    error,
    addLayer,
    removeLayer,
    toggleLayer,
    setLayerColor,
    reorderLayers,
    clearAll,
  };
}
