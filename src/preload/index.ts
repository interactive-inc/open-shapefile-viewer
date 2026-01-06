import { contextBridge, ipcRenderer } from "electron";
import type { FeatureCollection } from "geojson";

contextBridge.exposeInMainWorld("electronAPI", {
  openShapefileDialog: (): Promise<string | null> =>
    ipcRenderer.invoke("shapefile:open-dialog"),

  loadShapefile: (filePath: string): Promise<FeatureCollection> =>
    ipcRenderer.invoke("shapefile:load", filePath),
});
