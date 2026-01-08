import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMapStyle, MAP_STYLES, type MapStyleId } from "./use-map-style";
import { STORAGE_KEYS } from "@/lib/constants";

describe("useMapStyle", () => {
  const STORAGE_KEY = STORAGE_KEYS.MAP_STYLE;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("MAP_STYLES定数", () => {
    it("4つのスタイルが定義されている", () => {
      // Assert
      expect(Object.keys(MAP_STYLES)).toHaveLength(4);
    });

    it("各スタイルに必須プロパティがある", () => {
      // Arrange
      const requiredKeys = ["id", "name", "url", "attribution", "filter"];

      // Assert
      for (const styleId of Object.keys(MAP_STYLES) as MapStyleId[]) {
        const style = MAP_STYLES[styleId];
        for (const key of requiredKeys) {
          expect(style).toHaveProperty(key);
        }
      }
    });

    it("osmスタイルが正しく定義されている", () => {
      // Assert
      expect(MAP_STYLES.osm).toMatchObject({
        id: "osm",
        name: "OpenStreetMap",
        filter: null,
      });
      expect(MAP_STYLES.osm.url).toContain("openstreetmap.org");
    });

    it("positronスタイルが正しく定義されている", () => {
      // Assert
      expect(MAP_STYLES.positron).toMatchObject({
        id: "positron",
        name: "CartoDB Positron",
        filter: null,
      });
      expect(MAP_STYLES.positron.url).toContain("cartocdn.com");
    });

    it("darkスタイルが正しく定義されている", () => {
      // Assert
      expect(MAP_STYLES.dark).toMatchObject({
        id: "dark",
        name: "CartoDB Dark",
        filter: null,
      });
      expect(MAP_STYLES.dark.url).toContain("dark_all");
    });

    it("osm-mutedスタイルがフィルター付きで定義されている", () => {
      // Assert
      expect(MAP_STYLES["osm-muted"]).toMatchObject({
        id: "osm-muted",
        name: "OSM (淡色)",
      });
      expect(MAP_STYLES["osm-muted"].filter).not.toBeNull();
      expect(MAP_STYLES["osm-muted"].filter).toContain("brightness");
    });
  });

  describe("初期状態", () => {
    it("デフォルトでosmスタイルを返す", () => {
      // Act
      const { result } = renderHook(() => useMapStyle());

      // Assert
      expect(result.current.styleId).toBe("osm");
    });

    it("currentStyleがosmの設定を返す", () => {
      // Act
      const { result } = renderHook(() => useMapStyle());

      // Assert
      expect(result.current.currentStyle).toEqual(MAP_STYLES.osm);
    });

    it("allStylesが全スタイルを返す", () => {
      // Act
      const { result } = renderHook(() => useMapStyle());

      // Assert
      expect(result.current.allStyles).toHaveLength(4);
      expect(result.current.allStyles).toContainEqual(MAP_STYLES.osm);
      expect(result.current.allStyles).toContainEqual(MAP_STYLES.positron);
      expect(result.current.allStyles).toContainEqual(MAP_STYLES.dark);
      expect(result.current.allStyles).toContainEqual(MAP_STYLES["osm-muted"]);
    });
  });

  describe("localStorage復元", () => {
    it("保存されたスタイルIDを復元する", () => {
      // Arrange
      localStorage.setItem(STORAGE_KEY, "dark");

      // Act
      const { result } = renderHook(() => useMapStyle());

      // Assert
      expect(result.current.styleId).toBe("dark");
      expect(result.current.currentStyle).toEqual(MAP_STYLES.dark);
    });

    it("無効なスタイルIDの場合はデフォルト値を使用する", () => {
      // Arrange
      localStorage.setItem(STORAGE_KEY, "invalid-style");

      // Act
      const { result } = renderHook(() => useMapStyle());

      // Assert
      expect(result.current.styleId).toBe("osm");
    });

    it("localStorageエラー時はデフォルト値を使用する", () => {
      // Arrange
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("Storage error");
      });

      // Act
      const { result } = renderHook(() => useMapStyle());

      // Assert
      expect(result.current.styleId).toBe("osm");
    });
  });

  describe("setStyle", () => {
    it("スタイルを変更する", () => {
      // Arrange
      const { result } = renderHook(() => useMapStyle());

      // Act
      act(() => {
        result.current.setStyle("positron");
      });

      // Assert
      expect(result.current.styleId).toBe("positron");
      expect(result.current.currentStyle).toEqual(MAP_STYLES.positron);
    });

    it("スタイル変更時にlocalStorageに保存する", () => {
      // Arrange
      const { result } = renderHook(() => useMapStyle());

      // Act
      act(() => {
        result.current.setStyle("dark");
      });

      // Assert - localStorage の値を直接確認
      expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
    });

    it("localStorageエラー時も状態は更新される", () => {
      // Arrange
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("Storage error");
      });
      const { result } = renderHook(() => useMapStyle());

      // Act
      act(() => {
        result.current.setStyle("dark");
      });

      // Assert
      expect(result.current.styleId).toBe("dark");
    });

    it("全てのスタイルに切り替えできる", () => {
      // Arrange
      const { result } = renderHook(() => useMapStyle());
      const styleIds: MapStyleId[] = ["osm", "positron", "dark", "osm-muted"];

      // Act & Assert
      for (const styleId of styleIds) {
        act(() => {
          result.current.setStyle(styleId);
        });
        expect(result.current.styleId).toBe(styleId);
        expect(result.current.currentStyle.id).toBe(styleId);
      }
    });
  });

  describe("currentStyle", () => {
    it("選択中のスタイル設定を返す", () => {
      // Arrange
      const { result } = renderHook(() => useMapStyle());

      // Act
      act(() => {
        result.current.setStyle("osm-muted");
      });

      // Assert
      const style = result.current.currentStyle;
      expect(style.id).toBe("osm-muted");
      expect(style.name).toBe("OSM (淡色)");
      expect(style.filter).toContain("saturate");
    });
  });
});
