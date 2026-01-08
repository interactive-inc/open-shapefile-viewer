import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("単一のクラス名を返す", () => {
    // Act
    const result = cn("text-red-500");

    // Assert
    expect(result).toBe("text-red-500");
  });

  it("複数のクラス名を結合する", () => {
    // Act
    const result = cn("text-red-500", "bg-white");

    // Assert
    expect(result).toBe("text-red-500 bg-white");
  });

  it("条件付きクラス名を処理する", () => {
    // Act
    const result = cn("base", true && "active", false && "inactive");

    // Assert
    expect(result).toBe("base active");
  });

  it("オブジェクト形式の条件付きクラスを処理する", () => {
    // Act
    const result = cn("base", { active: true, inactive: false });

    // Assert
    expect(result).toBe("base active");
  });

  it("配列形式のクラスを処理する", () => {
    // Act
    const result = cn(["class1", "class2"]);

    // Assert
    expect(result).toBe("class1 class2");
  });

  it("Tailwindの競合するクラスをマージする", () => {
    // Act
    const result = cn("px-2", "px-4");

    // Assert
    expect(result).toBe("px-4");
  });

  it("undefinedとnullを無視する", () => {
    // Act
    const result = cn("base", undefined, null, "active");

    // Assert
    expect(result).toBe("base active");
  });

  it("空文字列を処理する", () => {
    // Act
    const result = cn("", "base", "");

    // Assert
    expect(result).toBe("base");
  });

  it("複雑なTailwindマージを処理する", () => {
    // Act
    const result = cn(
      "text-red-500 bg-blue-500",
      "text-green-500",
      { "font-bold": true }
    );

    // Assert
    expect(result).toBe("bg-blue-500 text-green-500 font-bold");
  });
});
