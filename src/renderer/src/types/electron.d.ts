import type { FeatureCollection } from "geojson";

declare global {
  interface Window {
    electronAPI: {
      openShapefileDialog: () => Promise<string | null>;
      loadShapefile: (filePath: string) => Promise<FeatureCollection>;
    };
  }
}

export {};
