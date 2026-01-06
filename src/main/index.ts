import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import shapefile from "shapefile";
import Store from "electron-store";
import type { AreaProject } from "./types/area";

// 保存するレイヤー状態の型
interface SavedLayerState {
  filePath: string;
  name: string;
  visible: boolean;
  color: string;
}

interface StoreSchema {
  savedLayers: SavedLayerState[];
  lastProjectPath: string | null;
}

// electron-store の初期化
const store = new Store<StoreSchema>({
  defaults: {
    savedLayers: [],
    lastProjectPath: null,
  },
});

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  // Open DevTools in development
  mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle("shapefile:open-dialog", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      { name: "Shapefile", extensions: ["shp"] },
      { name: "Zip Archive", extensions: ["zip"] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle("shapefile:load", async (_event, filePath: string) => {
  try {
    console.log(`[Shapefile] Loading: ${filePath}`);
    const basePath = filePath.replace(/\.shp$/i, "");
    const dbfPath = `${basePath}.dbf`;

    // Read shapefile with Shift_JIS encoding for Japanese
    const source = await shapefile.open(filePath, dbfPath, {
      encoding: "Shift_JIS",
    });

    const features: GeoJSON.Feature[] = [];

    let result = await source.read();
    let count = 0;
    while (!result.done) {
      features.push(result.value);
      result = await source.read();
      count++;
      // 進捗をログ出力 (100件ごと)
      if (count % 100 === 0) {
        console.log(`[Shapefile] Loaded ${count} features...`);
      }
    }

    console.log(`[Shapefile] Total features: ${features.length}`);

    const featureCollection: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features,
    };

    return featureCollection;
  } catch (error) {
    console.error("[Shapefile] Error loading:", error);
    throw error;
  }
});

// Area Project IPC Handlers
ipcMain.handle("area:new-project-dialog", async () => {
  const result = await dialog.showSaveDialog({
    title: "新規プロジェクトを作成",
    defaultPath: "project.json",
    filters: [{ name: "Area Project", extensions: ["json"] }],
  });

  if (result.canceled || !result.filePath) {
    return null;
  }

  return result.filePath;
});

ipcMain.handle("area:open-project-dialog", async () => {
  const result = await dialog.showOpenDialog({
    title: "プロジェクトを開く",
    properties: ["openFile"],
    filters: [{ name: "Area Project", extensions: ["json"] }],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle(
  "area:save-project",
  async (_event, filePath: string, project: AreaProject) => {
    try {
      console.log(`[Area] Saving project to: ${filePath}`);
      const content = JSON.stringify(project, null, 2);
      await fs.writeFile(filePath, content, "utf-8");
      console.log("[Area] Project saved successfully");
      return true;
    } catch (error) {
      console.error("[Area] Error saving project:", error);
      throw error;
    }
  }
);

ipcMain.handle("area:load-project", async (_event, filePath: string) => {
  try {
    console.log(`[Area] Loading project from: ${filePath}`);
    const content = await fs.readFile(filePath, "utf-8");
    const project: AreaProject = JSON.parse(content);
    console.log(`[Area] Project loaded: ${project.name}`);
    return project;
  } catch (error) {
    console.error("[Area] Error loading project:", error);
    throw error;
  }
});

// Layer State Persistence IPC Handlers
ipcMain.handle("layers:save-state", (_event, layers: SavedLayerState[]) => {
  console.log(`[Layers] Saving ${layers.length} layer states`);
  store.set("savedLayers", layers);
  return true;
});

ipcMain.handle("layers:load-state", () => {
  const savedLayers = store.get("savedLayers");
  console.log(`[Layers] Loaded ${savedLayers.length} saved layer states`);
  return savedLayers;
});

ipcMain.handle("layers:clear-state", () => {
  console.log("[Layers] Clearing saved layer states");
  store.set("savedLayers", []);
  return true;
});

// Project Path Persistence IPC Handlers
ipcMain.handle("project:save-path", (_event, projectPath: string | null) => {
  console.log(`[Project] Saving project path: ${projectPath}`);
  store.set("lastProjectPath", projectPath);
  return true;
});

ipcMain.handle("project:load-path", () => {
  const lastProjectPath = store.get("lastProjectPath");
  console.log(`[Project] Loaded project path: ${lastProjectPath}`);
  return lastProjectPath;
});

ipcMain.handle("project:clear-path", () => {
  console.log("[Project] Clearing saved project path");
  store.set("lastProjectPath", null);
  return true;
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
