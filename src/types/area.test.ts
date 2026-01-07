import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import type { Area } from "./area";
import { createEmptyProject, buildAreaTree, generateAreaId } from "./area";

describe("createEmptyProject", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T10:30:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("プロジェクト名でプロジェクトを作成する", () => {
    // Act
    const result = createEmptyProject("Test Project");

    // Assert
    expect(result.name).toBe("Test Project");
  });

  it("バージョンを1.0.0に設定する", () => {
    // Act
    const result = createEmptyProject("Test");

    // Assert
    expect(result.version).toBe("1.0.0");
  });

  it("作成日時と更新日時を設定する", () => {
    // Act
    const result = createEmptyProject("Test");

    // Assert
    expect(result.createdAt).toBe("2024-01-15T10:30:00.000Z");
    expect(result.updatedAt).toBe("2024-01-15T10:30:00.000Z");
  });

  it("空のエリア配列を持つ", () => {
    // Act
    const result = createEmptyProject("Test");

    // Assert
    expect(result.areas).toEqual([]);
  });

  it("全てのAreaProject型フィールドを持つ", () => {
    // Act
    const result = createEmptyProject("Test");

    // Assert
    expect(result).toHaveProperty("version");
    expect(result).toHaveProperty("name");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("updatedAt");
    expect(result).toHaveProperty("areas");
  });
});

describe("buildAreaTree", () => {
  // Test data factory
  function createArea(
    id: string,
    name: string,
    parentId: string | null = null
  ): Area {
    return {
      id,
      name,
      parentId,
      color: "#ff0000",
      featureIds: [],
    };
  }

  it("空の配列から空のツリーを返す", () => {
    // Act
    const result = buildAreaTree([]);

    // Assert
    expect(result).toEqual([]);
  });

  it("単一のルートエリアをツリーに変換する", () => {
    // Arrange
    const areas = [createArea("1", "Root")];

    // Act
    const result = buildAreaTree(areas);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
    expect(result[0].name).toBe("Root");
    expect(result[0].children).toEqual([]);
  });

  it("複数のルートエリアを処理する", () => {
    // Arrange
    const areas = [createArea("1", "Root1"), createArea("2", "Root2")];

    // Act
    const result = buildAreaTree(areas);

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("1");
    expect(result[1].id).toBe("2");
  });

  it("親子関係を構築する", () => {
    // Arrange
    const areas = [
      createArea("1", "Parent"),
      createArea("2", "Child", "1"),
    ];

    // Act
    const result = buildAreaTree(areas);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children[0].id).toBe("2");
  });

  it("複数階層のツリーを構築する", () => {
    // Arrange
    const areas = [
      createArea("1", "Grandparent"),
      createArea("2", "Parent", "1"),
      createArea("3", "Child", "2"),
    ];

    // Act
    const result = buildAreaTree(areas);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children[0].children).toHaveLength(1);
    expect(result[0].children[0].children[0].id).toBe("3");
  });

  it("同じ親を持つ複数の子を処理する", () => {
    // Arrange
    const areas = [
      createArea("1", "Parent"),
      createArea("2", "Child1", "1"),
      createArea("3", "Child2", "1"),
    ];

    // Act
    const result = buildAreaTree(areas);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].children).toHaveLength(2);
  });

  it("存在しない親を持つエリアをルートに追加する", () => {
    // Arrange
    const areas = [createArea("1", "Orphan", "nonexistent")];

    // Act
    const result = buildAreaTree(areas);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("エリアのプロパティを保持する", () => {
    // Arrange
    const area: Area = {
      id: "1",
      name: "Test",
      parentId: null,
      color: "#abcdef",
      featureIds: ["f1", "f2"],
    };
    const areas = [area];

    // Act
    const result = buildAreaTree(areas);

    // Assert
    expect(result[0].color).toBe("#abcdef");
    expect(result[0].featureIds).toEqual(["f1", "f2"]);
  });

  it("混在したルートと子を正しく分類する", () => {
    // Arrange
    const areas = [
      createArea("1", "Root1"),
      createArea("2", "Child of 1", "1"),
      createArea("3", "Root2"),
      createArea("4", "Child of 3", "3"),
    ];

    // Act
    const result = buildAreaTree(areas);

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].children).toHaveLength(1);
    expect(result[1].children).toHaveLength(1);
  });
});

describe("generateAreaId", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("area-プレフィックスで始まる", () => {
    // Arrange
    vi.setSystemTime(1705312200000);

    // Act
    const result = generateAreaId();

    // Assert
    expect(result).toMatch(/^area-/);
  });

  it("タイムスタンプを含む", () => {
    // Arrange
    const timestamp = 1705312200000;
    vi.setSystemTime(timestamp);

    // Act
    const result = generateAreaId();

    // Assert
    expect(result).toContain(timestamp.toString());
  });

  it("ランダム部分を含む", () => {
    // Arrange
    vi.setSystemTime(1705312200000);

    // Act
    const result = generateAreaId();

    // Assert
    // area-{timestamp}-{random} 形式
    const parts = result.split("-");
    expect(parts.length).toBeGreaterThanOrEqual(3);
  });

  it("連続呼び出しで異なるIDを生成する", () => {
    // Arrange
    vi.useRealTimers(); // 実際のタイマーを使用してランダム性を確保

    // Act
    const id1 = generateAreaId();
    const id2 = generateAreaId();

    // Assert
    expect(id1).not.toBe(id2);
  });

  it("有効な文字列形式のIDを生成する", () => {
    // Act
    const result = generateAreaId();

    // Assert
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
    // 有効な文字のみ(英数字とハイフン)
    expect(result).toMatch(/^[a-z0-9-]+$/);
  });
});
