# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**共通ガイドライン**: [AGENT.md](AGENT.md) を参照 (コードレビュー思想、優先度判定など)

## プロジェクト概要

Shapefile を地図上に表示し、フィーチャーをエリアごとに分類できる React Web アプリケーション。

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | React 19 + Vite 7 + Tailwind CSS 4 |
| 地図 | Leaflet / react-leaflet |
| テスト | Vitest + Playwright |
| ツール | npm, Biome, Lefthook |

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド (TypeScript コンパイル + Vite ビルド)
npm run build

# テスト
npm run test              # watch モード
npm run test:run          # 単発実行
npm run test:run <file>   # 特定ファイル実行 (例: npm run test:run src/hooks/use-layers.test.ts)
npm run test:coverage     # カバレッジ付き

# E2E テスト (Playwright)
npm run test:e2e          # ヘッドレス実行
npm run test:e2e:ui       # UI モード

# Lint & Format (Biome)
npm run lint              # チェックのみ
npm run lint:fix          # 自動修正
npm run format            # フォーマット
```

## アーキテクチャ

### ディレクトリ構成

```
src/
├── components/
│   ├── app/       # アプリケーションレベルのコンポーネント
│   ├── area/      # エリア管理関連
│   ├── layer/     # レイヤー管理関連
│   ├── map/       # 地図表示関連
│   └── ui/        # 汎用 UI コンポーネント (Button, Card 等)
├── hooks/         # カスタムフック
├── lib/           # ユーティリティ・パーサー
├── types/         # 型定義
└── __tests__/     # テストセットアップ
```

### 主要なカスタムフック

| フック | 責務 |
|--------|------|
| `useLayers` | Shapefile レイヤーの状態管理 (追加/削除/フィルター/並び替え) |
| `useAreas` | エリアプロジェクトの状態管理 (ツリー構造/フィーチャー割り当て) |
| `useMapStyle` | 地図タイルスタイルの切り替え |
| `usePrefecture` | 都道府県選択と localStorage 永続化 |
| `useResizableSidebar` | サイドバーのリサイズ機能 |

### データフロー

1. **Shapefile 読み込み**: `shapefile-parser.ts` → GeoJSON に変換 → `useLayers` で管理
2. **地図表示**: `MapView` (react-leaflet) → `GeoJSONLayer` でフィーチャー描画
3. **エリア管理**: `useAreas` でツリー構造管理 → `AreaProject` JSON としてエクスポート

### フィーチャー ID 規則

`{layerId}:{featureIndex}` 形式 (例: `layer_name:0`)
- `generateFeatureId()` / `parseFeatureId()` で生成・パース

## コーディング規約

### パスエイリアス

`@/` → `src/` (例: `import { Button } from "@/components/ui/button"`)

### Biome 設定 (重要なルール)

- `noArrayIndexKey: error` - 配列インデックスを key に使用禁止
- `useButtonType: error` - Button には type 属性必須
- `noUnusedVariables: error` - 未使用変数禁止

### コミットメッセージ

```
<type>: <description>

🤖 Generated with Claude Code
```

type: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

## Claude Code 固有の設定

### ツール使用ポリシー

- ファイル検索は `Glob` / `Grep` ツールを優先
- 複雑な探索は `Task` ツール (subagent_type=Explore) を使用
- 並列実行可能なツールは同時に呼び出す

### コード参照形式

コード参照時は `file_path:line_number` 形式を使用:

```
例: src/lib/shapefile-parser.ts:15
```
