import { GeoJSON, useMap } from "react-leaflet";
import type { Feature, FeatureCollection, GeoJsonProperties } from "geojson";
import type { Layer, PathOptions } from "leaflet";
import { useEffect, useRef, useMemo, useCallback } from "react";

interface GeoJSONLayerProps {
  data: FeatureCollection;
  color: string;
  onFeatureClick: (feature: Feature) => void;
  selectedFeature: Feature | null;
  fitBounds?: boolean;
}

// フィーチャーを比較するためのユニークIDを取得
function getFeatureId(feature: Feature | null | undefined): string | null {
  if (!feature) return null;
  // id があればそれを使用、なければ最初のプロパティ値を使用
  if (feature.id !== undefined) return String(feature.id);
  if (feature.properties) {
    const firstKey = Object.keys(feature.properties)[0];
    if (firstKey) return `${firstKey}:${feature.properties[firstKey]}`;
  }
  return null;
}

export function GeoJSONLayer({
  data,
  color,
  onFeatureClick,
  selectedFeature,
  fitBounds = false,
}: GeoJSONLayerProps) {
  const map = useMap();
  const geoJsonRef = useRef<L.GeoJSON | null>(null);

  // 選択されたフィーチャーのIDをメモ化
  const selectedId = useMemo(() => getFeatureId(selectedFeature), [selectedFeature]);

  const defaultStyle: PathOptions = useMemo(() => ({
    color: color,
    weight: 2,
    fillOpacity: 0.3,
    fillColor: color,
  }), [color]);

  const selectedStyle: PathOptions = useMemo(() => ({
    color: "#ef4444",
    weight: 3,
    fillOpacity: 0.5,
    fillColor: "#ef4444",
  }), []);

  const hoverStyle: PathOptions = useMemo(() => ({
    color: color,
    weight: 3,
    fillOpacity: 0.5,
    fillColor: color,
  }), [color]);

  // Fit bounds when fitBounds is true
  useEffect(() => {
    if (fitBounds && geoJsonRef.current) {
      const bounds = geoJsonRef.current.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [data, map, fitBounds]);

  const style = useCallback((feature: Feature | undefined): PathOptions => {
    if (selectedId && feature && getFeatureId(feature) === selectedId) {
      return selectedStyle;
    }
    return defaultStyle;
  }, [selectedId, selectedStyle, defaultStyle]);

  const onEachFeature = useCallback((feature: Feature<GeoJsonProperties>, layer: Layer) => {
    const featureId = getFeatureId(feature);

    layer.on({
      click: () => {
        onFeatureClick(feature);
      },
      mouseover: (e) => {
        const target = e.target as L.Path;
        if (!selectedId || featureId !== selectedId) {
          target.setStyle(hoverStyle);
        }
      },
      mouseout: (e) => {
        const target = e.target as L.Path;
        if (!selectedId || featureId !== selectedId) {
          target.setStyle(defaultStyle);
        }
      },
    });
  }, [selectedId, hoverStyle, defaultStyle, onFeatureClick]);

  // データが空の場合は何も描画しない
  if (!data || !data.features || data.features.length === 0) {
    return null;
  }

  return (
    <GeoJSON
      ref={geoJsonRef}
      key={`${data.features.length}-${color}`}
      data={data}
      style={style}
      onEachFeature={onEachFeature}
    />
  );
}
