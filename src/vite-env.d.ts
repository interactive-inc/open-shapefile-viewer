/// <reference types="vite/client" />

// CSS modules
declare module "*.css" {
  const content: string;
  export default content;
}

// Shapefile library
declare module "shapefile" {
  import type { Feature, Geometry, GeoJsonProperties } from "geojson";

  interface ShapefileOptions {
    encoding?: string;
  }

  interface ShapefileSource {
    read(): Promise<{
      done: boolean;
      value?: Feature<Geometry, GeoJsonProperties>;
    }>;
  }

  export function open(
    shp: ArrayBuffer | string,
    dbf?: ArrayBuffer | string,
    options?: ShapefileOptions
  ): Promise<ShapefileSource>;
}
