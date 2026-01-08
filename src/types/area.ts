/**
 * エリア定義
 */
export interface Area {
  id: string;
  name: string;
  parentId: string | null; // null = ルートエリア
  color: string;
  featureIds: string[]; // 所属するフィーチャーのID
  featureNames?: Record<string, string>; // featureId -> 名称 (エクスポート時に生成)
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

// 後方互換性のため維持 (新規はcolor-palette.tsを使用)
export { POLYGON_PALETTE as AREA_COLORS } from "@/lib/color-palette";
// 新しい色取得関数
export { getNextAvailableColor } from "@/lib/color-palette";

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

/**
 * Area オブジェクトのバリデーション
 */
function isValidArea(data: unknown): data is Area {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === "string" &&
    typeof obj.name === "string" &&
    (obj.parentId === null || typeof obj.parentId === "string") &&
    typeof obj.color === "string" &&
    Array.isArray(obj.featureIds) &&
    obj.featureIds.every((id) => typeof id === "string")
  );
}

/**
 * AreaProject のバリデーション (JSON.parse後のデータ検証用)
 * @param data - パース済みの不明なデータ
 * @returns 有効なAreaProjectの場合true
 */
export function isValidAreaProject(data: unknown): data is AreaProject {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.version === "string" &&
    typeof obj.name === "string" &&
    typeof obj.createdAt === "string" &&
    typeof obj.updatedAt === "string" &&
    Array.isArray(obj.areas) &&
    obj.areas.every(isValidArea)
  );
}

/**
 * JSON文字列からAreaProjectを安全にパース
 * @param json - JSON文字列
 * @returns パース成功時はAreaProject、失敗時はnull
 */
export function parseAreaProject(json: string): AreaProject | null {
  try {
    const parsed: unknown = JSON.parse(json);
    if (isValidAreaProject(parsed)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
