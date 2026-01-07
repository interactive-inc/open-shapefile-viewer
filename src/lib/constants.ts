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

/**
 * アプリケーション設定定数
 */
export const APP_CONFIG = {
  /** 地図のデフォルト中心座標 (日本) */
  DEFAULT_CENTER: [36.5, 138.0] as const,
  /** 地図のデフォルトズームレベル */
  DEFAULT_ZOOM: 5,
} as const;
