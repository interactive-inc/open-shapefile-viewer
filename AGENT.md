# AGENTS.md

AI アシスタント向け共通ドキュメント。常に日本語で回答してください。

## プロジェクト概要

**Shapefile Viewer** - Shapefile を地図上に表示し、フィーチャーをエリアごとに分類できる Web アプリケーション

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | React 19 + Vite + Tailwind CSS 4 |
| 地図 | Leaflet / react-leaflet |
| テスト | Vitest + Playwright |
| ツール | Bun, Biome, Lefthook |

## コマンド

```bash
# 開発
bun run dev              # 開発サーバー :5173

# 品質チェック
bun run lint             # Biome チェック
bun run lint:fix         # 自動修正
bun run test             # Unit テスト (watch モード)
bun run test:run         # Unit テスト (単発)
bun run test:coverage    # カバレッジ付きテスト
bun run test:e2e         # E2E テスト
bun run test:e2e:ui      # E2E テスト (UI モード)

# ビルド・デプロイ
bun run build            # プロダクションビルド
bun run preview          # ビルドプレビュー
bunx wrangler pages deploy dist  # Cloudflare Pages デプロイ
```

## ディレクトリ構造

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

e2e/               # Playwright E2E テスト
```

## 開発ガイドライン

### テスト

- 機能実装時は対応するテストも実装・更新
- 単体テスト: `*.test.ts(x)` を対象ファイルと同じディレクトリに配置
- E2E: `e2e/` に配置

### Lint (Biome)

警告レベルのルール (即時対応不要):
- `noExcessiveCognitiveComplexity`: 複雑度 15 超過
- `noNonNullAssertion`: 非 null アサーション使用
- `useExhaustiveDependencies`: 依存配列不足

## コードレビューの思想

### 評価の観点

1. **SRP**: クラス/関数の責任分離
2. **Code for Humans**: 可読性、保守性
3. **KISS**: シンプルで明確な実装
4. **CoC**: プロジェクト規約への準拠
5. **TypeScript 型安全性**: 適切な型定義、any の排除

### トレードオフの優先順位

```
セキュリティ > 保守性 > パフォーマンス > コード美観
```

### 段階的改善

```
Phase 1: 安全性 (セキュリティ、型安全性)
Phase 2: 保守性 (SRP、可読性)
Phase 3: パフォーマンス最適化
Phase 4: 美観と規約統一
```

### 優先度判定

| 優先度 | 基準 |
|--------|------|
| Critical | セキュリティ、データ整合性、システム安定性 |
| High | 保守性への大きな影響、将来的なバグのリスク |
| Medium | コード品質向上、規約違反 |
| Low | 最適化、効率化 |

### SRP vs KISS

- 50 行以下 → KISS 優先
- 50-100 行 → 明確に異なる責任がある場合のみ分割
- 100 行以上 → SRP 優先

## GitHub テンプレート

### Issue テンプレート

| テンプレート | 用途 | ラベル |
|-------------|------|--------|
| `feature.yml` | 機能追加 | enhancement |
| `bug.yml` | バグ報告 | bug |
| `task.yml` | リファクタリング、ドキュメント等 | task |

## CI/CD

### GitHub Actions

| ワークフロー | トリガー | ジョブ |
|-------------|---------|--------|
| `ci.yml` | push/PR to main | Lint, Unit Tests, E2E Tests, Build |

## 重要な制約事項

- **TypeScript strict モード必須**
- **CSS ファイルは Biome 対象外**: Tailwind ディレクティブとの互換性のため
