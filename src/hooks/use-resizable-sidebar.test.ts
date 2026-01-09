import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useResizableSidebar } from "./use-resizable-sidebar";
import { STORAGE_KEYS } from "@/lib/constants";

describe("useResizableSidebar", () => {
  const STORAGE_KEY = STORAGE_KEYS.SIDEBAR_WIDTH;
  const DEFAULT_WIDTH = 320;
  const MIN_WIDTH = 200;
  const MAX_WIDTH = 600;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("初期状態", () => {
    it("デフォルト幅で開始する", () => {
      // Arrange & Act
      const { result } = renderHook(() => useResizableSidebar());

      // Assert
      expect(result.current.width).toBe(DEFAULT_WIDTH);
    });

    it("isResizingがfalseで開始する", () => {
      // Arrange & Act
      const { result } = renderHook(() => useResizableSidebar());

      // Assert
      expect(result.current.isResizing).toBe(false);
    });

    it("minWidthとmaxWidthを返す", () => {
      // Arrange & Act
      const { result } = renderHook(() => useResizableSidebar());

      // Assert
      expect(result.current.minWidth).toBe(MIN_WIDTH);
      expect(result.current.maxWidth).toBe(MAX_WIDTH);
    });
  });

  describe("localStorage復元", () => {
    it("保存された幅を復元する", () => {
      // Arrange
      localStorage.setItem(STORAGE_KEY, "400");

      // Act
      const { result } = renderHook(() => useResizableSidebar());

      // Assert
      expect(result.current.width).toBe(400);
    });

    it("保存値が範囲外の場合はデフォルト値を使用する (小さすぎる)", () => {
      // Arrange
      localStorage.setItem(STORAGE_KEY, "100");

      // Act
      const { result } = renderHook(() => useResizableSidebar());

      // Assert
      expect(result.current.width).toBe(DEFAULT_WIDTH);
    });

    it("保存値が範囲外の場合はデフォルト値を使用する (大きすぎる)", () => {
      // Arrange
      localStorage.setItem(STORAGE_KEY, "1000");

      // Act
      const { result } = renderHook(() => useResizableSidebar());

      // Assert
      expect(result.current.width).toBe(DEFAULT_WIDTH);
    });

    it("保存値が無効な場合はデフォルト値を使用する", () => {
      // Arrange
      localStorage.setItem(STORAGE_KEY, "invalid");

      // Act
      const { result } = renderHook(() => useResizableSidebar());

      // Assert
      expect(result.current.width).toBe(DEFAULT_WIDTH);
    });

    it("localStorageエラー時はデフォルト値を使用する", () => {
      // Arrange
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("Storage error");
      });

      // Act
      const { result } = renderHook(() => useResizableSidebar());

      // Assert
      expect(result.current.width).toBe(DEFAULT_WIDTH);
    });
  });

  describe("handleMouseDown", () => {
    it("リサイズを開始する", () => {
      // Arrange
      const { result } = renderHook(() => useResizableSidebar());
      const mockEvent = {
        preventDefault: vi.fn(),
        clientX: 300,
      } as unknown as React.MouseEvent;

      // Act
      act(() => {
        result.current.handleMouseDown(mockEvent);
      });

      // Assert
      expect(result.current.isResizing).toBe(true);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe("リサイズ操作", () => {
    it("ドラッグで幅を変更する", () => {
      // Arrange
      const { result } = renderHook(() => useResizableSidebar());
      const mouseDownEvent = {
        preventDefault: vi.fn(),
        clientX: 300,
      } as unknown as React.MouseEvent;

      // Act - リサイズ開始
      act(() => {
        result.current.handleMouseDown(mouseDownEvent);
      });

      // Act - マウス移動
      act(() => {
        const mouseMoveEvent = new MouseEvent("mousemove", { clientX: 350 });
        document.dispatchEvent(mouseMoveEvent);
      });

      // Assert
      expect(result.current.width).toBe(DEFAULT_WIDTH + 50);
    });

    it("最小幅を下回らない", () => {
      // Arrange
      const { result } = renderHook(() => useResizableSidebar());
      const mouseDownEvent = {
        preventDefault: vi.fn(),
        clientX: 300,
      } as unknown as React.MouseEvent;

      // Act - リサイズ開始
      act(() => {
        result.current.handleMouseDown(mouseDownEvent);
      });

      // Act - 大きく左にドラッグ
      act(() => {
        const mouseMoveEvent = new MouseEvent("mousemove", { clientX: 0 });
        document.dispatchEvent(mouseMoveEvent);
      });

      // Assert
      expect(result.current.width).toBe(MIN_WIDTH);
    });

    it("最大幅を超えない", () => {
      // Arrange
      const { result } = renderHook(() => useResizableSidebar());
      const mouseDownEvent = {
        preventDefault: vi.fn(),
        clientX: 300,
      } as unknown as React.MouseEvent;

      // Act - リサイズ開始
      act(() => {
        result.current.handleMouseDown(mouseDownEvent);
      });

      // Act - 大きく右にドラッグ
      act(() => {
        const mouseMoveEvent = new MouseEvent("mousemove", { clientX: 1000 });
        document.dispatchEvent(mouseMoveEvent);
      });

      // Assert
      expect(result.current.width).toBe(MAX_WIDTH);
    });

    it("マウスアップでリサイズを終了する", () => {
      // Arrange
      const { result } = renderHook(() => useResizableSidebar());
      const mouseDownEvent = {
        preventDefault: vi.fn(),
        clientX: 300,
      } as unknown as React.MouseEvent;

      // Act - リサイズ開始
      act(() => {
        result.current.handleMouseDown(mouseDownEvent);
      });
      expect(result.current.isResizing).toBe(true);

      // Act - マウスアップ
      act(() => {
        const mouseUpEvent = new MouseEvent("mouseup");
        document.dispatchEvent(mouseUpEvent);
      });

      // Assert
      expect(result.current.isResizing).toBe(false);
    });

    it("リサイズ終了時にlocalStorageに保存する", () => {
      // Arrange
      const { result } = renderHook(() => useResizableSidebar());
      const mouseDownEvent = {
        preventDefault: vi.fn(),
        clientX: 300,
      } as unknown as React.MouseEvent;

      // Act - リサイズ開始
      act(() => {
        result.current.handleMouseDown(mouseDownEvent);
      });

      // Act - マウス移動
      act(() => {
        const mouseMoveEvent = new MouseEvent("mousemove", { clientX: 350 });
        document.dispatchEvent(mouseMoveEvent);
      });

      // Act - マウスアップ
      act(() => {
        const mouseUpEvent = new MouseEvent("mouseup");
        document.dispatchEvent(mouseUpEvent);
      });

      // Assert - localStorage の値を直接確認
      const savedWidth = localStorage.getItem(STORAGE_KEY);
      expect(savedWidth).not.toBeNull();
      expect(parseInt(savedWidth!, 10)).toBeGreaterThan(0);
    });
  });

  describe("リサイズ中のスタイル", () => {
    it("リサイズ中はbodyのuserSelectが無効になる", () => {
      // Arrange
      const { result } = renderHook(() => useResizableSidebar());
      const mouseDownEvent = {
        preventDefault: vi.fn(),
        clientX: 300,
      } as unknown as React.MouseEvent;

      // Act
      act(() => {
        result.current.handleMouseDown(mouseDownEvent);
      });

      // Assert
      expect(document.body.style.userSelect).toBe("none");
      expect(document.body.style.cursor).toBe("col-resize");
    });

    it("リサイズ終了後にスタイルが復元される", () => {
      // Arrange
      const { result } = renderHook(() => useResizableSidebar());
      const mouseDownEvent = {
        preventDefault: vi.fn(),
        clientX: 300,
      } as unknown as React.MouseEvent;

      // Act - リサイズ開始
      act(() => {
        result.current.handleMouseDown(mouseDownEvent);
      });

      // Act - マウスアップ
      act(() => {
        const mouseUpEvent = new MouseEvent("mouseup");
        document.dispatchEvent(mouseUpEvent);
      });

      // Assert
      expect(document.body.style.userSelect).toBe("");
      expect(document.body.style.cursor).toBe("");
    });
  });
});
