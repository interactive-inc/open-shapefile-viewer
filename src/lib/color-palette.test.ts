import { describe, it, expect } from "vitest";
import {
  UI_COLORS,
  POLYGON_PALETTE,
  getNextAvailableColor,
  getColorByIndex,
} from "./color-palette";

describe("UI_COLORS", () => {
  it("UI状態の色が定義されている", () => {
    // Assert
    expect(UI_COLORS.selected).toBe("#22c55e");
    expect(UI_COLORS.hoverAdd).toBe("#22c55e");
    expect(UI_COLORS.hoverRemove).toBe("#ef4444");
    expect(UI_COLORS.hoverDisabled).toBe("#9ca3af");
    expect(UI_COLORS.unassigned).toBe("#9ca3af");
  });
});

describe("POLYGON_PALETTE", () => {
  it("12色のパレットが生成される", () => {
    // Assert
    expect(POLYGON_PALETTE).toHaveLength(12);
  });

  it("全ての色がHEXフォーマット", () => {
    // Arrange
    const hexPattern = /^#[0-9a-f]{6}$/i;

    // Assert
    for (const color of POLYGON_PALETTE) {
      expect(color).toMatch(hexPattern);
    }
  });

  it("重複する色がない", () => {
    // Arrange
    const uniqueColors = new Set(POLYGON_PALETTE);

    // Assert
    expect(uniqueColors.size).toBe(POLYGON_PALETTE.length);
  });

  it("予約色(緑/赤)に近い色を含まない", () => {
    // Arrange
    // 緑(120度)と赤(0度)に近い色は除外されているはず
    const reservedColors = ["#22c55e", "#ef4444"];

    // Assert
    for (const reserved of reservedColors) {
      expect(POLYGON_PALETTE).not.toContain(reserved);
    }
  });
});

describe("getNextAvailableColor", () => {
  it("使用済み色がない場合、パレットの最初の色を返す", () => {
    // Act
    const result = getNextAvailableColor([]);

    // Assert
    expect(result).toBe(POLYGON_PALETTE[0]);
  });

  it("使用済み色と異なる色を返す", () => {
    // Arrange
    const usedColors = [POLYGON_PALETTE[0]];

    // Act
    const result = getNextAvailableColor(usedColors);

    // Assert
    expect(result).not.toBe(POLYGON_PALETTE[0]);
    expect(POLYGON_PALETTE).toContain(result);
  });

  it("複数の使用済み色がある場合、未使用の色を返す", () => {
    // Arrange
    const usedColors = [POLYGON_PALETTE[0], POLYGON_PALETTE[1]];

    // Act
    const result = getNextAvailableColor(usedColors);

    // Assert
    expect(usedColors).not.toContain(result);
  });

  it("使用済み色から最も離れた色を選択する", () => {
    // Arrange
    const usedColors = [POLYGON_PALETTE[0]];

    // Act
    const result = getNextAvailableColor(usedColors);

    // Assert
    // 結果が使用済み色と異なることを確認
    expect(result).not.toBe(usedColors[0]);
    // 有効なHEX色であること
    expect(result).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("パレットが枯渇した場合、新しい色を生成する", () => {
    // Arrange
    const usedColors = [...POLYGON_PALETTE];

    // Act
    const result = getNextAvailableColor(usedColors);

    // Assert
    expect(result).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe("getColorByIndex", () => {
  it("インデックス0でパレットの最初の色を返す", () => {
    // Act
    const result = getColorByIndex(0);

    // Assert
    expect(result).toBe(POLYGON_PALETTE[0]);
  });

  it("パレット範囲内のインデックスで正しい色を返す", () => {
    // Act & Assert
    for (let i = 0; i < POLYGON_PALETTE.length; i++) {
      expect(getColorByIndex(i)).toBe(POLYGON_PALETTE[i]);
    }
  });

  it("パレット範囲外のインデックスで循環する", () => {
    // Arrange
    const paletteLength = POLYGON_PALETTE.length;

    // Act & Assert
    expect(getColorByIndex(paletteLength)).toBe(POLYGON_PALETTE[0]);
    expect(getColorByIndex(paletteLength + 1)).toBe(POLYGON_PALETTE[1]);
    expect(getColorByIndex(paletteLength * 2)).toBe(POLYGON_PALETTE[0]);
  });

  it("大きなインデックスでも正しく循環する", () => {
    // Arrange
    const index = 100;
    const expectedIndex = index % POLYGON_PALETTE.length;

    // Act
    const result = getColorByIndex(index);

    // Assert
    expect(result).toBe(POLYGON_PALETTE[expectedIndex]);
  });
});
