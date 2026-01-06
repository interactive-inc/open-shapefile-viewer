import { contextBridge, ipcRenderer } from "electron";
import type { FeatureCollection } from "geojson";

interface AreaProject {
  version: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  areas: Array<{
    id: string;
    name: string;
    parentId: string | null;
    color: string;
    featureIds: string[];
  }>;
}

interface SavedLayerState {
  filePath: string;
  name: string;
  visible: boolean;
  color: string;
}

contextBridge.exposeInMainWorld("electronAPI", {
  // Shapefile APIs
  openShapefileDialog: (): Promise<string | null> =>
    ipcRenderer.invoke("shapefile:open-dialog"),

  loadShapefile: (filePath: string): Promise<FeatureCollection> =>
    ipcRenderer.invoke("shapefile:load", filePath),

  // Area Project APIs
  newProjectDialog: (): Promise<string | null> =>
    ipcRenderer.invoke("area:new-project-dialog"),

  openProjectDialog: (): Promise<string | null> =>
    ipcRenderer.invoke("area:open-project-dialog"),

  saveProject: (filePath: string, project: AreaProject): Promise<boolean> =>
    ipcRenderer.invoke("area:save-project", filePath, project),

  loadProject: (filePath: string): Promise<AreaProject> =>
    ipcRenderer.invoke("area:load-project", filePath),

  // Layer State Persistence APIs
  saveLayerState: (layers: SavedLayerState[]): Promise<boolean> =>
    ipcRenderer.invoke("layers:save-state", layers),

  loadLayerState: (): Promise<SavedLayerState[]> =>
    ipcRenderer.invoke("layers:load-state"),

  clearLayerState: (): Promise<boolean> =>
    ipcRenderer.invoke("layers:clear-state"),

  // Project Path Persistence APIs
  saveProjectPath: (projectPath: string | null): Promise<boolean> =>
    ipcRenderer.invoke("project:save-path", projectPath),

  loadProjectPath: (): Promise<string | null> =>
    ipcRenderer.invoke("project:load-path"),

  clearProjectPath: (): Promise<boolean> =>
    ipcRenderer.invoke("project:clear-path"),
});
