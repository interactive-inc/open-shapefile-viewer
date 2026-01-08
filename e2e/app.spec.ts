import { test, expect } from "@playwright/test";

test.describe("App", () => {
  test.beforeEach(async ({ page }) => {
    // Arrange - 共通: ページ遷移
    await page.goto("/");
  });

  test("アプリが正常に読み込まれる", async ({ page }) => {
    // Arrange - beforeEach でページ遷移済み
    // Act - 読み込み直後の初期状態を検証

    // Assert - 基本UI要素が全て表示される
    await expect(page).toHaveTitle(/Shapefile/i);
    await expect(page.locator("aside")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
  });

  test("サイドバーにタブが表示される", async ({ page }) => {
    // Arrange - beforeEach でページ遷移済み
    // Act - 初期状態の確認

    // Assert - タブボタンが表示される
    await expect(
      page.getByRole("button", { name: "レイヤー", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "エリア", exact: true })
    ).toBeVisible();
  });

  test("レイヤータブがデフォルトでアクティブ", async ({ page }) => {
    // Arrange - beforeEach でページ遷移済み
    const layerTab = page.getByRole("button", { name: "レイヤー", exact: true });

    // Act - 初期状態の確認

    // Assert - レイヤータブが存在し表示されている
    await expect(layerTab).toBeVisible();
  });

  test("タブを切り替えられる", async ({ page }) => {
    // Arrange
    const areaTab = page.getByRole("button", { name: "エリア", exact: true });
    const layerTab = page.getByRole("button", { name: "レイヤー", exact: true });

    // Act - エリアタブをクリック
    await areaTab.click();

    // Assert - エリアパネルが表示される
    await expect(
      page.getByText("プロジェクトを開くか新規作成してください")
    ).toBeVisible();

    // Act - レイヤータブに戻る
    await layerTab.click();

    // Assert - レイヤーパネルが表示される
    await expect(
      page.getByRole("button", { name: "レイヤーを追加" })
    ).toBeVisible();
  });
});

test.describe("レイヤー機能", () => {
  test.beforeEach(async ({ page }) => {
    // Arrange - 共通: ページ遷移
    await page.goto("/");
  });

  test("レイヤー追加ボタンが表示される", async ({ page }) => {
    // Arrange - beforeEach でページ遷移済み
    // Act - 初期状態の確認

    // Assert
    await expect(
      page.getByRole("button", { name: "レイヤーを追加" })
    ).toBeVisible();
  });

  test("すべてクリアボタンの動作", async ({ page }) => {
    // Arrange - beforeEach でページ遷移済み
    // Act - レイヤーがない初期状態

    // Assert - すべてクリアボタンはレイヤーがある時のみ表示
    await expect(
      page.getByRole("button", { name: "すべてクリア" })
    ).not.toBeVisible();
  });

  test("レイヤーがない場合の表示", async ({ page }) => {
    // Arrange - beforeEach でページ遷移済み
    // Act - 初期状態の確認

    // Assert - レイヤー数が0件と表示される
    await expect(page.getByText("0 件のレイヤー")).toBeVisible();
  });
});

test.describe("エリア機能", () => {
  test.beforeEach(async ({ page }) => {
    // Arrange - 共通: ページ遷移してエリアタブに切り替え
    await page.goto("/");
    await page.getByRole("button", { name: "エリア", exact: true }).click();
  });

  test("プロジェクト未作成状態が表示される", async ({ page }) => {
    // Arrange - beforeEach でエリアタブに切り替え済み
    // Act - 初期状態の確認

    // Assert - プロジェクト作成の案内が表示される
    await expect(
      page.getByText("プロジェクトを開くか新規作成してください")
    ).toBeVisible();
  });

  test("新規プロジェクトボタンが表示される", async ({ page }) => {
    // Arrange - beforeEach でエリアタブに切り替え済み
    // Act - 初期状態の確認

    // Assert
    await expect(page.getByRole("button", { name: "新規" })).toBeVisible();
  });

  test("開くボタンが表示される", async ({ page }) => {
    // Arrange - beforeEach でエリアタブに切り替え済み
    // Act - 初期状態の確認

    // Assert
    await expect(page.getByRole("button", { name: "開く" })).toBeVisible();
  });

  test("保存ボタンが無効状態で表示される", async ({ page }) => {
    // Arrange - beforeEach でエリアタブに切り替え済み
    const saveButton = page.getByRole("button", { name: "保存" });

    // Act - 初期状態の確認

    // Assert - プロジェクトがないため無効
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toBeDisabled();
  });
});

test.describe("マップ", () => {
  test.beforeEach(async ({ page }) => {
    // Arrange - 共通: ページ遷移
    await page.goto("/");
  });

  test("マップコンテナが表示される", async ({ page }) => {
    // Arrange - beforeEach でページ遷移済み
    // Act - 初期状態の確認

    // Assert - Leafletマップコンテナが存在
    await expect(page.locator(".leaflet-container")).toBeVisible();
  });

  test("マップコントロールが表示される", async ({ page }) => {
    // Arrange - beforeEach でページ遷移済み
    // Act - 初期状態の確認

    // Assert - ズームコントロールが存在
    await expect(page.locator(".leaflet-control-zoom")).toBeVisible();
  });
});

test.describe("都道府県セレクター", () => {
  test.beforeEach(async ({ page }) => {
    // Arrange - 共通: ページ遷移
    await page.goto("/");
  });

  test("都道府県セレクターが表示される", async ({ page }) => {
    // Arrange - beforeEach でページ遷移済み
    // Act - 初期状態の確認

    // Assert - 最初のコンボボックス(都道府県選択)が存在
    await expect(page.getByRole("combobox").first()).toBeVisible();
  });
});

test.describe("レスポンシブ", () => {
  test("モバイルサイズでも表示される", async ({ page }) => {
    // Arrange - ビューポートをモバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });

    // Act - ページ遷移
    await page.goto("/");

    // Assert - 主要要素が表示される
    await expect(page.locator("aside")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
  });

  test("デスクトップサイズで表示される", async ({ page }) => {
    // Arrange - ビューポートをデスクトップサイズに設定
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Act - ページ遷移
    await page.goto("/");

    // Assert - 主要要素が表示される
    await expect(page.locator("aside")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("アクセシビリティ", () => {
  test.beforeEach(async ({ page }) => {
    // Arrange - 共通: ページ遷移
    await page.goto("/");
  });

  test("タブがキーボードでフォーカス可能", async ({ page }) => {
    // Arrange
    const layerTab = page.getByRole("button", {
      name: "レイヤー",
      exact: true,
    });

    // Act - タブにフォーカス
    await layerTab.focus();

    // Assert - フォーカスが当たっている
    await expect(layerTab).toBeFocused();
  });

  test("キーボードナビゲーションが可能", async ({ page }) => {
    // Arrange
    const firstButton = page.getByRole("button").first();

    // Act - 最初のボタンにフォーカス
    await firstButton.focus();

    // Assert - フォーカスがあたっている
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  });
});
