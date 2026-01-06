/**
 * エリア定義 (メインプロセス用)
 */
export interface Area {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
  featureIds: string[];
}

/**
 * エリアプロジェクト (JSONファイル形式)
 */
export interface AreaProject {
  version: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  areas: Area[];
}
