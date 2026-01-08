import { describe, it, expect } from "vitest";
import type { Layer } from "./layer";
import {
  generateFeatureId,
  parseFeatureId,
  generateFeatureName,
  getFeatureNameFromLayers,
} from "./layer";

describe("generateFeatureId", () => {
  it("レイヤーIDとインデックスからフィーチャーIDを生成する", () => {
    // Act
    const result = generateFeatureId("layer-1", 0);

    // Assert
    expect(result).toBe("layer-1:0");
  });

  it("大きなインデックスでも正しく生成する", () => {
    // Act
    const result = generateFeatureId("layer-abc", 12345);

    // Assert
    expect(result).toBe("layer-abc:12345");
  });

  it("特殊文字を含むレイヤーIDを処理する", () => {
    // Act
    const result = generateFeatureId("layer_special-123", 5);

    // Assert
    expect(result).toBe("layer_special-123:5");
  });
});

describe("parseFeatureId", () => {
  it("有効なフィーチャーIDをパースする", () => {
    // Act
    const result = parseFeatureId("layer-1:5");

    // Assert
    expect(result).toEqual({ layerId: "layer-1", index: 5 });
  });

  it("インデックス0を正しくパースする", () => {
    // Act
    const result = parseFeatureId("layer-abc:0");

    // Assert
    expect(result).toEqual({ layerId: "layer-abc", index: 0 });
  });

  it("コロンがない場合はnullを返す", () => {
    // Act
    const result = parseFeatureId("invalid");

    // Assert
    expect(result).toBeNull();
  });

  it("コロンが複数ある場合はnullを返す", () => {
    // Act
    const result = parseFeatureId("layer:1:2");

    // Assert
    expect(result).toBeNull();
  });

  it("インデックスが数値でない場合はnullを返す", () => {
    // Act
    const result = parseFeatureId("layer-1:abc");

    // Assert
    expect(result).toBeNull();
  });

  it("空文字列でnullを返す", () => {
    // Act
    const result = parseFeatureId("");

    // Assert
    expect(result).toBeNull();
  });
});

describe("generateFeatureName", () => {
  it("nullプロパティで空文字列を返す", () => {
    // Act
    const result = generateFeatureName(null);

    // Assert
    expect(result).toBe("");
  });

  it("空オブジェクトで空文字列を返す", () => {
    // Act
    const result = generateFeatureName({});

    // Assert
    expect(result).toBe("");
  });

  it("都道府県名のみを返す", () => {
    // Arrange
    const properties = { 都道府県名: "東京都" };

    // Act
    const result = generateFeatureName(properties);

    // Assert
    expect(result).toBe("東京都");
  });

  it("全ての住所フィールドを結合する", () => {
    // Arrange
    const properties = {
      都道府県名: "東京都",
      市区町村名: "渋谷区",
      町大字名: "神南",
      丁目字名: "一丁目",
    };

    // Act
    const result = generateFeatureName(properties);

    // Assert
    expect(result).toBe("東京都渋谷区神南一丁目");
  });

  it("null/undefined/空文字のフィールドをスキップする", () => {
    // Arrange
    const properties = {
      都道府県名: "東京都",
      市区町村名: null,
      町大字名: undefined,
      丁目字名: "",
    };

    // Act
    const result = generateFeatureName(properties);

    // Assert
    expect(result).toBe("東京都");
  });

  it("関係ないプロパティを無視する", () => {
    // Arrange
    const properties = {
      都道府県名: "東京都",
      code: "13",
      population: 14000000,
    };

    // Act
    const result = generateFeatureName(properties);

    // Assert
    expect(result).toBe("東京都");
  });

  it("フィールドの順序を維持する", () => {
    // Arrange
    const properties = {
      丁目字名: "一丁目",
      市区町村名: "渋谷区",
      町大字名: "神南",
      都道府県名: "東京都",
    };

    // Act
    const result = generateFeatureName(properties);

    // Assert
    // 順序は都道府県名 -> 市区町村名 -> 町大字名 -> 丁目字名
    expect(result).toBe("東京都渋谷区神南一丁目");
  });
});

describe("getFeatureNameFromLayers", () => {
  // Test data factory
  function createLayer(
    id: string,
    features: Array<{ properties: Record<string, unknown> | null }>
  ): Layer {
    return {
      id,
      name: "Test Layer",
      geojson: {
        type: "FeatureCollection",
        features: features.map((f) => ({
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: [0, 0] },
          properties: f.properties,
        })),
      },
      visible: true,
      color: "#ff0000",
    };
  }

  it("有効なフィーチャーIDで名称を取得する", () => {
    // Arrange
    const layers = [
      createLayer("layer-1", [{ properties: { 都道府県名: "東京都" } }]),
    ];

    // Act
    const result = getFeatureNameFromLayers("layer-1:0", layers);

    // Assert
    expect(result).toBe("東京都");
  });

  it("無効なフィーチャーIDで空文字列を返す", () => {
    // Arrange
    const layers = [
      createLayer("layer-1", [{ properties: { 都道府県名: "東京都" } }]),
    ];

    // Act
    const result = getFeatureNameFromLayers("invalid", layers);

    // Assert
    expect(result).toBe("");
  });

  it("存在しないレイヤーIDで空文字列を返す", () => {
    // Arrange
    const layers = [
      createLayer("layer-1", [{ properties: { 都道府県名: "東京都" } }]),
    ];

    // Act
    const result = getFeatureNameFromLayers("layer-2:0", layers);

    // Assert
    expect(result).toBe("");
  });

  it("範囲外のインデックスで空文字列を返す", () => {
    // Arrange
    const layers = [
      createLayer("layer-1", [{ properties: { 都道府県名: "東京都" } }]),
    ];

    // Act
    const result = getFeatureNameFromLayers("layer-1:10", layers);

    // Assert
    expect(result).toBe("");
  });

  it("複数のレイヤーから正しいフィーチャーを取得する", () => {
    // Arrange
    const layers = [
      createLayer("layer-1", [{ properties: { 都道府県名: "東京都" } }]),
      createLayer("layer-2", [
        { properties: { 都道府県名: "大阪府" } },
        { properties: { 都道府県名: "京都府" } },
      ]),
    ];

    // Act
    const result = getFeatureNameFromLayers("layer-2:1", layers);

    // Assert
    expect(result).toBe("京都府");
  });

  it("空のレイヤー配列で空文字列を返す", () => {
    // Act
    const result = getFeatureNameFromLayers("layer-1:0", []);

    // Assert
    expect(result).toBe("");
  });
});
