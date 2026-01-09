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

  it("編集してblurで確定する", () => {
    const onUpdateArea = vi.fn();
    render(<AreaTreeView {...defaultProps} onUpdateArea={onUpdateArea} />);

    // 編集モードに入る
    fireEvent.doubleClick(screen.getByText("テストエリア1"));

    const input = screen.getByDisplayValue("テストエリア1");
    fireEvent.change(input, { target: { value: "blur確定名" } });
    fireEvent.blur(input);

    expect(onUpdateArea).toHaveBeenCalledWith("area-1", { name: "blur確定名" });
  });

  it("同じ名前で編集してもonUpdateAreaは呼ばれない", () => {
    const onUpdateArea = vi.fn();
    render(<AreaTreeView {...defaultProps} onUpdateArea={onUpdateArea} />);

    // 編集モードに入る
    fireEvent.doubleClick(screen.getByText("テストエリア1"));

    const input = screen.getByDisplayValue("テストエリア1");
    // 同じ名前のままEnter
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onUpdateArea).not.toHaveBeenCalled();
  });

  it("空白のみの名前ではonUpdateAreaは呼ばれない", () => {
    const onUpdateArea = vi.fn();
    render(<AreaTreeView {...defaultProps} onUpdateArea={onUpdateArea} />);

    // 編集モードに入る
    fireEvent.doubleClick(screen.getByText("テストエリア1"));

    const input = screen.getByDisplayValue("テストエリア1");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onUpdateArea).not.toHaveBeenCalled();
  });

  it("色インジケータが表示される", () => {
    render(<AreaTreeView {...defaultProps} />);

    // 各エリアの色が適用されたdivが存在する
    const colorIndicators = document.querySelectorAll('[style*="background-color"]');
    expect(colorIndicators.length).toBeGreaterThanOrEqual(2);
  });

  it("選択状態のエリアにはスタイルが適用される", () => {
    render(
      <AreaTreeView
        {...defaultProps}
        selectedAreaId="area-1"
      />
    );

    // 選択されたエリア名はfont-semiboldが適用される
    const selectedAreaName = screen.getByText("テストエリア1");
    expect(selectedAreaName).toHaveClass("font-semibold");
  });

  it("編集ボタンにPencilアイコンが表示される", () => {
    render(<AreaTreeView {...defaultProps} />);

    const editButtons = screen.getAllByTitle("名前を編集");
    // 各編集ボタンにsvgアイコンが含まれる
    for (const button of editButtons) {
      expect(button.querySelector("svg")).toBeInTheDocument();
    }
  });

  it("子エリア追加ボタンにPlusアイコンが表示される", () => {
    render(<AreaTreeView {...defaultProps} />);

    const addButtons = screen.getAllByTitle("子エリア追加");
    // 各追加ボタンにsvgアイコンが含まれる
    for (const button of addButtons) {
      expect(button.querySelector("svg")).toBeInTheDocument();
    }
  });

  it("削除ボタンにXアイコンが表示される", () => {
    render(<AreaTreeView {...defaultProps} />);

    const removeButtons = screen.getAllByTitle("削除");
    // 各削除ボタンにsvgアイコンが含まれる
    for (const button of removeButtons) {
      expect(button.querySelector("svg")).toBeInTheDocument();
    }
  });

  it("子のないエリアには展開ボタンが表示されない", () => {
    const singleArea: AreaWithChildren[] = [
      {
        id: "area-single",
        name: "単独エリア",
        parentId: null,
        color: "#ff6b6b",
        featureIds: [],
        children: [],
      },
    ];

    render(<AreaTreeView {...defaultProps} areas={singleArea} />);

    // 展開/折畳みアイコンは空
    expect(screen.queryByText("▶")).not.toBeInTheDocument();
    expect(screen.queryByText("▼")).not.toBeInTheDocument();
  });

  it("深い階層の子エリアも展開できる", () => {
    render(<AreaTreeView {...defaultProps} />);

    // area-2を展開
    const expandButton = screen.getByText("▶");
    fireEvent.click(expandButton);

    // 子エリアが表示される
    expect(screen.getByText("子エリア")).toBeInTheDocument();

    // 子エリアのフィーチャー数も表示される
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});
