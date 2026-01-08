import {
  MapContainer as LeafletMapContainer,
  TileLayer,
  useMap,
} from "react-leaflet";
import { useEffect, type ReactNode } from "react";
import L from "leaflet";
import { usePrefecture } from "@/hooks/use-prefecture";
import type { MapStyleConfig } from "@/hooks/use-map-style";

interface MapViewProps {
  children?: ReactNode;
  mapStyle: MapStyleConfig;
}

// Canvas レンダラーを使用 (大量のフィーチャーに最適)
const canvasRenderer = L.canvas({ tolerance: 5 });

/**
 * 地図位置の同期コンポーネント
 */
function MapPositionSync() {
  const map = useMap();
  const { subscribeToChange } = usePrefecture();

  useEffect(() => {
    const unsubscribe = subscribeToChange((position) => {
      map.setView(position.center, position.zoom);
    });
    return unsubscribe;
  }, [map, subscribeToChange]);

  return null;
}

export function MapView({ children, mapStyle }: MapViewProps) {
  const { getInitialPosition } = usePrefecture();
  const initialPosition = getInitialPosition();

  return (
    <LeafletMapContainer
      center={initialPosition.center}
      zoom={initialPosition.zoom}
      className="h-full w-full"
      renderer={canvasRenderer}
      preferCanvas={true}
    >
      <TileLayer
        key={mapStyle.id}
        attribution={mapStyle.attribution}
        url={mapStyle.url}
        className={mapStyle.filter ? "map-tile-filtered" : undefined}
      />
      {/* CSSフィルターを適用するためのスタイル */}
      {mapStyle.filter && (
        <style>{`.map-tile-filtered { filter: ${mapStyle.filter}; }`}</style>
      )}
      <MapPositionSync />
      {children}
    </LeafletMapContainer>
  );
}
