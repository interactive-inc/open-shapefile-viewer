import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLayers } from "./use-layers";
import * as shapefileParser from "@/lib/shapefile-parser";
import type { FeatureCollection } from "geojson";
import {
  createMockFileList,
  createShapefileFileList,
  createSingleShpFileList,
  createInvalidFileList,
} from "@/__tests__/test-utils/file-list-mock";

// Mock shapefile parser
vi.mock("@/lib/shapefile-parser", () => ({
  parseShapefileFromFiles: vi.fn(),
  extractShapefiles: vi.fn(),
}));

// 型付きモック関数
const mockExtractShapefiles = vi.mocked(shapefileParser.extractShapefiles);
const mockParseShapefileFromFiles = vi.mocked(shapefileParser.parseShapefileFromFiles);

describe("useLayers", () => {
  const mockGeoJson: FeatureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [0, 0] },
        properties: { name: "Test" },
      },
    ],
  };

  // モックセットアップヘルパー
  function setupValidShapefileMocks(name = "test") {
    const { fileList, shpFile, dbfFile } = createShapefileFileList(name);
    mockExtractShapefiles.mockReturnValue({
      shpFile,
      dbfFile,
      name,
    });
    mockParseShapefileFromFiles.mockResolvedValue(mockGeoJson);
    return { fileList, shpFile, dbfFile };
  }

  function setupSingleShpMocks(name = "test") {
    const { fileList, shpFile } = createSingleShpFileList(name);
    mockExtractShapefiles.mockReturnValue({
      shpFile,
      dbfFile: undefined,
      name,
    });
    mockParseShapefileFromFiles.mockResolvedValue(mockGeoJson);
    return { fileList, shpFile };
  }

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("初期状態", () => {
    it("空のレイヤー配列で開始する", () => {
      // Act
      const { result } = renderHook(() => useLayers());

      // Assert
      expect(result.current.layers).toEqual([]);
    });

    it("isLoadingがfalseで開始する", () => {
      // Act
      const { result } = renderHook(() => useLayers());

      // Assert
      expect(result.current.isLoading).toBe(false);
    });

    it("errorがnullで開始する", () => {
      // Act
      const { result } = renderHook(() => useLayers());

      // Assert
      expect(result.current.error).toBeNull();
    });
  });

  describe("addLayerFromFiles", () => {
    it("有効なShapefileでレイヤーを追加する", async () => {
      // Arrange
      const { fileList } = setupValidShapefileMocks("test");
      const { result } = renderHook(() => useLayers());

      // Act
      await act(async () => {
        await result.current.addLayerFromFiles(fileList);
      });

      // Assert
      expect(result.current.layers).toHaveLength(1);
      expect(result.current.layers[0].name).toBe("test");
      expect(result.current.layers[0].geojson).toBe(mockGeoJson);
    });

    it("Shapefileが見つからない場合はエラーを設定する", async () => {
      // Arrange
      const fileList = createInvalidFileList("test.txt");
      mockExtractShapefiles.mockReturnValue(null);

      const { result } = renderHook(() => useLayers());

      // Act
      await act(async () => {
        await result.current.addLayerFromFiles(fileList);
      });

      // Assert
      expect(result.current.layers).toHaveLength(0);
      expect(result.current.error).toBe(
        "Shapefileが見つかりません (.shp ファイルを選択してください)"
      );
    });

    it("パース中はisLoadingがtrueになる", async () => {
      // Arrange
      const { fileList, shpFile } = createSingleShpFileList("test");

      let resolvePromise: (value: FeatureCollection) => void = () => {};
      const pendingPromise = new Promise<FeatureCollection>((resolve) => {
        resolvePromise = resolve;
      });

      mockExtractShapefiles.mockReturnValue({
        shpFile,
        dbfFile: undefined,
        name: "test",
      });
      mockParseShapefileFromFiles.mockReturnValue(pendingPromise);

      const { result } = renderHook(() => useLayers());

      // Act
      let addPromise: Promise<void>;
      act(() => {
        addPromise = result.current.addLayerFromFiles(fileList);
      });

      // Assert - Loading state
      expect(result.current.isLoading).toBe(true);

      // Resolve and complete
      await act(async () => {
        resolvePromise(mockGeoJson);
        await addPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("各レイヤーに色を割り当てる", async () => {
      // Arrange
      const { fileList } = setupSingleShpMocks("test");
      const { result } = renderHook(() => useLayers());

      // Act
      await act(async () => {
        await result.current.addLayerFromFiles(fileList);
      });

      // Assert
      expect(result.current.layers[0].color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  describe("removeLayer", () => {
    it("IDでレイヤーを削除する", async () => {
      // Arrange
      const { fileList } = setupSingleShpMocks("test");
      const { result } = renderHook(() => useLayers());
      await act(async () => {
        await result.current.addLayerFromFiles(fileList);
      });
      const layerId = result.current.layers[0].id;

      // Act
      act(() => {
        result.current.removeLayer(layerId);
      });

      // Assert
      expect(result.current.layers).toHaveLength(0);
    });

    it("存在しないIDでは何もしない", async () => {
      // Arrange
      const { fileList } = setupSingleShpMocks("test");
      const { result } = renderHook(() => useLayers());
      await act(async () => {
        await result.current.addLayerFromFiles(fileList);
      });

      // Act
      act(() => {
        result.current.removeLayer("nonexistent");
      });

      // Assert
      expect(result.current.layers).toHaveLength(1);
    });
  });

  describe("toggleLayer", () => {
    it("レイヤーの可視性を切り替える", async () => {
      // Arrange
      const { fileList } = setupSingleShpMocks("test");
      const { result } = renderHook(() => useLayers());
      await act(async () => {
        await result.current.addLayerFromFiles(fileList);
      });
      const layerId = result.current.layers[0].id;
      const initialVisibility = result.current.layers[0].visible;

      // Act
      act(() => {
        result.current.toggleLayer(layerId);
      });

      // Assert
      expect(result.current.layers[0].visible).toBe(!initialVisibility);
    });

    it("2回トグルで元の状態に戻る", async () => {
      // Arrange
      const { fileList } = setupSingleShpMocks("test");
      const { result } = renderHook(() => useLayers());
      await act(async () => {
        await result.current.addLayerFromFiles(fileList);
      });
      const layerId = result.current.layers[0].id;
      const initialVisibility = result.current.layers[0].visible;

      // Act
      act(() => {
        result.current.toggleLayer(layerId);
        result.current.toggleLayer(layerId);
      });

      // Assert
      expect(result.current.layers[0].visible).toBe(initialVisibility);
    });
  });

  describe("setLayerColor", () => {
    it("レイヤーの色を変更する", async () => {
      // Arrange
      const { fileList } = setupSingleShpMocks("test");
      const { result } = renderHook(() => useLayers());
      await act(async () => {
        await result.current.addLayerFromFiles(fileList);
      });
      const layerId = result.current.layers[0].id;

      // Act
      act(() => {
        result.current.setLayerColor(layerId, "#ff0000");
      });

      // Assert
      expect(result.current.layers[0].color).toBe("#ff0000");
    });
  });

  describe("setLayerFilter", () => {
    it("レイヤーにフィルターを設定する", async () => {
      // Arrange
      const { fileList } = setupSingleShpMocks("test");
      const { result } = renderHook(() => useLayers());
      await act(async () => {
        await result.current.addLayerFromFiles(fileList);
      });
      const layerId = result.current.layers[0].id;
      const filter = { key: "name", values: ["Test"], enabled: true };

      // Act
      act(() => {
        result.current.setLayerFilter(layerId, filter);
      });

      // Assert
      expect(result.current.layers[0].filter).toEqual(filter);
    });

    it("フィルターをundefinedに設定して解除する", async () => {
      // Arrange
      const { fileList } = setupSingleShpMocks("test");
      const { result } = renderHook(() => useLayers());
      await act(async () => {
        await result.current.addLayerFromFiles(fileList);
      });
      const layerId = result.current.layers[0].id;
      act(() => {
        result.current.setLayerFilter(layerId, {
          key: "name",
          values: ["Test"],
          enabled: true,
        });
      });

      // Act
      act(() => {
        result.current.setLayerFilter(layerId, undefined);
      });

      // Assert
      expect(result.current.layers[0].filter).toBeUndefined();
    });
  });

  describe("reorderLayers", () => {
    it("レイヤーの順序を変更する", async () => {
      // Arrange
      const shpFile1 = new File([""], "test1.shp");
      const shpFile2 = new File([""], "test2.shp");

      mockExtractShapefiles
        .mockReturnValueOnce({ shpFile: shpFile1, dbfFile: undefined, name: "test1" })
        .mockReturnValueOnce({ shpFile: shpFile2, dbfFile: undefined, name: "test2" });
      mockParseShapefileFromFiles.mockResolvedValue(mockGeoJson);

      const { result } = renderHook(() => useLayers());
      await act(async () => {
        await result.current.addLayerFromFiles(createMockFileList(shpFile1));
        await result.current.addLayerFromFiles(createMockFileList(shpFile2));
      });

      // Act
      act(() => {
        result.current.reorderLayers(0, 1);
      });

      // Assert
      expect(result.current.layers[0].name).toBe("test2");
      expect(result.current.layers[1].name).toBe("test1");
    });
  });

  describe("clearAll", () => {
    it("全てのレイヤーをクリアする", async () => {
      // Arrange
      const { fileList } = setupSingleShpMocks("test");
      const { result } = renderHook(() => useLayers());
      await act(async () => {
        await result.current.addLayerFromFiles(fileList);
      });

      // Act
      act(() => {
        result.current.clearAll();
      });

      // Assert
      expect(result.current.layers).toHaveLength(0);
    });

    it("エラーもクリアする", async () => {
      // Arrange
      const fileList = createInvalidFileList("test.txt");
      mockExtractShapefiles.mockReturnValue(null);

      const { result } = renderHook(() => useLayers());
      await act(async () => {
        await result.current.addLayerFromFiles(fileList);
      });
      expect(result.current.error).not.toBeNull();

      // Act
      act(() => {
        result.current.clearAll();
      });

      // Assert
      expect(result.current.error).toBeNull();
    });
  });
});
