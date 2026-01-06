import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "node:path";
import shapefile from "shapefile";

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
