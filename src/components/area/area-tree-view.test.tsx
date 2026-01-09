import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AreaTreeView } from "./area-tree-view";
import type { AreaWithChildren } from "@/types/area";

const mockAreas: AreaWithChildren[] = [
  {
    id: "area-1",
    name: "テストエリア1",
    parentId: null,
    color: "#ff6b6b",
    featureIds: ["feature-1", "feature-2"],
    children: [],
  },
  {
    id: "area-2",
    name: "テストエリア2",
    parentId: null,
    color: "#4ecdc4",
    featureIds: [],
    children: [
      {
        id: "area-2-1",
        name: "子エリア",
        parentId: "area-2",
        color: "#45b7d1",
        featureIds: ["feature-3"],
        children: [],
      },
    ],
  },
];

describe("AreaTreeView", () => {
  const defaultProps = {
    areas: mockAreas,
    selectedAreaId: null,
    onSelectArea: vi.fn(),
    onAddChild: vi.fn(),
    onRemoveArea: vi.fn(),
    onUpdateArea: vi.fn(),
  };

  it("エリア名が表示される", () => {
    render(<AreaTreeView {...defaultProps} />);

    expect(screen.getByText("テストエリア1")).toBeInTheDocument();
    expect(screen.getByText("テストエリア2")).toBeInTheDocument();
  });

  it("フィーチャー数が表示される", () => {
    render(<AreaTreeView {...defaultProps} />);

    // テストエリア1は2つのフィーチャーを持つ
    expect(screen.getByText("2")).toBeInTheDocument();
    // テストエリア2は0つのフィーチャーを持つ
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("エリアがない場合はメッセージが表示される", () => {
    render(<AreaTreeView {...defaultProps} areas={[]} />);

    expect(screen.getByText("エリアがありません")).toBeInTheDocument();
  });

  it("エリアをクリックすると選択される", () => {
    const onSelectArea = vi.fn();
    render(<AreaTreeView {...defaultProps} onSelectArea={onSelectArea} />);

    fireEvent.click(screen.getByText("テストエリア1"));

    expect(onSelectArea).toHaveBeenCalledWith("area-1");
  });

  it("選択中のエリアを再度クリックすると選択解除される", () => {
    const onSelectArea = vi.fn();
    render(
      <AreaTreeView
        {...defaultProps}
        selectedAreaId="area-1"
        onSelectArea={onSelectArea}
      />
    );

    fireEvent.click(screen.getByText("テストエリア1"));

    expect(onSelectArea).toHaveBeenCalledWith(null);
  });

  it("ダブルクリックで編集モードに入る", () => {
    render(<AreaTreeView {...defaultProps} />);

    fireEvent.doubleClick(screen.getByText("テストエリア1"));

    // 編集用のinputが表示される
    const input = screen.getByDisplayValue("テストエリア1");
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe("INPUT");
  });

  it("編集ボタンをクリックすると編集モードに入る", async () => {
    render(<AreaTreeView {...defaultProps} />);

    // 編集ボタンは title="名前を編集" を持つ
    const editButtons = screen.getAllByTitle("名前を編集");
    expect(editButtons.length).toBeGreaterThan(0);

    fireEvent.click(editButtons[0]);

    // 編集用のinputが表示される
    const input = screen.getByDisplayValue("テストエリア1");
    expect(input).toBeInTheDocument();
  });

  it("編集してEnterで確定する", () => {
    const onUpdateArea = vi.fn();
    render(<AreaTreeView {...defaultProps} onUpdateArea={onUpdateArea} />);

    // 編集モードに入る
    fireEvent.doubleClick(screen.getByText("テストエリア1"));

    const input = screen.getByDisplayValue("テストエリア1");
    fireEvent.change(input, { target: { value: "新しいエリア名" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onUpdateArea).toHaveBeenCalledWith("area-1", { name: "新しいエリア名" });
  });

  it("編集してEscapeでキャンセルする", () => {
    const onUpdateArea = vi.fn();
    render(<AreaTreeView {...defaultProps} onUpdateArea={onUpdateArea} />);

    // 編集モードに入る
    fireEvent.doubleClick(screen.getByText("テストエリア1"));

    const input = screen.getByDisplayValue("テストエリア1");
    fireEvent.change(input, { target: { value: "新しいエリア名" } });
    fireEvent.keyDown(input, { key: "Escape" });

    // onUpdateAreaは呼ばれない
    expect(onUpdateArea).not.toHaveBeenCalled();
    // 元のエリア名が表示される
    expect(screen.getByText("テストエリア1")).toBeInTheDocument();
  });

  it("子エリア追加ボタンをクリックするとonAddChildが呼ばれる", () => {
    const onAddChild = vi.fn();
    render(<AreaTreeView {...defaultProps} onAddChild={onAddChild} />);

    const addChildButtons = screen.getAllByTitle("子エリア追加");
    fireEvent.click(addChildButtons[0]);

    expect(onAddChild).toHaveBeenCalledWith("area-1");
  });

  it("削除ボタンをクリックするとonRemoveAreaが呼ばれる", () => {
    const onRemoveArea = vi.fn();
    render(<AreaTreeView {...defaultProps} onRemoveArea={onRemoveArea} />);

    const removeButtons = screen.getAllByTitle("削除");
    fireEvent.click(removeButtons[0]);

    expect(onRemoveArea).toHaveBeenCalledWith("area-1");
  });

  it("子エリアを持つエリアは展開/折畳みできる", () => {
    render(<AreaTreeView {...defaultProps} />);

    // 初期状態では子エリアは非表示
    expect(screen.queryByText("子エリア")).not.toBeInTheDocument();

    // 展開ボタンをクリック (▶)
    const expandButton = screen.getByText("▶");
    fireEvent.click(expandButton);

    // 子エリアが表示される
    expect(screen.getByText("子エリア")).toBeInTheDocument();

    // 折畳みボタンをクリック (▼)
    const collapseButton = screen.getByText("▼");
    fireEvent.click(collapseButton);

    // 子エリアが非表示になる
    expect(screen.queryByText("子エリア")).not.toBeInTheDocument();
  });
});
