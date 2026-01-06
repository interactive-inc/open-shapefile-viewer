/**
 * エリア定義
 */
export interface Area {
  id: string;
  name: string;
  parentId: string | null; // null = ルートエリア
  color: string;
  featureIds: string[]; // 所属するフィーチャーのID
}

/**
 * UI表示用のエリア (子エリアを含む)
 */
export interface AreaWithChildren extends Area {
  children: AreaWithChildren[];
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

/**
 * デフォルトのエリアカラー
 */
export const AREA_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
];

/**
 * 空のプロジェクトを作成
 */
export function createEmptyProject(name: string): AreaProject {
  const now = new Date().toISOString();
  return {
    version: "1.0.0",
    name,
    createdAt: now,
    updatedAt: now,
    areas: [],
  };
}

/**
 * フラットなエリア配列をツリー構造に変換
 */
export function buildAreaTree(areas: Area[]): AreaWithChildren[] {
  const areaMap = new Map<string, AreaWithChildren>();

  // まず全てのエリアをマップに追加
  for (const area of areas) {
    areaMap.set(area.id, { ...area, children: [] });
  }

  const roots: AreaWithChildren[] = [];

  // 親子関係を構築
  for (const area of areaMap.values()) {
    if (area.parentId === null) {
      roots.push(area);
    } else {
      const parent = areaMap.get(area.parentId);
      if (parent) {
        parent.children.push(area);
      } else {
        // 親が見つからない場合はルートに追加
        roots.push(area);
      }
    }
  }

  return roots;
}

/**
 * エリアIDを生成
 */
export function generateAreaId(): string {
  return `area-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
