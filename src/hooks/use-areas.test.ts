import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAreas } from "./use-areas";

describe("useAreas", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T10:30:00.000Z"));
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("初期状態", () => {
    it("プロジェクトがnullで開始する", () => {
      // Act
      const { result } = renderHook(() => useAreas());

      // Assert
      expect(result.current.project).toBeNull();
    });

    it("isDirtyがfalseで開始する", () => {
      // Act
      const { result } = renderHook(() => useAreas());

      // Assert
      expect(result.current.isDirty).toBe(false);
    });

    it("selectedAreaIdがnullで開始する", () => {
      // Act
      const { result } = renderHook(() => useAreas());

      // Assert
      expect(result.current.selectedAreaId).toBeNull();
    });

    it("空のareas配列で開始する", () => {
      // Act
      const { result } = renderHook(() => useAreas());

      // Assert
      expect(result.current.areas).toEqual([]);
    });
  });

  describe("newProject", () => {
    it("新しいプロジェクトを作成する", () => {
      // Arrange
      const { result } = renderHook(() => useAreas());

      // Act
      act(() => {
        result.current.newProject("Test Project");
      });

      // Assert
      expect(result.current.project).not.toBeNull();
      expect(result.current.projectName).toBe("Test Project");
    });

    it("isDirtyをfalseにリセットする", () => {
      // Arrange
      const { result } = renderHook(() => useAreas());

      // Act
      act(() => {
        result.current.newProject("Test");
      });

      // Assert
      expect(result.current.isDirty).toBe(false);
    });

    it("selectedAreaIdをnullにリセットする", () => {
      // Arrange
      const { result } = renderHook(() => useAreas());

      // Act
      act(() => {
        result.current.newProject("Test");
        result.current.addArea("Area");
      });
      const areaId = result.current.areas[0]?.id;
      act(() => {
        if (areaId) result.current.selectArea(areaId);
      });
      act(() => {
        result.current.newProject("New Project");
      });

      // Assert
      expect(result.current.selectedAreaId).toBeNull();
    });
  });

  describe("addArea", () => {
    it("新しいエリアを追加する", () => {
      // Arrange
      const { result } = renderHook(() => useAreas());
      act(() => {
        result.current.newProject("Test");
      });

      // Act
      act(() => {
        result.current.addArea("New Area");
      });

      // Assert
      expect(result.current.areas).toHaveLength(1);
      expect(result.current.areas[0].name).toBe("New Area");
    });

    it("エリアに色を割り当てる", () => {
      // Arrange
      const { result } = renderHook(() => useAreas());
      act(() => {
        result.current.newProject("Test");
      });

      // Act
      act(() => {
        result.current.addArea("Area");
      });

      // Assert
      expect(result.current.areas[0].color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it("親エリアを指定して子エリアを追加する", () => {
      // Arrange
      const { result } = renderHook(() => useAreas());
      act(() => {
        result.current.newProject("Test");
      });
      act(() => {
        result.current.addArea("Parent");
      });

      // Act
      act(() => {
        const parentId = result.current.areas[0].id;
        result.current.addArea("Child", parentId);
      });

      // Assert
      const childArea = result.current.areas.find((a) => a.name === "Child");
      const parentArea = result.current.areas.find((a) => a.name === "Parent");
      expect(childArea?.parentId).toBe(parentArea?.id);
    });

    it("isDirtyをtrueに設定する", () => {
      // Arrange
      const { result } = renderHook(() => useAreas());
      act(() => {
        result.current.newProject("Test");
      });

      // Act
      act(() => {
        result.current.addArea("Area");
      });

      // Assert
      expect(result.current.isDirty).toBe(true);
    });

    it("プロジェクトがない場合は何もしない", () => {
      // Arrange
      const { result } = renderHook(() => useAreas());

      // Act
      act(() => {
        result.current.addArea("Area");
      });

      // Assert
      expect(result.current.areas).toHaveLength(0);
    });
  });

  describe("removeArea", () => {
    it("エリアを削除する", () => {
      // Arrange
      const { result } = renderHook(() => useAreas());
      act(() => {
        result.current.newProject("Test");
      });
      act(() => {
        result.current.addArea("Area");
      });

      // Act
      act(() => {
        const areaId = result.current.areas[0].id;
        result.current.removeArea(areaId);
      });

      // Assert
      expect(result.current.areas).toHaveLength(0);
    });

    it("子エリアも一緒に削除する", () => {
      // Arrange
      const { result } = renderHook(() => useAreas());
      act(() => {
        result.current.newProject("Test");
      });
      act(() => {
        result.current.addArea("Parent");
      });
      act(() => {
        const parentId = result.current.areas[0].id;
        result.current.addArea("Child", parentId);
      });

      // Act
      act(() => {
        const parentId = result.current.areas[0].id;
        result.current.removeArea(parentId);
      });

      // Assert
      expect(result.current.areas).toHaveLength(0);
    });

    it("選択中のエリアを削除するとselectedAreaIdがnullになる", () => {
      // Arrange
      const { result } = renderHook(() => useAreas());
      act(() => {
        result.current.newProject("Test");
      });
      act(() => {
        result.current.addArea("Area");
      });
      act(() => {
        const areaId = result.current.areas[0].id;
        result.current.selectArea(areaId);
      });

      // Act
      act(() => {
        const areaId = result.current.areas[0].id;
        result.current.removeArea(areaId);
      });

      // Assert
      expect(result.current.selectedAreaId).toBeNull();
    });
  });

  describe("updateArea", () => {
    it("エリアの名前を更新する", () => {
      // Arrange
      const { result } = renderHook(() => useAreas());
      act(() => {
        result.current.newProject("Test");
      });
      act(() => {
        result.current.addArea("Original");
      });

      // Act
      act(() => {
        const areaId = result.current.areas[0].id;
        result.current.updateArea(areaId, { name: "Updated" });
      });

      // Assert
      expect(result.current.areas[0].name).toBe("Updated");
    });

    it("エリアの色を更新する", () => {
      // Arrange
      const { result } = renderHook(() => useAreas());
      act(() => {
        result.current.newProject("Test");
      });
      act(() => {
        result.current.addArea("Area");
      });

      // Act
      act(() => {
        const areaId = result.current.areas[0].id;
        result.current.updateArea(areaId, { color: "#123456" });
      });

      // Assert
      expect(result.current.areas[0].color).toBe("#123456");
    });
  });

  describe("selectArea", () => {
    it("エリアを選択する", () => {
      // Arrange
      const { result } = renderHook(() => useAreas());
      act(() => {
        result.current.newProject("Test");
      });
      act(() => {
        result.current.addArea("Area");
      });

      // Act
      act(() => {
        const areaId = result.current.areas[0].id;
        result.current.selectArea(areaId);
      });

      // Assert
      expect(result.current.selectedAreaId).toBe(result.current.areas[0].id);
    });

    it("nullで選択を解除する", () => {
      // Arrange
      const { result } = renderHook(() => useAreas());
      act(() => {
        result.current.newProject("Test");
      });
      act(() => {
        result.current.addArea("Area");
      });
      act(() => {
        const areaId = result.current.areas[0].id;
        result.current.selectArea(areaId);
      });

      // Act
      act(() => {
        result.current.selectArea(null);
      });

      // Assert
      expect(result.current.selectedAreaId).toBeNull();
    });
  });

  describe("addFeatureToArea", () => {
    it("フィーチャーをエリアに追加する", () => {
      // Arrange
      const { result } = renderHook(() => useAreas());
      act(() => {
        result.current.newProject("Test");
      });
      act(() => {
        result.current.addArea("Area");
      });

      // Act
      act(() => {
        const areaId = result.current.areas[0].id;
        result.current.addFeatureToArea(areaId, "feature-1");
      });

      // Assert
      expect(result.current.areas[0].featureIds).toContain("feature-1");
    });

    it("既に割り当てられたフィーチャーは追加しない", () => {
      // Arrange
      const { result } = renderHook(() => useAreas());
      act(() => {
        result.current.newProject("Test");
      });
      act(() => {
        result.current.addArea("Area1");
        result.current.addArea("Area2");
      });
      act(() => {
        const area1Id = result.current.areas[0].id;
        result.current.addFeatureToArea(area1Id, "feature-1");
      });

      // Act
      act(() => {
        const area2Id = result.current.areas[1].id;
        result.current.addFeatureToArea(area2Id, "feature-1");
      });

      // Assert
      expect(result.current.areas[0].featureIds).toContain("feature-1");
      expect(result.current.areas[1].featureIds).not.toContain("feature-1");
    });
  });

  describe("removeFeatureFromArea", () => {
    it("フィーチャーをエリアから削除する", () => {
      // Arrange
      const { result } = renderHook(() => useAreas());
      act(() => {
        result.current.newProject("Test");
      });
      act(() => {
        result.current.addArea("Area");
      });
      act(() => {
        const areaId = result.current.areas[0].id;
        result.current.addFeatureToArea(areaId, "feature-1");
      });

      // Act
      act(() => {
        const areaId = result.current.areas[0].id;
        result.current.removeFeatureFromArea(areaId, "feature-1");
      });

      // Assert
      expect(result.current.areas[0].featureIds).not.toContain("feature-1");
    });
  });

  describe("addFeaturesToArea", () => {
    it("複数のフィーチャーをエリアに追加する", () => {
      // Arrange
      const { result } = renderHook(() => useAreas());
      act(() => {
        result.current.newProject("Test");
      });
      act(() => {
        result.current.addArea("Area");
      });

      // Act
      act(() => {
        const areaId = result.current.areas[0].id;
        result.current.addFeaturesToArea(areaId, ["f1", "f2", "f3"]);
      });

      // Assert
      expect(result.current.areas[0].featureIds).toEqual(["f1", "f2", "f3"]);
    });

    it("既に割り当てられたフィーチャーをスキップする", () => {
      // Arrange
      const { result } = renderHook(() => useAreas());
      act(() => {
        result.current.newProject("Test");
      });
      act(() => {
        result.current.addArea("Area1");
        result.current.addArea("Area2");
      });
      act(() => {
        const area1Id = result.current.areas[0].id;
        result.current.addFeatureToArea(area1Id, "f1");
      });

      // Act
      act(() => {
        const area2Id = result.current.areas[1].id;
        result.current.addFeaturesToArea(area2Id, ["f1", "f2", "f3"]);
      });

      // Assert
      expect(result.current.areas[1].featureIds).toEqual(["f2", "f3"]);
    });
  });

  describe("getAreaById", () => {
    it("IDでエリアを取得する", () => {
      // Arrange
      const { result } = renderHook(() => useAreas());
      act(() => {
        result.current.newProject("Test");
      });
      act(() => {
        result.current.addArea("Area");
      });

      // Act & Assert
      const areaId = result.current.areas[0].id;
      const area = result.current.getAreaById(areaId);
      expect(area?.name).toBe("Area");
    });

    it("存在しないIDでundefinedを返す", () => {
      // Arrange
      const { result } = renderHook(() => useAreas());
      act(() => {
        result.current.newProject("Test");
      });

      // Act
      const area = result.current.getAreaById("nonexistent");

      // Assert
      expect(area).toBeUndefined();
    });
  });

  describe("areaColorMap", () => {
    it("フィーチャーIDから色へのマップを返す", () => {
      // Arrange
      const { result } = renderHook(() => useAreas());
      act(() => {
        result.current.newProject("Test");
      });
      act(() => {
        result.current.addArea("Area");
      });
      act(() => {
        const areaId = result.current.areas[0].id;
        result.current.addFeatureToArea(areaId, "f1");
        result.current.addFeatureToArea(areaId, "f2");
      });

      // Assert
      const expectedColor = result.current.areas[0].color;
      expect(result.current.areaColorMap.get("f1")).toBe(expectedColor);
      expect(result.current.areaColorMap.get("f2")).toBe(expectedColor);
    });

    it("プロジェクトがない場合は空のMapを返す", () => {
      // Arrange
      const { result } = renderHook(() => useAreas());

      // Assert
      expect(result.current.areaColorMap.size).toBe(0);
    });
  });

  describe("areaTree", () => {
    it("ツリー構造を返す", () => {
      // Arrange
      const { result } = renderHook(() => useAreas());
      act(() => {
        result.current.newProject("Test");
      });
      act(() => {
        result.current.addArea("Parent");
      });
      act(() => {
        const parentId = result.current.areas[0].id;
        result.current.addArea("Child", parentId);
      });

      // Assert
      expect(result.current.areaTree).toHaveLength(1);
      expect(result.current.areaTree[0].children).toHaveLength(1);
    });

    it("プロジェクトがない場合は空の配列を返す", () => {
      // Arrange
      const { result } = renderHook(() => useAreas());

      // Assert
      expect(result.current.areaTree).toEqual([]);
    });
  });

  describe("closeProject", () => {
    it("プロジェクトをnullに設定する", () => {
      // Arrange
      const { result } = renderHook(() => useAreas());
      act(() => {
        result.current.newProject("Test");
      });

      // Act
      act(() => {
        result.current.closeProject();
      });

      // Assert
      expect(result.current.project).toBeNull();
    });

    it("全ての状態をリセットする", () => {
      // Arrange
      const { result } = renderHook(() => useAreas());
      act(() => {
        result.current.newProject("Test");
      });
      act(() => {
        result.current.addArea("Area");
      });
      act(() => {
        const areaId = result.current.areas[0].id;
        result.current.selectArea(areaId);
      });

      // Act
      act(() => {
        result.current.closeProject();
      });

      // Assert
      expect(result.current.project).toBeNull();
      expect(result.current.isDirty).toBe(false);
      expect(result.current.selectedAreaId).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });
});
