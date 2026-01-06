import * as shapefile from "shapefile";
import type { FeatureCollection } from "geojson";

/**
 * ブラウザでShapefileを解析してGeoJSONに変換
 * .shp と .dbf ファイルが必要
 */
export async function parseShapefileFromFiles(
  shpFile: File,
  dbfFile?: File
): Promise<FeatureCollection> {
  const shpBuffer = await shpFile.arrayBuffer();
  const dbfBuffer = dbfFile ? await dbfFile.arrayBuffer() : undefined;

  const features: GeoJSON.Feature[] = [];
  const source = await shapefile.open(shpBuffer, dbfBuffer, {
    encoding: "shift-jis",
  });

  let result = await source.read();
  while (!result.done) {
    if (result.value) {
      features.push(result.value);
    }
    result = await source.read();
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

/**
 * FileListからshpとdbfファイルを抽出
 */
export function extractShapefiles(
  files: FileList
): { shpFile: File; dbfFile?: File; name: string } | null {
  let shpFile: File | undefined;
  let dbfFile: File | undefined;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.name.toLowerCase().split(".").pop();
    if (ext === "shp") {
      shpFile = file;
    } else if (ext === "dbf") {
      dbfFile = file;
    }
  }

  if (!shpFile) {
    return null;
  }

  const name = shpFile.name.replace(/\.shp$/i, "");
  return { shpFile, dbfFile, name };
}
