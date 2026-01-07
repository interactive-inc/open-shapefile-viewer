import { describe, it, expect } from "vitest";
import type { Feature, Geometry, GeoJsonProperties } from "geojson";
import {
  getAvailablePropertyKeys,
  getAvailablePropertyValues,
  filterFeaturesByProperty,
} from "./property-filter-utils";

// Test data factory
function createFeature(
  properties: GeoJsonProperties
): Feature<Geometry | null, GeoJsonProperties> {
  return {
    type: "Feature",
    geometry: null,
    properties,
  };
}

describe("getAvailablePropertyKeys", () => {
  it("空の配列から空の配列を返す", () => {
    // Arrange
    const features: Feature<Geometry | null, GeoJsonProperties>[] = [];

    // Act
    const result = getAvailablePropertyKeys(features);

    // Assert
    expect(result).toEqual([]);
  });

  it("単一フィーチャーからキーを取得する", () => {
    // Arrange
    const features = [createFeature({ name: "Tokyo", code: "13" })];

    // Act
    const result = getAvailablePropertyKeys(features);

    // Assert
    expect(result).toEqual(["code", "name"]);
  });

  it("複数フィーチャーから重複なくキーを取得する", () => {
    // Arrange
    const features = [
      createFeature({ name: "Tokyo", code: "13" }),
      createFeature({ name: "Osaka", population: 8800000 }),
    ];

    // Act
    const result = getAvailablePropertyKeys(features);

    // Assert
    expect(result).toEqual(["code", "name", "population"]);
  });

  it("プロパティがnullのフィーチャーをスキップする", () => {
    // Arrange
    const features = [
      createFeature({ name: "Tokyo" }),
      createFeature(null),
    ];

    // Act
    const result = getAvailablePropertyKeys(features);

    // Assert
    expect(result).toEqual(["name"]);
  });

  it("キーをアルファベット順でソートする", () => {
    // Arrange
    const features = [createFeature({ zeta: 1, alpha: 2, beta: 3 })];

    // Act
    const result = getAvailablePropertyKeys(features);

    // Assert
    expect(result).toEqual(["alpha", "beta", "zeta"]);
  });
});

describe("getAvailablePropertyValues", () => {
  it("空のキーで空の配列を返す", () => {
    // Arrange
    const features = [createFeature({ name: "Tokyo" })];

    // Act
    const result = getAvailablePropertyValues(features, "");

    // Assert
    expect(result).toEqual([]);
  });

  it("存在しないキーで空の配列を返す", () => {
    // Arrange
    const features = [createFeature({ name: "Tokyo" })];

    // Act
    const result = getAvailablePropertyValues(features, "nonexistent");

    // Assert
    expect(result).toEqual([]);
  });

  it("単一フィーチャーから値を取得する", () => {
    // Arrange
    const features = [createFeature({ name: "Tokyo" })];

    // Act
    const result = getAvailablePropertyValues(features, "name");

    // Assert
    expect(result).toEqual(["Tokyo"]);
  });

  it("複数フィーチャーから重複なく値を取得する", () => {
    // Arrange
    const features = [
      createFeature({ prefecture: "東京都" }),
      createFeature({ prefecture: "大阪府" }),
      createFeature({ prefecture: "東京都" }),
    ];

    // Act
    const result = getAvailablePropertyValues(features, "prefecture");

    // Assert
    expect(result).toEqual(["大阪府", "東京都"]);
  });

  it("数値を文字列に変換する", () => {
    // Arrange
    const features = [
      createFeature({ code: 13 }),
      createFeature({ code: 27 }),
    ];

    // Act
    const result = getAvailablePropertyValues(features, "code");

    // Assert
    expect(result).toEqual(["13", "27"]);
  });

  it("null/undefined値をスキップする", () => {
    // Arrange
    const features = [
      createFeature({ name: "Tokyo" }),
      createFeature({ name: null }),
      createFeature({ name: undefined }),
      createFeature({ other: "value" }),
    ];

    // Act
    const result = getAvailablePropertyValues(features, "name");

    // Assert
    expect(result).toEqual(["Tokyo"]);
  });

  it("値をソートして返す", () => {
    // Arrange
    const features = [
      createFeature({ name: "C" }),
      createFeature({ name: "A" }),
      createFeature({ name: "B" }),
    ];

    // Act
    const result = getAvailablePropertyValues(features, "name");

    // Assert
    expect(result).toEqual(["A", "B", "C"]);
  });
});

describe("filterFeaturesByProperty", () => {
  it("空のキーで空の配列を返す", () => {
    // Arrange
    const features = [createFeature({ name: "Tokyo" })];

    // Act
    const result = filterFeaturesByProperty(features, "", ["Tokyo"]);

    // Assert
    expect(result).toEqual([]);
  });

  it("空の値配列で空の配列を返す", () => {
    // Arrange
    const features = [createFeature({ name: "Tokyo" })];

    // Act
    const result = filterFeaturesByProperty(features, "name", []);

    // Assert
    expect(result).toEqual([]);
  });

  it("単一の値でフィルタリングする", () => {
    // Arrange
    const tokyo = createFeature({ name: "Tokyo" });
    const osaka = createFeature({ name: "Osaka" });
    const features = [tokyo, osaka];

    // Act
    const result = filterFeaturesByProperty(features, "name", ["Tokyo"]);

    // Assert
    expect(result).toEqual([tokyo]);
  });

  it("複数の値でOR条件フィルタリングする", () => {
    // Arrange
    const tokyo = createFeature({ name: "Tokyo" });
    const osaka = createFeature({ name: "Osaka" });
    const kyoto = createFeature({ name: "Kyoto" });
    const features = [tokyo, osaka, kyoto];

    // Act
    const result = filterFeaturesByProperty(features, "name", [
      "Tokyo",
      "Osaka",
    ]);

    // Assert
    expect(result).toEqual([tokyo, osaka]);
  });

  it("数値プロパティを文字列として比較する", () => {
    // Arrange
    const feature13 = createFeature({ code: 13 });
    const feature27 = createFeature({ code: 27 });
    const features = [feature13, feature27];

    // Act
    const result = filterFeaturesByProperty(features, "code", ["13"]);

    // Assert
    expect(result).toEqual([feature13]);
  });

  it("null/undefinedプロパティを持つフィーチャーを除外する", () => {
    // Arrange
    const tokyo = createFeature({ name: "Tokyo" });
    const nullName = createFeature({ name: null });
    const noName = createFeature({ other: "value" });
    const features = [tokyo, nullName, noName];

    // Act
    const result = filterFeaturesByProperty(features, "name", ["Tokyo"]);

    // Assert
    expect(result).toEqual([tokyo]);
  });

  it("マッチしない場合は空の配列を返す", () => {
    // Arrange
    const features = [createFeature({ name: "Tokyo" })];

    // Act
    const result = filterFeaturesByProperty(features, "name", ["Nagoya"]);

    // Assert
    expect(result).toEqual([]);
  });

  it("元の配列の型を保持する", () => {
    // Arrange
    interface ExtendedFeature extends Feature<Geometry | null, GeoJsonProperties> {
      customField: string;
    }
    const feature: ExtendedFeature = {
      ...createFeature({ name: "Tokyo" }),
      customField: "custom",
    };
    const features: ExtendedFeature[] = [feature];

    // Act
    const result = filterFeaturesByProperty(features, "name", ["Tokyo"]);

    // Assert
    expect(result[0].customField).toBe("custom");
  });
});
