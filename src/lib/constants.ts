/**
 * LocalStorage キー定数
 * アプリケーション全体で使用するlocalStorageキーを一元管理
 */
export const STORAGE_KEYS = {
  /** エリアプロジェクトの保存キー */
  PROJECT: "shapefile-viewer-project",
  /** レイヤー状態の保存キー */
  LAYERS: "shapefile-viewer-layers",
  /** 選択された都道府県の保存キー */
  PREFECTURE: "shapefile-viewer-prefecture",
} as const;
