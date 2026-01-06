import type { FeatureCollection } from "geojson";
import type { AreaProject } from "./area";
import type { PropertyFilter } from "./layer";

export interface SavedLayerState {
  filePath: string;
  name: string;
  visible: boolean;
  color: string;
  filter?: PropertyFilter;
}

declare global {
  interface Window {
    electronAPI: {
      // Shapefile APIs
      openShapefileDialog: () => Promise<string | null>;
      loadShapefile: (filePath: string) => Promise<FeatureCollection>;

      // Area Project APIs
      newProjectDialog: () => Promise<string | null>;
      openProjectDialog: () => Promise<string | null>;
      saveProject: (filePath: string, project: AreaProject) => Promise<boolean>;
      loadProject: (filePath: string) => Promise<AreaProject>;

      // Layer State Persistence APIs
      saveLayerState: (layers: SavedLayerState[]) => Promise<boolean>;
      loadLayerState: () => Promise<SavedLayerState[]>;
      clearLayerState: () => Promise<boolean>;

      // Project Path Persistence APIs
      saveProjectPath: (projectPath: string | null) => Promise<boolean>;
      loadProjectPath: () => Promise<string | null>;
      clearProjectPath: () => Promise<boolean>;
    };
  }
}
