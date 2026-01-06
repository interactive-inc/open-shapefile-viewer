import { MapContainer as LeafletMapContainer, TileLayer } from "react-leaflet";
import type { ReactNode } from "react";
import L from "leaflet";

interface MapViewProps {
  children?: ReactNode;
}

// 山形県の中心座標
const YAMAGATA_CENTER: [number, number] = [38.24, 140.34];
const DEFAULT_ZOOM = 9;

// Canvas レンダラーを使用 (大量のフィーチャーに最適)
const canvasRenderer = L.canvas({ tolerance: 5 });

export function MapView({ children }: MapViewProps) {
  return (
    <LeafletMapContainer
      center={YAMAGATA_CENTER}
      zoom={DEFAULT_ZOOM}
      className="h-full w-full"
      renderer={canvasRenderer}
      preferCanvas={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </LeafletMapContainer>
  );
}
